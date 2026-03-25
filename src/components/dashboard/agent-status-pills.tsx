"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { AgentHeartbeat } from "@/lib/types";

interface AgentStatusProps {
  name: string;
  type: "hr" | "staff";
  heartbeat?: AgentHeartbeat | null;
}

function AgentStatusPill({ name, type, heartbeat }: AgentStatusProps) {
  const status = heartbeat?.status ?? "offline";
  const isOnline = status === "online";
  const isError = status === "error";

  const statusColor = isOnline
    ? "bg-brand-teal"
    : isError
      ? "bg-brand-coral"
      : "bg-gray-300";

  const statusText = isOnline
    ? "Online"
    : isError
      ? "Error"
      : heartbeat
        ? "Offline"
        : "Belum aktif";

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3.5">
      <div
        className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-lg shrink-0 relative ${
          type === "hr"
            ? "bg-gradient-to-br from-brand-indigo/15 to-brand-violet/[0.12] border border-brand-indigo/20"
            : "bg-gradient-to-br from-brand-teal/15 to-brand-indigo/[0.12] border border-brand-teal/20"
        }`}
      >
        {type === "hr" ? (
          <Bot className="h-5 w-5 text-brand-indigo" />
        ) : (
          <Sparkles className="h-5 w-5 text-brand-teal" />
        )}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor} ${
            isOnline ? "shadow-[0_0_6px_rgba(38,198,166,0.5)]" : ""
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-tertiary mt-0.5">
          <span>{statusText}</span>
          {heartbeat?.model && (
            <span className="text-[10px] font-mono opacity-70">
              · {heartbeat.model.replace("anthropic/", "")}
            </span>
          )}
        </div>
        {heartbeat?.last_seen && (
          <div className="flex items-center gap-1 text-[9px] text-tertiary mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(heartbeat.last_seen), {
              addSuffix: true,
              locale: localeId,
            })}
          </div>
        )}
      </div>

      {heartbeat && heartbeat.message_count > 0 && (
        <div className="text-[11px] font-semibold text-brand-indigo px-2 py-0.5 rounded-full bg-brand-indigo/10 font-mono">
          {heartbeat.message_count}
        </div>
      )}
    </div>
  );
}

export function AgentStatusPills() {
  const [heartbeats, setHeartbeats] = useState<AgentHeartbeat[]>([]);

  useEffect(() => {
    async function fetchHeartbeats() {
      try {
        const res = await fetch("/api/agents/status");
        if (res.ok) {
          setHeartbeats(await res.json());
        }
      } catch {
        // Silently fail
      }
    }

    fetchHeartbeats();

    // Poll every 15 seconds
    const interval = setInterval(fetchHeartbeats, 15_000);
    return () => clearInterval(interval);
  }, []);

  const hrHeartbeat =
    heartbeats.find((h) => h.agent_type === "hr_agent") ?? null;
  const staffHeartbeat =
    heartbeats.find((h) => h.agent_type === "staff_agent") ?? null;

  return (
    <div className="flex flex-col gap-3">
      <AgentStatusPill name="HR Agent" type="hr" heartbeat={hrHeartbeat} />
      <AgentStatusPill
        name="Hana (Staff)"
        type="staff"
        heartbeat={staffHeartbeat}
      />
    </div>
  );
}
