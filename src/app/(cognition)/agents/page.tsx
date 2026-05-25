"use client";

import { AgentLattice } from "@/components/agents/agent-lattice";
import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

function AgentsDefinitionBlock({ locale }: { locale: UiLocale }) {
  return (
    <div className="mb-[var(--ms-block-gap)] grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* What agents are */}
      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-faint">
          {pickLocale(locale, "What agents represent", "Что представляют агенты")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "Six specialist reads — structure, flow, liquidity, sentiment, macro, and risk. Each agent sees the market through a different lens. Together they form the full picture.",
            "Шесть специализированных прочтений — структура, поток, ликвидность, настроение, макро, риск. Каждый агент видит рынок через другую линзу. Вместе они формируют полную картину.",
          )}
        </p>
      </div>

      {/* Why consensus matters */}
      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-flow/80">
          {pickLocale(locale, "When reads align — consensus", "Когда прочтения сходятся — консенсус")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "Multiple agents reading the same condition independently. High consensus raises conviction — structure, flow, and risk all point the same direction. Decisions become cleaner.",
            "Несколько агентов независимо читают одно и то же условие. Высокий консенсус повышает убеждённость — структура, поток и риск указывают в одном направлении. Решения становятся чище.",
          )}
        </p>
      </div>

      {/* Why disagreements matter */}
      <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-3.5">
        <p className="ms-data-label text-ms-warning/80">
          {pickLocale(locale, "When reads conflict — disagreement", "Когда прочтения конфликтуют — расхождение")}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ms-muted">
          {pickLocale(
            locale,
            "Disagreements reveal edge cases and hidden risk. High disagreement doesn't mean wrong — it means the market is sending mixed signals. Use disagreements to sharpen invalidation and size down.",
            "Расхождения выявляют граничные случаи и скрытый риск. Высокое расхождение не означает ошибку — оно означает смешанные сигналы рынка. Используйте расхождения для уточнения инвалидации и снижения объёма.",
          )}
        </p>
      </div>
    </div>
  );
}

export default function AgentsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("agents");

  return (
    <CognitionWorldFrame world="agents" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="agents"
        eyebrow={sectionTitle(locale, "agents")}
        title={sectionTitle(locale, "agents")}
        purpose={sectionPurpose(locale, "agents")}
        subtitle={sectionChromeSubtitle(locale, "agents")}
      />
      <SurfaceBlufBlock bluf={bluf} />
      <AgentsDefinitionBlock locale={locale} />
      <AgentLattice />
    </CognitionWorldFrame>
  );
}
