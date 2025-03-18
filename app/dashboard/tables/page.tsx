"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
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

interface Table {
  id: string;
  number: number;
  position: {
    x: number;
    y: number;
  };
}

// Interface for the table data returned from the API
interface TableFromApi {
  id: string;
  seats: number;
  positionX: number;
  positionY: number;
  status?: string;
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
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const snapToGrid = useMemo(() => createSnapModifier(gridSize), [gridSize]);

  // Update container dimensions when window resizes
  useEffect(() => {
    const updateContainerSize = () => {
      // This function still runs on resize but we don't need to store the value in state
    };

    window.addEventListener('resize', updateContainerSize);
    
    return () => {
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  const addTable = () => {
    const newPosition = findAvailablePosition(tables);
    
    const newTable = {
      id: crypto.randomUUID(),
      number: tables.length + 1,
      position: {
        x: Math.round(newPosition.x / gridSize) * gridSize,
        y: Math.round(newPosition.y / gridSize) * gridSize,
      },
    };
    
    // 테이블 생성 API 호출
    fetch('/api/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTable),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Table saved to database:', data);
        setTables([...tables, newTable]);
      })
      .catch(error => {
        console.error('Error saving table:', error);
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
          Math.pow(table.position.y - position.y, 2)
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

  const handleTableSelect = (id: string, event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent selection when dragging
    if (event.target instanceof Element && event.target.closest('[data-drag-handle]')) {
      return;
    }
    
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection with Ctrl/Cmd key
      setSelectedTables(prev => 
        prev.includes(id) 
          ? prev.filter(tableId => tableId !== id) 
          : [...prev, id]
      );
    } else if (event.shiftKey && selectedTables.length > 0) {
      // Range selection with Shift key
      const tableIds = tables.map(table => table.id);
      const lastSelectedIndex = tableIds.indexOf(selectedTables[selectedTables.length - 1]);
      const currentIndex = tableIds.indexOf(id);
      
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      
      const rangeSelection = tableIds.slice(start, end + 1);
      setSelectedTables(prev => {
        const uniqueSelection = Array.from(new Set([...prev, ...rangeSelection]));
        return uniqueSelection;
      });
    } else {
      // Regular click - deselect others and select this one
      setSelectedTables(selectedTables.includes(id) && selectedTables.length === 1 ? [] : [id]);
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
    const isMovingSelectedGroup = selectedTables.includes(active.id as string) && selectedTables.length > 1;
    
    setTables((items) => {
      return items.map((item) => {
        // If moving a group and this item is selected, move it
        if (isMovingSelectedGroup && selectedTables.includes(item.id)) {
          // Calculate new position
          const newX = Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY = Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          // Check container boundaries
          const maxX = containerRef.current ? containerRef.current.clientWidth - CARD_SIZE : 0;
          const maxY = containerRef.current ? containerRef.current.clientHeight - CARD_SIZE : 0;
          
          // Apply boundary constraints
          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          // Here we should add collision detection for group movement,
          // but simplifying for now as it's complex to check all potential collisions

          const updatedPosition = { x: boundedX, y: boundedY };
          
          // API call for position update
          fetch('/api/tables', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: item.id,
              position: updatedPosition,
            }),
          })
            .then(response => response.json())
            .catch(error => {
              console.error('Error updating table position:', error);
            });
          
          return {
            ...item,
            position: updatedPosition,
          };
        } 
        // For the actively dragged item or when not moving as a group
        else if (item.id === active.id) {
          // Calculate new position
          const newX = Math.round((item.position.x + delta.x) / gridSize) * gridSize;
          const newY = Math.round((item.position.y + delta.y) / gridSize) * gridSize;

          // Check container boundaries
          const maxX = containerRef.current ? containerRef.current.clientWidth - CARD_SIZE : 0;
          const maxY = containerRef.current ? containerRef.current.clientHeight - CARD_SIZE : 0;
          
          // Apply boundary constraints
          const boundedX = Math.max(0, Math.min(newX, maxX));
          const boundedY = Math.max(0, Math.min(newY, maxY));

          // Check collision with other tables
          const hasCollision = items.some((otherItem) => {
            if (otherItem.id === item.id) return false;

            const distance = Math.sqrt(
              Math.pow(otherItem.position.x - boundedX, 2) + 
              Math.pow(otherItem.position.y - boundedY, 2)
            );

            return distance < gridSize;
          });

          if (!hasCollision) {
            const updatedPosition = { x: boundedX, y: boundedY };
            
            // 위치가 변경되었을 때 API 호출
            fetch('/api/tables', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: item.id,
                position: updatedPosition,
              }),
            })
              .then(response => response.json())
              .catch(error => {
                console.error('Error updating table position:', error);
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
    fetch('/api/tables')
      .then(response => response.json())
      .then(data => {
        // 데이터베이스에서 가져온 테이블 형식을 UI에 맞게 변환
        const formattedTables = data.map((table: TableFromApi) => ({
          id: table.id,
          number: table.seats, // seats를 number로 사용
          position: {
            x: table.positionX,
            y: table.positionY,
          },
        }));
        setTables(formattedTables);
      })
      .catch(error => {
        console.error('Error fetching tables:', error);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">테이블 관리</h1>
        <div className="flex items-center gap-4">
          {selectedTables.length > 0 && (
            <div className="text-sm">
              {selectedTables.length} 테이블 선택됨
            </div>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="gridSize" className="text-sm">그리드 크기:</label>
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
            const additionalTransform = (isSelected && activeDragId && !isBeingDragged && selectedTables.includes(activeDragId)) 
              ? { x: dragDelta.x, y: dragDelta.y } 
              : { x: 0, y: 0 };
              
            return (
              <TableCard
                key={table.id}
                id={table.id}
                number={table.number}
                position={table.position}
                isSelected={isSelected}
                onClick={(e) => handleTableSelect(table.id, e)}
                additionalTransform={additionalTransform}
              />
            );
          })}
        </DndContext>
      </div>
    </div>
  );
} 