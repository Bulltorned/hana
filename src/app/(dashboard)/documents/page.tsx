import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Dokumen"
      description="Generate surat kerja, SP, kontrak, dan dokumen HR lainnya secara otomatis dengan template dan kop surat perusahaan."
      phase="Phase 2 — Coming Soon"
    />
  );
}
