import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

interface TableCardProps {
  id: string;
  seats: number;
  number: number;
  position: {
    x: number;
    y: number;
  };
  status?: "empty" | "occupied";
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  additionalTransform?: {
    x: number;
    y: number;
  };
}

export function TableCard({
  id,
  seats,
  number,
  position,
  status = "empty",
  isSelected = false,
  onClick,
  onDoubleClick,
  additionalTransform = { x: 0, y: 0 },
}: TableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString({
      x: (transform?.x || 0) + position.x + additionalTransform.x,
      y: (transform?.y || 0) + position.y + additionalTransform.y,
      scaleX: 1,
      scaleY: 1,
    }),
  };

  // Determine border color based on the number of seats
  const borderColor =
    seats === 4
      ? "border-green-500"
      : seats === 6
        ? "border-purple-500"
        : "border-gray-300";

  console.log(seats);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`absolute flex h-32 w-32 flex-col items-center justify-between rounded-lg border p-4 shadow-sm ${borderColor} ${
        isSelected
          ? "border border-blue-500 bg-blue-100 ring-1 ring-blue-500"
          : status === "occupied"
            ? "bg-blue-50"
            : "bg-white"
      } select-none`}
    >
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className="cursor-move self-start text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">테이블 {number}</div>
        <div className="mt-1 text-xs text-gray-500">
          {status === "occupied" ? "사용중" : "비어있음"}
        </div>
      </div>
    </div>
  );
}
