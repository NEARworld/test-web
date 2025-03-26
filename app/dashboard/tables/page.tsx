"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Check, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/table-card";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  rectIntersection,
  Modifier,
} from "@dnd-kit/core";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface Table {
  id: string;
  number: number;
  seats: number;
  position: {
    x: number;
    y: number;
  };
  reservationId?: string;
  reservation?: Reservation;
}

interface TableFromApi {
  id: string;
  seats: number;
  number: number;
  positionX: number;
  positionY: number;
  status?: string;
  reservationId?: string;
  reservation?: Reservation;
}

interface Reservation {
  id: string;
  groupName: string;
  dateTime: string;
  status: string;
}

const CARD_SIZE = 128;

const createSnapModifier = (gridSize: number): Modifier => {
  return ({ transform }) => {
    const { x, y } = transform;
    return {
      ...transform,
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };
};

export default function TablesPage() {
  const { data: session } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(32);
  const [isGridSizeVisible] = useState(false); // 그리드 크기 표시 여부 상태 추가
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [doubleClickedTable, setDoubleClickedTable] = useState<Table>();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [
    isTableNumberUpdateButtonDisabled,
    setIsTableNumberUpdateButtonDisabled,
  ] = useState(false);
  const [isTableNumberUpdateSuccessful, setIsTableNumberUpdateSuccessful] =
    useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [isReservationUpdateSuccessful, setIsReservationUpdateSuccessful] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [containerPosition, setContainerPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panningStartPoint = useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const snapToGrid = useMemo(() => createSnapModifier(gridSize), [gridSize]);

  useEffect(() => {
    const updateContainerSize = () => {};

    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
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

          if (payload.eventType === "INSERT") {
            // 새 테이블 추가
            setTables((prevTables) => [
              ...prevTables,
              {
                id: newTable.id,
                number: newTable.number,
                seats: newTable.seats,
                position: {
                  x: newTable.positionX,
                  y: newTable.positionY,
                },
                reservationId: newTable.reservationId,
                reservation: newTable.reservation,
              },
            ]);
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
      subscription.unsubscribe();
    };
  }, [session]);

  const addTable = () => {
    const newPosition = findAvailablePosition(tables);

    const newTable = {
      id: crypto.randomUUID(),
      seats: 0,
      number: tables.length + 1,
      position: {
        x: Math.round(newPosition.x / gridSize) * gridSize,
        y: Math.round(newPosition.y / gridSize) * gridSize,
      },
      reservationId: undefined,
      reservation: undefined,
    };

    fetch("/api/tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTable),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Table saved to database:", data);
        setTables([...tables, newTable]);
      })
      .catch((error) => {
        console.error("Error saving table:", error);
      });
  };

  const findAvailablePosition = (existingTables: Table[]) => {
    const position = { x: 0, y: 0 };
    let found = false;

    while (!found) {
      let hasCollision = false;

      for (const table of existingTables) {
        const distance = Math.sqrt(
          Math.pow(table.position.x - position.x, 2) +
            Math.pow(table.position.y - position.y, 2),
        );

        if (distance < gridSize) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        found = true;
      } else {
        position.x += gridSize;
        if (position.x > window.innerWidth - CARD_SIZE) {
          position.x = 0;
          position.y += gridSize;
        }
      }
    }

    return position;
  };

  const handleTableSelect = (
    id: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-drag-handle]")
    ) {
      return;
    }

    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      setSelectedTables((prev) =>
        prev.includes(id)
          ? prev.filter((tableId) => tableId !== id)
          : [...prev, id],
      );
    } else if (event.shiftKey && selectedTables.length > 0) {
      const tableIds = tables.map((table) => table.id);
      const lastSelectedIndex = tableIds.indexOf(
        selectedTables[selectedTables.length - 1],
      );
      const currentIndex = tableIds.indexOf(id);

      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);

      const rangeSelection = tableIds.slice(start, end + 1);
      setSelectedTables((prev) => {
        const uniqueSelection = Array.from(
          new Set([...prev, ...rangeSelection]),
        );
        return uniqueSelection;
      });
    } else {
      setSelectedTables(
        selectedTables.includes(id) && selectedTables.length === 1 ? [] : [id],
      );
    }
  };

  const clearSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setSelectedTables([]);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!activeDragId) return;

    const { delta } = event;
    setDragDelta({ x: delta.x, y: delta.y });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    setActiveDragId(null);
    setDragDelta({ x: 0, y: 0 });

    const isMovingSelectedGroup =
      selectedTables.includes(active.id as string) && selectedTables.length > 1;

    setTables((items) => {
      return items.map((item) => {
        if (isMovingSelectedGroup && selectedTables.includes(item.id)) {
          const newX =
            Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          const maxX = containerRef.current
            ? containerRef.current.clientWidth - CARD_SIZE
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - CARD_SIZE
            : 0;

          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          const updatedPosition = { x: boundedX, y: boundedY };

          fetch("/api/tables", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: item.id,
              position: updatedPosition,
            }),
          })
            .then((response) => response.json())
            .catch((error) => {
              console.error("Error updating table position:", error);
            });

          return {
            ...item,
            position: updatedPosition,
          };
        } else if (item.id === active.id) {
          const newX =
            Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          const maxX = containerRef.current
            ? containerRef.current.clientWidth - CARD_SIZE
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - CARD_SIZE
            : 0;

          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          const hasCollision = items.some((otherItem) => {
            if (otherItem.id === item.id) return false;

            const distance = Math.sqrt(
              Math.pow(otherItem.position.x - boundedX, 2) +
                Math.pow(otherItem.position.y - boundedY, 2),
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            const updatedPosition = { x: boundedX, y: boundedY };

            fetch("/api/tables", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: item.id,
                position: updatedPosition,
              }),
            })
              .then((response) => response.json())
              .catch((error) => {
                console.error("Error updating table position:", error);
              });

            return {
              ...item,
              position: updatedPosition,
            };
          }
        }
        return item;
      });
    });
  };

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
              const tableData = {
                id: table.id,
                seats: table.seats,
                number: table.number,
                position: {
                  x: table.positionX,
                  y: table.positionY,
                },
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

  const handleDeleteConfirm = () => {
    const deletedIds = [...selectedTables];

    const deletePromises = deletedIds.map((id) =>
      fetch(`/api/tables/${id}`, {
        method: "DELETE",
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete table with ID: ${id}`);
        }
        return response.json();
      }),
    );

    Promise.all(deletePromises)
      .then(() => {
        setTables((prevTables) =>
          prevTables.filter((table) => !deletedIds.includes(table.id)),
        );
        setSelectedTables([]);
        setIsDeleteDialogOpen(false);
      })
      .catch((error) => {
        console.error("테이블 삭제 중 오류 발생:", error);
        setIsDeleteDialogOpen(false);
      });
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleTableDoubleClick = (id: string) => {
    const table = tables.find((table) => table.id === id);
    if (table) {
      setDoubleClickedTable(table);
      setSelectedReservation(table.reservationId || "none");
      setIsDialogOpen(true);
    }
  };

  const connectReservationToTable = async (
    tableId: string,
    reservationValue: string,
  ) => {
    setIsReservationUpdateSuccessful(false);

    try {
      const currentTable = tables.find((t) => t.id === tableId);
      if (!currentTable) {
        throw new Error("테이블을 찾을 수 없습니다.");
      }

      if (
        currentTable.reservationId &&
        currentTable.reservationId !== reservationValue
      ) {
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

      const reservationId =
        reservationValue === "none" ? undefined : reservationValue;
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

      const data = await response.json();

      try {
        const tablesResponse = await fetch("/api/tables");
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          const updatedTables = tablesData.map((table: TableFromApi) => {
            return {
              id: table.id,
              number: table.number,
              seats: table.seats,
              position: {
                x: table.positionX,
                y: table.positionY,
              },
              reservationId: table.reservationId,
              reservation: table.reservation as unknown as Reservation,
            };
          });

          setTables(updatedTables);

          if (doubleClickedTable) {
            const updatedTable = updatedTables.find(
              (t: Table) => t.id === tableId,
            );
            if (updatedTable) {
              setDoubleClickedTable(updatedTable);
            }
          }

          setIsReservationUpdateSuccessful(true);
          setTimeout(() => setIsReservationUpdateSuccessful(false), 1500);

          return { success: true, data };
        }
      } catch (error) {
        console.error("테이블 목록 새로고침 실패:", error);
      }

      console.log("테이블 목록 조회 실패, 로컬 상태만 업데이트합니다.");
      const matchingReservation =
        reservationValue !== "none"
          ? reservations.find((r) => r.id === reservationValue)
          : undefined;

      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === tableId
            ? {
                ...table,
                reservationId: reservationId,
                reservation: matchingReservation,
              }
            : table,
        ),
      );

      setIsReservationUpdateSuccessful(true);

      if (doubleClickedTable && doubleClickedTable.id === tableId) {
        setDoubleClickedTable({
          ...doubleClickedTable,
          reservationId: reservationId,
          reservation: matchingReservation,
        });
      }

      setTimeout(() => setIsReservationUpdateSuccessful(false), 1500);

      return { success: true, data };
    } catch (error) {
      console.error("Error updating reservation link:", error);
      alert(
        error instanceof Error
          ? error.message
          : "예약 연결 업데이트 중 오류가 발생했습니다.",
      );
      return { success: false, error };
    }
  };

  const handleReservationChange = (value: string) => {
    setSelectedReservation(value);
    if (doubleClickedTable) {
      connectReservationToTable(doubleClickedTable.id, value);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    panningStartPoint.current = {
      x: event.clientX,
      y: event.clientY,
    };
    containerRef.current?.classList.add("cursor-grab");
  };

  const handlePanMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;

    const deltaX = event.clientX - panningStartPoint.current.x;
    const deltaY = event.clientY - panningStartPoint.current.y;

    setContainerPosition((prevPosition) => ({
      x: prevPosition.x + deltaX,
      y: prevPosition.y + deltaY,
    }));

    panningStartPoint.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    containerRef.current?.classList.remove("cursor-grab");
  };

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
        className="relative h-[calc(100vh-12rem)] cursor-default overflow-hidden rounded-lg border bg-gray-50 active:cursor-grabbing"
        onClick={clearSelection}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${zoomLevel}) translate(${containerPosition.x}px, ${containerPosition.y}px)`,
            transformOrigin: "center center",
          }}
        >
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">
                테이블 정보를 불러오고 있습니다.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              modifiers={[snapToGrid]}
            >
              {tables.map((table) => {
                const isSelected = selectedTables.includes(table.id);
                const isBeingDragged = activeDragId === table.id;
                const additionalTransform =
                  isSelected &&
                  activeDragId &&
                  !isBeingDragged &&
                  selectedTables.includes(activeDragId)
                    ? { x: dragDelta.x, y: dragDelta.y }
                    : { x: 0, y: 0 };
                return (
                  <TableCard
                    key={table.id}
                    id={table.id}
                    seats={table.seats}
                    number={table.number}
                    position={table.position}
                    isSelected={isSelected}
                    onClick={(e) => handleTableSelect(table.id, e)}
                    onDoubleClick={() => handleTableDoubleClick(table.id)}
                    additionalTransform={additionalTransform}
                    reservation={table.reservation}
                  />
                );
              })}
            </DndContext>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>테이블 {doubleClickedTable?.number}</DialogTitle>
            </div>
            <DialogDescription>
              테이블 정보를 확인하고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogContent>
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
                    value={doubleClickedTable?.number}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      if (doubleClickedTable)
                        setDoubleClickedTable({
                          ...doubleClickedTable,
                          number: value,
                        });
                    }}
                    className="w-32"
                  />
                  <Button
                    onClick={async () => {
                      setIsTableNumberUpdateButtonDisabled(true);
                      setIsTableNumberUpdateSuccessful(false);

                      try {
                        const response = await fetch(
                          `/api/tables/${doubleClickedTable?.id}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              number: doubleClickedTable?.number,
                            }),
                          },
                        );

                        if (!response.ok) {
                          throw new Error(
                            "테이블 번호 업데이트에 실패했습니다.",
                          );
                        }

                        setTables((prevTables) =>
                          prevTables.map((table) =>
                            table.id === doubleClickedTable?.id
                              ? { ...table, number: doubleClickedTable?.number }
                              : table,
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
                    }}
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
                    value={doubleClickedTable?.seats}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      if (doubleClickedTable)
                        setDoubleClickedTable({
                          ...doubleClickedTable,
                          seats: value,
                        });
                    }}
                    className="w-32"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/tables/${doubleClickedTable?.id}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              seats: doubleClickedTable?.seats,
                            }),
                          },
                        );

                        if (!response.ok) {
                          throw new Error("좌석 수 업데이트에 실패했습니다.");
                        }

                        setTables((prevTables) =>
                          prevTables.map((table) =>
                            table.id === doubleClickedTable?.id
                              ? { ...table, seats: doubleClickedTable?.seats }
                              : table,
                          ),
                        );

                        alert("좌석 수가 업데이트되었습니다.");
                      } catch (error) {
                        console.error("Error updating seats:", error);
                        alert(
                          error instanceof Error
                            ? error.message
                            : "좌석 수 업데이트 중 오류가 발생했습니다.",
                        );
                      }
                    }}
                    size="sm"
                  >
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
                          <SelectItem
                            key={reservation.id}
                            value={reservation.id}
                          >
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
                        <div className="font-medium">
                          {reservation.groupName}
                        </div>
                        <div className="text-gray-600">
                          {new Date(reservation.dateTime).toLocaleString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              weekday: "long",
                            },
                          )}
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
          </DialogContent>

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        selectedCount={selectedTables.length}
      />
    </div>
  );
}
