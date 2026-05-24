import { LabsSubNav } from "@/components/labs/labs-sub-nav";

export default function LabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ms-labs-workspace ms-cognition-surface relative min-w-0 pb-2">
      <LabsSubNav />
      {children}
    </div>
  );
}
