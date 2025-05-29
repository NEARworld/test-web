import { Document } from "@prisma/client";
import type { DocumentFile as PrismaDocumentFile } from "@prisma/client";

export interface DocumentWithCreatedBy extends Document {
  createdBy?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  files?: PrismaDocumentFile[];
}

export interface DocumentTableProps {
  documents: DocumentWithCreatedBy[] | null;
  fetchDocuments: () => void;
}
