import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate } from "@/app/dashboard/tasks/utils/TaskUtils";
import { DocumentTableProps, DocumentWithCreatedBy } from "@/types/document";

export default function DocumentTable({ documents }: DocumentTableProps) {
  const hasDocuments = documents && documents.length > 0;
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentWithCreatedBy | null>(null);

  const handleDocumentClick = (doc: DocumentWithCreatedBy) => {
    setSelectedDocument(doc);
    setIsViewerOpen(true);
  };

  return (
    <div className="mt-4 rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>게시일</TableHead>
            <TableHead>첨부파일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasDocuments ? (
            documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleDocumentClick(doc)}
              >
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  {doc.createdBy && (
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        src={doc.createdBy.image || undefined}
                        name={doc.createdBy.name || "알 수 없음"}
                        className="h-6 w-6"
                      />
                      <span>{doc.createdBy.name || "알 수 없음"}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell>
                  {doc.fileName ? (
                    <span className="text-sm text-blue-500">
                      {doc.fileName}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">없음</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                등록된 문서가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
