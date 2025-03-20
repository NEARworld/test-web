"use client";

import { DailyChart } from "./components/daily-chart";
import { MonthlyChart } from "./components/monthly-chart";

export default function StatisticsPage() {
  // 연도 선택 옵션 생성 (현재 연도 기준 전후 5년)
  const today = new Date();
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => today.getFullYear() - 5 + i,
  );

  return (
    <div className="space-y-6 p-6">
      <DailyChart yearOptions={yearOptions} />
      <MonthlyChart yearOptions={yearOptions} />
    </div>
  );
}
