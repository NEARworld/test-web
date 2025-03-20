"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/table-card";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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

interface Table {
  id: string;
  number: number;
  seats: number;
  position: {
    x: number;
    y: number;
  };
  reservationId?: string;
}

// Interface for the table data returned from the API
interface TableFromApi {
  id: string;
  seats: number;
  number: number;
  positionX: number;
  positionY: number;
  status?: string;
  reservationId?: string;
}

// 예약 인터페이스 추가
interface Reservation {
  id: string;
  groupName: string;
  dateTime: string;
  status: string;
}

const CARD_SIZE = 128; // 8rem = 128px

// Grid snapping modifier
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
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(32); // Default grid size
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [doubleClickedTable, setDoubleClickedTable] = useState<Table>();
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [
    isReservationUpdateButtonDisabled,
    setIsReservationUpdateButtonDisabled,
  ] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const snapToGrid = useMemo(() => createSnapModifier(gridSize), [gridSize]);

  // Update container dimensions when window resizes
  useEffect(() => {
    const updateContainerSize = () => {
      // This function still runs on resize but we don't need to store the value in state
    };

    window.addEventListener("resize", updateContainerSize);

    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, []);

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
    };

    // 테이블 생성 API 호출
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
    // Prevent selection when dragging
    if (
      event.target instanceof Element &&
      event.target.closest("[data-drag-handle]")
    ) {
      return;
    }

    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      // Toggle selection with Ctrl/Cmd key
      setSelectedTables((prev) =>
        prev.includes(id)
          ? prev.filter((tableId) => tableId !== id)
          : [...prev, id],
      );
    } else if (event.shiftKey && selectedTables.length > 0) {
      // Range selection with Shift key
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
      // Regular click - deselect others and select this one
      setSelectedTables(
        selectedTables.includes(id) && selectedTables.length === 1 ? [] : [id],
      );
    }
  };

  const clearSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only clear if clicking directly on the container (not on a table)
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

    // Reset drag state
    setActiveDragId(null);
    setDragDelta({ x: 0, y: 0 });

    // If we're dragging a selected table and there are multiple selections,
    // move all selected tables
    const isMovingSelectedGroup =
      selectedTables.includes(active.id as string) && selectedTables.length > 1;

    setTables((items) => {
      return items.map((item) => {
        // If moving a group and this item is selected, move it
        if (isMovingSelectedGroup && selectedTables.includes(item.id)) {
          // Calculate new position
          const newX =
            Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          // Check container boundaries
          const maxX = containerRef.current
            ? containerRef.current.clientWidth - CARD_SIZE
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - CARD_SIZE
            : 0;

          // Apply boundary constraints
          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          // Here we should add collision detection for group movement,
          // but simplifying for now as it's complex to check all potential collisions

          const updatedPosition = { x: boundedX, y: boundedY };

          // API call for position update
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
        // For the actively dragged item or when not moving as a group
        else if (item.id === active.id) {
          // Calculate new position
          const newX =
            Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          // Check container boundaries
          const maxX = containerRef.current
            ? containerRef.current.clientWidth - CARD_SIZE
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - CARD_SIZE
            : 0;

          // Apply boundary constraints
          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          // Check collision with other tables
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

            // 위치가 변경되었을 때 API 호출
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

  // 페이지 로드 시 테이블 데이터 가져오기
  useEffect(() => {
    fetch("/api/tables")
      .then((response) => response.json())
      .then((data) => {
        // 데이터베이스에서 가져온 테이블 형식을 UI에 맞게 변환
        const formattedTables = data.map((table: TableFromApi) => ({
          id: table.id,
          seats: table.seats,
          number: table.number, // Use number directly
          position: {
            x: table.positionX,
            y: table.positionY,
          },
          reservationId: table.reservationId,
        }));
        setTables(formattedTables);
      })
      .catch((error) => {
        console.error("Error fetching tables:", error);
      });
  }, []);

  // 페이지 로드 시 예약 데이터 가져오기
  useEffect(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 구하기
    const today = new Date().toISOString().split("T")[0];

    // 오늘 날짜의 확정된 예약만 요청
    fetch(`/api/reservations?date=${today}&status=CONFIRMED`)
      .then((response) => response.json())
      .then((data) => {
        setReservations(data);
        console.log(`오늘(${today}) 확정된 예약 ${data.length}건 로드됨`);
      })
      .catch((error) => {
        console.error("Error fetching reservations:", error);
      });
  }, []);

  // Delete 키 감지 로직
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 테이블이 선택된 상태에서 Delete 키가 눌렸을 때만 처리
      if (
        selectedTables.length > 0 &&
        (e.key === "Delete" || e.key === "Backspace")
      ) {
        // 입력 요소에 포커스가 없을 때만 활성화
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTables]);

  // 삭제 확인 처리
  const handleDeleteConfirm = () => {
    // 선택된 테이블 삭제
    const deletedIds = [...selectedTables];

    // 데이터베이스에서 각 테이블 삭제
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

    // 모든 삭제 처리 후
    Promise.all(deletePromises)
      .then(() => {
        // 상태에서 삭제된 테이블 제거
        setTables((prevTables) =>
          prevTables.filter((table) => !deletedIds.includes(table.id)),
        );
        // 선택 초기화
        setSelectedTables([]);
        // 대화상자 닫기
        setIsDeleteDialogOpen(false);
      })
      .catch((error) => {
        console.error("테이블 삭제 중 오류 발생:", error);
        // 오류가 발생해도 대화상자 닫기
        setIsDeleteDialogOpen(false);
      });
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleTableDoubleClick = (id: string) => {
    const table = tables.find((table) => table.id === id);
    if (table) {
      setDoubleClickedTable(table);

      // Set selected reservation from table data if exists
      if (table.reservationId) {
        setSelectedReservation(table.reservationId);
      } else {
        setSelectedReservation("none");
      }

      setIsDialogOpen(true);
    }
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
          {selectedTables.length > 0 && (
            <div className="text-sm">{selectedTables.length} 테이블 선택됨</div>
          )}
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
          <Button onClick={addTable}>
            <Plus className="mr-2 h-4 w-4" />
            테이블 추가
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-gray-50"
        onClick={clearSelection}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          modifiers={[snapToGrid]}
        >
          {tables.map((table) => {
            // Calculate additional transform for selected tables during drag
            const isSelected = selectedTables.includes(table.id);
            const isBeingDragged = activeDragId === table.id;

            // Only apply additional transform to selected tables that are not being directly dragged
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
              />
            );
          })}
        </DndContext>
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
                    // Only allow positive numbers
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
                        throw new Error("테이블 번호 업데이트에 실패했습니다.");
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

            {/* 예약 선택 드롭다운 추가 */}
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
                  onValueChange={setSelectedReservation}
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
                <Button
                  onClick={async () => {
                    setIsReservationUpdateButtonDisabled(true);
                    setIsReservationUpdateSuccessful(false);

                    try {
                      const response = await fetch(
                        `/api/tables/${doubleClickedTable?.id}/reservation`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            reservationId: selectedReservation || null,
                          }),
                        },
                      );

                      if (!response.ok) {
                        throw new Error("예약 연결 업데이트에 실패했습니다.");
                      }

                      setIsReservationUpdateSuccessful(true);
                    } catch (error) {
                      console.error("Error updating reservation link:", error);
                      alert(
                        error instanceof Error
                          ? error.message
                          : "예약 연결 업데이트 중 오류가 발생했습니다.",
                      );
                    } finally {
                      setTimeout(() => {
                        setIsReservationUpdateButtonDisabled(false);
                      }, 1000);
                    }
                  }}
                  size="sm"
                  disabled={isReservationUpdateButtonDisabled}
                >
                  연결
                </Button>
                {isReservationUpdateSuccessful && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>

            {/* 선택된 예약 정보 표시 */}
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
