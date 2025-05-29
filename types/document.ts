import { Document } from "@prisma/client";
import type { Attachment as PrismaAttachment } from "@prisma/client";

export interface DocumentWithCreatedBy extends Document {
  createdBy?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  attachments?: PrismaAttachment[];
}

export interface DocumentTableProps {
  documents: DocumentWithCreatedBy[] | null;
  fetchDocuments: () => void;
}
