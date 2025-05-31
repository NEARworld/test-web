import { Department, JobPosition, UserStatus } from "@prisma/client";

export type UserStatusKorean = "재직중" | "비활성" | "휴직" | "퇴사";

export type UserJobPositionKorean =
  | "직원"
  | "팀장"
  | "사무국장"
  | "대표"
  | "이사장"
  | "미정";

export type UserDepartmentKorean =
  | "바자울"
  | "청년식당"
  | "먹거리 돌봄 센터"
  | "미정";

export function convertUserDepartmentToKorean(
  department: Department,
): UserDepartmentKorean {
  switch (department) {
    case Department.BAZAUL:
      return "바자울";
    case Department.YOUTH_RESTAURANT:
      return "청년식당";
    case Department.FOOD_CARE_CENTER:
      return "먹거리 돌봄 센터";
    default:
      return "미정";
  }
}

export function convertUserJobPositionToKorean(
  position: JobPosition,
): UserJobPositionKorean {
  switch (position) {
    case JobPosition.STAFF:
      return "직원";
    case JobPosition.TEAM_LEADER:
      return "팀장";
    case JobPosition.GENERAL_SECRETARY:
      return "사무국장";
    case JobPosition.CHAIRPERSON:
      return "대표";
    case JobPosition.CEO:
      return "이사장";
    default:
      return "미정";
  }
}
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
