"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { navigationItems, sectionLabels } from "@/lib/constants/navigation";
import { SidebarNavItem } from "./sidebar-nav-item";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const sections = ["main", "agent", "account"] as const;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[260px] p-0 glass">
        <div className="flex flex-col h-full p-5 gap-1.5">
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

          <ScrollArea className="flex-1">
            <nav className="flex flex-col gap-1" onClick={() => onOpenChange(false)}>
              {sections.map((section) => {
                const items = navigationItems.filter((i) => i.section === section);
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
