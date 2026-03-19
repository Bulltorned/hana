"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
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
              title="Dashboard"
              onMobileMenuToggle={() => setMobileOpen(true)}
            />
            <div className="flex-1">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
