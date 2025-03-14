"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyStat {
  date: string;
  totalReservations: number;
}

export default function StatisticsPage() {
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

  const fetchMonthlyStats = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const currentDate = today.toISOString().split("T")[0];
      const response = await fetch(
        `/api/reservations/stats/monthly?date=${currentDate}`,
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();

      // 현재 월의 모든 날짜 데이터 생성
      const allDates = generateMonthDates(
        today.getFullYear(),
        today.getMonth(),
      );

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
    fetchMonthlyStats();
  }, []);

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{new Date().getMonth() + 1}월 일별 예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
