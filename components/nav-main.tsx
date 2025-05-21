"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

export function NavMain() {
  const router = useRouter();
  const [openDocuments, setOpenDocuments] = useState(false);

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
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setOpenDocuments((prev) => !prev)}
          >
            <span>자료실</span>
            <ChevronRight
              style={{
                transition: "transform 0.2s",
                transform: openDocuments ? "rotate(90deg)" : "rotate(0deg)",
              }}
              className="ml-1 size-4"
            />
          </SidebarMenuButton>
          {openDocuments && (
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/corp");
                  }}
                >
                  법인
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/restaurant");
                  }}
                >
                  청년식당
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/bazaar");
                  }}
                >
                  바자울
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/foodcare");
                  }}
                >
                  먹거리돌봄 센터
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          )}
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
