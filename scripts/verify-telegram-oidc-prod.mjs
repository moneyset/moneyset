/** Production Telegram OIDC verification (no secrets). */
const base = process.argv[2] ?? "https://moneyset.pro";

async function main() {
  const results = {};

  // 1. OIDC start redirect
  const start = await fetch(`${base}/api/auth/telegram/oidc/start?next=/`, { redirect: "manual" });
  const loc = start.headers.get("location") ?? "";
  const authUrl = loc ? new URL(loc) : null;
  const expectedRedirect = `${base.replace(/\/$/, "")}/api/auth/telegram/oidc/callback`;
  const expectedOrigin = new URL(base).origin;

  results.oidcConfiguration = {
    startStatus: start.status,
    redirectsToTelegram: authUrl?.host === "oauth.telegram.org",
    clientIdPresent: Boolean(authUrl?.searchParams.get("client_id")),
    clientId: authUrl?.searchParams.get("client_id") ?? null,
    redirectUri: authUrl?.searchParams.get("redirect_uri") ?? null,
    redirectUriMatchesExpected: authUrl?.searchParams.get("redirect_uri") === expectedRedirect,
    expectedRedirectUri: expectedRedirect,
    responseTypeCode: authUrl?.searchParams.get("response_type") === "code",
    scopeOpenIdProfile: authUrl?.searchParams.get("scope") === "openid profile",
    pkceS256: authUrl?.searchParams.get("code_challenge_method") === "S256",
    hasCodeChallenge: Boolean(authUrl?.searchParams.get("code_challenge")),
    hasState: Boolean(authUrl?.searchParams.get("state")),
    pkceCookiesSet: (start.headers.get("set-cookie") ?? "").includes("ms_tg_oidc_state"),
    serverSecretsConfigured: start.status >= 300 && start.status < 400 && !loc.includes("telegram_oidc_unconfigured"),
  };

  // 2. Trusted origin (request origin drives redirect_uri)
  results.trustedOrigin = {
    expectedAllowedOrigin: expectedOrigin,
    redirectUriUsesProductionHost: (results.oidcConfiguration.redirectUri ?? "").startsWith(expectedOrigin),
    note: "BotFather Web Login → Allowed URL must match site origin exactly",
  };

  // 3. Callback route behavior
  const denied = await fetch(`${base}/api/auth/telegram/oidc/callback?error=access_denied`, { redirect: "manual" });
  const invalid = await fetch(`${base}/api/auth/telegram/oidc/callback?code=fake&state=bad`, { redirect: "manual" });
  results.callbackRoute = {
    oauthDeniedRedirect: denied.headers.get("location")?.includes("telegram_oidc_denied") ?? false,
    invalidStateRedirect: invalid.headers.get("location")?.includes("invalid_telegram_oidc") ?? false,
  };

  // 4. Client UI (auth page)
  const authHtml = await (await fetch(`${base}/auth`)).text();
  results.clientUi = {
    oidcStartLinkInPage: authHtml.includes("/api/auth/telegram/oidc/start"),
    telegramLoginLabel: authHtml.includes("Log in with Telegram") || authHtml.includes("Войти через Telegram"),
    notAvailableMessage: authHtml.includes("Telegram sign-in is not available"),
    legacyWidgetScript: authHtml.includes("telegram-widget.js"),
  };

  // 5. Health / supporting auth infra
  const health = await (await fetch(`${base}/api/health`)).json();
  results.health = {
    ok: health.ok === true,
    envOk: health.env?.ok === true,
    supabaseOk: health.supabase?.ok === true,
    adminConfigured: health.supabase?.adminConfigured === true,
  };

  // 6. Mini App path (separate from OIDC browser login)
  const mini = await fetch(`${base}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  results.miniAppAuth = {
    status: mini.status,
    missingInitData: mini.status === 400,
  };

  // Blockers for automated checks
  const blockers = [];
  if (!results.oidcConfiguration.serverSecretsConfigured) blockers.push("TELEGRAM_OIDC_CLIENT_ID/SECRET missing on server");
  if (!results.oidcConfiguration.redirectUriMatchesExpected) blockers.push("Redirect URI mismatch");
  if (!results.oidcConfiguration.pkceS256) blockers.push("PKCE not configured");
  if (!results.trustedOrigin.redirectUriUsesProductionHost) blockers.push("Redirect URI host does not match production origin");
  if (results.clientUi.notAvailableMessage) blockers.push("Client shows OIDC unavailable — redeploy after NEXT_PUBLIC_TELEGRAM_OIDC_CLIENT_ID");
  if (results.clientUi.legacyWidgetScript) blockers.push("Legacy widget still present");
  if (!results.health.supabaseOk) blockers.push("Supabase not healthy — session creation may fail");

  results.automatedBlockers = blockers;
  results.manualVerificationRequired = [
    "Complete Telegram OAuth in browser with a real account (new user test)",
    "Repeat login with same Telegram account (returning user test)",
    "Confirm /api/access/me returns signed-in profile after redirect",
  ];

  console.log(JSON.stringify(results, null, 2));
  process.exit(blockers.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
