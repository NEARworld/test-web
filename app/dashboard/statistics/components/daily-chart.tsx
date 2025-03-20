"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface DailyStat {
  date: string;
  totalReservations: number;
}

interface DailyChartProps {
  yearOptions: number[];
}

export function DailyChart({ yearOptions }: DailyChartProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [monthlyStats, setMonthlyStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 해당 월의 모든 날짜 생성
  const generateMonthDates = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return {
        date: `${day}일`,
        originalDate: dateStr,
        totalReservations: 0,
      };
    });
  };

  const fetchMonthlyStats = async (year: number, month: number) => {
    try {
      setIsLoading(true);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const response = await fetch(
        `/api/reservations/stats/monthly?date=${dateStr}`,
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();

      // 선택된 월의 모든 날짜 데이터 생성
      const allDates = generateMonthDates(year, month);

      // 실제 예약 데이터와 병합
      const mergedData = allDates.map((dateData) => {
        const stat = data.dailyStats.find(
          (s: DailyStat) => s.date === dateData.originalDate,
        );
        return {
          date: dateData.date,
          totalReservations: stat ? stat.totalReservations : 0,
        };
      });

      setMonthlyStats(mergedData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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
            <p className="text-sm">통계 데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyStats}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
            }}
            formatter={(value) => [`${value}건`, "예약 수"]}
          />
          <Line
            type="linear"
            dataKey="totalReservations"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: "#2563eb", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>일별 예약 현황</CardTitle>
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
