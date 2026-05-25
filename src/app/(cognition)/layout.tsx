import { CognitionRuntimeProvider } from "@/components/cognition/cognition-runtime-provider";
import { AppShell } from "@/components/layout/app-shell";
import { CognitionLocaleSync } from "@/components/cognition/cognition-locale-sync";
import { CognitionEntryGate } from "@/components/motion/cognition-entry-gate";
import { CinematicIntroRoot } from "@/components/motion/cinematic-intro-root";

export default function CognitionLayout({ children }: { children: React.ReactNode }) {
  return (
    <CognitionEntryGate>
      <CognitionLocaleSync />
      <CognitionRuntimeProvider>
        <CinematicIntroRoot>
          <AppShell>{children}</AppShell>
        </CinematicIntroRoot>
      </CognitionRuntimeProvider>
    </CognitionEntryGate>
  );
}
