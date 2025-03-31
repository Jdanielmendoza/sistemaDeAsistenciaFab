"use client"

import { useState } from "react"
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

// Datos de ejemplo
const volunteerRecords = [
  {
    id: 1,
    date: new Date(2024, 2, 25),
    volunteerName: "Ana García",
    checkIn: "09:00",
    checkOut: "17:00",
    totalHours: 8,
    overtime: 0,
  },
  {
    id: 2,
    date: new Date(2024, 2, 25),
    volunteerName: "Carlos Rodríguez",
    checkIn: "08:30",
    checkOut: "18:30",
    totalHours: 10,
    overtime: 2,
  },
  {
    id: 3,
    date: new Date(2024, 2, 24),
    volunteerName: "María López",
    checkIn: "09:15",
    checkOut: "17:15",
    totalHours: 8,
    overtime: 0,
  },
  {
    id: 4,
    date: new Date(2024, 2, 24),
    volunteerName: "Juan Martínez",
    checkIn: "08:45",
    checkOut: "16:45",
    totalHours: 8,
    overtime: 0,
  },
  {
    id: 5,
    date: new Date(2024, 2, 23),
    volunteerName: "Laura Sánchez",
    checkIn: "09:30",
    checkOut: "18:30",
    totalHours: 9,
    overtime: 1,
  },
]

export function VolunteerAttendanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  // Filtrar registros basados en búsqueda y fecha
  const filteredRecords = volunteerRecords.filter((record) => {
    const matchesSearch = record.volunteerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !date || record.date.toDateString() === date.toDateString()
    return matchesSearch && matchesDate
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
                {date ? format(date, "PPP", { locale: es }) : <span>Filtrar por fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} />
              {date && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDate(undefined)}
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
                <FilePdf className="mr-2 h-4 w-4" />
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
              <TableHead>Fecha</TableHead>
              <TableHead>Nombre del Voluntario</TableHead>
              <TableHead>Hora de Entrada</TableHead>
              <TableHead>Hora de Salida</TableHead>
              <TableHead>Horas Totales</TableHead>
              <TableHead>Horas Extras</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(record.date, "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium">{record.volunteerName}</TableCell>
                  <TableCell>{record.checkIn}</TableCell>
                  <TableCell>{record.checkOut}</TableCell>
                  <TableCell>{record.totalHours}</TableCell>
                  <TableCell>
                    {record.overtime > 0 ? <span className="text-amber-600 font-medium">{record.overtime}</span> : "0"}
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
                <Input id="volunteer-name" defaultValue={selectedRecord.volunteerName} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="check-in">Hora de Entrada</Label>
                  <Input id="check-in" type="time" defaultValue={selectedRecord.checkIn} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="check-out">Hora de Salida</Label>
                  <Input id="check-out" type="time" defaultValue={selectedRecord.checkOut} />
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
                <Input id="manual-volunteer-name" defaultValue={selectedRecord.volunteerName} disabled />
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
                      {selectedRecord.date ? (
                        format(selectedRecord.date, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedRecord.date} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-in">Hora de Entrada</Label>
                  <Input id="manual-check-in" type="time" defaultValue={selectedRecord.checkIn} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manual-check-out">Hora de Salida</Label>
                  <Input id="manual-check-out" type="time" defaultValue={selectedRecord.checkOut} />
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

