const base = "https://moneyset.pro";

const authHtml = await fetch(`${base}/auth`).then((r) => r.text());
const layoutJs = authHtml.match(/\/_next\/static\/chunks\/[^"]+\.js/g) ?? [];

let found = { signInTitle: false, structuralSubtitle: false, institutionalLead: false, valueBlockClass: authHtml.includes("ms-auth-page__value") };

for (const path of layoutJs.slice(0, 20)) {
  const js = await fetch(`${base}${path}`).then((r) => r.text()).catch(() => "");
  if (js.includes("Structural market intelligence")) found.structuralSubtitle = true;
  if (js.includes("Institutional-grade market intelligence")) found.institutionalLead = true;
  if (js.includes('"Sign in"') || js.includes("Sign in to save")) found.signInTitle = true;
}

console.log(JSON.stringify(found, null, 2));
