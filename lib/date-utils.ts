/**
 * 날짜와 시간 포매팅 유틸리티 함수
 * @param dateTime 날짜 시간 문자열 또는 Date 객체
 * @param options 포맷 옵션
 * @returns 포맷된 날짜 문자열
 */
export function formatDateTime(
  dateTime: string | Date,
  options: {
    includeWeekday?: boolean;
    includeTime?: boolean;
    monthFormat?: "long" | "numeric" | "2-digit";
  } = { includeWeekday: true, includeTime: true, monthFormat: "numeric" },
): string {
  const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // 기본 날짜 포맷 (월, 일)
  let formatted = `${month}월 ${day}일`;

  // 요일 추가 옵션
  if (options.includeWeekday) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    formatted += ` (${weekday})`;
  }

  // 시간 추가 옵션
  if (options.includeTime) {
    formatted += ` ${hours}:${minutes}`;
  }

  return formatted;
}

/**
 * 날짜 문자열을 Date 객체로 변환
 * @param date 날짜 문자열
 * @returns Date 객체
 */
export function getKSTfromUTC(utcDate: Date): Date {
  const date = new Date(utcDate);
  // KST 기준으로 하루 더한 날짜 계산
  return new Date(date.setDate(date.getDate() + 1));
}

/**
 * ISO 형식 날짜 문자열로 변환 (YYYY-MM-DD)
 * @param date Date 객체 또는 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function toISODateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * 가격 포맷팅
 * @param price 가격
 * @param currency 통화 (기본: 원)
 * @returns 포맷된 가격 문자열
 */
export function formatPrice(price: number, currency: string = "원"): string {
  return `${price.toLocaleString()} ${currency}`;
}
