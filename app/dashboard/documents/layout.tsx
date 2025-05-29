"use client";

import DocumentWriteButton from "@/app/dashboard/documents/components/DocumentWrite";
import { DocumentProvider } from "@/contexts/DocumentProvider";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-4">
      <DocumentProvider>{children}</DocumentProvider>
      <div className="relative mt-2.5">
        <DocumentWriteButton />
      </div>
    </section>
  );
}
