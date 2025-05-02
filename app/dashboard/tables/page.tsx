"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Check, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/table-card";
import {
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  rectIntersection,
  Modifier,
  DndContext,
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

export interface TableFromApi {
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
  const [tables, setTables] = useState<TableFromApi[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(32);
  const [isGridSizeVisible] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [doubleClickedTable, setDoubleClickedTable] = useState<TableFromApi>();
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
  const [isClient, setIsClient] = useState(false);

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
    setIsClient(true);
  }, []);

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
          const newTableId = newTable.id;

          if (payload.eventType === "INSERT") {
            setTables((prevTables) => {
              // *** 추가된 조건 ***
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

  const addTable = () => {
    const newPosition = findAvailablePosition(tables);

    // 새 테이블 객체 생성 - 여기서는 ID를 서버에서 생성하도록 함
    const newTable: Omit<TableFromApi, "id"> = {
      seats: 4, // 기본값으로 4인석 설정 (이전엔 0이었음)
      number: tables.length + 1,
      positionX: Math.round(newPosition.x / gridSize) * gridSize,
      positionY: Math.round(newPosition.y / gridSize) * gridSize,
    };

    // 서버에 새 테이블 저장
    fetch("/api/tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTable),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("테이블 추가에 실패했습니다");
        }
        return response.json();
      })
      .then((data) => {
        console.log("테이블이 데이터베이스에 저장되었습니다:", data);
        // 서버 응답으로 받은 데이터(서버에서 생성된 ID 포함)로 테이블을 추가
        setTables((prevTables) => [...prevTables, data]);
      })
      .catch((error) => {
        console.error("테이블 저장 중 오류 발생:", error);
        alert("테이블 저장에 실패했습니다: " + error.message);
      });
  };

  const findAvailablePosition = (existingTables: TableFromApi[]) => {
    const position = { x: 0, y: 0 };
    let found = false;

    while (!found) {
      let hasCollision = false;

      for (const table of existingTables) {
        const distance = Math.sqrt(
          Math.pow(table.positionX - position.x, 2) +
            Math.pow(table.positionY - position.y, 2),
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
        // 클라이언트 측 렌더링에서만 window 객체에 접근
        const maxWidth =
          typeof window !== "undefined" ? window.innerWidth - CARD_SIZE : 1000;
        if (position.x > maxWidth) {
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
    // 이미 선택된 테이블 클릭 처리 - 그대로 유지
    if (selectedTables.includes(id)) {
      event.stopPropagation();
      return;
    }

    // 가려진 영역만 클릭 무시 (겹친 테이블의 노출된 부분은 클릭 처리)
    if (selectedTables.length > 0) {
      // 클릭한 테이블과 선택된 테이블이 겹치는지 확인
      const clickedTable = tables.find((t) => t.id === id);
      const selectedTable = tables.find((t) => t.id === selectedTables[0]);

      if (clickedTable && selectedTable) {
        // 두 테이블 간의 거리 계산
        const distance = Math.sqrt(
          Math.pow(selectedTable.positionX - clickedTable.positionX, 2) +
            Math.pow(selectedTable.positionY - clickedTable.positionY, 2),
        );

        // 테이블이 겹쳐있는 경우 (테이블 크기는 128px)
        if (distance < 128) {
          // 렌더링 순서에서 클릭한 테이블의 인덱스 확인
          const sortedTables = getSortedTables();
          const clickedTableIndex = sortedTables.findIndex((t) => t.id === id);
          const selectedTableIndex = sortedTables.findIndex(
            (t) => t.id === selectedTables[0],
          );

          // 클릭한 테이블이 선택된 테이블보다 아래에 있는 경우(인덱스가 더 작은 경우)에만 클릭 무시
          // 이는 가려진 영역을 클릭한 경우에만 무시하기 위함
          if (clickedTableIndex < selectedTableIndex) {
            // DOM 이벤트 좌표를 기준으로 실제 가려진 부분인지 확인
            // 클릭 위치 확인 (상대 위치)
            const rect = (
              event.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            // 두 테이블의 중심점 간 거리 벡터
            const dx = clickedTable.positionX - selectedTable.positionX;
            const dy = clickedTable.positionY - selectedTable.positionY;

            // 클릭 위치가 두 테이블의 중심점 간 거리 벡터와 같은 방향에 있는지 확인
            // 이는 선택된 테이블에서 클릭한 테이블 방향으로 겹친 영역을 클릭했는지 확인
            const cx = clickX - 64; // 64는 테이블 크기의 절반
            const cy = clickY - 64;

            // 두 벡터의 내적이 양수이면 같은 방향
            const dotProduct = dx * cx + dy * cy;

            if (dotProduct < 0) {
              // 가려진 영역 클릭으로 간주하고 클릭 무시
              event.stopPropagation();
              return;
            }
          }
        }
      }
    }

    // 기존 선택 로직
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
      setSelectedTables([id]);
    }
  };

  const clearSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setSelectedTables([]);
    }
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
              (t: TableFromApi) => t.id === tableId,
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
      const updatedItems = items.map((item) => {
        if (isMovingSelectedGroup && selectedTables.includes(item.id)) {
          // 그룹으로 선택된 테이블들 이동 처리
          const newX =
            Math.round((item.positionX + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.positionY + delta.y) / gridSize) * gridSize;

          const maxX = containerRef.current
            ? containerRef.current.clientWidth - CARD_SIZE
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - CARD_SIZE
            : 0;

          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          const hasCollision = items.some((otherItem) => {
            if (
              otherItem.id === item.id ||
              selectedTables.includes(otherItem.id)
            )
              return false;

            const distance = Math.sqrt(
              Math.pow(otherItem.positionX - boundedX, 2) +
                Math.pow(otherItem.positionY - boundedY, 2),
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            // 서버에 테이블 위치 업데이트 요청
            updateTablePositionOnServer(item.id, boundedX, boundedY);

            return {
              ...item,
              positionX: boundedX,
              positionY: boundedY,
            };
          }
        } else if (item.id === active.id) {
          // 단일 테이블 이동 처리
          const newX =
            Math.round((item.positionX + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.positionY + delta.y) / gridSize) * gridSize;

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
              Math.pow(otherItem.positionX - boundedX, 2) +
                Math.pow(otherItem.positionY - boundedY, 2),
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            // 서버에 테이블 위치 업데이트 요청
            updateTablePositionOnServer(item.id, boundedX, boundedY);

            return {
              ...item,
              positionX: boundedX,
              positionY: boundedY,
            };
          }
        }
        return item;
      });

      return updatedItems;
    });
  };

  // 테이블 위치 업데이트를 위한 서버 요청 함수
  const updateTablePositionOnServer = (id: string, x: number, y: number) => {
    fetch("/api/tables", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        position: { x, y },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`테이블 ${id} 위치 업데이트에 실패했습니다`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("테이블 위치 업데이트 중 오류 발생:", error);
      });
  };

  const handleTableSelectWithEvent = (
    id: string,
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    handleTableSelect(id, event);
  };

  // 테이블 렌더링 순서 결정 함수 수정
  const getSortedTables = () => {
    // 선택된 테이블을 가장 위에 표시할 수 있도록 복사 후 정렬
    return [...tables].sort((a, b) => {
      // 선택된 테이블이 가장 우선순위가 높음
      if (selectedTables.includes(a.id) && !selectedTables.includes(b.id)) {
        return 1; // a가 선택되어 있으면 나중에(위에) 렌더링
      }
      if (!selectedTables.includes(a.id) && selectedTables.includes(b.id)) {
        return -1; // b가 선택되어 있으면 나중에(위에) 렌더링
      }

      // 테이블 번호 정렬을 반대로 변경 - 번호가 큰 테이블이 위에 오도록
      return b.number - a.number;
    });
  };

  // 처음 마운트 시에만 렌더링
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
        <div
          ref={contentRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
          }}
        >
          {isClient && !isLoading ? (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              modifiers={[snapToGrid]}
            >
              {/* 정렬된 테이블 목록 사용 */}
              {getSortedTables().map((table) => {
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
                    position={{ x: table.positionX, y: table.positionY }}
                    isSelected={isSelected}
                    onClick={(
                      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                    ) => {
                      e.stopPropagation(); // 이벤트 버블링 방지
                      handleTableSelectWithEvent(table.id, e);
                    }}
                    onDoubleClick={() => handleTableDoubleClick(table.id)}
                    additionalTransform={additionalTransform}
                    reservation={table.reservation}
                  />
                );
              })}
            </DndContext>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">
                테이블 정보를 불러오고 있습니다.
              </p>
            </div>
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
                        setIsDialogOpen(false);
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
