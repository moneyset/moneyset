import { CognitionRuntimeProvider } from "@/components/cognition/cognition-runtime-provider";
import { AppShell } from "@/components/layout/app-shell";
import { CognitionLocaleSync } from "@/components/cognition/cognition-locale-sync";
import { CognitionEntryGate } from "@/components/motion/cognition-entry-gate";

export default function CognitionLayout({ children }: { children: React.ReactNode }) {
  return (
    <CognitionEntryGate>
      <CognitionLocaleSync />
      <CognitionRuntimeProvider>
        <AppShell>{children}</AppShell>
      </CognitionRuntimeProvider>
    </CognitionEntryGate>
  );
}
