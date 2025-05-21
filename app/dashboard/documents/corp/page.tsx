// 법인 자료실 페이지
import React from "react";

// 더미 게시글 데이터
const dummyPosts = [
  { id: 1, title: "2024년 6월 회의록", author: "홍길동", date: "2024-06-01" },
  { id: 2, title: "법인 정관 변경 안내", author: "이순신", date: "2024-05-28" },
  { id: 3, title: "5월 업무 보고서", author: "김유신", date: "2024-05-20" },
];

export default function CorpDocumentsPage() {
  return (
    <div>
      {/* 법인 자료실 페이지 */}
      <h1>법인 자료실</h1>
      <p>이곳은 법인 자료실입니다.</p>

      {/* 게시글 목록 테이블 */}
      <div className="mt-8">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">제목</th>
              <th className="border px-4 py-2">작성자</th>
              <th className="border px-4 py-2">날짜</th>
            </tr>
          </thead>
          <tbody>
            {dummyPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{post.title}</td>
                <td className="border px-4 py-2">{post.author}</td>
                <td className="border px-4 py-2">{post.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
