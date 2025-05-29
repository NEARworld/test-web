"use client";

import DocumentWriteButton from "@/app/dashboard/documents/components/DocumentWrite";
import { DocumentProvider } from "@/contexts/DocumentProvider";
import DocumentPagination from "@/app/dashboard/documents/components/DocumentPagination";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-4">
      <DocumentProvider>
        {children}
        <div className="relative mt-2.5 flex min-h-9 items-center justify-between">
          <DocumentPagination />
          <DocumentWriteButton />
        </div>
      </DocumentProvider>
    </section>
  );
}
