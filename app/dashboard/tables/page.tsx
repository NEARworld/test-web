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

// Interface for the table data returned from the API
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
  const contentRef = useRef<HTMLDivElement>(null); // 내용물을 감싸는 div의 ref
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
  const [containerPosition, setContainerPosition] = useState({ x: 0, y: 0 }); // 팬 위치 상태 추가
  const [isPanning, setIsPanning] = useState(false); // 팬 상태 추가
  const panningStartPoint = useRef({ x: 0, y: 0 }); // 팬 시작점

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
      reservationId: undefined,
      reservation: undefined,
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

  // 페이지 로드 시 테이블 데이터와 예약 데이터 가져오기
  useEffect(() => {
    setIsLoading(true);
    // 오늘 날짜를 YYYY-MM-DD 형식으로 구하기
    const today = new Date().toISOString().split("T")[0];

    // 먼저 모든 예약 데이터를 가져온 다음 테이블을 처리합니다
    fetch(`/api/reservations?date=${today}`)
      .then((response) => response.json())
      .then((allReservationsData) => {
        // 확정된 예약만 필터링해서 상태에 저장
        const confirmedReservations = allReservationsData.filter(
          (r: Reservation) => r.status === "CONFIRMED",
        );
        setReservations(confirmedReservations);
        console.log(
          `오늘(${today}) 확정된 예약 ${confirmedReservations.length}건 로드됨`,
        );

        // 예약 데이터를 가져온 후 테이블 데이터를 가져옵니다
        return fetch("/api/tables")
          .then((response) => response.json())
          .then((data) => {
            // 데이터베이스에서 가져온 테이블 형식을 UI에 맞게 변환하고 예약 정보 연결
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

              // 테이블에 연관된 예약 정보가 있다면 연결
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

  // 테이블에 예약 연결하는 함수
  const connectReservationToTable = async (
    tableId: string,
    reservationValue: string,
  ) => {
    // 예약 성공 표시 초기화
    setIsReservationUpdateSuccessful(false);

    try {
      // 현재 테이블의 예약 정보 가져오기
      const currentTable = tables.find((t) => t.id === tableId);
      if (!currentTable) {
        throw new Error("테이블을 찾을 수 없습니다.");
      }

      // 기존 예약이 있고, 새로운 예약이 다른 경우
      if (
        currentTable.reservationId &&
        currentTable.reservationId !== reservationValue
      ) {
        // 기존 예약 연결 해제
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

      // 새로운 예약 연결
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

      // 예약 테이블 전체를 다시 조회하여 테이블 상태 업데이트
      try {
        const tablesResponse = await fetch("/api/tables");
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();

          // 받아온 테이블 데이터를 UI에 맞게 변환
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

          // 테이블 상태 업데이트
          setTables(updatedTables);

          // 선택된 테이블도 업데이트
          if (doubleClickedTable) {
            const updatedTable = updatedTables.find(
              (t: Table) => t.id === tableId,
            );
            if (updatedTable) {
              setDoubleClickedTable(updatedTable);
            }
          }

          // 성공 표시
          setIsReservationUpdateSuccessful(true);

          // 1.5초 후 성공 표시 제거
          setTimeout(() => {
            setIsReservationUpdateSuccessful(false);
          }, 1500);

          return { success: true, data };
        }
      } catch (error) {
        console.error("테이블 목록 새로고침 실패:", error);
      }

      // API 호출 실패 시 폴백 로직 - 로컬 상태만 업데이트
      console.log("테이블 목록 조회 실패, 로컬 상태만 업데이트합니다.");
      const matchingReservation =
        reservationValue !== "none"
          ? reservations.find((r) => r.id === reservationValue)
          : undefined;

      // 테이블 상태 업데이트
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

      // 성공 표시
      setIsReservationUpdateSuccessful(true);

      // 현재 선택된 테이블이면 해당 테이블 정보도 업데이트
      if (doubleClickedTable && doubleClickedTable.id === tableId) {
        setDoubleClickedTable({
          ...doubleClickedTable,
          reservationId: reservationId,
          reservation: matchingReservation,
        });
      }

      // 1.5초 후 성공 표시 제거
      setTimeout(() => {
        setIsReservationUpdateSuccessful(false);
      }, 1500);

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

  // 예약 드롭다운 변경 핸들러
  const handleReservationChange = (value: string) => {
    setSelectedReservation(value);

    // 테이블이 선택되어 있으면 예약 연결
    if (doubleClickedTable) {
      connectReservationToTable(doubleClickedTable.id, value);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.2, 0.5));
  };

  // 팬 시작
  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    panningStartPoint.current = {
      x: event.clientX,
      y: event.clientY,
    };
    containerRef.current?.classList.add("cursor-grab"); // 커서 스타일 변경
  };

  // 팬 이동
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

  // 팬 종료
  const handlePanEnd = () => {
    setIsPanning(false);
    containerRef.current?.classList.remove("cursor-grab"); // 커서 스타일 복원
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
            <Button size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
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
        className="relative h-[calc(100vh-12rem)] cursor-default overflow-hidden rounded-lg border bg-gray-50 active:cursor-grabbing" // 팬 커서 스타일 추가
        onClick={clearSelection}
        onMouseDown={handlePanStart} // 팬 시작 이벤트
        onMouseMove={handlePanMove} // 팬 이동 이벤트
        onMouseUp={handlePanEnd} // 팬 종료 이벤트
        onMouseLeave={handlePanEnd} // 컨테이너 벗어났을 때 팬 종료 이벤트
      >
        {/* 내용물을 감싸는 div */}
        <div
          ref={contentRef}
          style={{
            transform: `scale(${zoomLevel}) translate(${containerPosition.x}px, ${containerPosition.y}px)`, // 팬 위치 적용
            transformOrigin: "center center", // 확대/축소 기준점 중앙으로 변경
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
