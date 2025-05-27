import { TableFromApi, CARD_SIZE } from "@/types/tables";

export function useTables(
  tables: TableFromApi[],
  setTables: React.Dispatch<React.SetStateAction<TableFromApi[]>>,
  selectedTables: string[],
  gridSize: number,
) {
  // 테이블 추가 함수
  const addTable = () => {
    const newPosition = findAvailablePosition(tables);

    // 새 테이블 객체 생성 - 여기서는 ID를 서버에서 생성하도록 함
    const newTable: Omit<TableFromApi, "id"> = {
      seats: 4, // 기본값으로 4인석 설정
      number: tables.length + 1,
      positionX: Math.round(newPosition.x / gridSize) * gridSize,
      positionY: Math.round(newPosition.y / gridSize) * gridSize,
    };

    // 서버에 새 테이블 저장
    fetch("/api/tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTable),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("테이블 추가에 실패했습니다");
        }
        return response.json();
      })
      .then((data) => {
        console.log("테이블이 데이터베이스에 저장되었습니다:", data);
        // 서버 응답으로 받은 데이터(서버에서 생성된 ID 포함)로 테이블을 추가
        setTables((prevTables) => [...prevTables, data]);
      })
      .catch((error) => {
        console.error("테이블 저장 중 오류 발생:", error);
        alert("테이블 저장에 실패했습니다: " + error.message);
      });
  };

  // 테이블 삭제 함수
  const handleDeleteConfirm = (
    selectedIds: string[],
    setTablesCallback: React.Dispatch<React.SetStateAction<TableFromApi[]>>,
    setSelectedTablesCallback: React.Dispatch<React.SetStateAction<string[]>>,
    setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const deletedIds = [...selectedIds];

    const deletePromises = deletedIds.map((id) =>
      fetch(`/api/tables/${id}`, {
        method: "DELETE",
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete table with ID: ${id}`);
        }
        return response.json();
      }),
    );

    Promise.all(deletePromises)
      .then(() => {
        setTablesCallback((prevTables) =>
          prevTables.filter((table) => !deletedIds.includes(table.id)),
        );
        setSelectedTablesCallback([]);
        setIsDeleteDialogOpen(false);
      })
      .catch((error) => {
        console.error("테이블 삭제 중 오류 발생:", error);
        setIsDeleteDialogOpen(false);
      });
  };

  // 테이블 비어있는 위치 찾기
  const findAvailablePosition = (existingTables: TableFromApi[]) => {
    const position = { x: 0, y: 0 };
    let found = false;

    while (!found) {
      let hasCollision = false;

      for (const table of existingTables) {
        const distance = Math.sqrt(
          Math.pow(table.positionX - position.x, 2) +
            Math.pow(table.positionY - position.y, 2),
        );

        if (distance < gridSize) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        found = true;
      } else {
        position.x += gridSize;
        // 클라이언트 측 렌더링에서만 window 객체에 접근
        const maxWidth =
          typeof window !== "undefined" ? window.innerWidth - CARD_SIZE : 1000;
        if (position.x > maxWidth) {
          position.x = 0;
          position.y += gridSize;
        }
      }
    }

    return position;
  };

  // 테이블 정렬 함수 (Z-index 결정)
  const getSortedTables = () => {
    // 선택된 테이블을 가장 위에 표시할 수 있도록 복사 후 정렬
    return [...tables].sort((a, b) => {
      // 선택된 테이블이 가장 우선순위가 높음
      if (selectedTables.includes(a.id) && !selectedTables.includes(b.id)) {
        return 1; // a가 선택되어 있으면 나중에(위에) 렌더링
      }
      if (!selectedTables.includes(a.id) && selectedTables.includes(b.id)) {
        return -1; // b가 선택되어 있으면 나중에(위에) 렌더링
      }

      // 테이블 번호 정렬을 반대로 변경 - 번호가 큰 테이블이 위에 오도록
      return b.number - a.number;
    });
  };

  // 테이블 위치 업데이트 함수
  const updateTablePositionOnServer = (id: string, x: number, y: number) => {
    fetch("/api/tables", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        position: { x, y },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`테이블 ${id} 위치 업데이트에 실패했습니다`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("테이블 위치 업데이트 중 오류 발생:", error);
      });
  };

  return {
    addTable,
    handleDeleteConfirm,
    findAvailablePosition,
    getSortedTables,
    updateTablePositionOnServer,
  };
}
