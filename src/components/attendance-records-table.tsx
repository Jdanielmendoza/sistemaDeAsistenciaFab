"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileIcon,
  Search,
  Edit,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Timer,
  AlarmClock,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import type { DateRange } from "react-day-picker"

// Tipos basados en la estructura de la base de datos
type User = {
  id_user: string
  name: string
  email: string
}

type AttendanceRecord = {
  id_record: string
  id_user: string
  user: User
  check_in_time: Date
  check_out_time: Date | null
  total_hours: string | null
  overtime_hours: string | null
}

// Datos de ejemplo
const attendanceRecords: AttendanceRecord[] = [
  {
    id_record: "1",
    id_user: "101",
    user: {
      id_user: "101",
      name: "Ana García",
      email: "ana.garcia@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 25, 9, 0),
    check_out_time: new Date(2024, 2, 25, 17, 0),
    total_hours: "08:00:00",
    overtime_hours: null,
  },
  {
    id_record: "2",
    id_user: "102",
    user: {
      id_user: "102",
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 25, 8, 30),
    check_out_time: new Date(2024, 2, 25, 18, 30),
    total_hours: "10:00:00",
    overtime_hours: "02:00:00",
  },
  {
    id_record: "3",
    id_user: "103",
    user: {
      id_user: "103",
      name: "María López",
      email: "maria.lopez@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 24, 9, 15),
    check_out_time: new Date(2024, 2, 24, 17, 15),
    total_hours: "08:00:00",
    overtime_hours: null,
  },
  {
    id_record: "4",
    id_user: "104",
    user: {
      id_user: "104",
      name: "Juan Martínez",
      email: "juan.martinez@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 24, 8, 45),
    check_out_time: new Date(2024, 2, 24, 16, 45),
    total_hours: "08:00:00",
    overtime_hours: null,
  },
  {
    id_record: "5",
    id_user: "105",
    user: {
      id_user: "105",
      name: "Laura Sánchez",
      email: "laura.sanchez@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 23, 9, 30),
    check_out_time: new Date(2024, 2, 23, 18, 30),
    total_hours: "09:00:00",
    overtime_hours: "01:00:00",
  },
  {
    id_record: "6",
    id_user: "106",
    user: {
      id_user: "106",
      name: "Pedro Gómez",
      email: "pedro.gomez@universidad.edu",
    },
    check_in_time: new Date(2024, 2, 26, 8, 0),
    check_out_time: null,
    total_hours: null,
    overtime_hours: null,
  },
]

export function AttendanceRecordsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(10)

  // Filtrar registros basados en búsqueda y rango de fechas
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.user.name.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesDate = true
    if (dateRange?.from) {
      const recordDate = new Date(record.check_in_time)
      recordDate.setHours(0, 0, 0, 0)

      const fromDate = new Date(dateRange.from)
      fromDate.setHours(0, 0, 0, 0)

      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        matchesDate = recordDate >= fromDate && recordDate <= toDate
      } else {
        matchesDate = recordDate.getTime() === fromDate.getTime()
      }
    }

    return matchesSearch && matchesDate
  })

  useEffect(() => { setPage(1) }, [searchTerm, dateRange])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pageEnd = pageStart + pageSize
  const paginatedRecords = useMemo(() => filteredRecords.slice(pageStart, pageEnd), [filteredRecords, pageStart, pageEnd])

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setIsEditDialogOpen(true)
  }

  const handleManualAttendance = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setIsAttendanceDialogOpen(true)
  }

  // Función para formatear intervalos de tiempo (PostgreSQL INTERVAL)
  const formatInterval = (interval: string | null) => {
    if (!interval) return "-"

    // Formato esperado: "HH:MM:SS"
    const parts = interval.split(":")
    if (parts.length !== 3) return interval

    const hours = Number.parseInt(parts[0])
    const minutes = Number.parseInt(parts[1])

    if (hours === 0) {
      return `${minutes} min`
    }

    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de voluntario..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Filtrar por fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={new Date()}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={es}
              />
              {dateRange?.from && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                    className="w-full justify-start text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileIcon className="mr-2 h-4 w-4" />
                Exportar a PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Entrada</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Clock className="h-4 w-4"/> Salida</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><UserIcon className="h-4 w-4"/> Voluntario</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Timer className="h-4 w-4"/> Total</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><AlarmClock className="h-4 w-4"/> Extras</div></TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <TableRow key={record.id_record}>
                  <TableCell>{format(record.check_in_time, "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    {record.check_out_time ? (
                      format(record.check_out_time, "dd/MM/yyyy HH:mm")
                    ) : (
                      <span className="text-amber-600 font-medium">En curso</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{record.user.name}</TableCell>
                  <TableCell>
                    {record.total_hours ? (
                      formatInterval(record.total_hours)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.overtime_hours ? (
                      <span className="text-amber-600 font-medium">{formatInterval(record.overtime_hours)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar registro</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleManualAttendance(record)}>
                        <Clock className="h-4 w-4" />
                        <span className="sr-only">Marcar asistencia</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
            {p}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal para editar registro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>Modifica los datos de asistencia del voluntario.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="volunteer-name">Nombre del Voluntario</Label>
                <Input id="volunteer-name" defaultValue={selectedRecord.user.name} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-in-date">Fecha de Entrada</Label>
                <Input
                  id="check-in-date"
                  type="date"
                  defaultValue={format(selectedRecord.check_in_time, "yyyy-MM-dd")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="check-in-time">Hora de Entrada</Label>
                  <Input id="check-in-time" type="time" defaultValue={format(selectedRecord.check_in_time, "HH:mm")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="check-out-time">Hora de Salida</Label>
                  <Input
                    id="check-out-time"
                    type="time"
                    defaultValue={selectedRecord.check_out_time ? format(selectedRecord.check_out_time, "HH:mm") : ""}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-out-date">Fecha de Salida</Label>
                <Input
                  id="check-out-date"
                  type="date"
                  defaultValue={
                    selectedRecord.check_out_time ? format(selectedRecord.check_out_time, "yyyy-MM-dd") : ""
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para marcar asistencia manualmente */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Marcar Asistencia Manualmente</DialogTitle>
            <DialogDescription>Registra la asistencia manual para este voluntario.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="manual-volunteer-name">Nombre del Voluntario</Label>
                <Input id="manual-volunteer-name" defaultValue={selectedRecord.user.name} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-check-in-date">Fecha de Entrada</Label>
                <Input id="manual-check-in-date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-in-time">Hora de Entrada</Label>
                  <Input id="manual-check-in-time" type="time" defaultValue={format(new Date(), "HH:mm")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-out-time">Hora de Salida</Label>
                  <Input id="manual-check-out-time" type="time" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-check-out-date">Fecha de Salida</Label>
                <Input id="manual-check-out-date" type="date" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Asistencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

