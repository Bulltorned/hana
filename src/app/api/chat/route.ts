import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  routeMessage,
  streamQAResponse,
  buildTenantContext,
  type ChatHistoryMessage,
} from "@/lib/anthropic";

interface KopSurat {
  nama?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
}

const PROVISIONING_URL =
  process.env.PROVISIONING_URL ?? "http://168.144.40.98:3100";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const sessionId = searchParams.get("session_id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("chat_messages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { tenant_id, session_id, content } = body;

  if (!tenant_id || !session_id || !content) {
    return NextResponse.json(
      { error: "tenant_id, session_id, and content are required" },
      { status: 400 }
    );
  }

  // 1. Save user message
  const { data: userMsg, error: msgErr } = await supabase
    .from("chat_messages")
    .insert({
      tenant_id,
      session_id,
      role: "user",
      content,
    })
    .select()
    .single();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // 2. Route message → which skill/handler?
  const hasImage = content.includes("__IMAGE_DATA__");
  const route = await routeMessage(content, hasImage);
  console.log(`[chat] route: ${route}`);

  // 3a. Non-action routes → Direct Anthropic API with streaming + relevant skill only
  if (route !== "action") {
    try {
      // Get tenant context
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenant_id)
        .single();

      const { data: settings } = await supabase
        .from("tenant_settings")
        .select("kop_surat, signer_name, signer_jabatan")
        .eq("tenant_id", tenant_id)
        .single();

      const { count: empCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant_id)
        .eq("is_archived", false);

      const kopSurat = settings?.kop_surat as KopSurat | null;

      const { tenantName, context } = buildTenantContext({
        tenantName: (tenant?.name as string) ?? "Perusahaan",
        employeeCount: empCount ?? 0,
        alamat: kopSurat?.alamat,
        signerName: settings?.signer_name as string | undefined,
        signerJabatan: settings?.signer_jabatan as string | undefined,
      });

      // Get recent chat history for context
      const { data: historyData } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("tenant_id", tenant_id)
        .eq("session_id", session_id)
        .order("created_at", { ascending: true })
        .limit(10);

      const history: ChatHistoryMessage[] = (historyData ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Extract image data if present
      let imageData: { base64: string; mediaType: string } | undefined;
      let textContent = content;

      const imageMatch = content.match(/__IMAGE_DATA__(.+?)__END_IMAGE__/);
      if (imageMatch) {
        try {
          imageData = JSON.parse(imageMatch[1]);
          textContent = content.replace(/__IMAGE_DATA__.+?__END_IMAGE__/, "").trim();
        } catch {
          // Failed to parse image data, continue with text only
        }
      }

      // Stream response
      const stream = await streamQAResponse(
        textContent,
        tenantName,
        context,
        history,
        imageData
      );

      // We need to also save the final message to Supabase
      // Tee the stream: one for the client, one for saving
      const [clientStream, saveStream] = stream.tee();

      // Save full response in background
      saveResponseToSupabase(saveStream, supabase, tenant_id, session_id);

      return new Response(clientStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Chat-Route": "direct",
          "X-User-Message-Id": userMsg.id,
        },
      });
    } catch (err: unknown) {
      // Fall through to OpenClaw if direct API fails
      console.error("Direct API failed, falling back to OpenClaw:", err);
    }
  }

  // 3b. Action → Try OpenClaw first, fallback to Direct API
  try {
    const gatewayRes = await fetch(`${PROVISIONING_URL}/gateway/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id,
        session_id,
        message: content,
      }),
      signal: AbortSignal.timeout(65_000),
    });

    if (gatewayRes.ok) {
      const { response: assistantMsg } = await gatewayRes.json();

      return NextResponse.json({
        userMessage: userMsg,
        assistantMessage: {
          ...assistantMsg,
          metadata: { ...((assistantMsg?.metadata as Record<string, unknown>) ?? {}), route: "openclaw" },
        },
      });
    }

    // OpenClaw failed — fall back to Direct API for this action too
    console.warn("OpenClaw unavailable for action, falling back to Direct API");
  } catch {
    console.warn("OpenClaw unreachable, falling back to Direct API");
  }

  // 3c. Fallback: Direct API for actions (limited but better than error)
  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenant_id)
      .single();

    const { data: settings } = await supabase
      .from("tenant_settings")
      .select("kop_surat, signer_name, signer_jabatan")
      .eq("tenant_id", tenant_id)
      .single();

    const { count: empCount } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .eq("is_archived", false);

    const kopSurat = settings?.kop_surat as KopSurat | null;

    const { tenantName, context } = buildTenantContext({
      tenantName: (tenant?.name as string) ?? "Perusahaan",
      employeeCount: empCount ?? 0,
      alamat: kopSurat?.alamat,
      signerName: settings?.signer_name as string | undefined,
      signerJabatan: settings?.signer_jabatan as string | undefined,
    });

    const { data: historyData } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("tenant_id", tenant_id)
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const history: ChatHistoryMessage[] = (historyData ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await streamQAResponse(content, tenantName, context, history);
    const [clientStream, saveStream] = stream.tee();
    saveResponseToSupabase(saveStream, supabase, tenant_id, session_id);

    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Chat-Route": "direct",
        "X-User-Message-Id": userMsg.id,
      },
    });
  } catch {
    // Everything failed — return error message
    const { data: assistantMsg } = await supabase
      .from("chat_messages")
      .insert({
        tenant_id,
        session_id,
        role: "assistant",
        content:
          "Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.",
        metadata: { error: true },
      })
      .select()
      .single();

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  }
}

// ── Helper: Save streamed response to Supabase ─────

async function saveResponseToSupabase(
  stream: ReadableStream<Uint8Array>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  sessionId: string
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "done") {
              fullText = data.fullText;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }

    if (fullText) {
      await supabase.from("chat_messages").insert({
        tenant_id: tenantId,
        session_id: sessionId,
        role: "assistant",
        content: fullText,
        metadata: { route: "direct" },
      });
    }
  } catch (err) {
    console.error("Failed to save streamed response:", err);
  }
}
