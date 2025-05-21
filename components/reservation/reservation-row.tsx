"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check, ChevronDown, X } from "lucide-react";
import { MenuItem, Reservation } from "./types";
import { formatTime, getStatusBadge } from "./utils";

export function ReservationRow({
  reservation,
  onStatusChange,
  onRowClick,
  calculateTotalPrice,
}: {
  reservation: Reservation;
  onStatusChange: (
    id: string,
    action: "confirm" | "cancel" | "complete",
  ) => void;
  onRowClick: (reservation: Reservation) => void;
  calculateTotalPrice: (menu: MenuItem[]) => number;
}) {
  const statusBadge = getStatusBadge(reservation.status);

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50"
      onClick={(e) => {
        // 이벤트 전파 중단을 위한 체크 (드롭다운 메뉴 내부 요소 클릭 시)
        if ((e.target as HTMLElement).closest(".dropdown-ignore")) return;
        onRowClick(reservation);
      }}
    >
      <TableCell>{formatTime(reservation.dateTime)}</TableCell>
      <TableCell>{reservation.groupName}</TableCell>
      <TableCell className="hidden md:table-cell">
        {reservation.seatNumber}
      </TableCell>
      <TableCell>
        {reservation.menuItems.reduce((sum, item) => sum + item.quantity, 0)}명
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {calculateTotalPrice(reservation.menuItems).toLocaleString()} 원
      </TableCell>
      <TableCell className="dropdown-ignore">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="dropdown-ignore h-8">
              <div className="dropdown-ignore flex items-center gap-1">
                <Badge
                  variant={statusBadge.variant}
                  className={`dropdown-ignore ${
                    reservation.status === "COMPLETED"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }`}
                >
                  {statusBadge.text}
                </Badge>
                <ChevronDown className="dropdown-ignore h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {reservation.status !== "CONFIRMED" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(reservation.id, "confirm");
                }}
              >
                <Check className="mr-2 h-4 w-4" /> 확정
              </DropdownMenuItem>
            )}
            {reservation.status !== "COMPLETED" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(reservation.id, "complete");
                }}
              >
                <Check className="mr-2 h-4 w-4" /> 완료
              </DropdownMenuItem>
            )}
            {reservation.status !== "CANCELED" && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(reservation.id, "cancel");
                }}
              >
                <X className="mr-2 h-4 w-4" /> 취소
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
