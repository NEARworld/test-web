import { MenuItem } from "./types";
import { ReservationStatus } from "@prisma/client";

// 메뉴 항목의 총 가격을 계산하는 함수
export const calculateTotalPrice = (menu: MenuItem[]) => {
  return menu.reduce((total, item) => total + item.price * item.quantity, 0);
};

// 표시용 날짜 포맷팅 함수
export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
};

// 날짜 및 시간 포맷팅 함수
export const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday}) ${hours}:${minutes}`;
};

// 시간 포맷팅 함수
export const formatTime = (dateTime: string) => {
  const date = new Date(dateTime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 상태 표시 배지 스타일 결정 함수
export const getStatusBadge = (status: ReservationStatus) => {
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
