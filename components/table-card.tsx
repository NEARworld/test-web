import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TableCardProps {
  id: string;
  number: number;
  position: {
    x: number;
    y: number;
  };
  status?: "empty" | "occupied";
}

export function TableCard({ id, number, position, status = "empty" }: TableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString({
      x: (transform?.x || 0) + position.x,
      y: (transform?.y || 0) + position.y,
      scaleX: 1,
      scaleY: 1,
    }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute flex h-32 w-32 flex-col items-center justify-between rounded-lg border p-4 shadow-sm ${
        status === "occupied" ? "bg-blue-50" : "bg-white"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
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