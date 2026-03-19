import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Pengaturan"
      description="Konfigurasi perusahaan, kop surat, template dokumen, notifikasi WhatsApp, dan preferensi agent AI."
      phase="Phase 4 — Coming Soon"
    />
  );
}
