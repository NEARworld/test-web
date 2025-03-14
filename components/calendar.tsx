"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarProps {
  reservations: any[];
  monthlyStats?: {
    date: string;
    totalReservations: number;
  }[]; // 월별 통계 데이터 추가
  onDateSelect?: (year: number, month: number, day: number) => void;
  initialYear?: number;
  initialMonth?: number; // 0-indexed (0 = January)
}

const Calendar = ({
  reservations,
  monthlyStats = [], // 월별 통계 추가
  onDateSelect,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth(),
}: CalendarProps) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);

  // 달력에 예약 데이터를 반영하기 위해 예약 데이터를 활용
  const hasReservations = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reservations.some((r) => r.dateTime.startsWith(dateStr));
  };

  const getReservationCount = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dailyStat = monthlyStats.find((stat) => stat.date === dateStr);
    return dailyStat?.totalReservations || 0;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    setSelectedDate({ year: currentYear, month: currentMonth, day });

    if (onDateSelect) {
      onDateSelect(currentYear, currentMonth, day);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const weeks = [];
    let days = [];

    // 첫 번째 주의 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // 날짜 렌더링
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        currentYear === today.getFullYear() &&
        currentMonth === today.getMonth() &&
        day === today.getDate();

      const isSelected =
        selectedDate?.year === currentYear &&
        selectedDate?.month === currentMonth &&
        selectedDate?.day === day;

      const reservationCount = getReservationCount(
        currentYear,
        currentMonth,
        day,
      );
      const hasRes = reservationCount > 0;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`relative flex h-12 cursor-pointer items-center justify-center rounded-lg border border-gray-200 transition-colors ${
            isSelected
              ? "bg-blue-500 text-white"
              : isToday
                ? "bg-blue-200 text-blue-800"
                : hasRes
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "hover:bg-gray-100"
          }`}
        >
          <span className="text-sm">{day}</span>
          {hasRes && (
            <Badge
              className={`absolute top-1 right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px] ${
                isSelected ? "bg-white text-blue-500" : ""
              }`}
            >
              {reservationCount}
            </Badge>
          )}
        </div>,
      );

      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-2">
            {days}
          </div>,
        );
        days = [];
      }
    }

    return weeks;
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevMonth}
          className="flex items-center gap-2"
        >
          <span>◀</span> 이전
        </Button>
        <h3 className="text-lg font-semibold">
          {currentYear}년 {currentMonth + 1}월
        </h3>
        <Button
          variant="outline"
          onClick={nextMonth}
          className="flex items-center gap-2"
        >
          다음 <span>▶</span>
        </Button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center font-medium">
        <div className="rounded bg-gray-50 py-2 text-red-500">일</div>
        <div className="rounded bg-gray-50 py-2">월</div>
        <div className="rounded bg-gray-50 py-2">화</div>
        <div className="rounded bg-gray-50 py-2">수</div>
        <div className="rounded bg-gray-50 py-2">목</div>
        <div className="rounded bg-gray-50 py-2">금</div>
        <div className="rounded bg-gray-50 py-2 text-blue-500">토</div>
      </div>
      <div className="min-w-[300px]">{renderCalendar()}</div>
    </div>
  );
};

export default Calendar;
