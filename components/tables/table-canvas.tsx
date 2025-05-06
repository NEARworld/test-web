import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { TableCard } from "@/components/table-card";

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
  const [canvasSize, setCanvasSize] = useState({
    width: 8000,
    height: 6000,
    minX: -4000,
    minY: -3000,
    maxX: 4000,
    maxY: 3000,
  });

  // 드래그 상태를 참조로 관리
  const dragState = useRef({
    isDragging: false,
    isZooming: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    zoomTimer: null as NodeJS.Timeout | null,
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

    // 캔버스 크기를 훨씬 크게 설정하여 넓은 영역을 사용할 수 있게 함
    const width = Math.max(containerWidth * scaleFactor * 2, 8000);
    const height = Math.max(containerHeight * scaleFactor * 2, 6000);

    setCanvasSize({
      width: width,
      height: height,
      minX: -width / 2,
      minY: -height / 2,
      maxX: width / 2,
      maxY: height / 2,
    });

    // 초기 마운트나 화면 크기 변경 시에만 위치를 중앙으로 조정
    // 줌이나 드래그 중에는 위치를 조정하지 않음
    if (!dragState.current.isZooming && !dragState.current.isDragging) {
      // 화면 중앙을 기준으로 캔버스 위치 계산
      const newX = containerWidth / 2 - (width / 2) * zoomLevel;
      const newY = containerHeight / 2 - (height / 2) * zoomLevel;

      setCanvasPosition({
        x: newX,
        y: newY,
      });
    }
  }, [containerRef, zoomLevel]);

  // 캔버스 확장 함수
  const expandCanvasIfNeeded = useCallback(
    (posX: number, posY: number) => {
      const padding = 500; // 경계에 도달하기 전에 확장을 시작할 패딩

      let needsUpdate = false;
      const newSize = { ...canvasSize };

      // 왼쪽 경계 확인
      if (posX < canvasSize.minX + padding) {
        newSize.minX = canvasSize.minX - 1000;
        newSize.width = newSize.maxX - newSize.minX;
        needsUpdate = true;
      }

      // 오른쪽 경계 확인
      if (posX > canvasSize.maxX - padding) {
        newSize.maxX = canvasSize.maxX + 1000;
        newSize.width = newSize.maxX - newSize.minX;
        needsUpdate = true;
      }

      // 위쪽 경계 확인
      if (posY < canvasSize.minY + padding) {
        newSize.minY = canvasSize.minY - 1000;
        newSize.height = newSize.maxY - newSize.minY;
        needsUpdate = true;
      }

      // 아래쪽 경계 확인
      if (posY > canvasSize.maxY - padding) {
        newSize.maxY = canvasSize.maxY + 1000;
        newSize.height = newSize.maxY - newSize.minY;
        needsUpdate = true;
      }

      if (needsUpdate) {
        setCanvasSize(newSize);
      }

      return needsUpdate;
    },
    [canvasSize],
  );

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

      dragState.current.isZooming = true;

      // 현재 마우스 위치 (뷰포트 상의)
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // 현재 줌 레벨에서 마우스 위치의 캔버스 상 좌표 계산
      const mouseXInCanvas = (mouseX - canvasPosition.x) / zoomLevel;
      const mouseYInCanvas = (mouseY - canvasPosition.y) / zoomLevel;

      // 줌 계산
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));

      // 새 줌 레벨에서 마우스 포인터가 같은 캔버스 위치를 가리키도록 캔버스 위치 계산
      const newX = mouseX - mouseXInCanvas * newZoom;
      const newY = mouseY - mouseYInCanvas * newZoom;

      // 새 줌 레벨과 캔버스 위치 적용
      setZoomLevel(newZoom);
      setCanvasPosition({ x: newX, y: newY });

      // 타이머가 이미 있다면 클리어
      if (dragState.current.zoomTimer) {
        clearTimeout(dragState.current.zoomTimer);
      }

      // 줌 상태 해제 타이머 설정 (시간을 500ms로 늘림)
      dragState.current.zoomTimer = setTimeout(() => {
        dragState.current.isZooming = false;
      }, 500);
    },
    [zoomLevel, canvasPosition, setZoomLevel],
  );

  // 줌 레벨이 변경될 때마다 캔버스 크기만 업데이트하고 위치는 건드리지 않음
  useEffect(() => {
    // 드래그나 줌 중에는 캔버스 크기 업데이트만 수행하고 위치는 변경하지 않음
    updateCanvasSize();
  }, [zoomLevel, updateCanvasSize]);

  // 컨테이너 크기가 변경될 때마다 캔버스 크기 업데이트
  useEffect(() => {
    const currentRef = containerRef.current;
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
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

          // 테이블이 새 위치로 이동할 때 필요에 따라 캔버스 확장
          expandCanvasIfNeeded(newX, newY);

          // 충돌 검사
          const hasCollision = items.some((otherItem) => {
            if (
              otherItem.id === item.id ||
              selectedTables.includes(otherItem.id)
            )
              return false;

            const distance = Math.sqrt(
              Math.pow(otherItem.positionX - newX, 2) +
                Math.pow(otherItem.positionY - newY, 2),
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            updateTablePositionOnServer(item.id, newX, newY);

            return {
              ...item,
              positionX: newX,
              positionY: newY,
            };
          }
        } else if (item.id === active.id) {
          const newX =
            Math.round((item.positionX + delta.x) / gridSize) * gridSize;
          const newY =
            Math.round((item.positionY + delta.y) / gridSize) * gridSize;

          // 테이블이 새 위치로 이동할 때 필요에 따라 캔버스 확장
          expandCanvasIfNeeded(newX, newY);

          // 충돌 검사
          const hasCollision = items.some((otherItem) => {
            if (otherItem.id === item.id) return false;

            const distance = Math.sqrt(
              Math.pow(otherItem.positionX - newX, 2) +
                Math.pow(otherItem.positionY - newY, 2),
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            updateTablePositionOnServer(item.id, newX, newY);

            return {
              ...item,
              positionX: newX,
              positionY: newY,
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
        transformOrigin: "0 0",
        cursor: isDraggingCanvas ? "grabbing" : "grab",
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        position: "absolute",
        backgroundColor: "rgba(200, 220, 240, 0.5)",
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
