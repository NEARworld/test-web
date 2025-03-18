import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TableCardProps {
  id: string;
  number: number;
}

export function TableCard({ id, number }: TableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex h-32 w-32 flex-col items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
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
        <div className="mt-1 text-xs text-gray-500">비어있음</div>
      </div>
    </div>
  );
}