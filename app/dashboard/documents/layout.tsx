import { DocumentProvider } from "@/contexts/DocumentProvider";
import { usePathname } from "next/navigation";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const boardType = pathname.split("/").pop();

  return (
    <section className="mx-4">
      <DocumentProvider boardType={boardType}>{children}</DocumentProvider>
    </section>
  );
}
