import { Bot, Sparkles } from "lucide-react";

interface AgentStatusProps {
  name: string;
  type: "hr" | "staff";
  isOnline: boolean;
  statusText: string;
  messageCount?: number;
}

function AgentStatusPill({
  name,
  type,
  isOnline,
  statusText,
  messageCount,
}: AgentStatusProps) {
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
        <div className="text-[11px] text-tertiary mt-0.5">{statusText}</div>
      </div>
      {messageCount !== undefined && (
        <div className="text-[11px] font-semibold text-brand-indigo px-2 py-0.5 rounded-full bg-brand-indigo/10 font-mono">
          {messageCount} msg
        </div>
      )}
    </div>
  );
}

export function AgentStatusPills() {
  return (
    <div className="flex flex-col gap-3">
      <AgentStatusPill
        name="HR Agent"
        type="hr"
        isOnline={false}
        statusText="Offline — Belum dikonfigurasi"
        messageCount={0}
      />
      <AgentStatusPill
        name="Hana (Staff Agent)"
        type="staff"
        isOnline={false}
        statusText="Offline — Belum dikonfigurasi"
        messageCount={0}
      />
    </div>
  );
}
