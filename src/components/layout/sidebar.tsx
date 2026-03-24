"use client";

import { navigationItems, sectionLabels } from "@/lib/constants/navigation";
import { SidebarNavItem } from "./sidebar-nav-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/hooks/use-auth";

export function Sidebar() {
  const { profile } = useAuth();
  const sections = ["main", "agent", "account"] as const;

  const isOperator = profile?.role === "operator";
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside className="glass-sidebar sticky top-4 h-[calc(100vh-32px)] w-[220px] shrink-0 flex flex-col p-5 pb-4 gap-1.5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2.5 pb-4 mb-2 border-b border-brand-indigo/[0.08]">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-[14px] font-bold text-white tracking-tight">
          H
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Hana</div>
          <div className="text-[10px] text-tertiary">HRD Agent OS</div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <nav className="flex flex-col gap-1">
          {sections.map((section) => {
            const items = navigationItems.filter(
              (i) => i.section === section && (!i.operatorOnly || isOperator)
            );
            if (items.length === 0) return null;
            return (
              <div key={section}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-tertiary px-3 pt-3 pb-1">
                  {sectionLabels[section]}
                </div>
                {items.map((item) => (
                  <SidebarNavItem key={item.href} item={item} />
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Pill (bottom) */}
      <div className="mt-auto pt-3 border-t border-brand-indigo/[0.08]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-brand-indigo/[0.06] border border-brand-indigo/[0.12]">
          <div
            className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${
              isOperator
                ? "bg-gradient-to-br from-brand-teal to-brand-indigo"
                : "bg-gradient-to-br from-brand-indigo to-brand-violet"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-[550] truncate">
              {profile?.full_name ?? "Loading..."}
            </div>
            <div className="text-[10px] text-tertiary truncate">
              {isOperator ? "Operator" : "Client HRD"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
