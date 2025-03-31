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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Inicio",
          url: "/dashboard",
        },
        {
          title: "Estadísticas",
          url: "/dashboard/estadisticas",
        }
      ],
    },
    {
      title: "Gestión de Usuarios",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Administradores",
          url: "/dashboard/admin",
        },
        {
          title: "Voluntarios",
          url: "/dashboard/volunteers",
        },
      ],
    },
    {
      title: "Registros de Asistencia",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Ver Registros",
          url: "/dashboard/attendance-record",
        },
        {
          title: "Reportes Diarios",
          url: "/dashboard/attendance-reports",
        },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Roles y Permisos",
          url: "/dashboard/roles",
        },
        {
          title: "Tarjetas RFID",
          url: "/dashboard/rfidCards",
        },
        {
          title: "Universidades",
          url: "/dashboard/universidades",
        },
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
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
