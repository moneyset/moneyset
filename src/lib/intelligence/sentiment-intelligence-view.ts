import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type NarrativeFragilityView = Readonly<{
  headline: string;
  tensionPct: number;
  detail: string;
  executionImplication: string;
}>;

export type SentimentIntelligenceBundle = Readonly<{
  narrativeTension: NarrativeFragilityView;
  crowdPositioning: string;
  fearEuphoria: string;
  mediaIntensity: string;
  narrativeConsensus: string;
  positioningFragility: string;
  sentimentDivergence: string;
  geopolitical: readonly string[];
  crossMarket: readonly string[];
}>;

function clampPct(n: number): number {
  return Math.max(8, Math.min(100, Math.round(n)));
}

export function deriveSentimentIntelligenceBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): SentimentIntelligenceBundle {
  const st = latent.sentimentThermal;
  const pp = latent.positioningPressure;
  const vi = latent.volatilityImpulse;
  const div = derived.divergenceIndex;
  const tensionPct = clampPct(st * 0.42 + pp * 0.38 + div * 0.35);

  const narrativeTension: NarrativeFragilityView =
    pp >= 62 && st >= 56 && st < 72 && vi <= 52 && div >= 26
      ? {
          headline: pickLocale(
            locale,
            "Reactive crowd positioning — breadth narrowing",
            "Реактивное позиционирование толпы — сужение ширины",
          ),
          tensionPct,
          detail: pickLocale(
            locale,
            "Headline strength supported by tactical adds; participation breadth no longer confirms clean continuation.",
            "Сила заголовков на тактических добавках; ширина участия больше не подтверждает чистое продолжение.",
          ),
          executionImplication: pickLocale(
            locale,
            "Execution: favor reclaim proofs over narrative chase — crowding is reactive, not structural.",
            "Исполнение: важнее доказательства откупа, чем погоня за нарративом — скопление реактивно, не структурно.",
          ),
        }
      : st >= 72 && pp >= 64
      ? {
          headline: pickLocale(locale, "Euphoric crowding — unstable bullish consensus", "Эйфорическое скопление — нестабильный бычий консенсус"),
          tensionPct,
          detail: pickLocale(
            locale,
            "Narrative optimism expanding despite weakening breadth — crowd positioning one-sided.",
            "Оптимизм нарратива растёт на ослабевающей ширине — позиционирование толпы односторонне.",
          ),
          executionImplication: pickLocale(
            locale,
            "Continuation vulnerable to negative catalyst shock — tighten sponsorship checks.",
            "Продолжение уязвимо к негативному шоку катализатора — ужать проверки спонсорства.",
          ),
        }
      : st <= 44 && derived.dangerBand !== "calm"
        ? {
            headline: pickLocale(locale, "Defensive sentiment rotation", "Защитный поворот настроений"),
            tensionPct,
            detail: pickLocale(
              locale,
              "Risk-off pressure broadening — safe-haven preference rising in interpretation lattice.",
              "Давление risk-off расширяется — предпочтение убежищ растёт в решётке прочтения.",
            ),
            executionImplication: pickLocale(
              locale,
              "Execution: favor reclaim proofs; reduce extension chasing.",
              "Исполнение: важнее доказательства откупа; меньше погони за продлением.",
            ),
          }
        : {
            headline: pickLocale(locale, "Narrative tension controlled", "Напряжение нарратива под контролем"),
            tensionPct,
            detail: pickLocale(
              locale,
              "Sentiment divergence contained — participation and narrative not maximally opposed.",
              "Дивергенция настроений сдержана — участие и нарратив не максимально противостоят.",
            ),
            executionImplication: pickLocale(
              locale,
              "Execution: standard discipline — monitor X/headline velocity into stress bands.",
              "Исполнение: стандартная дисциплина — скорость X/заголовков к полосам стресса.",
            ),
          };

  const crowdPositioning = pickLocale(
    locale,
    pp >= 70
      ? "Crowd: leverage extended — liquidation geometry sensitive."
      : pp <= 38
        ? "Crowd: de-risked — participation rebuild required for trend sponsorship."
        : "Crowd: two-way — positioning not at crowding extremes.",
    pp >= 70
      ? "Толпа: плечо растянуто — геометрия ликвидаций чувствительна."
      : pp <= 38
        ? "Толпа: снят риск — для спонсорства тренда нужно восстановление участия."
        : "Толпа: двусторонне — без экстремумов скопления.",
  );

  const fearEuphoria = pickLocale(
    locale,
    st >= 68
      ? "Fear/euphoria: euphoria-heavy — narrative heat above participation comfort."
      : st <= 42
        ? "Fear/euphoria: fear-heavy — defensive narrative dominates flow."
        : "Fear/euphoria: balanced — no single emotional pole dominating tape read.",
    st >= 68
      ? "Страх/эйфория: перекос в эйфорию — жар нарратива выше комфорта участия."
      : st <= 42
        ? "Страх/эйфория: перекос в страх — защитный нарратив ведёт поток."
        : "Страх/эйфория: баланс — ни один полюс не доминирует в чтении ленты.",
  );

  const mediaIntensity = pickLocale(
    locale,
    div >= 42
      ? "Media narrative intensity elevated — consensus splitting across channels."
      : "Media narrative intensity moderate — headline risk contained.",
    div >= 42
      ? "Интенсивность медиа-нарратива выше — консенсус расходится по каналам."
      : "Интенсивность медиа-нарратива умеренная — риск заголовков сдержан.",
  );

  const narrativeConsensus = pickLocale(
    locale,
    `Lattice consensus label: ${derived.consensus.replace(/_/g, " ")} — interpreted, not polled.`,
    `Метка консенсуса решётки: ${derived.consensus.replace(/_/g, " ")} — интерпретация, не опрос.`,
  );

  const positioningFragility = pickLocale(
    locale,
    pp >= 66 && latent.liquidityStructuralStress >= 62
      ? "Positioning fragility: high — breadth and depth disagree with leverage."
      : "Positioning fragility: moderate — watch sweep windows.",
    pp >= 66 && latent.liquidityStructuralStress >= 62
      ? "Хрупкость позиционирования: высокая — ширина и глубина не согласны с плечом."
      : "Хрупкость позиционирования: умеренная — следить за окнами сноса.",
  );

  const sentimentDivergence = pickLocale(
    locale,
    div >= 48
      ? "Sentiment divergence expanding — cross-agent narrative disagreement rising."
      : "Sentiment divergence contained — single dominant narrative not assumed.",
    div >= 48
      ? "Дивергенция настроений расширяется — растёт разногласие нарратива между агентами."
      : "Дивергенция настроений сдержана — единый доминирующий нарратив не предполагается.",
  );

  const geo: string[] = [];
  if (latent.volatilityImpulse >= 62 && latent.macroLiquidityBackdrop >= 58) {
    geo.push(
      pickLocale(
        locale,
        "Geopolitical stress: oil sensitivity increasing — volatility transmission to risk assets.",
        "Геостресс: растёт чувствительность к нефти — передача волатильности в риск-активы.",
      ),
    );
  }
  if (derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    geo.push(
      pickLocale(
        locale,
        "Geopolitical uncertainty: safe-haven flows strengthening in cross-market read.",
        "Геополитическая неопределённость: усиливаются потоки в убежища в кросс-чтении.",
      ),
    );
  }
  if (geo.length === 0) {
    geo.push(
      pickLocale(
        locale,
        "Geopolitical layer quiet — no elevated transmission into structural stress.",
        "Геополитический слой спокоен — нет повышенной передачи в структурный стресс.",
      ),
    );
  }

  const crossMarket = [
    pickLocale(
      locale,
      "BTC / DXY: risk-on/off tilt inferred from lattice stress, not spot quotes.",
      "BTC / DXY: наклон risk-on/off из стресса решётки, не из котировок.",
    ),
    pickLocale(
      locale,
      "BTC / yields: duration sensitivity rises when macro backdrop dominates micro flow.",
      "BTC / доходности: чувствительность к дюрации растёт, когда макро доминирует микропоток.",
    ),
    pickLocale(
      locale,
      "Equities / crypto: participation migration tracked via breadth vs thermal divergence.",
      "Акции / крипто: миграция участия через расхождение ширины и термального слоя.",
    ),
  ] as const;

  return {
    narrativeTension,
    crowdPositioning,
    fearEuphoria,
    mediaIntensity,
    narrativeConsensus,
    positioningFragility,
    sentimentDivergence,
    geopolitical: geo.slice(0, 3),
    crossMarket,
  };
}
