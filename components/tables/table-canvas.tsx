import React, { useRef, useState, useEffect } from "react";
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === contentRef.current) {
      setSelectedTables([]);
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - canvasPosition.x,
        y: e.clientY - canvasPosition.y,
      });
      if (contentRef.current) {
        contentRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (isDraggingCanvas) {
      setCanvasPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    if (contentRef.current) {
      contentRef.current.style.cursor = "grab";
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleCanvasMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      handleCanvasMouseUp();
    };

    const handleWheelEvent = (e: WheelEvent) => {
      handleWheel(e);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      currentContentRef.addEventListener("wheel", handleWheelEvent, {
        passive: false,
      });
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (currentContentRef) {
        currentContentRef.removeEventListener("wheel", handleWheelEvent);
      }
    };
  }, [isDraggingCanvas, dragStart, zoomLevel]);

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
        width: "100%",
        height: "100%",
        position: "absolute",
      }}
      onMouseDown={handleCanvasMouseDown}
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
