"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Home,
  Users,
  Clock,
} from "lucide-react"

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
        { title: "Inicio", url: "/dashboard" },
        { title: "Estadísticas", url: "/dashboard/estadisticas" },
      ],
    },
    {
      title: "Usuarios",
      url: "#",
      icon: Users,
      items: [
        { title: "Administradores", url: "/dashboard/admin" },
        { title: "Voluntarios", url: "/dashboard/volunteers" },
      ],
    },
    {
      title: "Asistencia",
      url: "#",
      icon: Clock,
      items: [
        { title: "Entradas/Salidas", url: "/dashboard/attendance-record" },
        { title: "Presentes ahora", url: "/dashboard/attendance-live" },
        {
          title: "Reportes",
          url: "#",
          items: [
            { title: "Diario", url: "/dashboard/attendance-reports/diario" },
            { title: "Semanal", url: "/dashboard/attendance-reports/semanal" },
            { title: "Mensual", url: "/dashboard/attendance-reports/mensual" },
          ],
        },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      icon: Settings2,
      items: [
        { title: "Horarios", url: "/dashboard/horarios" },
        { title: "Universidades", url: "/dashboard/universidades" },
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
