import React from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface FilePreviewProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  previewUrl: string | null;
  previewType: string | null;
  previewName: string | null;
  isPreviewLoading: boolean;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewType: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewName: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPreviewLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilePreview({
  isPreviewOpen,
  setIsPreviewOpen,
  previewUrl,
  previewType,
  previewName,
  isPreviewLoading,
  setPreviewUrl,
  setPreviewType,
  setPreviewName,
  setIsPreviewLoading,
}: FilePreviewProps) {
  return (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="flex max-h-[90vh] min-h-[24rem] flex-col sm:max-w-md md:max-w-2xl lg:max-w-4xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>파일 미리보기: {previewName}</DialogTitle>
        </DialogHeader>
        <div className="my-4 flex flex-grow items-center overflow-auto border-t border-b py-4">
          {isPreviewLoading ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-muted-foreground text-sm">
                파일을 불러오는 중...
              </p>
            </div>
          ) : (
            <>
              {previewType === "image" && previewUrl && (
                <div className="animate-in fade-in flex h-full items-center justify-center duration-200">
                  <Image
                    src={previewUrl}
                    alt={previewName || "이미지 미리보기"}
                    className="max-h-[70vh] max-w-full object-contain"
                    width={800}
                    height={600}
                    unoptimized
                  />
                </div>
              )}
              {previewType === "pdf" && previewUrl && (
                <div className="animate-in fade-in h-[70vh] w-full duration-200">
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="h-full w-full"
                    title={previewName || "PDF 미리보기"}
                  />
                </div>
              )}
              {previewType === "text" && previewUrl && (
                <pre className="bg-muted/30 animate-in fade-in max-h-[70vh] w-full overflow-auto rounded-md p-4 text-sm whitespace-pre-wrap duration-200">
                  {previewUrl}
                </pre>
              )}
            </>
          )}
        </div>
        <DialogFooter className="mt-auto flex-shrink-0 gap-2">
          {previewUrl && (
            <Button variant="default" size="sm" asChild>
              <a
                href={
                  typeof previewUrl === "string" &&
                  previewUrl.startsWith("/api")
                    ? previewUrl
                    : "#"
                }
                download={previewName || undefined}
              >
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPreviewOpen(false);
              setTimeout(() => {
                setPreviewUrl(null);
                setPreviewType(null);
                setPreviewName(null);
                setIsPreviewLoading(false);
              }, 300); // 닫힘 애니메이션 후에 상태 리셋
            }}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
