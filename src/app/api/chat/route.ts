import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Create pending task for the agent to process
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("pending_tasks").insert({
    tenant_id,
    task_type: "chat_message",
    priority: 2, // chat is higher priority
    payload: {
      session_id,
      message_id: userMsg.id,
      content,
    },
    created_by: user?.id || null,
  });

  // For now, create a placeholder assistant response
  // In production, the OpenClaw agent would poll pending_tasks and respond
  const { data: assistantMsg } = await supabase
    .from("chat_messages")
    .insert({
      tenant_id,
      session_id,
      role: "assistant",
      content:
        "Pesan kamu sudah diterima. Saat ini HR Agent sedang dalam proses setup — " +
        "setelah OpenClaw container aktif, agent akan bisa merespons pertanyaan HR, " +
        "compliance, dan generate dokumen secara langsung. 🤖",
      metadata: { placeholder: true },
    })
    .select()
    .single();

  return NextResponse.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
}
