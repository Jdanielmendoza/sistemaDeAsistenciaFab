"use client";

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, ClipboardList } from "lucide-react";

// Existing components with dummy data
import { AttendanceStats } from "@/components/attendance-stats";
import { VolunteerAttendanceTable } from "@/components/volunteer-attendance-table";

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, description, icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardHome() {
  // ---- Datos ficticios basados en el esquema de la BD ----
  const summary = [
    {
      title: "Voluntarios totales",
      value: "120",
      description: "Registrados en el sistema",
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Voluntarios presentes",
      value: "15",
      description: "Actualmente dentro del FabLab",
      icon: <UserCheck className="h-4 w-4 text-green-500" />,
    },
    {
      title: "Horas trabajadas hoy",
      value: "96",
      description: "Total acumulado (HH)",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    {
      title: "Tarjetas sin asignar",
      value: "8",
      description: "RFID disponibles",
      icon: <ClipboardList className="h-4 w-4 text-amber-500" />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </div>

      {/* Gráficos y métricas de asistencia */}
      <AttendanceStats />

      {/* Registros recientes */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Registros recientes</h2>
        <VolunteerAttendanceTable />
      </div>
    </div>
  );
}
