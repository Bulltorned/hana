"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="glass rounded-[var(--radius-xl)] p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-coral/10 mb-4">
        <AlertTriangle className="h-8 w-8 text-brand-coral opacity-60" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight mb-1">
        Terjadi Kesalahan
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        Halaman ini mengalami error. Silakan coba refresh atau kembali ke dashboard.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={reset}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
        >
          Coba Lagi
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
          Ke Dashboard
        </Button>
      </div>
    </div>
  );
}
