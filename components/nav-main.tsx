"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

export function NavMain() {
  const router = useRouter();

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>청소년자립학교</SidebarGroupLabel> */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"업무 관리"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/tasks")}
          >
            {/* <Users /> */}
            <span>업무 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"자료실"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/documents")}
          >
            <span>자료실</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"종합"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard")}
          >
            {/* <Monitor /> */}
            <span>종합</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"식당 예약관리"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/reservation")}
          >
            {/* <NotebookText /> */}
            <span>예약 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"예약 통계"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/statistics")}
          >
            {/* <BarChart3 /> */}
            <span>예약 통계</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"예약 통계"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/employees")}
          >
            {/* <BarChart3 /> */}
            <span>직원 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/* <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"식당 재고관리"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/inventory")}
          >
            <Box />
            <span>재고 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"테이블 관리"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/tables")}
          >
            <span>테이블 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
