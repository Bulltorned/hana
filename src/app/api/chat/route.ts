import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROVISIONING_URL = process.env.PROVISIONING_URL ?? "http://168.144.40.98:3100";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenant_id");
  const sessionId = searchParams.get("session_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
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

  // Save user message
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

  // Forward message to OpenClaw via provisioning gateway
  try {
    const gatewayRes = await fetch(`${PROVISIONING_URL}/gateway/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id,
        session_id,
        message: content,
      }),
      signal: AbortSignal.timeout(65_000), // Slightly longer than gateway's 60s
    });

    if (gatewayRes.ok) {
      const { response: assistantMsg } = await gatewayRes.json();
      return NextResponse.json({
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    }

    // Agent not available — fall back to pending task
    const errorData = await gatewayRes.json().catch(() => ({}));
    const errorMsg = (errorData as Record<string, string>).error ?? "Agent tidak tersedia";

    // Create pending task as fallback
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("pending_tasks").insert({
      tenant_id,
      task_type: "chat_message",
      priority: 2,
      payload: { session_id, message_id: userMsg.id, content },
      created_by: user?.id || null,
    });

    // Return placeholder response
    const { data: assistantMsg } = await supabase
      .from("chat_messages")
      .insert({
        tenant_id,
        session_id,
        role: "assistant",
        content: `⏳ ${errorMsg}. Pesan kamu sudah disimpan dan akan diproses setelah agent aktif.`,
        metadata: { placeholder: true, error: errorMsg },
      })
      .select()
      .single();

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err: unknown) {
    // Network error or timeout — fall back to pending task
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("pending_tasks").insert({
      tenant_id,
      task_type: "chat_message",
      priority: 2,
      payload: { session_id, message_id: userMsg.id, content },
      created_by: user?.id || null,
    });

    const { data: assistantMsg } = await supabase
      .from("chat_messages")
      .insert({
        tenant_id,
        session_id,
        role: "assistant",
        content:
          "⏳ Agent sedang tidak tersedia. Pesan kamu sudah disimpan dan akan diproses segera.",
        metadata: { placeholder: true },
      })
      .select()
      .single();

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  }
}
