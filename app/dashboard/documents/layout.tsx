import { DocumentProvider } from "@/contexts/DocumentProvider";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-4">
      <DocumentProvider>{children}</DocumentProvider>
    </section>
  );
}
