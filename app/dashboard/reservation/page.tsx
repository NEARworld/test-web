"use client";

import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Calendar from "@/components/calendar";
import {
  Plus,
  Minus,
  Check,
  X,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { ReservationStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

interface Reservation {
  id: string;
  groupName: string;
  totalPeople: number;
  dateTime: string;
  seatNumber: string;
  menuItems: MenuItem[];
  status: ReservationStatus;
  createdBy: {
    name: string;
  };
}

export default function ReservationPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableMenus, setAvailableMenus] = useState<
    { name: string; price: number; id: string }[]
  >([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "", message: "" });
  const [selectedReservation, setSelectedReservation] = useState<string | null>(
    null,
  );
  const [statusActionType, setStatusActionType] = useState<
    "confirm" | "cancel" | "complete" | null
  >(null);
  const [monthlyStats, setMonthlyStats] = useState([]);

  const [formData, setFormData] = useState({
    groupName: "",
    totalPeople: 2,
    time: "12:00",
    seatNumber: "A-1",
    menuItems: [{ name: "", price: 0, quantity: 1 }],
  });

  // Available seats and times (could be fetched from API in a real application)
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
    "09:00",
    "09:30",
    "10:00",
    "10:30",
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

  // Fetch reservations for the selected date
  const fetchReservations = async (date: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations?date=${date}`);
      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      showAlert("Error", "Failed to load reservations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available menu items
  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");

      const data = await response.json();
      setAvailableMenus(data.filter((item: any) => item.isAvailable));

      // Initialize form with first menu item if available
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          menuItems: [
            {
              name: data[0].name,
              price: data[0].price,
              quantity: 1,
            },
          ],
        }));
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // 월별 통계 데이터 가져오기
  const fetchMonthlyStats = async (date: string) => {
    try {
      const response = await fetch(
        `/api/reservations/stats/monthly?date=${date}`,
      );
      if (!response.ok) throw new Error("Failed to fetch monthly stats");
      const data = await response.json();
      setMonthlyStats(data.dailyStats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      showAlert("Error", "Failed to update calendar statistics");
    }
  };

  // Initial data load
  const loadInitialData = async () => {
    await Promise.all([fetchReservations(selectedDate), fetchMenuItems()]);
  };

  // Call loadInitialData on component mount
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    fetchMonthlyStats(currentDate);
    loadInitialData();
  }, []);

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
    fetchReservations(dateStr);
    fetchMonthlyStats(dateStr);
  };

  const handleAddReservation = () => {
    // Reset form data
    setFormData({
      groupName: "",
      totalPeople: 2,
      time: "12:00",
      seatNumber: "A-1",
      menuItems: [
        {
          name: availableMenus.length > 0 ? availableMenus[0].name : "",
          price: availableMenus.length > 0 ? availableMenus[0].price : 0,
          quantity: 1,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleSubmitReservation = async () => {
    try {
      setIsLoading(true);

      // Form validation
      if (!formData.groupName.trim()) {
        showAlert("Missing Information", "Please enter a group name.");
        return;
      }

      if (formData.totalPeople < 1) {
        showAlert(
          "Invalid Information",
          "Number of people must be at least 1.",
        );
        return;
      }

      if (formData.menuItems.some((item) => item.quantity < 1 || !item.name)) {
        showAlert("Invalid Menu", "Please check your menu items.");
        return;
      }

      // 한국 시간 기준으로 날짜와 시간 설정
      const korDateTime = new Date(`${selectedDate}T${formData.time}:00+09:00`);

      const reservationData = {
        groupName: formData.groupName,
        totalPeople: formData.totalPeople,
        dateTime: korDateTime.toISOString(), // 자동으로 UTC로 변환됨
        seatNumber: formData.seatNumber,
        menuItems: formData.menuItems,
        status: "CONFIRMED",
      };

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        throw new Error("Failed to create reservation");
      }

      // 예약 생성 성공 후:
      // 1. 해당 날짜의 예약 목록 새로고침
      await fetchReservations(selectedDate);

      // 2. 월별 통계 데이터 새로고침
      await fetchMonthlyStats(selectedDate);

      // 모달 닫기 및 성공 메시지
      setIsModalOpen(false);
      showAlert("Success", "Reservation created successfully!");
    } catch (error) {
      console.error("Error creating reservation:", error);
      showAlert("Error", "Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuItemChange = (index: number, field: string, value: any) => {
    const newMenuItems = [...formData.menuItems];

    if (field === "name") {
      const selectedItem = availableMenus.find((item) => item.name === value);
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
    if (availableMenus.length === 0) return;

    setFormData({
      ...formData,
      menuItems: [
        ...formData.menuItems,
        {
          name: availableMenus[0].name,
          price: availableMenus[0].price,
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

  const showAlert = (title: string, message: string) => {
    setAlertMessage({ title, message });
    setIsAlertOpen(true);
  };

  const handleStatusChange = (
    reservationId: string,
    action: "confirm" | "cancel" | "complete",
  ) => {
    setSelectedReservation(reservationId);
    setStatusActionType(action);
    setIsAlertOpen(true);

    let title, message;
    switch (action) {
      case "confirm":
        title = "Confirm Reservation";
        message = "Are you sure you want to confirm this reservation?";
        break;
      case "cancel":
        title = "Cancel Reservation";
        message = "Are you sure you want to cancel this reservation?";
        break;
      case "complete":
        title = "Complete Reservation";
        message = "Mark this reservation as completed?";
        break;
    }

    setAlertMessage({ title, message });
  };

  const confirmStatusChange = async () => {
    if (!selectedReservation || !statusActionType) return;

    try {
      setIsLoading(true);

      const newStatus =
        statusActionType === "confirm"
          ? "CONFIRMED"
          : statusActionType === "cancel"
            ? "CANCELED"
            : "COMPLETED";

      const response = await fetch(
        `/api/reservations/${selectedReservation}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update reservation status");
      }

      // Refresh reservations
      await fetchReservations(selectedDate);

      showAlert(
        "Status Updated",
        `Reservation has been ${newStatus.toLowerCase()} successfully.`,
      );
    } catch (error) {
      console.error("Error updating reservation status:", error);
      showAlert(
        "Error",
        "Failed to update reservation status. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setSelectedReservation(null);
      setStatusActionType(null);
    }
  };

  // Get a badge variant based on reservation status
  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return { variant: "default" as const, text: "확정됨" };
      case "PENDING":
        return { variant: "secondary" as const, text: "대기중" };
      case "CANCELED":
        return { variant: "destructive" as const, text: "취소됨" };
      case "COMPLETED":
        return { variant: "default" as const, text: "완료됨" };
    }
  };

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
    const statusBadge = getStatusBadge(reservation.status);

    return (
      <Card className="relative">
        <CardHeader>
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>{reservation.groupName}</CardTitle>
              <div className="flex gap-2">
                <Badge
                  variant={statusBadge.variant}
                  className={
                    reservation.status === "COMPLETED"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
            <Badge variant="secondary" className="absolute top-4 right-4">
              {formatDateTime(reservation.dateTime)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>인원: {reservation.totalPeople}명</p>
          <p>예약석: {reservation.seatNumber}</p>
          <div>
            <p className="font-medium">예약 메뉴:</p>
            <ul className="list-disc pl-5">
              {reservation.menuItems.map((item, idx) => (
                <li key={idx}>
                  {item.name} - {item.quantity}개 ({item.price.toLocaleString()}
                  원)
                </li>
              ))}
            </ul>
          </div>
          <p className="text-right font-semibold">
            총 가격:{" "}
            {calculateTotalPrice(reservation.menuItems).toLocaleString()} 원
          </p>

          {/* Status management buttons */}
          {reservation.status !== "CANCELED" &&
            reservation.status !== "COMPLETED" && (
              <div className="mt-4 flex justify-end gap-2">
                {reservation.status === "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusChange(reservation.id, "confirm")
                    }
                  >
                    <Check className="mr-1 h-4 w-4" /> 확정
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(reservation.id, "complete")}
                >
                  <Check className="mr-1 h-4 w-4" /> 완료
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(reservation.id, "cancel")}
                >
                  <X className="mr-1 h-4 w-4" /> 취소
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  // Filter reservations for lunch and dinner
  const lunchReservations = reservations.filter((r) => {
    const hour = new Date(r.dateTime).getHours();
    return hour < 17; // 5PM 이전은 점심으로 간주
  });

  const dinnerReservations = reservations.filter((r) => {
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
                <Button
                  onClick={handleAddReservation}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" /> 예약하기
                </Button>
              </div>
              <Calendar
                monthlyStats={monthlyStats}
                onDateSelect={handleDateSelect}
                initialYear={new Date().getFullYear()}
                initialMonth={new Date().getMonth()}
              />
            </div>
          </section>

          {/* 선택한 날짜의 예약 섹션 - 달력 아래 배치 */}
          <section className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {formatDisplayDate(selectedDate)}의 예약
                {isLoading && (
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                )}
              </h2>
            </div>

            <div className="rounded-lg border bg-white">
              <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
                {/* 점심 예약 섹션 */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-blue-600">
                    점심 예약
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>예약자</TableHead>
                        <TableHead>인원</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : lunchReservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex justify-center py-4 text-gray-500">
                              점심 예약이 없습니다.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lunchReservations.map((reservation) => (
                          <ReservationRow
                            key={reservation.id}
                            reservation={reservation}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 저녁 예약 섹션 */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-orange-600">
                    저녁 예약
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>예약자</TableHead>
                        <TableHead>인원</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : dinnerReservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="flex justify-center py-4 text-gray-500">
                              저녁 예약이 없습니다.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dinnerReservations.map((reservation) => (
                          <ReservationRow
                            key={reservation.id}
                            reservation={reservation}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                  disabled={availableMenus.length === 0}
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
                        {availableMenus.map((menuItem) => (
                          <SelectItem key={menuItem.id} value={menuItem.name}>
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
                          parseInt(e.target.value) || 1,
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
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReservation}
              disabled={isLoading}
            >
              {isLoading ? "처리 중..." : "예약 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for confirmations and notifications */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusActionType ? alertMessage.title : alertMessage.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusActionType ? alertMessage.message : alertMessage.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {statusActionType ? (
              <>
                <AlertDialogCancel
                  onClick={() => {
                    setSelectedReservation(null);
                    setStatusActionType(null);
                  }}
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmStatusChange}>
                  확인
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction>확인</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 예약 행 컴포넌트
function ReservationRow({
  reservation,
  onStatusChange,
}: {
  reservation: Reservation;
  onStatusChange: (
    id: string,
    action: "confirm" | "cancel" | "complete",
  ) => void;
}) {
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

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return { variant: "default" as const, text: "확정됨" };
      case "PENDING":
        return { variant: "secondary" as const, text: "대기중" };
      case "CANCELED":
        return { variant: "destructive" as const, text: "취소됨" };
      case "COMPLETED":
        return { variant: "default" as const, text: "완료됨" };
    }
  };

  const statusBadge = getStatusBadge(reservation.status);

  return (
    <TableRow>
      <TableCell>{formatDateTime(reservation.dateTime)}</TableCell>
      <TableCell>{reservation.groupName}</TableCell>
      <TableCell>{reservation.totalPeople}명</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8">
              <div className="flex items-center gap-1">
                <Badge
                  variant={statusBadge.variant}
                  className={
                    reservation.status === "COMPLETED"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  {statusBadge.text}
                </Badge>
                <ChevronDown className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {reservation.status !== "CONFIRMED" && (
              <DropdownMenuItem
                onClick={() => onStatusChange(reservation.id, "confirm")}
              >
                <Check className="mr-2 h-4 w-4" /> 확정
              </DropdownMenuItem>
            )}
            {reservation.status !== "COMPLETED" && (
              <DropdownMenuItem
                onClick={() => onStatusChange(reservation.id, "complete")}
              >
                <Check className="mr-2 h-4 w-4" /> 완료
              </DropdownMenuItem>
            )}
            {reservation.status !== "CANCELED" && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onStatusChange(reservation.id, "cancel")}
              >
                <X className="mr-2 h-4 w-4" /> 취소
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>예약 상세</DropdownMenuItem>
            <DropdownMenuItem>예약 수정</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
