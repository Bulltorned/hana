"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F8]">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-coral/10 mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30 hover:shadow-xl transition-shadow"
          >
            Coba Lagi
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/70 border border-white/90 text-muted-foreground hover:text-foreground transition-colors"
          >
            Ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
