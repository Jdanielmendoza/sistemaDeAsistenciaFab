"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, UserX, Clock, Users, CalendarClock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Datos de ejemplo para el gráfico
const weeklyData = [
  { name: "Lun", asistencias: 12, ausencias: 3 },
  { name: "Mar", asistencias: 15, ausencias: 2 },
  { name: "Mié", asistencias: 10, ausencias: 5 },
  { name: "Jue", asistencias: 14, ausencias: 1 },
  { name: "Vie", asistencias: 13, ausencias: 2 },
  { name: "Sáb", asistencias: 8, ausencias: 1 },
  { name: "Dom", asistencias: 5, ausencias: 0 },
]

export function AttendanceStats() {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Asistencias"
            value="12"
            description="Voluntarios presentes hoy"
            icon={<UserCheck className="h-4 w-4 text-green-500" />}
          />
          <StatsCard
            title="Ausencias"
            value="3"
            description="Voluntarios ausentes hoy"
            icon={<UserX className="h-4 w-4 text-red-500" />}
          />
          <StatsCard
            title="Horas Totales"
            value="96"
            description="Horas acumuladas hoy"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
          />
          <StatsCard
            title="Horas Extras"
            value="8"
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
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { hora: "8:00", entradas: 3, salidas: 0 },
                    { hora: "9:00", entradas: 5, salidas: 0 },
                    { hora: "10:00", entradas: 2, salidas: 1 },
                    { hora: "11:00", entradas: 1, salidas: 0 },
                    { hora: "12:00", entradas: 0, salidas: 2 },
                    { hora: "13:00", entradas: 0, salidas: 1 },
                    { hora: "14:00", entradas: 1, salidas: 0 },
                    { hora: "15:00", entradas: 0, salidas: 0 },
                    { hora: "16:00", entradas: 0, salidas: 3 },
                    { hora: "17:00", entradas: 0, salidas: 4 },
                    { hora: "18:00", entradas: 0, salidas: 5 },
                  ]}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
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
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="week" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Asistencias"
            value="77"
            description="Voluntarios esta semana"
            icon={<UserCheck className="h-4 w-4 text-green-500" />}
          />
          <StatsCard
            title="Ausencias"
            value="14"
            description="Voluntarios ausentes"
            icon={<UserX className="h-4 w-4 text-red-500" />}
          />
          <StatsCard
            title="Promedio Diario"
            value="11"
            description="Voluntarios por día"
            icon={<Users className="h-4 w-4 text-blue-500" />}
          />
          <StatsCard
            title="Horas Extras"
            value="24"
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="asistencias" fill="hsl(var(--primary))" name="Asistencias" />
                  <Bar dataKey="ausencias" fill="hsl(var(--destructive))" name="Ausencias" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="month" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Asistencias"
            value="312"
            description="Voluntarios este mes"
            icon={<UserCheck className="h-4 w-4 text-green-500" />}
          />
          <StatsCard
            title="Ausencias"
            value="48"
            description="Voluntarios ausentes"
            icon={<UserX className="h-4 w-4 text-red-500" />}
          />
          <StatsCard
            title="Horas Totales"
            value="2496"
            description="Horas acumuladas"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
          />
          <StatsCard
            title="Promedio Diario"
            value="10.4"
            description="Voluntarios por día"
            icon={<CalendarClock className="h-4 w-4 text-amber-500" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Evolución de asistencias durante el mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { semana: "Semana 1", asistencias: 78, ausencias: 12 },
                    { semana: "Semana 2", asistencias: 82, ausencias: 10 },
                    { semana: "Semana 3", asistencias: 77, ausencias: 14 },
                    { semana: "Semana 4", asistencias: 75, ausencias: 12 },
                  ]}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="asistencias" fill="hsl(var(--primary))" name="Asistencias" />
                  <Bar dataKey="ausencias" fill="hsl(var(--destructive))" name="Ausencias" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
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
  )
}

