import type { ReactNode } from "react";
import Link from "next/link";

const CONTACT = "moneyset@moneyset.pro";

type LegalSection = Readonly<{ title: string; body: ReactNode }>;

type LegalDocumentProps = Readonly<{
  title: string;
  updated: string;
  sections: readonly LegalSection[];
  sibling: { href: string; label: string };
}>;

export function LegalDocument({ title, updated, sections, sibling }: LegalDocumentProps) {
  return (
    <main className="ms-legal-page">
      <div className="ms-legal-page__inner">
        <header className="ms-legal-page__header">
          <p className="ms-legal-page__wordmark">MONEYSET</p>
          <h1 className="ms-legal-page__title">{title}</h1>
          <p className="ms-legal-page__updated">Last updated · {updated}</p>
        </header>

        <div className="ms-legal-page__body">
          {sections.map((section) => (
            <section key={section.title} className="ms-legal-page__section">
              <h2>{section.title}</h2>
              {section.body}
            </section>
          ))}
        </div>

        <footer className="ms-legal-page__footer">
          <Link href="/">← Platform</Link>
          <Link href={sibling.href}>{sibling.label}</Link>
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </footer>
      </div>
    </main>
  );
}

export { CONTACT as LEGAL_CONTACT_EMAIL };
