"use client";

import * as React from "react";
import Image from "next/image";
// import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";

const data = {
  navMain: [
    // {
    //   title: "홈",
    //   url: "/",
    // },
    // {
    //   title: "소개",
    //   url: "/about",
    // },
  ],
};

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center">
        <div className="rounded-md bg-yellow-400">
          <Image src="/logo.png" alt="logo" width={30} height={30} />
        </div>
        <span className="text-sm">사회적 협동조합 청소년자립학교</span>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
