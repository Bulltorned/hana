import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  BarChart3,
  FileText,
  Bot,
  Sparkles,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  section: "main" | "agent" | "account";
  operatorOnly?: boolean;
}

export const navigationItems: NavItem[] = [
  // Main
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "main" },
  { label: "Tenants", href: "/tenants", icon: Building2, section: "main", operatorOnly: true },
  { label: "Karyawan", href: "/employees", icon: Users, section: "main" },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck, section: "main" },
  { label: "Assessment", href: "/assessment", icon: BarChart3, section: "main" },
  { label: "Dokumen", href: "/documents", icon: FileText, section: "main" },

  // Agent
  { label: "HR Agent", href: "/hr-agent", icon: Bot, section: "agent" },
  { label: "Hana (Staff)", href: "/hana-agent", icon: Sparkles, section: "agent" },

  // Account
  { label: "Pengaturan", href: "/settings", icon: Settings, section: "account" },
  { label: "Subscription", href: "/billing", icon: CreditCard, section: "account" },
];

export const sectionLabels: Record<string, string> = {
  main: "Main",
  agent: "Agent",
  account: "Account",
};
