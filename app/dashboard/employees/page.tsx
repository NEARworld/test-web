// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { MoreHorizontal, Search } from "lucide-react";
// import { User } from "@prisma/client";
// import prisma from "@/lib/prisma";

// // Helper function to format date (optional, but good practice)
// function formatDate(date: Date | null): string {
//   if (!date) return "N/A"; // Or return an empty string or placeholder
//   // Example: 'YYYY-MM-DD' format. Adjust 'ko-KR' and options as needed.
//   // return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
//   return date.toISOString().split("T")[0]; // Simpler YYYY-MM-DD
// }

// export default async function EmployeesPage() {
//   // Fetch employee data from the database
//   let employees: User[] = [];
//   try {
//     employees = await prisma.user.findMany({
//       // Add ordering if needed, e.g., by name or hire date
//       orderBy: {
//         name: "asc", // Sort alphabetically by name
//       },
//       // You could add 'where' clauses here later for filtering
//     });
//   } catch (error) {
//     console.error("Database Error: Failed to fetch employees.", error);
//     // Handle the error appropriately, maybe show an error message component
//     // For now, we'll proceed with an empty array, but a real app should be more robust.
//   }

//   return (
//     <div className="container mx-auto py-8">
//       {/* ---------------- 페이지 헤더 ---------------- */}
//       <div className="mb-8 flex items-center justify-between">
//         <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
//       </div>

//       {/* ---------------- 검색 & 필터 ---------------- */}
//       <div className="mb-6 flex gap-4">
//         <div className="relative flex-1">
//           <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
//           <Input placeholder="직원 검색..." className="pl-8" />
//         </div>

//         <Select>
//           <SelectTrigger className="w-[180px]">
//             <SelectValue placeholder="부서 선택" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">전체 부서</SelectItem>
//             <SelectItem value="dev">개발팀</SelectItem>
//             <SelectItem value="sales">영업팀</SelectItem>
//             <SelectItem value="hr">인사팀</SelectItem>
//           </SelectContent>
//         </Select>

//         <Select>
//           <SelectTrigger className="w-[180px]">
//             <SelectValue placeholder="직급 선택" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">전체 직급</SelectItem>
//             <SelectItem value="staff">사원</SelectItem>
//             <SelectItem value="senior">대리</SelectItem>
//             <SelectItem value="manager">과장</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* ---------------- 직원 테이블 ---------------- */}
//       <div className="rounded-lg border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>이름</TableHead>
//               <TableHead>부서</TableHead>
//               <TableHead>직급</TableHead>
//               <TableHead>입사일</TableHead>
//               <TableHead>연락처</TableHead>
//               <TableHead className="w-[80px]">작업</TableHead>{" "}
//               {/* Added label */}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {employees.length > 0 ? (
//               employees.map((employee) => (
//                 <TableRow key={employee.id}>
//                   {" "}
//                   {/* Use unique ID as key */}
//                   <TableCell className="font-medium">{employee.name}</TableCell>
//                   {/* Use '??' for nullish coalescing to provide default values */}
//                   <TableCell>{employee. ?? "미지정"}</TableCell>
//                   <TableCell>{employee.role ?? "미지정"}</TableCell>
//                   <TableCell>{formatDate(employee.hireDate)}</TableCell>{" "}
//                   {/* Format the date */}
//                   <TableCell>{employee.phoneNumber ?? "없음"}</TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" className="h-8 w-8 p-0">
//                           <span className="sr-only">Open menu</span>{" "}
//                           {/* Accessibility */}
//                           <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuLabel>작업</DropdownMenuLabel>
//                         {/* These actions need client-side logic or links */}
//                         {/* Example: Link to detail page */}
//                         {/* <DropdownMenuItem asChild><Link href={`/employees/${employee.id}`}>상세 보기</Link></DropdownMenuItem> */}
//                         <DropdownMenuItem>상세 보기</DropdownMenuItem>
//                         <DropdownMenuItem>수정</DropdownMenuItem>
//                         <DropdownMenuItem className="text-red-600">
//                           삭제
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               // Display when no employees are found
//               <TableRow>
//                 <TableCell colSpan={6} className="h-24 text-center">
//                   등록된 직원이 없습니다.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {/* ---------------- 페이지네이션 ---------------- */}
//       <div className="flex items-center justify-center space-x-2 py-4">
//         <Button variant="outline" size="sm">
//           이전
//         </Button>
//         <Button
//           variant="outline"
//           size="sm"
//           className="bg-primary text-primary-foreground"
//         >
//           1
//         </Button>
//         <Button variant="outline" size="sm">
//           2
//         </Button>
//         <Button variant="outline" size="sm">
//           3
//         </Button>
//         <Button variant="outline" size="sm">
//           다음
//         </Button>
//       </div>
//     </div>
//   );
// }
