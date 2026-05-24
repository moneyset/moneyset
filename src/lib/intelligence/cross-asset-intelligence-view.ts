import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

function clampPct(n: number): number {
  return Math.max(10, Math.min(96, Math.round(n)));
}

function slope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const a = values[0]!;
  const b = values[values.length - 1]!;
  return (b - a) / Math.max(1, values.length - 1);
}

export type CrossAssetRelationRead = Readonly<{
  id: string;
  label: string;
  structuralRead: string;
  executionImplication: string;
  /** Internal tension for strip — not a correlation coefficient. */
  tensionPct: number;
}>;

export type CrossAssetIntelligenceBundle = Readonly<{
  relations: readonly CrossAssetRelationRead[];
  liquidityMigration: Readonly<{
    lines: readonly string[];
    executionImplication: string;
  }>;
  riskTransition: Readonly<{
    label: string;
    structuralRead: string;
    executionImplication: string;
    tensionPct: number;
  }>;
  volPressureField: string;
  deskFootnote: string;
}>;

export function deriveCrossAssetIntelligenceBundle(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): CrossAssetIntelligenceBundle {
  const m = latent.macroLiquidityBackdrop;
  const pp = latent.positioningPressure;
  const liq = latent.liquidityStructuralStress;
  const vi = latent.volatilityImpulse;
  const st = latent.sentimentThermal;
  const div = derived.divergenceIndex;
  const spread = derived.consensusSpreadPct;

  const macroSlope = history.length >= 12 ? slope(history.slice(-12).map((x) => x.liquidityStructuralStress)) : 0;

  const btcDxy: CrossAssetRelationRead = {
    id: "btc_dxy",
    label: pickLocale(locale, "BTC vs USD (proxy)", "BTC vs USD (прокси)"),
    structuralRead:
      isLateContinuationRegime(latent)
        ? pickLocale(
            locale,
            "USD and rates pressure transmit into BTC continuation quality — cross-asset fragility rising.",
            "Давление USD и ставок передаётся в качество продолжения BTC — кросс-хрупкость растёт.",
          )
        : m >= 64 && pp < 58
        ? pickLocale(
            locale,
            "Dollar strength broadening while crypto participation narrows — transmission into continuation quality.",
            "Доллар усиливается, крипто-участие сужается — передача в качество продолжения.",
          )
        : m <= 46
          ? pickLocale(
              locale,
              "USD pressure easing on the desk read — risk carry finds more sponsorship room.",
              "Давление USD слабеет в прочтении — риск-кэрри получает больше спонсорства.",
            )
          : pickLocale(
              locale,
              "USD / risk tension balanced — no clean dominance handoff between fiat pressure and tape depth.",
              "Напряжение USD/риск сбалансировано — без явной передачи доминанты.",
            ),
    executionImplication:
      m >= 64 && pp < 58
        ? pickLocale(locale, "Execution: continuation quality weakening — favor proofs over impulse.", "Исполнение: продолжение слабеет — важнее доказательства, не импульс.")
        : pickLocale(locale, "Execution: monitor reclaim acceptance when USD and participation diverge.", "Исполнение: следить за принятием откупа при расхождении USD и участия."),
    tensionPct: clampPct(m * 0.52 + (100 - pp) * 0.22 + div * 0.28),
  };

  const btcYields: CrossAssetRelationRead = {
    id: "btc_yields",
    label: pickLocale(locale, "BTC vs yields (proxy)", "BTC vs доходности (прокси)"),
    structuralRead:
      isLateContinuationRegime(latent)
        ? pickLocale(
            locale,
            "Yield pressure rising into compressed BTC vol — cross-market fragility transmits faster than spot structure updates.",
            "Давление доходности растёт на сжатой воле BTC — кросс-хрупкость передаётся быстрее, чем обновляется структура.",
          )
        : m >= 60 && derived.volTone !== "compressing"
        ? pickLocale(
            locale,
            "Yield pressure increasing into macro-sensitive environment — duration repricing risk elevated.",
            "Давление ставок растёт в макро-чувствительной среде — риск переоценки дюрации выше.",
          )
        : derived.volTone === "compressing" && m >= 52
          ? pickLocale(
              locale,
              "Rates volatility compressed while macro backdrop stays firm — coil before catalyst transmission.",
              "Волатильность ставок сжата при жёстком макро — змеевик до передачи катализатора.",
            )
          : pickLocale(
              locale,
              "Yield–crypto tension moderate — curve not forcing a single structural read on crypto tape.",
              "Напряжение ставки–крипто умеренное — кривую нельзя свести к одному структурному чтению.",
            ),
    executionImplication:
      m >= 60 && derived.volTone !== "compressing"
        ? pickLocale(locale, "Execution: breakout conditions becoming fragile — tighten invalidation.", "Исполнение: пробои хрупче — ужать инвалидацию.")
        : pickLocale(locale, "Execution: favor range discipline until yield vol resolves directionally.", "Исполнение: дисциплина диапазона, пока вол ставок не даст направление."),
    tensionPct: clampPct(m * 0.48 + vi * 0.35 + (derived.volTone === "expanding" ? 14 : 0)),
  };

  const btcNasdaq: CrossAssetRelationRead = {
    id: "btc_nasdaq",
    label: pickLocale(locale, "BTC vs growth / Nasdaq (proxy)", "BTC vs рост / Nasdaq (прокси)"),
    structuralRead:
      st >= 68 && spread < 52
        ? pickLocale(
            locale,
            "Nasdaq sponsorship weakening while participation heat stays elevated on crypto — cross-market divergence risk increasing.",
            "Спонсорство «роста» слабеет, крипто остаётся горячим — растёт кросс-дивергенция.",
          )
        : st < 52 && spread >= 58
          ? pickLocale(
              locale,
              "Growth tape supportive in proxy read — crypto breadth can borrow sponsorship if liquidity holds.",
              "Рост поддерживает в прокси — ширина крипто может позаимствовать спонсорство при ликвидности.",
            )
          : pickLocale(
              locale,
              "Tech–crypto leadership mixed — no single sponsor driving both tapes in this window.",
              "Лидерство тех/крипто смешанное — один спонсор не ведёт обе ленты.",
            ),
    executionImplication:
      st >= 68 && spread < 52
        ? pickLocale(locale, "Execution: reduce trend chase; treat extensions as conditional.", "Исполнение: меньше погони за трендом; продолжение условно.")
        : pickLocale(locale, "Execution: align breakout tests with cross-sponsor coherence.", "Исполнение: пробои — в связке со спонсором."),
    tensionPct: clampPct(st * 0.42 + (100 - spread) * 0.38 + div * 0.2),
  };

  const btcOil: CrossAssetRelationRead = {
    id: "btc_oil",
    label: pickLocale(locale, "BTC vs commodities / oil (proxy)", "BTC vs сырьё / нефть (прокси)"),
    structuralRead:
      liq >= 64 && vi >= 56
        ? pickLocale(
            locale,
            "Commodity-volatility channel loading into liquidity stress — energy shock sensitivity on watch.",
            "Канал сырьевой волы на стресс ликвидности — чувствительность к энергошоку на контроле.",
          )
        : liq < 56 && vi < 50
          ? pickLocale(
              locale,
              "Commodity shock proxy contained — reflation impulse not dominating crypto structural read.",
              "Прокси сырьевого шока сдержан — рефляция не доминирует в структуре крипто.",
            )
          : pickLocale(
              locale,
              "Cross-commodity pressure present but not decisive — liquidity desk remains primary lens.",
              "Сырьевое давление есть, но не решает — первична ликвидность.",
            ),
    executionImplication:
      liq >= 64 && vi >= 56
        ? pickLocale(locale, "Execution: widen tail awareness; avoid thin-book aggression.", "Исполнение: хвосты шире; без агрессии в тонком стакане.")
        : pickLocale(locale, "Execution: standard continuation filters unless stress re-accelerates.", "Исполнение: обычные фильтры продолжения, пока стресс не ускорится."),
    tensionPct: clampPct(liq * 0.5 + vi * 0.45),
  };

  const ethBtcSpread = Math.abs(st - pp);
  const ethBtc: CrossAssetRelationRead = {
    id: "eth_btc",
    label: pickLocale(locale, "ETH / BTC structure (proxy)", "Структура ETH/BTC (прокси)"),
    structuralRead:
      ethBtcSpread >= 22
        ? pickLocale(
            locale,
            "Altcoin beta diverging from majors — liquidity migrating toward concentration or risk-off pockets.",
            "Альта расходится с мажорами — ликвидность к концентрации или risk-off карманам.",
          )
        : pickLocale(
            locale,
            "Major / alt beta coherent — no extreme internal rotation signal in this lattice window.",
            "Бета мажор/альт согласована — без экстремальной внутренней ротации в окне решётки.",
          ),
    executionImplication:
      ethBtcSpread >= 22
        ? pickLocale(locale, "Execution: favor majors for execution quality when beta splits.", "Исполнение: мажоры при расхождении беты для качества.")
        : pickLocale(locale, "Execution: rotation risk contained — size normally to structure.", "Исполнение: ротация сдержана — размер к структуре."),
    tensionPct: clampPct(ethBtcSpread * 1.85 + liq * 0.25),
  };

  const crossVol: CrossAssetRelationRead = {
    id: "cross_vol",
    label: pickLocale(locale, "Cross-market volatility pressure", "Кросс-рыночное давление волатильности"),
    structuralRead:
      vi >= 62 && div >= 40
        ? pickLocale(
            locale,
            "Volatility pressure transmitting across views — dispersion rising faster than single-asset vol alone suggests.",
            "Вола передаётся между представлениями — дисперсия растёт быстрее одной волы.",
          )
        : derived.volTone === "compressing" && m >= 54
          ? pickLocale(
              locale,
              "Cross-asset vol suppressed but macro-sensitive — expansion risk into catalyst / overlap windows.",
              "Кросс-вола сжата, но макро-чувствительна — риск расширения в окна катализатора/перекрытия.",
            )
          : pickLocale(
              locale,
              "Volatility field orderly — no broad contagion signature in the proxy stack.",
              "Волатильное поле упорядочено — широкой заразы в прокси нет.",
            ),
    executionImplication:
      vi >= 62 && div >= 40
        ? pickLocale(locale, "Execution: reactive execution preferred over breakout initiation.", "Исполнение: реактивнее, чем инициация пробоя.")
        : pickLocale(locale, "Execution: maintain compression discipline until leadership clarifies.", "Исполнение: дисциплина сжатия, пока лидерство не прояснится."),
    tensionPct: clampPct(vi * 0.55 + div * 0.4 + (derived.volTone === "expanding" ? 12 : 0)),
  };

  const lines: string[] = [];
  if (macroSlope > 0.45) {
    lines.push(
      pickLocale(locale, "Liquidity migrating defensively — depth preference for majors rising.", "Ликвидность в защиту — предпочтение глубины мажоров."),
    );
  } else if (macroSlope < -0.45) {
    lines.push(
      pickLocale(locale, "Liquidity stress moderating — speculative breadth can repair if sponsorship returns.", "Стресс ликвидности слабеет — ширина может починиться со спонсорством."),
    );
  }
  if (pp >= 70 && liq >= 58) {
    lines.push(
      pickLocale(locale, "Leverage crowding expanding — concentration into trending books.", "Скопление плеча — концентрация в трендовых книгах."),
    );
  }
  if (spread <= 48 && st >= 62) {
    lines.push(
      pickLocale(locale, "Speculative breadth weakening — participation narrowing near local highs.", "Спекулятивная ширина слабеет — сужение у локальных максимумов."),
    );
  }
  if (lines.length === 0) {
    lines.push(
      pickLocale(
        locale,
        "Liquidity migration quiet — no strong rotation signature between majors and peripherals.",
        "Миграция ликвидности спокойна — без сильной ротации мажор/периферия.",
      ),
    );
  }

  const riskOffUndertow =
    derived.dangerBand === "calm" || derived.consensus === "macro_dominance_rising"
      ? false
      : derived.consensus === "consensus_weakening" ||
        derived.consensus === "divergence_increasing" ||
        derived.consensus === "risk_layer_escalating" ||
        derived.dangerBand === "elevated" ||
        derived.dangerBand === "dangerous" ||
        derived.dangerBand === "critical";

  const riskTransition = {
    label: pickLocale(locale, "Risk-on / risk-off transition", "Переход risk-on / risk-off"),
    structuralRead: riskOffUndertow
      ? pickLocale(
          locale,
          "Risk-off undertow strengthening — defensive bid quality prioritized across cross-assets.",
          "Подталкивание risk-off — в приоритете качество защитного бида кросс-активов.",
        )
      : pickLocale(
          locale,
          "Risk-on conditions tolerable — sponsorship still borrows from macro and flow coherence.",
          "Risk-on терпим — спонсорство ещё одалживает связность макро и потока.",
        ),
    executionImplication: riskOffUndertow
      ? pickLocale(locale, "Execution: reduce breakout aggression; favor responsive fills.", "Исполнение: меньше агрессии пробоев; ответные заполнения.")
      : pickLocale(locale, "Execution: continuation favored while cross-market coherence holds.", "Исполнение: продолжение, пока кросс-связность держится."),
    tensionPct: clampPct((riskOffUndertow ? 62 : 38) + div * 0.35 + (riskOffUndertow ? vi * 0.15 : 0)),
  };

  const volPressureField = pickLocale(
    locale,
    `Volatility stress field: ${derived.volTone === "compressing" ? "suppressed" : derived.volTone === "expanding" ? "active" : "neutral"} transmission across proxies · dispersion ${div >= 44 ? "elevated" : "contained"}.`,
    `Поле волы: ${derived.volTone === "compressing" ? "сжато" : derived.volTone === "expanding" ? "активно" : "нейтрально"} · разнос ${div >= 44 ? "выше" : "сдержан"}.`,
  );

  const deskFootnote = isLateContinuationRegime(latent)
    ? pickLocale(
        locale,
        "Transmission observatory: fragility propagates from rates, USD, and growth proxies into BTC continuation quality — not decorative correlation.",
        "Обсерватория передачи: хрупкость идёт от ставок, USD и прокси роста в качество продолжения BTC — не декоративная корреляция.",
      )
    : pickLocale(
        locale,
        "Intermarket reads are structural proxies from the cognition lattice — not live index correlations or quote feeds.",
        "Межрыночные прочтения — структурные прокси решётки, а не живые корреляции индексов.",
      );

  return {
    relations: [btcDxy, btcYields, btcNasdaq, btcOil, ethBtc, crossVol],
    liquidityMigration: {
      lines: lines.slice(0, 4),
      executionImplication: pickLocale(
        locale,
        "Execution: size liquidity migration into participation quality — thin rotation punishes late chase.",
        "Исполнение: миграцию ликвидности вшить в качество участия — поздняя погоня карается.",
      ),
    },
    riskTransition,
    volPressureField,
    deskFootnote,
  };
}
