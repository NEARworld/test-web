import { Document, User } from "@prisma/client";

interface BoardProps {
  documents: ExtendedDocument[] | undefined;
  users: Pick<User, "id" | "name" | "image">[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalDocuments: number;
  itemsPerPage: number;
}
export type ExtendedDocument = Document & {
  assignee: { name: string; image?: string }; // 담당자 정보
  creator?: { id: string; name: string; image?: string } | null; // 작성자 정보
  fileUrl?: string | null; // 파일 공개 URL
  fileName?: string | null; // 원본 파일명
  fileType?: string | null; // 파일 MIME 타입
};

export default function Board(document: BoardProps) {
  console.log(document);

  return (
    <div>
      <h1>Board</h1>
    </div>
  );
}
