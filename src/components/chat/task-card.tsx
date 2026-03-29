"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface TaskCardProps {
  taskId: string;
  tenantId: string;
  title: string;
  initialStatus?: string;
}

interface TaskData {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  task_type: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    icon: Clock,
    className: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
    iconColor: "text-brand-amber",
  },
  processing: {
    label: "Sedang dikerjakan",
    icon: Loader2,
    className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
    iconColor: "text-brand-indigo",
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle,
    className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    iconColor: "text-brand-teal",
  },
  failed: {
    label: "Gagal",
    icon: XCircle,
    className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
    iconColor: "text-brand-coral",
  },
};

export function TaskCard({ taskId, tenantId, title, initialStatus }: TaskCardProps) {
  const [task, setTask] = useState<TaskData | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!taskId || !polling) return;

    let active = true;

    async function poll() {
      try {
        const res = await fetch(
          `/api/tasks/${taskId}?tenant_id=${tenantId}`
        );
        if (res.ok && active) {
          const data: TaskData = await res.json();
          setTask(data);

          // Stop polling when done
          if (data.status === "completed" || data.status === "failed") {
            setPolling(false);
          }
        }
      } catch {
        // Silently fail — will retry
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [taskId, tenantId, polling]);

  const status = task?.status ?? (initialStatus as TaskData["status"]) ?? "pending";
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white/80 border border-white/90 rounded-xl p-3.5 my-2 backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`shrink-0 ${config.iconColor}`}>
          <StatusIcon
            className={`h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{title}</div>
          <div className="text-[10px] text-tertiary font-mono">
            {taskId.slice(0, 8)}
          </div>
        </div>
        <Badge variant="outline" className={`text-[9px] ${config.className}`}>
          {config.label}
        </Badge>
      </div>

      {/* Result */}
      {task?.status === "completed" && task.result && (
        <div className="mt-2 pt-2 border-t border-brand-indigo/[0.06]">
          <div className="text-[11px] text-muted-foreground">
            {typeof task.result.summary === "string"
              ? task.result.summary
              : `${Object.keys(task.result).length} data diproses`}
          </div>
          {task.result.url && (
            <a
              href={String(task.result.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-brand-indigo hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              Lihat hasil
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {task?.status === "failed" && (
        <div className="mt-2 pt-2 border-t border-brand-coral/10">
          <div className="text-[11px] text-brand-coral">
            {task.error ?? "Terjadi kesalahan"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-6 px-2 mt-1 text-brand-indigo"
            onClick={() => setPolling(true)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Coba lagi
          </Button>
        </div>
      )}

      {/* Time */}
      {task?.completed_at && (
        <div className="text-[9px] text-tertiary mt-1.5">
          Selesai{" "}
          {new Date(task.completed_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
