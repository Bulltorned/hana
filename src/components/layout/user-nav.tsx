"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings, CreditCard, ChevronDown } from "lucide-react";

export function UserNav() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isOperator = profile?.role === "operator";

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const menuItems = [
    {
      label: "Pengaturan",
      icon: Settings,
      href: "/settings",
    },
    {
      label: "Subscription",
      icon: CreditCard,
      href: "/billing",
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-brand-indigo/[0.06] transition-colors cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-brand-indigo to-brand-violet text-white text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-3 w-3 text-tertiary" />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[240px] p-0 overflow-hidden">
        {/* User info header */}
        <div className="px-3 py-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                isOperator
                  ? "bg-gradient-to-br from-brand-teal to-brand-indigo"
                  : "bg-gradient-to-br from-brand-indigo to-brand-violet"
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">
                {profile?.full_name ?? "User"}
              </div>
              <div className="text-[10px] text-tertiary truncate">
                {user?.email}
              </div>
              <div className="text-[9px] text-tertiary mt-0.5">
                {isOperator ? "Operator" : "Client HRD"}
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-1">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                setOpen(false);
                router.push(item.href);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-muted/60 transition-colors"
            >
              <item.icon className="h-3.5 w-3.5 text-tertiary" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="p-1 border-t border-border/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-brand-coral hover:bg-brand-coral/[0.06] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
