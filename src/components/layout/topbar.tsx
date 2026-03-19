"use client";

import { UserNav } from "./user-nav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export function Topbar({ title, subtitle, onMobileMenuToggle }: TopbarProps) {
  return (
    <div className="glass rounded-[var(--radius-xl)] px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-[650] tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UserNav />
      </div>
    </div>
  );
}
