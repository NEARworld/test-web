// app/dashboard/page.tsx

export default function DashboardPage() {
  // 예시 데이터 (실제로는 API에서 가져올 수 있음)
  const reservations = {
    lunch: [
      {
        groupName: "김씨 가족",
        totalPeople: 4,
        dateTime: "2025-03-06 12:00",
        seatNumber: "A-1",
      },
      {
        groupName: "이씨 팀",
        totalPeople: 6,
        dateTime: "2025-03-06 13:00",
        seatNumber: "B-2",
      },
    ],
    dinner: [
      {
        groupName: "박씨 모임",
        totalPeople: 8,
        dateTime: "2025-03-06 18:30",
        seatNumber: "C-1",
      },
      {
        groupName: "최씨 친구들",
        totalPeople: 5,
        dateTime: "2025-03-06 19:00",
        seatNumber: "C-2",
      },
      {
        groupName: "정씨 동료",
        totalPeople: 3,
        dateTime: "2025-03-06 20:00",
        seatNumber: "D-1",
      },
    ],
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="container mx-auto flex h-full justify-center">
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
              {/* 점심 예약 섹션 */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">점심 예약</h2>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  {reservations.lunch.map((group, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 flex flex-col gap-2 rounded-xl p-4"
                    >
                      <h3 className="font-semibold">{group.groupName}</h3>
                      <p>인원: {group.totalPeople}명</p>
                      <p>예약 시간: {group.dateTime}</p>
                      <p>예약석: {group.seatNumber}</p>
                    </div>
                  ))}
                  {reservations.lunch.length === 0 && (
                    <p className="text-muted-foreground col-span-3">
                      현재 점심 예약이 없습니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 저녁 예약 섹션 */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">저녁 예약</h2>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  {reservations.dinner.map((group, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 flex flex-col gap-2 rounded-xl p-4"
                    >
                      <h3 className="font-semibold">{group.groupName}</h3>
                      <p>인원: {group.totalPeople}명</p>
                      <p>예약 시간: {group.dateTime}</p>
                      <p>예약석: {group.seatNumber}</p>
                    </div>
                  ))}
                  {reservations.dinner.length === 0 && (
                    <p className="text-muted-foreground col-span-3">
                      현재 저녁 예약이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
