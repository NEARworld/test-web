import { useState } from "react";
import { Check } from "lucide-react";
import { TableFromApi, Reservation } from "@/types/tables";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableFromApi;
  setTable: React.Dispatch<React.SetStateAction<TableFromApi | undefined>>;
  setTables: React.Dispatch<React.SetStateAction<TableFromApi[]>>;
  reservations: Reservation[];
}

export function TableDetailDialog({
  isOpen,
  onClose,
  table,
  setTable,
  setTables,
  reservations,
}: TableDetailDialogProps) {
  const [
    isTableNumberUpdateButtonDisabled,
    setIsTableNumberUpdateButtonDisabled,
  ] = useState(false);
  const [isTableNumberUpdateSuccessful, setIsTableNumberUpdateSuccessful] =
    useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string>(
    table.reservationId || "none",
  );
  const [isReservationUpdateSuccessful, setIsReservationUpdateSuccessful] =
    useState(false);

  // 테이블 번호 업데이트 처리
  const handleTableNumberUpdate = async () => {
    setIsTableNumberUpdateButtonDisabled(true);
    setIsTableNumberUpdateSuccessful(false);

    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: table.number,
        }),
      });

      if (!response.ok) {
        throw new Error("테이블 번호 업데이트에 실패했습니다.");
      }

      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === table.id ? { ...t, number: table.number } : t,
        ),
      );

      setIsTableNumberUpdateSuccessful(true);
    } catch (error) {
      console.error("Error updating table number:", error);
      alert(
        error instanceof Error
          ? error.message
          : "테이블 번호 업데이트 중 오류가 발생했습니다.",
      );
    } finally {
      setTimeout(() => {
        setIsTableNumberUpdateButtonDisabled(false);
      }, 1000);
    }
  };

  // 좌석 수 업데이트 처리
  const handleSeatsUpdate = async () => {
    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seats: table.seats,
        }),
      });

      if (!response.ok) {
        throw new Error("좌석 수 업데이트에 실패했습니다.");
      }

      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === table.id ? { ...t, seats: table.seats } : t,
        ),
      );

      alert("좌석 수가 업데이트되었습니다.");
      onClose();
    } catch (error) {
      console.error("Error updating seats:", error);
      alert(
        error instanceof Error
          ? error.message
          : "좌석 수 업데이트 중 오류가 발생했습니다.",
      );
    }
  };

  // 예약 연결 처리
  const handleReservationChange = (value: string) => {
    setSelectedReservation(value);
    connectReservationToTable(table.id, value);
  };

  const connectReservationToTable = async (
    tableId: string,
    reservationValue: string,
  ) => {
    setIsReservationUpdateSuccessful(false);

    try {
      // 기존 예약 연결 해제
      if (table.reservationId && table.reservationId !== reservationValue) {
        await fetch(`/api/tables/${tableId}/reservation`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId: null,
          }),
        });
      }

      // 새 예약 연결
      const response = await fetch(`/api/tables/${tableId}/reservation`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: reservationValue === "none" ? null : reservationValue,
        }),
      });

      if (!response.ok) {
        throw new Error("예약 연결 업데이트에 실패했습니다.");
      }

      // 서버에서 최신 테이블 목록 가져오기 시도
      try {
        const tablesResponse = await fetch("/api/tables");
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);

          const updatedTable = tablesData.find(
            (t: TableFromApi) => t.id === tableId,
          );
          if (updatedTable) {
            setTable(updatedTable);
          }

          setIsReservationUpdateSuccessful(true);
          setTimeout(() => setIsReservationUpdateSuccessful(false), 1500);
          return;
        }
      } catch (error) {
        console.error("테이블 목록 새로고침 실패:", error);
      }

      // 서버 요청 실패 시 로컬 상태만 업데이트
      console.log("테이블 목록 조회 실패, 로컬 상태만 업데이트합니다.");
      const matchingReservation =
        reservationValue !== "none"
          ? reservations.find((r) => r.id === reservationValue)
          : undefined;

      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                reservationId:
                  reservationValue === "none" ? undefined : reservationValue,
                reservation: matchingReservation,
              }
            : t,
        ),
      );

      setTable({
        ...table,
        reservationId:
          reservationValue === "none" ? undefined : reservationValue,
        reservation: matchingReservation,
      });

      setIsReservationUpdateSuccessful(true);
      setTimeout(() => setIsReservationUpdateSuccessful(false), 1500);
    } catch (error) {
      console.error("Error updating reservation link:", error);
      alert(
        error instanceof Error
          ? error.message
          : "예약 연결 업데이트 중 오류가 발생했습니다.",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>테이블 {table.number}</DialogTitle>
          </div>
          <DialogDescription>
            테이블 정보를 확인하고 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid justify-start gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="tableNumber"
              className="text-left text-sm font-medium"
            >
              테이블 번호
            </label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="tableNumber"
                type="text"
                value={table.number}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setTable({
                    ...table,
                    number: value,
                  });
                }}
                className="w-32"
              />
              <Button
                onClick={handleTableNumberUpdate}
                size="sm"
                disabled={isTableNumberUpdateButtonDisabled}
              >
                수정
              </Button>
              {isTableNumberUpdateSuccessful && (
                <Check className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="tableSeats"
              className="text-left text-sm font-medium"
            >
              좌석 수
            </label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="tableSeats"
                type="number"
                value={table.seats}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setTable({
                    ...table,
                    seats: value,
                  });
                }}
                className="w-32"
              />
              <Button onClick={handleSeatsUpdate} size="sm">
                수정
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="reservation"
              className="text-left text-sm font-medium"
            >
              연결된 예약
            </label>
            <div className="col-span-3 flex items-center gap-2">
              <Select
                value={selectedReservation}
                onValueChange={handleReservationChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="예약 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">예약 없음</SelectItem>
                  {reservations.length > 0 ? (
                    reservations.map((reservation) => (
                      <SelectItem key={reservation.id} value={reservation.id}>
                        {reservation.groupName} -{" "}
                        {new Date(reservation.dateTime).toLocaleString(
                          "ko-KR",
                          {
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          },
                        )}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-reservations" disabled>
                      확정된 예약이 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {isReservationUpdateSuccessful && (
                <Check className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          {selectedReservation && selectedReservation !== "none" && (
            <div className="mt-2 rounded-md bg-gray-50 p-3">
              {(() => {
                const reservation = reservations.find(
                  (r) => r.id === selectedReservation,
                );
                if (!reservation) return null;

                return (
                  <div className="text-sm">
                    <div className="font-medium">{reservation.groupName}</div>
                    <div className="text-gray-600">
                      {new Date(reservation.dateTime).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        weekday: "long",
                      })}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          reservation.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {reservation.status === "CONFIRMED"
                          ? "예약 확정"
                          : "예약 대기중"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
