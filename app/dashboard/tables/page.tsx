"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/table-card";

export default function TablesPage() {
  const [tables, setTables] = useState<Array<{ id: string; number: number }>>([]);

  const addTable = () => {
    const newTable = {
      id: crypto.randomUUID(),
      number: tables.length + 1,
    };
    setTables([...tables, newTable]);
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {tables.map((table) => (
          <TableCard key={table.id} number={table.number} />
        ))}
      </div>
    </div>
  );
} 