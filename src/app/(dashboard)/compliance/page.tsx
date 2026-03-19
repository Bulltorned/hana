import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function CompliancePage() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      title="Compliance"
      description="Kelola kewajiban kepatuhan HR seperti BPJS, PPh 21, dan pelaporan tenaga kerja. Notifikasi otomatis sebelum deadline."
      phase="Phase 2 — Coming Soon"
    />
  );
}
