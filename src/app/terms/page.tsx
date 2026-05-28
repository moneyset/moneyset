import type { Metadata } from "next";

import { LegalDocument, LEGAL_CONTACT_EMAIL } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing lawful use of the MONEYSET platform.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="May 28, 2026"
      sibling={{ href: "/privacy", label: "Privacy Policy" }}
      sections={[
        {
          title: "Lawful use",
          body: (
            <p>
              MONEYSET is an institutional market-structure intelligence environment. You agree to use the
              platform lawfully, without attempting to disrupt service, bypass access controls, scrape
              protected surfaces, or misuse authentication, billing, or API endpoints. You are responsible
              for activity under your account.
            </p>
          ),
        },
        {
          title: "No guarantees",
          body: (
            <p>
              MONEYSET provides interpretive market intelligence — not trading signals, investment advice, or
              execution instructions. Data feeds, models, and outputs may be delayed, incomplete, or
              incorrect. We make no guarantee of accuracy, uptime, profitability, or suitability for any
              financial decision. You use the platform at your own discretion and risk.
            </p>
          ),
        },
        {
          title: "Account suspension",
          body: (
            <p>
              We may suspend or terminate access — including paid entitlements — if we reasonably believe you
              have violated these terms, abused the platform, compromised security, or engaged in fraudulent
              payment activity. Suspension may occur without prior notice when required to protect the service
              or other users.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              For terms-related inquiries, contact{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
