// app/dashboard/reservation/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Calendar from "@/components/calendar";
import { Plus, Minus } from "lucide-react";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupName: "",
    totalPeople: 2,
    time: "12:00",
    seatNumber: "A-1",
    menuItems: [{ name: "김치찌개", price: 8000, quantity: 1 }],
  });

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

  const availableMenuItems = [
    { name: "김치찌개", price: 8000 },
    { name: "삼겹살", price: 15000 },
    { name: "냉면", price: 9000 },
    { name: "잡채", price: 10000 },
    { name: "김밥", price: 5000 },
    { name: "비빔밥", price: 9000 },
  ];

  const availableSeats = [
    "A-1",
    "A-2",
    "A-3",
    "B-1",
    "B-2",
    "B-3",
    "C-1",
    "C-2",
    "C-3",
    "D-1",
    "D-2",
    "D-3",
  ];

  const availableTimes = [
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
  ];

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

  const handleAddReservation = () => {
    setIsModalOpen(true);
  };

  const handleSubmitReservation = () => {
    // 실제 구현에서는 여기서 API 호출 등을 통해 예약을 저장합니다
    console.log("예약 데이터:", {
      ...formData,
      dateTime: `${selectedDate} ${formData.time}`,
    });

    // 모달 닫기 및 폼 초기화
    setIsModalOpen(false);
    setFormData({
      groupName: "",
      totalPeople: 2,
      time: "12:00",
      seatNumber: "A-1",
      menuItems: [{ name: "김치찌개", price: 8000, quantity: 1 }],
    });
  };

  const handleMenuItemChange = (index: number, field: string, value: any) => {
    const newMenuItems = [...formData.menuItems];

    if (field === "name") {
      const selectedItem = availableMenuItems.find(
        (item) => item.name === value,
      );
      if (selectedItem) {
        newMenuItems[index] = {
          ...newMenuItems[index],
          name: value,
          price: selectedItem.price,
        };
      }
    } else {
      // @ts-ignore
      newMenuItems[index][field] = value;
    }

    setFormData({
      ...formData,
      menuItems: newMenuItems,
    });
  };

  const addMenuItem = () => {
    setFormData({
      ...formData,
      menuItems: [
        ...formData.menuItems,
        {
          name: availableMenuItems[0].name,
          price: availableMenuItems[0].price,
          quantity: 1,
        },
      ],
    });
  };

  const removeMenuItem = (index: number) => {
    if (formData.menuItems.length > 1) {
      const newMenuItems = [...formData.menuItems];
      newMenuItems.splice(index, 1);
      setFormData({
        ...formData,
        menuItems: newMenuItems,
      });
    }
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
        <div className="flex flex-col gap-6">
          {/* 달력 섹션 */}
          <section className="w-full">
            <div className="mx-auto max-w-3xl">
              {/* 상단 헤더와 예약 버튼 */}
              <div className="flex items-center justify-end">
                {/* <h1 className="text-3xl font-bold">예약 관리</h1> */}
                <Button
                  onClick={handleAddReservation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> 예약하기
                </Button>
              </div>
              <Calendar
                reservations={allReservations}
                onDateSelect={handleDateSelect}
                initialYear={2025}
                initialMonth={2} // 3월 (0-indexed)
              />
            </div>
          </section>

          {/* 선택한 날짜의 예약 섹션 - 달력 아래 배치 */}
          <section className="w-full">
            <h2 className="mb-4 text-2xl font-bold">
              {formatDisplayDate(selectedDate)}의 예약
            </h2>
            {/* 고정된 높이와 항상 스크롤바가 보이도록 설정 */}
            <div className="scrollbar-gutter-stable h-[500px] overflow-x-hidden overflow-y-auto rounded-lg bg-white p-4 shadow">
              {selectedDateReservations.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">
                    선택한 날짜에 예약이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

      {/* 예약 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 예약 등록</DialogTitle>
            <DialogDescription>
              {formatDisplayDate(selectedDate)}에 새로운 예약을 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName">예약자명 / 단체명</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e) =>
                  setFormData({ ...formData, groupName: e.target.value })
                }
                placeholder="홍길동 / 홍씨 가족"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalPeople">인원 수</Label>
                <Input
                  id="totalPeople"
                  type="number"
                  min="1"
                  value={formData.totalPeople}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalPeople: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time">예약 시간</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) =>
                    setFormData({ ...formData, time: value })
                  }
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seatNumber">예약석</Label>
              <Select
                value={formData.seatNumber}
                onValueChange={(value) =>
                  setFormData({ ...formData, seatNumber: value })
                }
              >
                <SelectTrigger id="seatNumber">
                  <SelectValue placeholder="좌석 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat} value={seat}>
                      {seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>메뉴 선택</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMenuItem}
                >
                  <Plus className="h-4 w-4" /> 메뉴 추가
                </Button>
              </div>

              {formData.menuItems.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`menu-${index}`} className="sr-only">
                      메뉴
                    </Label>
                    <Select
                      value={item.name}
                      onValueChange={(value) =>
                        handleMenuItemChange(index, "name", value)
                      }
                    >
                      <SelectTrigger id={`menu-${index}`}>
                        <SelectValue placeholder="메뉴 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMenuItems.map((menuItem) => (
                          <SelectItem key={menuItem.name} value={menuItem.name}>
                            {menuItem.name} ({menuItem.price.toLocaleString()}
                            원)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20">
                    <Label htmlFor={`quantity-${index}`} className="sr-only">
                      수량
                    </Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleMenuItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMenuItem(index)}
                    disabled={formData.menuItems.length <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="text-right font-semibold">
              총 가격:{" "}
              {calculateTotalPrice(
                formData.menuItems.map((item) => ({ ...item })),
              ).toLocaleString()}{" "}
              원
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSubmitReservation}>
              예약 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
