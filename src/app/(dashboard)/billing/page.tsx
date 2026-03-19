import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function BillingPage() {
  return (
    <ComingSoon
      icon={CreditCard}
      title="Subscription & Billing"
      description="Kelola paket langganan, lihat pemakaian token AI, dan riwayat pembayaran."
      phase="Phase 3 — Coming Soon"
    />
  );
}
