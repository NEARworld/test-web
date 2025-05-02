import React, { useRef, useState, useEffect, useCallback } from "react";
import { TableCard } from "@/components/table-card";
import { Loader2 } from "lucide-react";
import { TableFromApi } from "@/types/tables";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  rectIntersection,
  Modifier,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";

interface TableCanvasProps {
  tables: TableFromApi[];
  setTables: React.Dispatch<React.SetStateAction<TableFromApi[]>>;
  selectedTables: string[];
  setSelectedTables: React.Dispatch<React.SetStateAction<string[]>>;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  gridSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  isClient: boolean;
  onTableDoubleClick: (id: string) => void;
  getSortedTables: () => TableFromApi[];
  updateTablePositionOnServer: (id: string, x: number, y: number) => void;
}

export function TableCanvas({
  tables,
  setTables,
  selectedTables,
  setSelectedTables,
  zoomLevel,
  setZoomLevel,
  gridSize,
  containerRef,
  isLoading,
  isClient,
  onTableDoubleClick,
  getSortedTables,
  updateTablePositionOnServer,
}: TableCanvasProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 4000, height: 3000 });

  // 드래그 상태를 참조로 관리
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // 테이블 요소 감지 함수
  const isTableElement = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return (
      !!target.closest("[data-drag-handle]") ||
      !!target.closest(".table-card") ||
      !!target.closest("[role='button']")
    );
  }, []);

  // 캔버스 크기 업데이트 함수
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 줌 레벨에 따라 캔버스 크기 조정
    // 줌이 작아질수록 캔버스는 커짐 (역비례)
    const scaleFactor = 1.5 / zoomLevel; // 줌 레벨이 작을수록 scaleFactor는 커짐

    setCanvasSize({
      width: Math.max(containerWidth * scaleFactor, 4000),
      height: Math.max(containerHeight * scaleFactor, 3000),
    });

    // 위치 조정 (캔버스가 항상 중앙에 오도록)
    const newX =
      (containerWidth - containerWidth * scaleFactor * zoomLevel) / 2;
    const newY =
      (containerHeight - containerHeight * scaleFactor * zoomLevel) / 2;

    setCanvasPosition({
      x: newX,
      y: newY,
    });
  }, [containerRef, zoomLevel]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // 테이블 요소를 클릭한 경우 드래그를 시작하지 않음
      if (isTableElement(e.target)) {
        return;
      }

      // 드래그 시작
      dragState.current.isDragging = true;
      dragState.current.startX = e.clientX - canvasPosition.x;
      dragState.current.startY = e.clientY - canvasPosition.y;
      dragState.current.lastX = canvasPosition.x;
      dragState.current.lastY = canvasPosition.y;

      setSelectedTables([]);
      setIsDraggingCanvas(true);
      document.body.style.cursor = "grabbing";

      // 이벤트 전파 방지
      e.preventDefault();
      e.stopPropagation();
    },
    [canvasPosition, setSelectedTables, isTableElement],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging) return;

    const newX = e.clientX - dragState.current.startX;
    const newY = e.clientY - dragState.current.startY;

    setCanvasPosition({
      x: newX,
      y: newY,
    });

    dragState.current.lastX = newX;
    dragState.current.lastY = newY;

    e.preventDefault();
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging) return;

    dragState.current.isDragging = false;
    setIsDraggingCanvas(false);
    document.body.style.cursor = "auto";

    e.preventDefault();
  }, []);

  // 휠 이벤트 핸들러
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
      setZoomLevel(newZoom);
    },
    [zoomLevel, setZoomLevel],
  );

  // 줌 레벨이 변경될 때마다 캔버스 크기 업데이트
  useEffect(() => {
    updateCanvasSize();
  }, [zoomLevel, updateCanvasSize]);

  // 컨테이너 크기가 변경될 때마다 캔버스 크기 업데이트
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      observer.disconnect();
    };
  }, [containerRef, updateCanvasSize]);

  // 초기 마운트 시 캔버스 크기 설정
  useEffect(() => {
    updateCanvasSize();
  }, [updateCanvasSize]);

  // 이벤트 리스너 등록 및 해제
  useEffect(() => {
    // 이벤트 핸들러 등록
    const parentElement = containerRef.current;
    if (!parentElement) return;

    // 마우스 이벤트 리스너 등록
    parentElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // 휠 이벤트 리스너 등록 (document 레벨에서도 등록하여 어디서든 작동하도록)
    parentElement.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener(
      "wheel",
      (e) => {
        if (parentElement.contains(e.target as Node)) {
          handleWheel(e);
        }
      },
      { passive: false },
    );

    // 클린업 함수
    return () => {
      parentElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      parentElement.removeEventListener("wheel", handleWheel);
      document.removeEventListener("wheel", (e) => {
        if (parentElement.contains(e.target as Node)) {
          handleWheel(e);
        }
      });
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    containerRef,
  ]);

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

  const snapToGrid = createSnapModifier(gridSize);

  const handleTableSelectWithEvent = (
    id: string,
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    handleTableSelect(id, event);
  };

  const handleTableSelect = (
    id: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (selectedTables.includes(id)) {
      event.stopPropagation();
      return;
    }

    if (selectedTables.length > 0) {
      const clickedTable = tables.find((t) => t.id === id);
      const selectedTable = tables.find((t) => t.id === selectedTables[0]);

      if (clickedTable && selectedTable) {
        const distance = Math.sqrt(
          Math.pow(selectedTable.positionX - clickedTable.positionX, 2) +
            Math.pow(selectedTable.positionY - clickedTable.positionY, 2),
        );

        if (distance < 128) {
          const sortedTables = getSortedTables();
          const clickedTableIndex = sortedTables.findIndex((t) => t.id === id);
          const selectedTableIndex = sortedTables.findIndex(
            (t) => t.id === selectedTables[0],
          );

          if (clickedTableIndex < selectedTableIndex) {
            const rect = (
              event.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            const dx = clickedTable.positionX - selectedTable.positionX;
            const dy = clickedTable.positionY - selectedTable.positionY;

            const cx = clickX - 64;
            const cy = clickY - 64;

            const dotProduct = dx * cx + dy * cy;

            if (dotProduct < 0) {
              event.stopPropagation();
              return;
            }
          }
        }
      }
    }

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
          const newX =
            Math.round((item.positionX + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.positionY + delta.y) / gridSize) * gridSize;

          const maxX = containerRef.current
            ? containerRef.current.clientWidth - 128
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - 128
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
            updateTablePositionOnServer(item.id, boundedX, boundedY);

            return {
              ...item,
              positionX: boundedX,
              positionY: boundedY,
            };
          }
        } else if (item.id === active.id) {
          const newX =
            Math.round((item.positionX + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.positionY + delta.y) / gridSize) * gridSize;

          const maxX = containerRef.current
            ? containerRef.current.clientWidth - 128
            : 0;
          const maxY = containerRef.current
            ? containerRef.current.clientHeight - 128
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

  return (
    <div
      ref={contentRef}
      style={{
        transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoomLevel})`,
        transformOrigin: "center center",
        cursor: isDraggingCanvas ? "grabbing" : "grab",
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        position: "absolute",
        backgroundColor: "rgba(200, 220, 240, 0.5)", // 배경색 약간 추가
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
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                  e.stopPropagation();
                  handleTableSelectWithEvent(table.id, e);
                }}
                onDoubleClick={() => onTableDoubleClick(table.id)}
                additionalTransform={additionalTransform}
                reservation={table.reservation}
                className="table-card"
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
  );
}
