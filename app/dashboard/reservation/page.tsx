// app/dashboard/reservation/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Calendar from "@/components/calendar";

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

export default function ReservationPage() {
  const [selectedDate, setSelectedDate] = useState("2025-03-06");

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

  const handleDateSelect = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
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

  const selectedDateReservations = allReservations.filter((r) =>
    r.dateTime.startsWith(selectedDate),
  );

  // 점심과 저녁 예약을 나누어서 표시
  const lunchReservations = selectedDateReservations.filter((r) => {
    const hour = new Date(r.dateTime).getHours();
    return hour < 17; // 5PM 이전은 점심으로 간주
  });

  const dinnerReservations = selectedDateReservations.filter((r) => {
    const hour = new Date(r.dateTime).getHours();
    return hour >= 17; // 5PM 이후는 저녁으로 간주
  });

  // Format the selected date for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  return (
    <div className="p-6">
      <div className="container mx-auto">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* 달력 섹션 - 좌측 배치 */}
          <section className="w-full lg:w-1/2">
            <h2 className="mb-4 text-2xl font-bold">예약 관리 달력</h2>
            <Calendar
              reservations={allReservations}
              onDateSelect={handleDateSelect}
              initialYear={2025}
              initialMonth={2} // 3월 (0-indexed)
            />
          </section>

          {/* 선택한 날짜의 예약 섹션 - 우측 배치 */}
          <section className="w-full lg:w-1/2">
            <h2 className="mb-4 text-2xl font-bold">
              {formatDisplayDate(selectedDate)}의 예약
            </h2>
            {/* 고정된 높이와 항상 스크롤바가 보이도록 설정 */}
            <div className="scrollbar-gutter-stable h-[600px] overflow-x-hidden overflow-y-auto rounded-lg bg-white p-4 shadow">
              {selectedDateReservations.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">
                    선택한 날짜에 예약이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 점심 예약 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-blue-600">
                      점심 예약
                    </h3>
                    {lunchReservations.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        점심 예약이 없습니다.
                      </p>
                    ) : (
                      lunchReservations.map((reservation, index) => (
                        <ReservationCard
                          key={`lunch-${index}`}
                          reservation={reservation}
                        />
                      ))
                    )}
                  </div>

                  {/* 저녁 예약 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-600">
                      저녁 예약
                    </h3>
                    {dinnerReservations.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        저녁 예약이 없습니다.
                      </p>
                    ) : (
                      dinnerReservations.map((reservation, index) => (
                        <ReservationCard
                          key={`dinner-${index}`}
                          reservation={reservation}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
