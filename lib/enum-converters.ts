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
