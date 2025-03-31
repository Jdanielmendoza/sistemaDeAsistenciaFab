import { AttendanceRecordsTable } from "@/components/attendance-records-table"
import { AttendanceStats } from "@/components/attendance-stats"

export default function AttendanceRecordsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Registros de Asistencia</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza los registros de asistencia de los voluntarios del FabLab.
        </p>
      </div>

      <AttendanceStats />
      <AttendanceRecordsTable />
    </div>
  )
}

