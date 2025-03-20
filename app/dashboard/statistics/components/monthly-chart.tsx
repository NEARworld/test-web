"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface MonthlyStat {
  month: string;
  totalReservations: number;
}

interface MonthlyChartProps {
  yearOptions: number[];
}

export function MonthlyChart({ yearOptions }: MonthlyChartProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [yearlyStats, setYearlyStats] = useState<MonthlyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYearlyStats = async (year: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/reservations/stats/yearly?year=${year}`,
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setYearlyStats(data.monthlyStats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyStats(selectedYear);
  }, [selectedYear]);

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
        <BarChart
          data={yearlyStats}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
          <Bar
            dataKey="totalReservations"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>월별 예약 현황</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">{renderChart()}</div>
      </CardContent>
    </Card>
  );
}
