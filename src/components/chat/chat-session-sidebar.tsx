"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ChatSession {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

interface ChatSessionSidebarProps {
  tenantId: string | null;
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  refreshTrigger?: number;
}

export function ChatSessionSidebar({
  tenantId,
  activeSessionId,
  onSelectSession,
  onNewSession,
  refreshTrigger,
}: ChatSessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions?tenant_id=${tenantId}`);
      if (res.ok) {
        setSessions(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshTrigger]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  async function handleDelete(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();

    if (deletingId) return;
    setDeletingId(sessionId);

    try {
      const res = await fetch(
        `/api/chat/sessions?session_id=${sessionId}&tenant_id=${tenantId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("Chat berhasil dihapus");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        // If deleting active session, create new one
        if (sessionId === activeSessionId) {
          onNewSession();
        }
      } else {
        toast.error("Gagal menghapus chat");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-[220px] shrink-0 flex flex-col gap-2">
      {/* New chat button */}
      <Button
        onClick={onNewSession}
        className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-xs h-9"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Chat Baru
      </Button>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {loading && sessions.length === 0 ? (
          <div className="text-center text-tertiary text-xs py-4">
            Memuat...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-tertiary text-xs py-4">
            Belum ada riwayat chat
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors group ${
                  isActive
                    ? "bg-brand-indigo/[0.08] border border-brand-indigo/[0.15]"
                    : "hover:bg-white/50 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare
                    className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                      isActive ? "text-brand-indigo" : "text-tertiary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[11px] font-medium truncate ${
                        isActive ? "text-brand-indigo" : "text-foreground"
                      }`}
                    >
                      {session.title}
                    </div>
                    <div className="text-[9px] text-tertiary mt-0.5">
                      {formatDistanceToNow(new Date(session.lastMessageAt), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                      {" · "}
                      {session.messageCount} pesan
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-brand-coral/10 shrink-0"
                    title="Hapus chat"
                  >
                    <Trash2 className="h-3 w-3 text-brand-coral" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
