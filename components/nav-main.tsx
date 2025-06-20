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
import Link from "next/link";
import { useSession } from "next-auth/react";

export function NavMain() {
  const router = useRouter();
  const [openDocuments, setOpenDocuments] = useState(true);
  const { data: session } = useSession();

  const userRole = session?.user?.role as string | undefined;
  const userPosition = session?.user?.position as string | undefined;

  const canViewAdminPage = userRole === "ADMIN" || userPosition === "CEO";

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>청소년자립학교</SidebarGroupLabel> */}
      <SidebarMenu>
        {/* <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"업무 관리"}
            className="cursor-pointer"
            onClick={() => router.replace("/dashboard/tasks")}
          >
            <Users />
            <span>업무 관리</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
        {canViewAdminPage && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={"관리자 페이지"}
              className="flex cursor-pointer items-center justify-between"
              asChild
            >
              <Link href="/dashboard/admin">
                <span>관리자 페이지</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
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
                    router.replace("/dashboard/documents/bajaul");
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
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/community");
                  }}
                >
                  공동모금회
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.replace("/dashboard/documents/other");
                  }}
                >
                  기타
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
        {/* {session?.user.role === "ADMIN" && ( */}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={"전자 결재"}
            className="flex cursor-pointer items-center justify-between"
            asChild
          >
            <Link href="/dashboard/approvals">
              <span>전자 결재</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/* )} */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
