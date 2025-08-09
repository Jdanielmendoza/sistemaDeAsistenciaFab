"use client";

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, ClipboardList, AlertCircle } from "lucide-react";

import { useEffect, useState } from "react";
// Existing components with dummy data
import { AttendanceStats } from "@/components/attendance-stats";
import { VolunteerAttendanceTable } from "@/components/volunteer-attendance-table";

interface DashboardSummary {
  totalVolunteers: number;
  presentVolunteers: number;
  hoursWorkedToday: number; // in hours
  unassignedCards: number;
}

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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(errorData.error || "Error al cargar el resumen");
        }
        const data: DashboardSummary = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const cards = summary
    ? [
        {
          title: "Voluntarios totales",
          value: summary.totalVolunteers.toString(),
          description: "Registrados en el sistema",
          icon: <Users className="h-4 w-4 text-primary" />,
        },
        {
          title: "Voluntarios presentes",
          value: summary.presentVolunteers.toString(),
          description: "Actualmente dentro del FabLab",
          icon: <UserCheck className="h-4 w-4 text-green-500" />,
        },
        {
          title: "Horas trabajadas hoy",
          value: summary.hoursWorkedToday.toFixed(1),
          description: "Total acumulado (HH)",
          icon: <Clock className="h-4 w-4 text-blue-500" />,
        },
        {
          title: "Tarjetas sin asignar",
          value: summary.unassignedCards.toString(),
          description: "RFID disponibles",
          icon: <ClipboardList className="h-4 w-4 text-amber-500" />,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-4">
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : cards.length > 0 ? (
          cards.map((item) => <SummaryCard key={item.title} {...item} />)
        ) : (
          <div className="col-span-4 text-center text-sm text-muted-foreground">No hay datos disponibles</div>
        )}
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
