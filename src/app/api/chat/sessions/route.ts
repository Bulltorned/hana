import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  // Get distinct sessions with their first and last messages
  const { data, error } = await supabase
    .from("chat_messages")
    .select("session_id, content, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by session_id, get first user message as title and last message time
  const sessionsMap = new Map<
    string,
    { id: string; title: string; lastMessageAt: string; messageCount: number }
  >();

  for (const msg of data ?? []) {
    const existing = sessionsMap.get(msg.session_id);
    if (!existing) {
      sessionsMap.set(msg.session_id, {
        id: msg.session_id,
        title:
          msg.role === "user"
            ? msg.content.slice(0, 60) + (msg.content.length > 60 ? "..." : "")
            : "Chat baru",
        lastMessageAt: msg.created_at,
        messageCount: 1,
      });
    } else {
      existing.messageCount++;
      // Use first user message as title
      if (msg.role === "user" && existing.title === "Chat baru") {
        existing.title =
          msg.content.slice(0, 60) + (msg.content.length > 60 ? "..." : "");
      }
    }
  }

  const sessions = Array.from(sessionsMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
  );

  return NextResponse.json(sessions);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const tenantId = searchParams.get("tenant_id");

  if (!sessionId || !tenantId) {
    return NextResponse.json(
      { error: "session_id and tenant_id required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId)
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
