import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function HRAgentPage() {
  return (
    <ComingSoon
      icon={Bot}
      title="HR Agent"
      description="AI assistant yang membantu HRD mengelola compliance, generate dokumen, dan menjawab pertanyaan regulasi ketenagakerjaan."
      phase="Phase 2 — Coming Soon"
    />
  );
}
