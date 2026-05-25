import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "MONEYSET — secure session on this device. No feed, no noise.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
