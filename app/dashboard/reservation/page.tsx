"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Calendar from "@/components/calendar";
import { Plus } from "lucide-react";

// 분리된 컴포넌트 및 유틸리티 함수들 임포트
import { ReservationRow } from "@/components/reservation/reservation-row";
import { ReservationDetailModal } from "@/components/reservation/reservation-detail-modal";
import { ReservationFormModal } from "@/components/reservation/form-modal";
import { StatusAlertDialog } from "@/components/reservation/status-alert-dialog";
import {
  Reservation,
  MenuData,
  ReservationFormData,
} from "@/components/reservation/types";
import {
  calculateTotalPrice,
  formatDisplayDate,
} from "@/components/reservation/utils";
import { Badge } from "@/components/ui/badge";

export default function ReservationPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservationDetail, setSelectedReservationDetail] =
    useState<Reservation | null>(null);
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

  const showAlert = useCallback((title: string, message: string) => {
    setAlertMessage({ title, message });
    setIsAlertOpen(true);
  }, []);

  // Fetch reservations for the selected date
  const fetchReservations = useCallback(
    async (date: string) => {
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
    },
    [showAlert],
  );

  // Fetch available menu items
  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");

      const data = await response.json();
      setAvailableMenus(data.filter((item: MenuData) => item.isAvailable));
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }, []);

  // 월별 통계 데이터 가져오기
  const fetchMonthlyStats = useCallback(
    async (date: string) => {
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
    },
    [showAlert],
  );

  // Call loadInitialData on component mount
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    fetchMonthlyStats(currentDate);

    const loadInitialData = async () => {
      await Promise.all([fetchReservations(selectedDate), fetchMenuItems()]);
    };

    loadInitialData();
  }, [fetchMonthlyStats, selectedDate, fetchReservations, fetchMenuItems]);

  const handleDateSelect = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    fetchReservations(dateStr);
    fetchMonthlyStats(dateStr);
  };

  const handleAddReservation = () => {
    setIsModalOpen(true);
  };

  const handleSubmitReservation = async (formData: ReservationFormData) => {
    try {
      setIsLoading(true);

      // Form validation
      if (!formData.groupName.trim()) {
        showAlert("Missing Information", "Please enter a group name.");
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

  const handleStatusChange = useCallback(
    (reservationId: string, action: "confirm" | "cancel" | "complete") => {
      setSelectedReservation(reservationId);
      setStatusActionType(action);

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
      setIsAlertOpen(true);
    },
    [],
  );

  const confirmStatusChange = useCallback(async () => {
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
  }, [
    selectedReservation,
    statusActionType,
    selectedDate,
    fetchReservations,
    showAlert,
  ]);

  // Filter reservations for lunch and dinner
  const lunchReservations = reservations.filter((r) => {
    const hour = new Date(r.dateTime).getHours();
    return hour < 17; // 5PM 이전은 점심으로 간주
  });

  const dinnerReservations = reservations.filter((r) => {
    const hour = new Date(r.dateTime).getHours();
    return hour >= 17; // 5PM 이후는 저녁으로 간주
  });

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservationDetail(reservation);
    setIsDetailModalOpen(true);
  };

  const handleAlertCancel = () => {
    setSelectedReservation(null);
    setStatusActionType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          {/* 상단 헤더 섹션 추가 */}
          <section className="w-full">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                예약 관리 시스템
              </h1>
              <p className="text-gray-500">
                날짜를 선택하여 예약 현황을 확인하고 관리하세요.
              </p>
            </div>
          </section>

          {/* 달력과 요약 통계 섹션 */}
          <section className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:col-span-2">
              {/* 상단 헤더와 예약 버튼 */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  예약 일정
                </h2>
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

            {/* 현재 선택 날짜 요약 정보 섹션 추가 */}
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                {formatDisplayDate(selectedDate)} 요약
              </h2>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 예약 통계 카드 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="text-sm font-medium text-blue-800">
                        점심 예약
                      </div>
                      <div className="mt-1 text-2xl font-bold text-blue-600">
                        {lunchReservations.length}건
                      </div>
                    </div>
                    <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                      <div className="text-sm font-medium text-orange-800">
                        저녁 예약
                      </div>
                      <div className="mt-1 text-2xl font-bold text-orange-600">
                        {dinnerReservations.length}건
                      </div>
                    </div>
                  </div>

                  {/* 예약 상태별 통계 */}
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-600">
                      예약 상태
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">확정됨</span>
                        <Badge variant="default" className="bg-blue-500">
                          {
                            reservations.filter((r) => r.status === "CONFIRMED")
                              .length
                          }
                          건
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">대기중</span>
                        <Badge variant="secondary">
                          {
                            reservations.filter((r) => r.status === "PENDING")
                              .length
                          }
                          건
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">취소됨</span>
                        <Badge variant="destructive">
                          {
                            reservations.filter((r) => r.status === "CANCELED")
                              .length
                          }
                          건
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">완료됨</span>
                        <Badge variant="default" className="bg-green-500">
                          {
                            reservations.filter((r) => r.status === "COMPLETED")
                              .length
                          }
                          건
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 오늘 총 매출 예상 */}
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-600">
                      총 매출 예상
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {reservations
                        .filter((r) => r.status !== "CANCELED")
                        .reduce(
                          (total, r) =>
                            total + calculateTotalPrice(r.menuItems),
                          0,
                        )
                        .toLocaleString()}
                      원
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 선택한 날짜의 예약 섹션 - 달력 아래 배치 */}
          <section className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {formatDisplayDate(selectedDate)}의 예약
                {isLoading && (
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 점심 예약 섹션 */}
              <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 p-3">
                  <h3 className="text-lg font-medium text-blue-700">
                    점심 예약 ({lunchReservations.length}건)
                  </h3>
                </div>
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>예약자</TableHead>
                        <TableHead className="hidden md:table-cell">
                          예약석
                        </TableHead>
                        <TableHead>인원</TableHead>
                        <TableHead className="hidden md:table-cell">
                          가격
                        </TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="md:hidden">
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                          <TableCell
                            colSpan={7}
                            className="hidden md:table-cell"
                          >
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : lunchReservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="md:hidden">
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <span className="mb-2 text-4xl">🍽️</span>
                              <span>점심 예약이 없습니다.</span>
                            </div>
                          </TableCell>
                          <TableCell
                            colSpan={7}
                            className="hidden md:table-cell"
                          >
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <span className="mb-2 text-4xl">🍽️</span>
                              <span>점심 예약이 없습니다.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lunchReservations.map((reservation) => (
                          <ReservationRow
                            key={reservation.id}
                            reservation={reservation}
                            onStatusChange={handleStatusChange}
                            onRowClick={handleReservationClick}
                            calculateTotalPrice={calculateTotalPrice}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 저녁 예약 섹션 */}
              <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="border-b border-orange-100 bg-orange-50 p-3">
                  <h3 className="text-lg font-medium text-orange-700">
                    저녁 예약 ({dinnerReservations.length}건)
                  </h3>
                </div>
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>예약자</TableHead>
                        <TableHead className="hidden md:table-cell">
                          예약석
                        </TableHead>
                        <TableHead>인원</TableHead>
                        <TableHead className="hidden md:table-cell">
                          가격
                        </TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="md:hidden">
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                          <TableCell
                            colSpan={7}
                            className="hidden md:table-cell"
                          >
                            <div className="flex justify-center py-4">
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : dinnerReservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="md:hidden">
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <span className="mb-2 text-4xl">🌙</span>
                              <span>저녁 예약이 없습니다.</span>
                            </div>
                          </TableCell>
                          <TableCell
                            colSpan={7}
                            className="hidden md:table-cell"
                          >
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <span className="mb-2 text-4xl">🌙</span>
                              <span>저녁 예약이 없습니다.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dinnerReservations.map((reservation) => (
                          <ReservationRow
                            key={reservation.id}
                            reservation={reservation}
                            onStatusChange={handleStatusChange}
                            onRowClick={handleReservationClick}
                            calculateTotalPrice={calculateTotalPrice}
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
      <ReservationFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedDate={selectedDate}
        availableMenus={availableMenus}
        availableSeats={availableSeats}
        availableTimes={availableTimes}
        isLoading={isLoading}
        onSubmit={handleSubmitReservation}
        formatDisplayDate={formatDisplayDate}
      />

      {/* 예약 상세 모달 */}
      <ReservationDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        reservation={selectedReservationDetail}
        calculateTotalPrice={calculateTotalPrice}
      />

      {/* 상태 변경 알림 대화 상자 */}
      <StatusAlertDialog
        isOpen={isAlertOpen}
        onOpenChange={setIsAlertOpen}
        title={alertMessage.title}
        message={alertMessage.message}
        onConfirm={statusActionType ? confirmStatusChange : () => {}}
        onCancel={handleAlertCancel}
        isStatusChange={!!statusActionType}
      />
    </div>
  );
}
