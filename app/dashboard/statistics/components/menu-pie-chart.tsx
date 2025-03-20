"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface MenuStat {
  name: string;
  value: number;
}

interface MenuPieChartProps {
  yearOptions: number[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C43",
  "#A4DE6C",
  "#D0ED57",
];

export function MenuPieChart({ yearOptions }: MenuPieChartProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [menuStats, setMenuStats] = useState<MenuStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenuStats = useCallback(async (year: number, month: number) => {
    try {
      setIsLoading(true);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const response = await fetch(
        `/api/reservations/stats/menu?date=${dateStr}`,
      );

      if (!response.ok) throw new Error("Failed to fetch menu statistics");

      const data = await response.json();
      setMenuStats(data.menuStats);
    } catch (error) {
      console.error("Error fetching menu statistics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchMenuStats]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm">메뉴 통계 데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={menuStats}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {menuStats.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}건`, "예약 수"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>메뉴별 예약 점유율</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                ◀ 이전
              </Button>
              <span className="min-w-[80px] text-center font-medium">
                {selectedMonth + 1}월
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                다음 ▶
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">{renderChart()}</div>
      </CardContent>
    </Card>
  );
}
