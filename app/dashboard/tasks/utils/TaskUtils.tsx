import { ExtendedTask } from "../page";
import {
  FileIcon,
  Image as ImageIcon,
  File,
  FileText,
  FileSpreadsheet,
  FilePen,
  Presentation,
  FileJson,
  FileCode,
  FileCog,
  Video,
  Music,
} from "lucide-react";
import React from "react";

// 파일 크기 제한 상수 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 날짜 포맷팅 함수
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "날짜 형식 오류";
  }
};

export const formatDateWithWeekday = (
  date: Date | string | undefined | null,
): string => {
  if (!date) return "없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "날짜 형식 오류";
  }
};

// 페이지네이션 관련 상수
export const DOTS = "...";

// 페이지네이션 범위 계산 함수
export const getPaginationRange = (
  totalPages: number,
  currentPage: number,
  siblingCount = 1,
): (number | string)[] => {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i,
    );
    return [firstPageIndex, DOTS, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// 스켈레톤 UI 컴포넌트
interface SkeletonProps {
  width: string;
  height: string;
  rounded?: boolean;
}

export const Skeleton = ({ width, height, rounded = false }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded ? "rounded-full" : "rounded"} ${width} ${height}`}
  />
);

// 이미지 파일 확인 함수
export const isImageFile = (filename: string): boolean => {
  if (!filename) return false;
  const fileExt = filename.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
    fileExt,
  );
};

// 파일 아이콘 가져오기 함수
export const getFileIcon = (filename: string) => {
  if (!filename) return <FileIcon className="h-4 w-4" />;

  const fileExt = filename.split(".").pop()?.toLowerCase() || "";

  // 이미지 파일
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
      fileExt,
    )
  ) {
    return <ImageIcon className="h-4 w-4" />;
  }
  // 엑셀 파일 (엑셀 아이콘으로 표시)
  else if (["xls", "xlsx", "csv", "xlsm", "xlt", "xltx"].includes(fileExt)) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  }
  // 한글 문서
  else if (["hwp", "hwpx"].includes(fileExt)) {
    return <FilePen className="h-4 w-4 text-[#00a4ff]" />;
  }
  // 파워포인트 (프레젠테이션 아이콘으로 표시)
  else if (
    ["ppt", "pptx", "pptm", "pot", "potx", "pps", "ppsx"].includes(fileExt)
  ) {
    return <Presentation className="h-4 w-4 text-orange-600" />;
  }
  // 워드 문서
  else if (["doc", "docx", "docm", "rtf", "odt"].includes(fileExt)) {
    return <FileText className="h-4 w-4 text-blue-600" />;
  }
  // PDF 문서
  else if (["pdf"].includes(fileExt)) {
    return <FileText className="h-4 w-4 text-red-600" />;
  }
  // 동영상 파일
  else if (
    ["mp4", "avi", "mov", "wmv", "mkv", "flv", "webm"].includes(fileExt)
  ) {
    return <Video className="h-4 w-4" />;
  }
  // 오디오 파일
  else if (["mp3", "wav", "ogg", "flac", "aac"].includes(fileExt)) {
    return <Music className="h-4 w-4" />;
  }
  // 코드 파일
  else if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "py",
      "java",
      "c",
      "cpp",
    ].includes(fileExt)
  ) {
    return <FileCode className="h-4 w-4" />;
  } else if (
    ["json", "xml", "yaml", "yml", "toml", "ini", "conf"].includes(fileExt)
  ) {
    return <FileJson className="h-4 w-4" />;
  } else if (["exe", "dll", "bin", "sh", "bat", "cmd"].includes(fileExt)) {
    return <FileCog className="h-4 w-4" />;
  } else {
    return <File className="h-4 w-4" />;
  }
};

// 작업 수정 권한 확인 함수
export const canEditTask = (
  task: ExtendedTask | undefined,
  sessionUserId: string | undefined,
  sessionUserRole: string | undefined,
) => {
  if (!task || !sessionUserId) return false;

  // 작성자인 경우 수정 가능
  if (task.createdById === sessionUserId) return true;

  // role이 ADMIN인 경우 수정 가능
  if (sessionUserRole === "ADMIN") return true;

  return false;
};
