import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

// Define Reservation interface - exported for use in other components
export interface Reservation {
  id: string;
  groupName: string;
  dateTime: string;
  status: string;
}

// TableCardProps 인터페이스 정의
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
  reservation?: Reservation;
  className?: string;
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
  reservation,
  className = "",
}: TableCardProps) {
  // 드래그 기능
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  // If table has reservation, set status to occupied
  const tableStatus = reservation ? "occupied" : status;

  // 좌표와 z-index를 포함한 스타일
  const style = {
    transform: CSS.Transform.toString({
      x: (transform?.x || 0) + position.x + additionalTransform.x,
      y: (transform?.y || 0) + position.y + additionalTransform.y,
      scaleX: 1,
      scaleY: 1,
    }),
    cursor: "move", // 커서를 이동 가능 상태로 변경
    zIndex: isSelected ? 10 : 1, // 선택된 테이블에 더 높은 z-index 부여
  };

  // Determine border color based on the number of seats
  const borderColor =
    seats === 4
      ? "border-green-500"
      : seats === 6
        ? "border-purple-500"
        : "border-gray-300";

  // 테이블 카드 전체를 드래그 핸들로 사용
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`absolute flex h-32 w-32 flex-col items-center justify-between rounded-lg border p-2 shadow-sm ${borderColor} ${
        isSelected
          ? "border border-blue-500 bg-blue-100 ring-2 ring-blue-500"
          : tableStatus === "occupied"
            ? "bg-blue-50"
            : "bg-white"
      } select-none ${className} ${isSelected ? "shadow-lg" : ""}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="font-bold">{number}</div>
      </div>

      <div className="text-center">
        <div className="text-lg">테이블</div>
        {reservation ? (
          <div className="mt-1 text-xs">
            <div className="font-semibold text-blue-600">
              {reservation.groupName}
            </div>
            <div className="text-gray-600">
              {new Date(reservation.dateTime).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-500">
            {tableStatus === "occupied" ? "사용중" : "비어있음"}
          </div>
        )}
      </div>
    </div>
  );
}
