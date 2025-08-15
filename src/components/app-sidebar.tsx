"use client"

import * as React from "react"
import { Home, Users, Clock, Settings2, IdCard, GraduationCap, UserPlus, CalendarCheck, BarChart2 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useEffect, useState } from "react";

function DynamicNavUser() {
  const [user, setUser] = useState(placeholderUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            name: parsed.name ?? placeholderUser.name,
            email: parsed.email ?? placeholderUser.email,
            avatar: "/avatars/shadcn.jpg",
          });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return <NavUser user={user} />;
}

const placeholderUser = {
  name: "Usuario",
  email: "usuario@example.com",
  avatar: "/avatars/shadcn.jpg",
};

const data = {
  teams: [],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: Home,
      items: [
        { title: "Inicio", url: "/dashboard", icon: BarChart2 },
      ],
    },
    {
      title: "Voluntarios",
      url: "#",
      icon: Users,
      items: [
        { title: "Listado", url: "/dashboard/volunteers", icon: Users },
        { title: "Agregar", url: "/dashboard/volunteers/create", icon: UserPlus },
        { title: "Tarjetas RFID", url: "/dashboard/rfidCards", icon: IdCard },
      ],
    },
    {
      title: "Asistencia",
      url: "#",
      icon: Clock,
      items: [
        { title: "Registros", url: "/dashboard/attendance-record", icon: CalendarCheck },
        { title: "Estadísticas", url: "/dashboard/attendance-stats", icon: BarChart2 },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      icon: Settings2,
      items: [
        { title: "Horarios", url: "/dashboard/horarios", icon: Clock },
        { title: "Universidades", url: "/dashboard/universidades", icon: GraduationCap },
      ],
    },
  ],
 /*  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ], */
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <DynamicNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
