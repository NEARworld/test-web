// app/dashboard/reservation/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MenuItem {
  name: string;
  price: number;
  quantity: number;
}

interface Reservation {
  groupName: string;
  totalPeople: number;
  dateTime: string;
  seatNumber: string;
  menu: MenuItem[];
}

// 달력에 예약 데이터를 반영하기 위해 예약 데이터를 활용
const hasReservations = (
  year: number,
  month: number,
  day: number,
  reservations: Reservation[],
) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return reservations.some((r) => r.dateTime.startsWith(dateStr));
};

export default function ReservationPage() {
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(2); // 0부터 시작하므로 2는 3월

  const reservations: { lunch: Reservation[]; dinner: Reservation[] } = {
    lunch: [
      {
        groupName: "김씨 가족",
        totalPeople: 4,
        dateTime: "2025-03-06 12:00",
        seatNumber: "A-1",
        menu: [{ name: "김치찌개", price: 8000, quantity: 2 }],
      },
      {
        groupName: "이씨 팀",
        totalPeople: 6,
        dateTime: "2025-03-06 13:00",
        seatNumber: "B-2",
        menu: [{ name: "삼겹살", price: 15000, quantity: 4 }],
      },
    ],
    dinner: [
      {
        groupName: "박씨 모임",
        totalPeople: 8,
        dateTime: "2025-03-06 18:30",
        seatNumber: "C-1",
        menu: [{ name: "냉면", price: 9000, quantity: 3 }],
      },
      {
        groupName: "최씨 친구들",
        totalPeople: 5,
        dateTime: "2025-03-06 19:00",
        seatNumber: "C-2",
        menu: [{ name: "잡채", price: 10000, quantity: 2 }],
      },
      {
        groupName: "정씨 동료",
        totalPeople: 3,
        dateTime: "2025-03-06 20:00",
        seatNumber: "D-1",
        menu: [{ name: "김밥", price: 5000, quantity: 3 }],
      },
    ],
  };

  const allReservations = [...reservations.lunch, ...reservations.dinner];

  const calculateTotalPrice = (menu: MenuItem[]) => {
    return menu.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday}) ${hours}:${minutes}`;
  };

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <Card className="relative">
      <CardHeader>
        <CardTitle>{reservation.groupName}</CardTitle>
        <Badge variant="secondary" className="absolute top-4 right-4">
          {formatDateTime(reservation.dateTime)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>인원: {reservation.totalPeople}명</p>
        <p>예약석: {reservation.seatNumber}</p>
        <div>
          <p className="font-medium">예약 메뉴:</p>
          <ul className="list-disc pl-5">
            {reservation.menu.map((item, idx) => (
              <li key={idx}>
                {item.name} - {item.quantity}개 ({item.price.toLocaleString()}
                원)
              </li>
            ))}
          </ul>
        </div>
        <p className="text-right font-semibold">
          총 가격: {calculateTotalPrice(reservation.menu).toLocaleString()} 원
        </p>
      </CardContent>
    </Card>
  );

  const todayReservations = [
    ...reservations.lunch,
    ...reservations.dinner,
  ].filter(
    (r) =>
      new Date(r.dateTime).toDateString() ===
      new Date("2025-03-06").toDateString(),
  );

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

  const renderCalendar = () => {
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
      const isToday = currentYear === 2025 && currentMonth === 2 && day === 6;
      const hasRes = hasReservations(
        currentYear,
        currentMonth,
        day,
        allReservations,
      );

      days.push(
        <div
          key={day}
          className={`relative flex h-12 items-center justify-center rounded-lg border border-gray-200 transition-colors ${
            isToday
              ? "bg-blue-500 text-white"
              : hasRes
                ? "bg-green-100 text-green-800"
                : "hover:bg-gray-100"
          }`}
        >
          {day}
          {hasRes && (
            <Badge className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center p-0 text-xs">
              {
                allReservations.filter((r) =>
                  r.dateTime.startsWith(
                    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                  ),
                ).length
              }
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
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            {/* 오늘의 예약 섹션 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">오늘의 예약 (3월 6일)</h2>
              {todayReservations.length === 0 ? (
                <p className="text-muted-foreground">오늘 예약이 없습니다.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {todayReservations.map((reservation, index) => (
                    <ReservationCard key={index} reservation={reservation} />
                  ))}
                </div>
              )}
            </section>

            {/* 달력 섹션 */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">예약 관리 달력</h2>
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
                  <div className="rounded bg-gray-50 py-2 text-blue-500">
                    토
                  </div>
                </div>
                <div className="min-w-[300px]">{renderCalendar()}</div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
