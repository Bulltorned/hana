"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AgentHeartbeat } from "@/lib/types";

interface AgentStatusProps {
  name: string;
  type: "hr" | "staff";
  heartbeat?: AgentHeartbeat | null;
}

function AgentStatusPill({ name, type, heartbeat }: AgentStatusProps) {
  const isOnline = heartbeat?.status === "online";
  const statusText = heartbeat
    ? heartbeat.status === "online"
      ? "Online"
      : heartbeat.status === "error"
        ? "Error"
        : "Offline"
    : "Belum dikonfigurasi";

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
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-teal border-2 border-white shadow-[0_0_6px_rgba(38,198,166,0.5)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{name}</div>
        <div className="text-[11px] text-tertiary mt-0.5">
          {statusText}
          {heartbeat?.model && (
            <span className="ml-1.5 text-[10px] font-mono opacity-70">
              ({heartbeat.model})
            </span>
          )}
        </div>
      </div>
      {heartbeat && heartbeat.message_count > 0 && (
        <div className="text-[11px] font-semibold text-brand-indigo px-2 py-0.5 rounded-full bg-brand-indigo/10 font-mono">
          {heartbeat.message_count} msg
        </div>
      )}
    </div>
  );
}

export function AgentStatusPills() {
  const [heartbeats, setHeartbeats] = useState<AgentHeartbeat[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchHeartbeats() {
      const { data } = await supabase
        .from("agent_heartbeats")
        .select("*")
        .order("agent_type");

      if (data) setHeartbeats(data);
    }

    fetchHeartbeats();

    // Poll every 30 seconds
    const interval = setInterval(fetchHeartbeats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const hrHeartbeat = heartbeats.find((h) => h.agent_type === "hr_agent") ?? null;
  const staffHeartbeat = heartbeats.find((h) => h.agent_type === "staff_agent") ?? null;

  return (
    <div className="flex flex-col gap-3">
      <AgentStatusPill
        name="HR Agent"
        type="hr"
        heartbeat={hrHeartbeat}
      />
      <AgentStatusPill
        name="Hana (Staff Agent)"
        type="staff"
        heartbeat={staffHeartbeat}
      />
    </div>
  );
}
