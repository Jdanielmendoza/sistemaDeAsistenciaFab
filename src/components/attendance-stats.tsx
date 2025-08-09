"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, UserX, Clock, Users, CalendarClock, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TodayChartItem { hora: string; entradas: number; salidas: number }
interface WeekChartItem { name: string; entradas: number; salidas: number }
interface MonthChartItem { semana: string; entradas: number; salidas: number }

export function AttendanceStats() {
  const [todayData, setTodayData] = useState<TodayChartItem[]>([]);
  const [weekData, setWeekData] = useState<WeekChartItem[]>([]);
  const [monthData, setMonthData] = useState<MonthChartItem[]>([]);
  const [todayStats, setTodayStats] = useState<{ asistencias: number; ausencias: number; horas_totales: number; horas_extras: number } | null>(null);
  const [weekStats, setWeekStats] = useState<{ entradas: number; salidas: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [todayRes, weekRes, monthRes] = await Promise.all([
          fetch("/api/attendance_stats?period=today"),
          fetch("/api/attendance_stats?period=week"),
          fetch("/api/attendance_stats?period=month"),
        ]);
        
        if (!todayRes.ok || !weekRes.ok || !monthRes.ok) {
          throw new Error("Error al cargar los datos de estadísticas");
        }
        
        if (todayRes.ok) {
          const t = await todayRes.json();
          setTodayData(t.chart || []);
          setTodayStats(t.stats || { asistencias: 0, ausencias: 0, horas_totales: 0, horas_extras: 0 });
        }
        if (weekRes.ok) {
          const w = await weekRes.json();
          setWeekData(w.chart || []);
          setWeekStats(w.stats || { entradas: 0, salidas: 0 });
        }
        if (monthRes.ok) {
          const m = await monthRes.json();
          console.log("Month data received:", m);
          setMonthData(m.chart || []);
        }
      } catch (err) {
        console.error("Error loading attendance stats:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Tabs defaultValue="today" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="today" disabled>Hoy</TabsTrigger>
            <TabsTrigger value="week" disabled>Esta Semana</TabsTrigger>
            <TabsTrigger value="month" disabled>Este Mes</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </Tabs>
    );
  }

  if (error) {
    return (
      <Tabs defaultValue="today" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="today" disabled>Hoy</TabsTrigger>
            <TabsTrigger value="week" disabled>Esta Semana</TabsTrigger>
            <TabsTrigger value="month" disabled>Este Mes</TabsTrigger>
          </TabsList>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    );
  }

  return (
    <Tabs defaultValue="today" className="space-y-4">
      <div className="flex justify-between">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="week">Esta Semana</TabsTrigger>
          <TabsTrigger value="month">Este Mes</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="today" className="space-y-4">
        {todayStats && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Asistencias"
                value={todayStats.asistencias.toString()}
                description="Voluntarios presentes hoy"
                icon={<UserCheck className="h-4 w-4 text-green-500" />}
              />
              <StatsCard
                title="Ausencias"
                value={todayStats.ausencias.toString()}
                description="Voluntarios ausentes hoy"
                icon={<UserX className="h-4 w-4 text-red-500" />}
              />
              <StatsCard
                title="Horas Totales"
                value={todayStats.horas_totales.toFixed(1)}
                description="Horas acumuladas hoy"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Horas Extras"
                value={todayStats.horas_extras.toFixed(1)}
                description="Horas extras acumuladas"
                icon={<Clock className="h-4 w-4 text-amber-500" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Asistencia por Hora</CardTitle>
                <CardDescription>Distribución de entradas y salidas durante el día</CardDescription>
              </CardHeader>
              <CardContent>
                {todayData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={todayData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="entradas" fill="hsl(var(--primary))" name="Entradas" />
                      <Bar dataKey="salidas" fill="hsl(var(--muted))" name="Salidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos de asistencia para hoy</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="week" className="space-y-4">
        {weekStats && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Entradas"
                value={weekStats.entradas.toString()}
                description="Entradas registradas"
                icon={<UserCheck className="h-4 w-4 text-green-500" />}
              />
              <StatsCard
                title="Salidas"
                value={weekStats.salidas.toString()}
                description="Salidas registradas"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Promedio Diario"
                value="-"
                description="Voluntarios por día"
                icon={<Users className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Horas Extras"
                value="-"
                description="Horas extras acumuladas"
                icon={<Clock className="h-4 w-4 text-amber-500" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Asistencia Semanal</CardTitle>
                <CardDescription>Comparativa de asistencias y ausencias por día</CardDescription>
              </CardHeader>
              <CardContent>
                {weekData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="entradas" fill="hsl(var(--primary))" name="Entradas" />
                      <Bar dataKey="salidas" fill="hsl(var(--secondary))" name="Salidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos de asistencia para esta semana</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="month" className="space-y-4">
        {monthData.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Entradas"
                value={monthData.reduce((s, d) => s + d.entradas, 0).toString()}
                description="Entradas este mes"
                icon={<UserCheck className="h-4 w-4 text-green-500" />}
              />
              <StatsCard
                title="Salidas"
                value={monthData.reduce((s, d) => s + d.salidas, 0).toString()}
                description="Salidas registradas"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Horas Totales"
                value="-"
                description="Horas acumuladas"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Promedio Diario"
                value={monthData.length > 0 ? (monthData.reduce((s, d) => s + d.entradas, 0) / monthData.length).toFixed(1) : "0"}
                description="Voluntarios por semana"
                icon={<CalendarClock className="h-4 w-4 text-amber-500" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Evolución de asistencias durante el mes</CardDescription>
              </CardHeader>
              <CardContent>
                {monthData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="semana" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="entradas" fill="hsl(var(--primary))" name="Entradas" />
                      <Bar dataKey="salidas" fill="hsl(var(--secondary))" name="Salidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos de asistencia para este mes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Entradas"
                value="0"
                description="Entradas este mes"
                icon={<UserCheck className="h-4 w-4 text-green-500" />}
              />
              <StatsCard
                title="Salidas"
                value="0"
                description="Salidas registradas"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Horas Totales"
                value="0"
                description="Horas acumuladas"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatsCard
                title="Promedio Diario"
                value="0"
                description="Voluntarios por semana"
                icon={<CalendarClock className="h-4 w-4 text-amber-500" />}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Evolución de asistencias durante el mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">No hay datos de asistencia para este mes</p>
                    <p className="text-xs text-muted-foreground">Los datos aparecerán cuando haya registros de asistencia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
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

