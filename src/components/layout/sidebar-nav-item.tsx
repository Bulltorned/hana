"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants/navigation";

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13.5px] font-[450] transition-all duration-150",
        isActive
          ? "bg-gradient-to-r from-brand-indigo/[0.14] to-brand-violet/[0.10] text-brand-indigo font-[550] border border-brand-indigo/[0.18] shadow-sm shadow-brand-indigo/10"
          : "text-muted-foreground hover:bg-brand-indigo/[0.08] hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-brand-indigo to-brand-violet text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
