export const jobPositionLabels = {
  STAFF: "사원",
  TEAM_LEADER: "팀장",
  GENERAL_SECRETARY: "사무국장",
  CHAIRPERSON: "이사장",
  CEO: "대표",
  UNKNOWN: "미지정",
} as const;

export type JobPosition = keyof typeof jobPositionLabels;
