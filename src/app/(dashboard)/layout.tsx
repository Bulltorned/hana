"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { RouteProgress } from "@/components/layout/route-progress";
import { TooltipProvider } from "@/components/ui/tooltip";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Ringkasan data & aktivitas" },
  "/employees": { title: "Karyawan", subtitle: "Kelola data karyawan" },
  "/tenants": { title: "Tenants", subtitle: "Kelola tenant terdaftar" },
  "/compliance": { title: "Compliance", subtitle: "Kewajiban & kepatuhan" },
  "/assessment": { title: "Assessment 360°", subtitle: "Evaluasi kinerja" },
  "/documents": { title: "Dokumen", subtitle: "Surat & dokumen HR" },
  "/hr-agent": { title: "HR Agent", subtitle: "AI assistant untuk HR" },
  "/hana-agent": { title: "Hana (Staff)", subtitle: "AI assistant untuk karyawan" },
  "/settings": { title: "Pengaturan", subtitle: "Konfigurasi perusahaan" },
  "/billing": { title: "Subscription", subtitle: "Paket & tagihan" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Match pathname to page title (supports /tenants/[id] etc.)
  const pageKey = Object.keys(pageTitles).find(
    (key) => pathname === key || pathname.startsWith(key + "/")
  );
  const { title, subtitle } = pageTitles[pageKey ?? "/dashboard"] ?? pageTitles["/dashboard"];

  return (
    <TooltipProvider>
      <RouteProgress />
      <div className="min-h-screen relative">
        {/* Ambient background blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="blob"
            style={{
              width: 600,
              height: 600,
              background: "radial-gradient(circle, #4F7BF7, #7C5CF6)",
              top: -200,
              left: -150,
            }}
          />
          <div
            className="blob"
            style={{
              width: 500,
              height: 500,
              background: "radial-gradient(circle, #26C6A6, #4F7BF7)",
              top: "40%",
              right: -150,
            }}
          />
          <div
            className="blob"
            style={{
              width: 400,
              height: 400,
              background: "radial-gradient(circle, #F76B4F, #F7C94F)",
              bottom: -100,
              left: "30%",
            }}
          />
        </div>

        <div className="flex gap-3 p-4 min-h-screen">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile sidebar */}
          <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

          {/* Main content */}
          <main className="flex-1 flex flex-col gap-3 min-w-0">
            <Topbar
              title={title}
              subtitle={subtitle}
              onMobileMenuToggle={() => setMobileOpen(true)}
            />
            <div className="flex-1">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
