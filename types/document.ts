import { Document } from "@prisma/client";

export interface DocumentWithCreatedBy extends Document {
  createdBy?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export interface DocumentTableProps {
  documents: DocumentWithCreatedBy[] | null;
  fetchDocuments: () => void;
}
