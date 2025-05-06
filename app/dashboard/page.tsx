// app/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice } from "@/lib/date-utils";

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

export default function DashboardPage() {
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

  const calculateTotalPrice = (menu: MenuItem[]) => {
    return menu.reduce((total, item) => total + item.price * item.quantity, 0);
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
                {item.name} - {item.quantity}개 ({formatPrice(item.price)})
              </li>
            ))}
          </ul>
        </div>
        <p className="text-right font-semibold">
          총 가격: {formatPrice(calculateTotalPrice(reservation.menu))}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        {/* 점심 예약 섹션 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">점심 예약</h2>
          {reservations.lunch.length === 0 ? (
            <p className="text-muted-foreground">현재 점심 예약이 없습니다.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reservations.lunch.map((reservation, index) => (
                <ReservationCard key={index} reservation={reservation} />
              ))}
            </div>
          )}
        </section>

        {/* 저녁 예약 섹션 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold">저녁 예약</h2>
          {reservations.dinner.length === 0 ? (
            <p className="text-muted-foreground">현재 저녁 예약이 없습니다.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reservations.dinner.map((reservation, index) => (
                <ReservationCard key={index} reservation={reservation} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
