"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCanvas } from "@/components/tables/table-canvas";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useTables } from "@/hooks/use-tables";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { TableFromApi, Reservation } from "@/types/tables";
import { TableDetailDialog } from "@/components/tables/table-detail-dialog";

export default function TablesPage() {
  const { data: session } = useSession();
  const [tables, setTables] = useState<TableFromApi[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [doubleClickedTable, setDoubleClickedTable] = useState<TableFromApi>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [gridSize, setGridSize] = useState(32);
  const [isGridSizeVisible] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // 테이블 관련 커스텀 훅에서 가져온 함수들
  const {
    addTable,
    handleDeleteConfirm,
    getSortedTables,
    updateTablePositionOnServer,
  } = useTables(tables, setTables, selectedTables, gridSize);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    // 실시간 구독 설정
    const subscription = supabase
      .channel("tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Table" },
        (payload) => {
          const newTable = payload.new as TableFromApi;
          const newTableId = newTable.id;

          if (payload.eventType === "INSERT") {
            setTables((prevTables) => {
              // 현재 로컬 상태에 이미 이 ID의 테이블이 있는지 확인
              const exists = prevTables.some(
                (table) => table.id === newTableId,
              );

              if (exists) {
                // 이미 존재하면 상태를 변경하지 않음
                return prevTables;
              } else {
                // 존재하지 않으면 새로 추가
                console.log(
                  `Adding new table ${newTableId} from subscription.`,
                );
                return [
                  ...prevTables,
                  {
                    id: newTable.id,
                    number: newTable.number,
                    seats: newTable.seats,
                    positionX: newTable.positionX,
                    positionY: newTable.positionY,
                    reservationId: newTable.reservationId,
                    reservation: newTable.reservation,
                  },
                ];
              }
            });
          } else if (payload.eventType === "UPDATE") {
            // 테이블 정보 업데이트
            setTables((prevTables) =>
              prevTables.map((table) =>
                table.id === newTable.id
                  ? {
                      ...table,
                      number: newTable.number,
                      seats: newTable.seats,
                      position: {
                        x: newTable.positionX,
                        y: newTable.positionY,
                      },
                      reservationId: newTable.reservationId,
                      reservation: newTable.reservation,
                    }
                  : table,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            // 테이블 삭제
            const deletedTable = payload.old as TableFromApi;
            setTables((prevTables) =>
              prevTables.filter((table) => table.id !== deletedTable.id),
            );
          }
        },
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  useEffect(() => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];

    fetch(`/api/reservations?date=${today}`)
      .then((response) => response.json())
      .then((allReservationsData) => {
        const confirmedReservations = allReservationsData.filter(
          (r: Reservation) => r.status === "CONFIRMED",
        );
        setReservations(confirmedReservations);
        console.log(
          `오늘(${today}) 확정된 예약 ${confirmedReservations.length}건 로드됨`,
        );

        return fetch("/api/tables")
          .then((response) => response.json())
          .then((data) => {
            const formattedTables = data.map((table: TableFromApi) => {
              const tableData: TableFromApi = {
                id: table.id,
                seats: table.seats,
                number: table.number,
                positionX: table.positionX,
                positionY: table.positionY,
                reservationId: table.reservationId,
              };

              if (table.reservationId) {
                const matchingReservation = allReservationsData.find(
                  (r: Reservation) => r.id === table.reservationId,
                );
                if (matchingReservation) {
                  return {
                    ...tableData,
                    reservation: matchingReservation,
                  };
                }
              }

              return tableData;
            });

            setTables(formattedTables);
            setIsLoading(false);
          });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        selectedTables.length > 0 &&
        (e.key === "Delete" || e.key === "Backspace")
      ) {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "SELECT"
        ) {
          e.preventDefault();
          setIsDeleteDialogOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTables]);

  const handleTableDoubleClick = (id: string) => {
    const table = tables.find((table) => table.id === id);
    if (table) {
      setDoubleClickedTable(table);
      setIsDetailDialogOpen(true);
    }
  };

  const clearSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setSelectedTables([]);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  // SSR 시 로딩 컴포넌트 표시
  if (typeof window === "undefined") {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">테이블 관리</h1>
        </div>
        <div className="relative h-[calc(100vh-12rem)] cursor-default overflow-hidden rounded-lg border bg-gray-50">
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isClient || isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">테이블 관리</h1>
        </div>
        <div className="relative h-[calc(100vh-12rem)] cursor-default overflow-hidden rounded-lg border bg-gray-50">
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">
              테이블 정보를 불러오고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">테이블 관리</h1>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
              <span>4인석</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-purple-500"></div>
              <span>6인석</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          {isGridSizeVisible && (
            <div className="flex items-center gap-2">
              <label htmlFor="gridSize" className="text-sm">
                그리드 크기:
              </label>
              <input
                id="gridSize"
                type="range"
                min="16"
                max="64"
                step="8"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm">{gridSize}px</span>
            </div>
          )}
          <Button onClick={addTable}>
            <Plus className="mr-2 h-4 w-4" />
            테이블 추가
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[calc(100vh-12rem)] cursor-default overflow-hidden rounded-lg border bg-gray-50"
        onClick={clearSelection}
      >
        <TableCanvas
          tables={tables}
          setTables={setTables}
          selectedTables={selectedTables}
          setSelectedTables={setSelectedTables}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          gridSize={gridSize}
          containerRef={containerRef}
          isLoading={isLoading}
          isClient={isClient}
          onTableDoubleClick={handleTableDoubleClick}
          getSortedTables={getSortedTables}
          updateTablePositionOnServer={updateTablePositionOnServer}
        />
      </div>

      {doubleClickedTable && (
        <TableDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          table={doubleClickedTable}
          setTable={setDoubleClickedTable}
          setTables={setTables}
          reservations={reservations}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() =>
          handleDeleteConfirm(
            selectedTables,
            setTables,
            setSelectedTables,
            setIsDeleteDialogOpen,
          )
        }
        selectedCount={selectedTables.length}
      />
    </div>
  );
}
