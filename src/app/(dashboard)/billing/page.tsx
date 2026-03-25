"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  Crown,
  BarChart3,
  Users,
  Bot,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface PlanConfig {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  period: string;
  description: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  limits: {
    employees: string;
    agents: string;
    documents: string;
    storage: string;
  };
  popular?: boolean;
}

const plans: PlanConfig[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Gratis",
    priceNum: 0,
    period: "14 hari",
    description: "Coba semua fitur dasar",
    icon: Zap,
    color: "text-tertiary",
    features: [
      "Dashboard & employee directory",
      "Compliance calendar",
      "HR Agent (limited)",
    ],
    limits: {
      employees: "10 karyawan",
      agents: "1 agent session/hari",
      documents: "5 dokumen/bulan",
      storage: "100 MB",
    },
  },
  {
    id: "starter",
    name: "Starter",
    price: "Rp 2.5jt",
    priceNum: 2500000,
    period: "/bulan",
    description: "Untuk UKM kecil",
    icon: TrendingUp,
    color: "text-brand-teal",
    features: [
      "Semua fitur Trial",
      "HR Agent (unlimited Q&A)",
      "Compliance auto-reminder",
      "Document generation",
    ],
    limits: {
      employees: "50 karyawan",
      agents: "Unlimited Q&A",
      documents: "50 dokumen/bulan",
      storage: "1 GB",
    },
  },
  {
    id: "growth",
    name: "Growth",
    price: "Rp 6jt",
    priceNum: 6000000,
    period: "/bulan",
    description: "Untuk perusahaan berkembang",
    icon: BarChart3,
    color: "text-brand-indigo",
    popular: true,
    features: [
      "Semua fitur Starter",
      "Assessment 360°",
      "Document drafter (advanced templates)",
      "Multi-user HRD access",
      "Priority support",
    ],
    limits: {
      employees: "200 karyawan",
      agents: "Unlimited + advanced",
      documents: "Unlimited",
      storage: "5 GB",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp 15jt",
    priceNum: 15000000,
    period: "/bulan",
    description: "Enterprise-grade HR automation",
    icon: Crown,
    color: "text-brand-violet",
    features: [
      "Semua fitur Growth",
      "Hana Staff Agent (WhatsApp)",
      "Custom document templates",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: {
      employees: "Unlimited",
      agents: "Unlimited + WhatsApp",
      documents: "Unlimited",
      storage: "25 GB",
    },
  },
];

export default function BillingPage() {
  const {
    tenants,
    selectedTenantId,
    selectedTenant,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [tokenUsage, setTokenUsage] = useState<{
    tokensUsed: number;
    costUsd: number;
    month: string;
  } | null>(null);

  const currentPlan = selectedTenant?.plan ?? "trial";

  useEffect(() => {
    if (!selectedTenantId) return;

    // Fetch token usage for current month
    const month = new Date().toISOString().slice(0, 7);
    fetch(`/api/billing/usage?tenant_id=${selectedTenantId}&month=${month}`)
      .then((r) => r.json())
      .then(setTokenUsage)
      .catch(() => {});
  }, [selectedTenantId]);

  function handleUpgrade(planId: string) {
    if (planId === currentPlan) return;

    // In production: call Xendit to create invoice/subscription
    toast.info(
      `Upgrade ke ${planId} akan tersedia setelah integrasi Xendit aktif.`
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Subscription & Billing
          </h2>
          <p className="text-xs text-tertiary mt-0.5">
            Kelola paket langganan dan lihat pemakaian
          </p>
        </div>
        {isOperator && (
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={setSelectedTenantId}
          />
        )}
      </div>

      {/* Current Plan + Usage */}
      {selectedTenantId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Current Plan */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="text-xs text-tertiary mb-2">Paket Aktif</div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="text-sm font-semibold px-3 py-1 capitalize"
              >
                {currentPlan}
              </Badge>
              {selectedTenant && (
                <span className="text-xs text-tertiary">
                  {selectedTenant.name}
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {plans.find((p) => p.id === currentPlan)?.limits.employees}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="h-3.5 w-3.5" />
                {plans.find((p) => p.id === currentPlan)?.limits.agents}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {plans.find((p) => p.id === currentPlan)?.limits.documents}
              </div>
            </div>
          </div>

          {/* Token Usage */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="text-xs text-tertiary mb-2">
              Pemakaian Token Bulan Ini
            </div>
            <div className="text-2xl font-bold font-mono">
              {tokenUsage
                ? tokenUsage.tokensUsed.toLocaleString("id-ID")
                : "0"}
            </div>
            <div className="text-xs text-tertiary mt-1">tokens</div>
            {tokenUsage && tokenUsage.costUsd > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Estimasi biaya:{" "}
                <span className="font-mono font-semibold">
                  ${tokenUsage.costUsd.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Billing Status */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="text-xs text-tertiary mb-2">Status Pembayaran</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-teal" />
              <span className="text-sm font-medium">Aktif</span>
            </div>
            <div className="text-xs text-tertiary mt-2">
              Perpanjangan otomatis: Aktif
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() =>
                toast.info("Riwayat pembayaran akan tersedia setelah integrasi Xendit.")
              }
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Riwayat Pembayaran
            </Button>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`glass rounded-[var(--radius-xl)] p-5 flex flex-col relative ${
                plan.popular
                  ? "ring-2 ring-brand-indigo/30"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-indigo text-white text-[10px] px-2.5">
                    Paling Populer
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    plan.id === "trial"
                      ? "bg-muted"
                      : plan.id === "starter"
                        ? "bg-brand-teal/10"
                        : plan.id === "growth"
                          ? "bg-brand-indigo/10"
                          : "bg-brand-violet/10"
                  }`}
                >
                  <PlanIcon className={`h-4.5 w-4.5 ${plan.color}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{plan.name}</div>
                  <div className="text-[10px] text-tertiary">
                    {plan.description}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xl font-bold">{plan.price}</span>
                <span className="text-xs text-tertiary">{plan.period}</span>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-4 flex-1">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Check className="h-3.5 w-3.5 text-brand-teal shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div className="space-y-1.5 mb-4 pt-3 border-t border-brand-indigo/[0.06]">
                <div className="flex justify-between text-[10px]">
                  <span className="text-tertiary">Karyawan</span>
                  <span className="font-mono">{plan.limits.employees}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-tertiary">Storage</span>
                  <span className="font-mono">{plan.limits.storage}</span>
                </div>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan}
                variant={isCurrentPlan ? "outline" : "default"}
                className={`w-full text-xs ${
                  isCurrentPlan
                    ? ""
                    : plan.popular
                      ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
                      : ""
                }`}
              >
                {isCurrentPlan ? "Paket Aktif" : "Pilih Paket"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
