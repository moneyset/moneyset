import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type { AgentLatticeRow, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";
import { divergenceLabel, divergenceTier, pickLocale } from "@/lib/i18n/cognition-dict";

export function deriveAgentLattice(latent: LatentDrivers, derived: DerivedCognitionSnapshot, locale: UiLocale): AgentLatticeRow[] {
  const divergence = derived.divergenceIndex;
  const divTier = divergenceTier(divergence);
  const div = divergenceLabel(locale, divTier);
  const lateContinuation = isLateContinuationRegime(latent);

  const macroC = clampPct(latent.macroLiquidityBackdrop * 0.92 + latent.liquidityStructuralStress * -0.05);
  const flowC = clampPct(latent.positioningPressure * 0.93 + latent.volatilityImpulse * 0.04);
  const riskC = clampPct(latent.liquidityStructuralStress * 0.9 + divergence * 0.18);
  const sentC = clampPct(106 - latent.sentimentThermal * 0.75 + divergence * -0.1);
  const liqC = clampPct(latent.liquidityStructuralStress * -0.15 + latent.positioningPressure * 0.55 + latent.macroLiquidityBackdrop * 0.35);

  const orchBase =
    latent.positioningPressure * 0.18 +
    latent.liquidityStructuralStress * -0.2 +
    latent.macroLiquidityBackdrop * 0.32 +
    (100 - divergence) * 0.42;
  const orchC = clampPct(orchBase);

  const macroAlign = pickLocale(
    locale,
    latent.macroLiquidityBackdrop >= 62 ? "Macro supportive" : latent.macroLiquidityBackdrop <= 42 ? "Macro tight" : "Macro mixed",
    latent.macroLiquidityBackdrop >= 62 ? "Макро поддерживает" : latent.macroLiquidityBackdrop <= 42 ? "Макро жмёт" : "Макро смешанно",
  );

  const flowAlign = pickLocale(
    locale,
    latent.positioningPressure >= 64 ? "Bid-led" : latent.positioningPressure <= 38 ? "Offer-led" : "Two-way",
    latent.positioningPressure >= 64 ? "Покупатели ведут" : latent.positioningPressure <= 38 ? "Продавцы ведут" : "Двусторонне",
  );

  const riskAlign = pickLocale(
    locale,
    derived.dangerBand === "calm" || derived.dangerBand === "moderate" ? "Tails balanced" : "Tail skew",
    derived.dangerBand === "calm" || derived.dangerBand === "moderate" ? "Хвосты в балансе" : "Перекос хвоста",
  );

  const sentimentAlign = pickLocale(
    locale,
    latent.sentimentThermal <= 52 ? "Crowd quiet" : latent.sentimentThermal >= 73 ? "Crowd hot" : "Crowd neutral",
    latent.sentimentThermal <= 52 ? "Толпа спокойна" : latent.sentimentThermal >= 73 ? "Толпа горячая" : "Толпа нейтральна",
  );

  const liqAlign = pickLocale(
    locale,
    latent.liquidityStructuralStress >= 62 ? "Depth thin" : "Depth stable",
    latent.liquidityStructuralStress >= 62 ? "Глубина тонкая" : "Глубина ровная",
  );

  return [
    {
      role: "Macro",
      confidencePct: macroC,
      alignmentLabel: macroAlign,
      divergenceLabel: div,
      stateLabel: pickLocale(
        locale,
        divergence >= 54 && latent.macroLiquidityBackdrop > latent.positioningPressure ? "Elevated" : "Stable",
        divergence >= 54 && latent.macroLiquidityBackdrop > latent.positioningPressure ? "Повышено" : "Стабильно",
      ),
      analyticLine: pickLocale(
        locale,
        lateContinuation
          ? "Yield pressure rising — BTC extension sensitive to duration and USD shocks."
          : divergence >= 54
            ? "Participation mismatch vs macro liquidity path."
            : "Rate path inside assumed corridor.",
        lateContinuation
          ? "Давление доходности растёт — продление BTC чувствительно к дюрации и USD."
          : divergence >= 54
            ? "Участие не попадает в макро‑ликвидностный контур."
            : "Ставки в допущенном коридоре.",
      ),
      accent: divergence >= 50 ? "warning" : "cognition",
    },
    {
      role: "Flow",
      confidencePct: flowC,
      alignmentLabel: flowAlign,
      divergenceLabel: div,
      stateLabel: pickLocale(
        locale,
        latent.positioningPressure >= 72 ? "Stretch" : "Monitor",
        latent.positioningPressure >= 72 ? "Растяжение" : "Наблюдение",
      ),
      analyticLine: pickLocale(
        locale,
        lateContinuation
          ? "Momentum locally overheated — continuation needs sponsorship, not chase."
          : latent.positioningPressure >= 72
            ? "Leverage extended. Bid support required."
            : "Absorption stable.",
        lateContinuation
          ? "Импульс локально перегрет — продолжению нужен спонсор, не погоня."
          : latent.positioningPressure >= 72
            ? "Плечо растянуто. Нужны биды."
            : "Поглощение ровное.",
      ),
      accent: latent.positioningPressure >= 72 ? "flow" : "flow",
    },
    {
      role: "Risk",
      confidencePct: riskC,
      alignmentLabel: riskAlign,
      divergenceLabel: div,
      stateLabel: pickLocale(
        locale,
        derived.dangerBand === "dangerous" || derived.dangerBand === "critical" ? "Defense" : "Measured",
        derived.dangerBand === "dangerous" || derived.dangerBand === "critical" ? "Защита" : "Сдержанно",
      ),
      analyticLine: pickLocale(
        locale,
        lateContinuation
          ? "Structural fragility rising beneath headline strength — invalidation bands tighten."
          : derived.dangerScore >= 74
            ? "Tail skew widening — liquidation paths dominate tape."
            : "Tail posture inside current stress band.",
        lateContinuation
          ? "Структурная хрупкость растёт под силой заголовков — полосы инвалидации сжимаются."
          : derived.dangerScore >= 74
            ? "Хвост дорожает — ликвидации ведут ленту."
            : "Хвост внутри текущей полосы стресса.",
      ),
      accent: derived.dangerScore >= 74 ? "danger" : derived.dangerScore >= 54 ? "warning" : "danger",
    },
    {
      role: "Sentiment",
      confidencePct: sentC,
      alignmentLabel: sentimentAlign,
      divergenceLabel: div,
      stateLabel: pickLocale(locale, latent.sentimentThermal >= 70 ? "Hot" : "Stable", latent.sentimentThermal >= 70 ? "Жарко" : "Стабильно"),
      analyticLine: pickLocale(
        locale,
        lateContinuation
          ? "Crowd reactive to headlines — breadth narrowing under extension."
          : latent.sentimentThermal >= 73
            ? "Participation thermal hot — reversal sensitivity ↑."
            : "Participation tempo sustainable vs vol.",
        lateContinuation
          ? "Толпа реактивна к заголовкам — ширина сужается на продлении."
          : latent.sentimentThermal >= 73
            ? "Тепло участия высоко — чувствительность к развороту ↑."
            : "Темп участия устойчив к текущей воле.",
      ),
      accent: "sentiment",
    },
    {
      role: "Liquidity",
      confidencePct: liqC,
      alignmentLabel: liqAlign,
      divergenceLabel: div,
      stateLabel: pickLocale(
        locale,
        latent.liquidityStructuralStress >= 72 ? "Tightening" : latent.liquidityStructuralStress <= 42 ? "Loose" : "Stable",
        latent.liquidityStructuralStress >= 72 ? "Сжатие" : latent.liquidityStructuralStress <= 42 ? "Свободнее" : "Стабильно",
      ),
      analyticLine: pickLocale(
        locale,
        lateContinuation
          ? "Passive depth thinning — sweep vulnerability elevated below reclaim."
          : latent.liquidityStructuralStress >= 68
            ? "Book thin; size down or widen limits."
            : "Spreads and depth OK for usual size.",
        lateContinuation
          ? "Пассивная глубина истончается — риск сноса ниже откупа выше."
          : latent.liquidityStructuralStress >= 68
            ? "Книга тонкая; меньше размер или шире лимиты."
            : "Спреды и глубина ок под обычный размер.",
      ),
      accent: latent.liquidityStructuralStress >= 68 ? "consensus" : "consensus",
    },
    {
      role: "Orchestrator",
      confidencePct: orchC,
      alignmentLabel: pickLocale(
        locale,
        divergence <= 34 ? "Reads aligned" : divergence <= 54 ? "Tape vs risk split" : "Cross-input conflict",
        divergence <= 34 ? "Чтения сходятся" : divergence <= 54 ? "Лента vs риск — разнос" : "Конфликт вводных",
      ),
      divergenceLabel: div,
      stateLabel: pickLocale(
        locale,
        divergence >= 50 ? "Mixed signals" : "Aligned signals",
        divergence >= 50 ? "Смешанные сигналы" : "Сигналы согласованы",
      ),
      analyticLine: pickLocale(
        locale,
        derived.phase === "panic_risk"
          ? "Liquidation regime — weight flow over narrative."
          : lateContinuation
            ? "Desk: controlled continuation vs sweep risk — probabilistic disagreement held."
            : "Desk weighting follows regime; flag structural split.",
        derived.phase === "panic_risk"
          ? "Режим ликвидаций — приоритет потока."
          : lateContinuation
            ? "Деск: контролируемое продолжение vs риск сноса — вероятностный разнос удержан."
            : "Веса деска по режиму; фиксировать структурный разрыв.",
      ),
      accent: divergence >= 50 ? "warning" : "warning",
    },
  ];
}

function clampPct(n: number): number {
  return Math.min(94, Math.max(34, Math.round(n)));
}
