"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/table-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

interface Table {
  id: string;
  number: number;
  position: {
    x: number;
    y: number;
  };
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const addTable = () => {
    const newTable = {
      id: crypto.randomUUID(),
      number: tables.length + 1,
      position: { x: 0, y: 0 },
    };
    setTables([...tables, newTable]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setTables((items) => {
      return items.map((item) => {
        if (item.id === active.id) {
          return {
            ...item,
            position: {
              x: (item.position.x || 0) + delta.x,
              y: (item.position.y || 0) + delta.y,
            },
          };
        }
        return item;
      });
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">테이블 관리</h1>
        <Button onClick={addTable}>
          <Plus className="mr-2 h-4 w-4" />
          테이블 추가
        </Button>
      </div>

      <div className="relative h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-gray-50">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {tables.map((table) => (
            <TableCard
              key={table.id}
              id={table.id}
              number={table.number}
              position={table.position}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
} 