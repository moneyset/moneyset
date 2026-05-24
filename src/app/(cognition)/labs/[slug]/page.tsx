import { notFound } from "next/navigation";

import { LabModuleSurface } from "@/components/labs/lab-module-surface";
import { LAB_SLUGS, isLabSlug } from "@/lib/labs/labs-modules";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LAB_SLUGS.map((slug) => ({ slug }));
}

export default async function LabSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isLabSlug(slug)) {
    notFound();
  }
  return <LabModuleSurface slug={slug} />;
}
