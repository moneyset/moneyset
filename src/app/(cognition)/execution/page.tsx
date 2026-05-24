"use client";

import dynamic from "next/dynamic";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { WorkspaceSkeleton } from "@/components/ui/workspace-skeleton";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const ExecutionTacticalWorkspace = dynamic(
  () =>
    import("@/components/execution/execution-tactical-workspace").then((m) => m.ExecutionTacticalWorkspace),
  {
    ssr: false,
    loading: () => <WorkspaceSkeleton variant="theater" label="Loading execution workspace" className="mt-4" />,
  },
);

export default function ExecutionSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="execution" className="ms-page ms-cognition-surface relative lg:grid lg:grid-cols-12 lg:gap-x-6">
      <div className="min-w-0 lg:col-span-12">
        <WorldSurfaceChrome
          world="execution"
          eyebrow={pickLocale(locale, "Surface", "Поверхность")}
          title={pickLocale(locale, "Execution", "Исполнение")}
          subtitle={pickLocale(
            locale,
            "Tactical geometry · live conditions · decision gravity",
            "Тактическая геометрия · живые условия · гравитация решения",
          )}
        />
        <ExecutionTacticalWorkspace />
      </div>
    </CognitionWorldFrame>
  );
}
