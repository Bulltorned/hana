import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function HanaAgentPage() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="Hana (Staff Agent)"
      description="AI chatbot untuk karyawan — cek sisa cuti, slip gaji, kebijakan perusahaan, dan ajukan permintaan HR via WhatsApp."
      phase="Phase 4 — Coming Soon"
    />
  );
}
