import type { Metadata } from "next";

import { LegalDocument, LEGAL_CONTACT_EMAIL } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MONEYSET handles authentication data, cookies, and analytics.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="May 28, 2026"
      sibling={{ href: "/terms", label: "Terms of Service" }}
      sections={[
        {
          title: "Authentication data",
          body: (
            <p>
              When you sign in, we process account identifiers supplied by your auth provider (for example
              Google or Telegram) and session tokens required to keep you signed in on this device. We use
              this data only to authenticate access, enforce entitlements, and maintain account security. We
              do not sell authentication data to third parties.
            </p>
          ),
        },
        {
          title: "Cookies & local storage",
          body: (
            <p>
              MONEYSET uses cookies and browser storage to maintain your session, remember UI preferences,
              and keep the workspace stable between visits. Essential cookies are required for sign-in and
              access control. You can clear cookies in your browser settings; doing so will sign you out and
              reset local preferences.
            </p>
          ),
        },
        {
          title: "Analytics",
          body: (
            <p>
              We may collect aggregated, non-identifying usage signals to understand reliability and product
              performance (for example page errors, latency, or feature adoption). We do not use third-party
              advertising trackers. Analytics data is used internally to improve stability and is not sold.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              For privacy questions or data requests, contact{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
