import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session",
  description: "MONEYSET session — restrained access control.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
