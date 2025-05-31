import { UserStatus } from "@prisma/client";

export type UserStatusKorean = "재직중" | "비활성" | "휴직" | "퇴사";

export function convertUserStatusToKorean(
  status: UserStatus,
): UserStatusKorean {
  switch (status) {
    case UserStatus.ACTIVE:
      return "재직중";
    case UserStatus.INACTIVE:
      return "비활성";
    case UserStatus.LEAVE:
      return "휴직";
    case UserStatus.RESIGNED:
      return "퇴사";
    default:
      return "알 수 없음" as never;
  }
}

export function getUserStatusKorean(status: UserStatus | undefined): {
  text: UserStatusKorean | "알 수 없음";
  className: string;
} {
  if (!status) {
    return { text: "알 수 없음", className: "bg-purple-100" };
  }

  const koreanStatus = convertUserStatusToKorean(status);

  let className = "";
  switch (status) {
    case UserStatus.ACTIVE:
      className += " bg-green-100";
      break;
    case UserStatus.LEAVE:
      className += " bg-yellow-100";
      break;
    case UserStatus.RESIGNED:
      className += " bg-red-100";
      break;
    case UserStatus.INACTIVE:
      className += " bg-gray-100";
      break;
  }

  return { text: koreanStatus, className };
}
