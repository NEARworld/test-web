"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isStatusChange: boolean;
}

export function StatusAlertDialog({
  isOpen,
  onOpenChange,
  title,
  message,
  onConfirm,
  onCancel,
  isStatusChange,
}: StatusAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isStatusChange ? (
            <>
              <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>확인</AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={onConfirm}>확인</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
