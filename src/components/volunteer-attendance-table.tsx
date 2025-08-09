"use client"

import { useState, useEffect } from "react"
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Search,
  Edit,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  CalendarRange,
  CalendarDays,
  RefreshCcw,
  EyeOff,
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
import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { type DateRange } from "react-day-picker"

interface AttendanceRecordItem {
  id_record: string;
  id_user: string;
  name: string;
  check_in_time: string; // ISO date string
  check_out_time: string | null;
  total_hours: string | null; // interval string e.g. "08:00:00"
}

// Convierte un intervalo PostgreSQL (string u objeto) a horas decimales
function parseHours(interval: any): number {
  if (!interval) return 0;

  // Si el backend ya envía número -> devolverlo
  if (typeof interval === "number") return interval;

  // Formato string "HH:MM:SS" o similar
  if (typeof interval === "string") {
    const parts = interval.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0] || "0", 10);
      const minutes = parseInt(parts[1] || "0", 10);
      const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
      return hours + minutes / 60 + seconds / 3600;
    }
    // Si no coincide, intentar parseFloat
    const maybe = parseFloat(interval);
    return isNaN(maybe) ? 0 : maybe;
  }

  // Si es objeto (pg Interval) { hours, minutes, seconds, days, months }
  if (typeof interval === "object") {
    const hours = interval.hours || 0;
    const minutes = interval.minutes || 0;
    const seconds = interval.seconds || 0;
    const days = interval.days || 0;
    const months = interval.months || 0; // ignoramos meses -> convertir a días aprox.
    return hours + minutes / 60 + seconds / 3600 + days * 24 + months * 30 * 24;
  }

  return 0;
}

// Formatea horas decimales a "H h - M min - S s" (segundos opcionales)
function formatDecimalHours(value: number): string {
  const totalSeconds = Math.round(value * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds} s`); // solo mostrar segundos si no hay horas

  // Si todas las partes son cero, mostrar "0 s"
  if (parts.length === 0) return "0 s";

  return parts.join(" - ");
}

export function VolunteerAttendanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [quickRange, setQuickRange] = useState<string | null>(null)
  const [onlyPresent, setOnlyPresent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/attendance_record");
        if (!res.ok) throw new Error("Failed to load attendance records");
        const data = await res.json();
        setRecords(data.records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false)
      }
    };

    fetchRecords();
  }, []);

  // Quick range handler
  const applyQuickRange = (value: string | null) => {
    setQuickRange(value)
    if (!value) {
      setRange(undefined)
      return
    }
    const now = new Date()
    if (value === "today") {
      setRange({from: now, to: now})
    } else if (value === "week") {
      setRange({from: startOfWeek(now, {weekStartsOn:1}), to: endOfWeek(now, {weekStartsOn:1})})
    } else if (value === "month") {
      setRange({from: startOfMonth(now), to: endOfMonth(now)})
    }
  }

  // Filtrar registros basados en búsqueda y fecha
  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase())

    const recordDate = new Date(record.check_in_time)

    let matchesDate = true
    if (range && range.from && range.to) {
      matchesDate = recordDate >= range.from && recordDate <= addDays(range.to,1) // inclusive
    }

    const matchesPresent = !onlyPresent || record.check_out_time === null

    return matchesSearch && matchesDate && matchesPresent
  })

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    setIsEditDialogOpen(true)
  }

  const handleManualAttendance = (record: any) => {
    setSelectedRecord(record)
    setIsAttendanceDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Left: search & quick range */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 flex-1">
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar voluntario..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick range toggle group */}
          <ToggleGroup type="single" value={quickRange ?? undefined} onValueChange={applyQuickRange}>
            <ToggleGroupItem value="today" aria-label="Hoy">
              <Sun className="mr-1 h-4 w-4" /> Hoy
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Semana">
              <CalendarRange className="mr-1 h-4 w-4" /> Semana
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Mes">
              <CalendarDays className="mr-1 h-4 w-4" /> Mes
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Right: filters & actions */}
        <div className="flex flex-wrap gap-2 md:justify-end">
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarRange className="mr-2 h-4 w-4" />
                {range && range.from && range.to ? (
                  <span>
                    {format(range.from, "dd/MM/yyyy")} - {format(range.to, "dd/MM/yyyy")}
                  </span>
                ) : (
                  <span>Rango fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(val: any) => {
                  setRange(val ?? undefined)
                  setQuickRange(null)
                }}
                initialFocus
                locale={es}
              />
              {range && range.from && (
                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => setRange(undefined)} className="w-full justify-start text-destructive">
                    <X className="mr-2 h-4 w-4" /> Limpiar rango
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Only present toggle */}
          <Toggle
            pressed={onlyPresent}
            onPressedChange={(val) => setOnlyPresent(val)}
            variant="outline"
            aria-label="Solo presentes"
          >
            <EyeOff className="mr-1 h-4 w-4" /> Presentes
          </Toggle>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={() => {
            setLoading(true); applyQuickRange(quickRange); // keep filters
            // re-fetch
            (async () => {
              try {
                const res = await fetch("/api/attendance_record");
                const data = await res.json();
                setRecords(data.records || []);
              } catch(err){console.error(err);} finally {setLoading(false)}
            })();
          }}>
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")}/>
          </Button>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FilePdf className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha / Hora de Entrada</TableHead>
              <TableHead>Fecha / Hora de Salida</TableHead>
              <TableHead>Nombre del Voluntario</TableHead>
              <TableHead>Horas Totales</TableHead>
              <TableHead>Horas Extras</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const checkInDate = new Date(record.check_in_time)
                const checkOutDate = record.check_out_time ? new Date(record.check_out_time) : null

                const checkInStr = format(checkInDate, "HH:mm")
                const checkOutStr = checkOutDate ? format(checkOutDate, "HH:mm") : "-"

                const totalHours = parseHours(record.total_hours)
                const overtime = totalHours > 8 ? totalHours - 8 : 0

                return (
                  <TableRow key={record.id_record}>
                    <TableCell>{format(checkInDate, "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>{checkOutDate ? format(checkOutDate, "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{formatDecimalHours(totalHours)}</TableCell>
                    <TableCell>
                      {overtime > 0 ? (
                        <span className="text-amber-600 font-medium">{formatDecimalHours(overtime)}</span>
                      ) : (
                        "0 s"
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
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
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
                <Input id="volunteer-name" defaultValue={selectedRecord.name} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="check-in">Hora de Entrada</Label>
                  <Input id="check-in" type="time" defaultValue={format(new Date(selectedRecord.check_in_time), "HH:mm")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="check-out">Hora de Salida</Label>
                  <Input id="check-out" type="time" defaultValue={selectedRecord.check_out_time ? format(new Date(selectedRecord.check_out_time), "HH:mm") : ""} />
                </div>
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
                <Input id="manual-volunteer-name" defaultValue={selectedRecord.name} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedRecord.check_in_time ? (
                        format(new Date(selectedRecord.check_in_time), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedRecord.check_in_time ? new Date(selectedRecord.check_in_time) : undefined} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-in">Hora de Entrada</Label>
                  <Input id="manual-check-in" type="time" defaultValue={format(new Date(selectedRecord.check_in_time), "HH:mm")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-out">Hora de Salida</Label>
                  <Input id="manual-check-out" type="time" defaultValue={selectedRecord.check_out_time ? format(new Date(selectedRecord.check_out_time), "HH:mm") : ""} />
                </div>
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

