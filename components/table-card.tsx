interface TableCardProps {
  number: number;
}

export function TableCard({ number }: TableCardProps) {
  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-center">
        <div className="text-xl font-bold">테이블 {number}</div>
        <div className="mt-1 text-xs text-gray-500">비어있음</div>
      </div>
    </div>
  );
}