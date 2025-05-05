"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuItem, Reservation } from "./types";
import { formatDateTime, getStatusBadge } from "./utils";

interface ReservationDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  calculateTotalPrice: (menu: MenuItem[]) => number;
}

export function ReservationDetailModal({
  isOpen,
  onOpenChange,
  reservation,
  calculateTotalPrice,
}: ReservationDetailModalProps) {
  if (!reservation) return null;

  const statusBadge = getStatusBadge(reservation.status);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>예약 상세 정보</DialogTitle>
          <DialogDescription>
            {formatDateTime(reservation.dateTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">
                예약자
              </Label>
              <p className="mt-1">{reservation.groupName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                예약석
              </Label>
              <p className="mt-1">{reservation.seatNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">상태</Label>
              <div className="mt-1">
                <Badge
                  variant={statusBadge.variant}
                  className={
                    reservation.status === "COMPLETED"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">
              예약 메뉴
            </Label>
            <div className="mt-2 space-y-2">
              {reservation.menuItems.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-gray-600">
                    {item.quantity}개 × {item.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <span className="font-semibold">
                총 가격:{" "}
                {calculateTotalPrice(reservation.menuItems).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
