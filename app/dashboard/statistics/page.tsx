"use client";

import { DailyChart } from "./components/daily-chart";
import { MonthlyChart } from "./components/monthly-chart";
import { MenuPieChart } from "./components/menu-pie-chart";

export default function StatisticsPage() {
  // 연도 선택 옵션 생성 (현재 연도 기준 전후 5년)
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6 px-6">
      <div className="grid gap-6 md:grid-cols-2">
        <DailyChart yearOptions={yearOptions} />
        <MonthlyChart yearOptions={yearOptions} />
      </div>
      <MenuPieChart yearOptions={yearOptions} />
    </div>
  );
}
