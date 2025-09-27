"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, isValid, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, IdCard, Mail, Phone, Shield, GraduationCap, User as UserIcon, Pencil, Clock3, HelpCircle, RefreshCcw } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Pagination from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SmoothLineChart } from "@/components/ui/line-chart"
import PieDonut from "@/components/ui/pie-donut"

type Role = { id: string; name: string }
type University = { id: string; name: string }
type UserDetail = {
  id_user: string
  name: string
  email: string
  birthdate: string
  phone_number: string | null
  id_role: string
  role_name?: string
  id_university: string | null
  university_name?: string | null
}

type CardInfo = { id: string; name: string; id_user: string | null }
type ScheduleRow = {
  id_schedule: string
  id_user: string
  day_of_week: number
  start_time: string
  end_time: string
  start_date: string | null
  end_date: string | null
}

type AttendanceRecord = {
  id_record: string
  id_user: string
  check_in_time: string
  check_out_time: string | null
  total_hours?: string | null
}

export default function VolunteerProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : params?.id), [params])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const [roles, setRoles] = useState<Role[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [card, setCard] = useState<CardInfo | null>(null)
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [birthdate, setBirthdate] = useState<Date | undefined>()
  const [idRole, setIdRole] = useState<string>("")
  const [idUniversity, setIdUniversity] = useState<string>("none")
  const [cardNumberInput, setCardNumberInput] = useState<string>("")
  const [isEditingCard, setIsEditingCard] = useState<boolean>(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState<boolean>(false)
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [timesByDay, setTimesByDay] = useState<Record<string, { startTime: string; endTime: string }>>({})
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [tablePage, setTablePage] = useState<number>(1)
  const [tablePageSize] = useState<number>(10)
  const [chartRange, setChartRange] = useState<DateRange | undefined>()
  const [initialRange, setInitialRange] = useState<DateRange | undefined>()
  const chartPoints = useMemo(() => {
    // Construir serie por día en el rango seleccionado (o primer-último registro)
    const userRecords = attendance.filter((r) => !!r.check_in_time)
    if (userRecords.length === 0) return []

    // Determinar rango
    const minDateAll = userRecords.reduce((min, r) => {
      const d = new Date(r.check_in_time)
      return d < min ? d : min
    }, new Date(userRecords[0].check_in_time))
    const maxDateAll = userRecords.reduce((max, r) => {
      const d = new Date(r.check_out_time ?? r.check_in_time)
      return d > max ? d : max
    }, new Date(userRecords[0].check_out_time ?? userRecords[0].check_in_time))

    const rangeFrom = chartRange?.from ? new Date(chartRange.from) : minDateAll
    const rangeTo = chartRange?.to ? new Date(chartRange.to) : maxDateAll

    // Normalizar a día local (00:00 - 23:59)
    const start = new Date(rangeFrom)
    start.setHours(0, 0, 0, 0)
    const end = new Date(rangeTo)
    end.setHours(23, 59, 59, 999)

    const byDay = new Map<string, number>()
    userRecords.forEach((r) => {
      if (!r.check_out_time) return
      const inDate = new Date(r.check_in_time)
      const outDate = new Date(r.check_out_time)
      if (outDate < start || inDate > end) return
      const ms = Math.max(0, outDate.getTime() - inDate.getTime())
      const hours = ms / 3600000 // horas decimales
      const keyDate = new Date(inDate)
      keyDate.setHours(0, 0, 0, 0)
      const key = keyDate.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) || 0) + hours)
    })

    const days: { x: number; y: number; label: string }[] = []
    const d = new Date(start)
    while (d <= end) {
      const key = d.toISOString().slice(0, 10)
      const y = byDay.get(key) || 0
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      days.push({ x: d.getTime(), y, label: `${dd}/${mm}` })
      d.setDate(d.getDate() + 1)
    }
    return days
  }, [attendance, chartRange])

  // Gráfica corregida: prorratea horas de cada sesión por día y marca entrada/salida
  const chartPointsProrated = useMemo(() => {
    const userRecords = attendance.filter((r) => !!r.check_in_time)
    if (userRecords.length === 0) return [] as { x: number; y: number; label: string }[]

    const minDateAll = userRecords.reduce((min, r) => {
      const d = new Date(r.check_in_time)
      return d < min ? d : min
    }, new Date(userRecords[0].check_in_time))
    const maxDateAll = userRecords.reduce((max, r) => {
      const d = new Date(r.check_out_time ?? r.check_in_time)
      return d > max ? d : max
    }, new Date(userRecords[0].check_out_time ?? userRecords[0].check_in_time))

    const rangeFrom = chartRange?.from ? new Date(chartRange.from) : minDateAll
    const rangeTo = chartRange?.to ? new Date(chartRange.to) : maxDateAll

    const start = new Date(rangeFrom)
    start.setHours(0, 0, 0, 0)
    const end = new Date(rangeTo)
    end.setHours(23, 59, 59, 999)

    const byDay = new Map<string, number>()
    const flags = new Map<string, { in: boolean; out: boolean }>()

    const dayKey = (d: Date) => {
      const c = new Date(d)
      c.setHours(0, 0, 0, 0)
      return c.toISOString().slice(0, 10)
    }

    userRecords.forEach((r) => {
      const inDate = new Date(r.check_in_time)
      const outDate = new Date(r.check_out_time ?? r.check_in_time)
      if (outDate < start || inDate > end) return

      // Marcar flags de eventos por día
      const inKey = dayKey(inDate)
      const outKey = r.check_out_time ? dayKey(outDate) : undefined
      flags.set(inKey, { ...(flags.get(inKey) || { in: false, out: false }), in: true })
      if (outKey) flags.set(outKey, { ...(flags.get(outKey) || { in: false, out: false }), out: true })

      // Prorratear horas por cada día que toca la sesión
      let cursor = new Date(inDate)
      if (cursor < start) cursor = new Date(start)
      const sessionEnd = outDate > end ? new Date(end) : outDate

      while (cursor <= sessionEnd) {
        const dayStart = new Date(cursor)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)

        const overlapStart = new Date(Math.max(dayStart.getTime(), inDate.getTime(), start.getTime()))
        const overlapEnd = new Date(Math.min(dayEnd.getTime(), sessionEnd.getTime()))
        const ms = Math.max(0, overlapEnd.getTime() - overlapStart.getTime())
        const hours = ms / 3600000
        const key = dayKey(dayStart)
        if (hours > 0) byDay.set(key, (byDay.get(key) || 0) + hours)

        // avanzar al siguiente día
        const next = new Date(dayStart)
        next.setDate(next.getDate() + 1)
        cursor = next
      }
    })

    const points: { x: number; y: number; label: string }[] = []
    const d = new Date(start)
    while (d <= end) {
      const key = dayKey(d)
      const y = byDay.get(key) || 0
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const f = flags.get(key)
      const badge = f ? (f.in && f.out ? "(E,S)" : f.in ? "(E)" : f.out ? "(S)" : "") : ""
      points.push({ x: d.getTime(), y, label: `${dd}/${mm} ${badge}`.trim() })
      d.setDate(d.getDate() + 1)
    }

    return points
  }, [attendance, chartRange])

  // Helpers para la tabla
  const toDecimalHours = (intervalOrIn: string | null | undefined, out?: string | null): number => {
    if (intervalOrIn && typeof intervalOrIn === "string" && intervalOrIn.includes(":")) {
      const parts = intervalOrIn.split(":")
      if (parts.length >= 2) {
        const h = parseInt(parts[0] || "0", 10)
        const m = parseInt(parts[1] || "0", 10)
        const s = parts[2] ? parseInt(parts[2], 10) : 0
        return h + m / 60 + s / 3600
      }
    }
    if (intervalOrIn && out) {
      const a = new Date(intervalOrIn)
      const b = new Date(out)
      const ms = Math.max(0, b.getTime() - a.getTime())
      return ms / 3600000
    }
    return 0
  }

  const formatHoursHM = (hoursDecimal: number): string => {
    const totalMinutes = Math.max(0, Math.round(hoursDecimal * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours} h ${minutes} min`
  }

  const filteredRows = useMemo(() => {
    if (attendance.length === 0) return [] as AttendanceRecord[]
    const userRecords = attendance
    const minDateAll = new Date(userRecords[0].check_in_time)
    const maxDateAll = new Date(userRecords[userRecords.length - 1].check_out_time ?? userRecords[userRecords.length - 1].check_in_time)
    const rangeFrom = chartRange?.from ? new Date(chartRange.from) : minDateAll
    const rangeTo = chartRange?.to ? new Date(chartRange.to) : maxDateAll
    const start = new Date(rangeFrom); start.setHours(0,0,0,0)
    const end = new Date(rangeTo); end.setHours(23,59,59,999)
    return userRecords.filter((r) => {
      const inDate = new Date(r.check_in_time)
      const outDate = r.check_out_time ? new Date(r.check_out_time) : inDate
      return outDate >= start && inDate <= end
    })
  }, [attendance, chartRange])

  const totalRows = filteredRows.length
  const pageStart = (tablePage - 1) * tablePageSize
  const pageEnd = pageStart + tablePageSize
  const pageRows = useMemo(() => filteredRows.slice(pageStart, pageEnd), [filteredRows, pageStart, pageEnd])

  useEffect(() => { setTablePage(1) }, [chartRange])

  // Datos para donut: horas por día de la semana (prorrateadas) en el rango
  const donutByWeekday = useMemo(() => {
    const map = new Map<number, number>()
    chartPointsProrated.forEach((p) => {
      const d = new Date(p.x)
      const wd = d.getDay() // 0..6
      map.set(wd, (map.get(wd) || 0) + p.y)
    })
    const labels = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([k,v]) => ({ label: labels[k], value: v }))
  }, [chartPointsProrated])

  useEffect(() => {
    if (!userId) return

    const fetchAllAttendanceForUser = async (uid: string) => {
      const pageSize = 100
      let page = 1
      const all: AttendanceRecord[] = []
      // loop pages until we collect 'total'
      // avoid infinite loops by capping iterations
      for (let iter = 0; iter < 100; iter++) {
        const res = await fetch(`/api/attendance_record?id_user=${encodeURIComponent(uid)}&page=${page}&pageSize=${pageSize}`)
        if (!res.ok) break
        const payload = await res.json().catch(() => ({}))
        const records: AttendanceRecord[] = Array.isArray(payload) ? payload : (payload?.records || [])
        const total: number = payload?.total ?? records.length
        all.push(...records)
        if (all.length >= total || records.length === 0) break
        page += 1
      }
      return all
    }

    const loadAll = async () => {
      try {
        setIsLoading(true)
        const [userRes, rolesRes, univRes, cardsRes, scheduleRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/roles`),
          fetch(`/api/university`),
          fetch(`/api/cards`),
          fetch(`/api/schedule`),
        ])

        if (!userRes.ok) throw new Error("No se pudo cargar el usuario")
        const user: UserDetail = await userRes.json()

        const rolesData: Role[] = rolesRes.ok ? await rolesRes.json() : []
        const univData: University[] = univRes.ok ? await univRes.json() : []
        const cardsData: CardInfo[] = cardsRes.ok ? await cardsRes.json() : []
        const scheduleData: ScheduleRow[] = scheduleRes.ok ? await scheduleRes.json() : []
        const attendanceData: AttendanceRecord[] = await fetchAllAttendanceForUser(userId)

        setRoles(rolesData)
        setUniversities(univData)

        setName(user.name ?? "")
        setEmail(user.email ?? "")
        setPhoneNumber(user.phone_number ?? "")
        setIdRole(user.id_role ?? "")
        setIdUniversity(user.id_university ?? "none")

        // Parse birthdate robustly (supports YYYY-MM-DD or ISO string)
        if (user.birthdate) {
          const parsed = parseISO(user.birthdate)
          if (isValid(parsed)) {
            setBirthdate(parsed)
          } else {
            const short = user.birthdate.slice(0, 10)
            const [y, m, d] = short.split("-")
            const fallback = new Date(Number(y), Number(m) - 1, Number(d))
            if (!Number.isNaN(fallback.getTime())) setBirthdate(fallback)
          }
        }

        // Card info
        const userCard = cardsData.find((c) => c.id_user === userId) || null
        setCard(userCard)
        setCardNumberInput(userCard?.name ?? "")

        // Schedules for user
        const userSchedules = scheduleData.filter((s) => s.id_user === userId)
        setSchedules(userSchedules)

        // initialize schedule edit state from fetched schedules
        const initDays = userSchedules.map((s) => String(s.day_of_week))
        setSelectedDays(initDays)
        const initTimes: Record<string, { startTime: string; endTime: string }> = {}
        userSchedules.forEach((s) => {
          initTimes[String(s.day_of_week)] = {
            startTime: s.start_time?.slice(0, 5) || "09:00",
            endTime: s.end_time?.slice(0, 5) || "12:00",
          }
        })
        setTimesByDay(initTimes)

        // Attendance records (filter by user)
        const userRecs = attendanceData.filter((r) => r.id_user === userId)
        setAttendance(userRecs)
        if (userRecs.length > 0) {
          const minD = userRecs.reduce((min, r) => {
            const d = new Date(r.check_in_time)
            return d < min ? d : min
          }, new Date(userRecs[0].check_in_time))
          const maxD = userRecs.reduce((max, r) => {
            const d = new Date(r.check_out_time ?? r.check_in_time)
            return d > max ? d : max
          }, new Date(userRecs[0].check_out_time ?? userRecs[0].check_in_time))
          const rng = { from: minD, to: maxD }
          setInitialRange(rng)
          setChartRange((prev) => prev ?? rng)
        }
      } catch (error) {
        toast.error("Error cargando el perfil")
      } finally {
        setIsLoading(false)
      }
    }

    loadAll()
  }, [userId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    try {
      setIsSaving(true)
      const payload = {
        id_user: userId,
        name,
        email,
        birthdate: birthdate && isValid(birthdate) ? birthdate.toISOString().split("T")[0] : null,
        phone_number: phoneNumber === "" ? null : phoneNumber,
        id_role: idRole,
        id_university: idUniversity === "none" ? null : idUniversity,
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("No se pudo guardar")
      toast.success("Perfil actualizado")
    } catch (error) {
      toast.error("Error guardando cambios")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignCard = async () => {
    if (!userId) return
    if (!cardNumberInput || cardNumberInput.trim().length < 5) {
      toast.error("Ingresa un número de tarjeta válido (mín. 5 caracteres)")
      return
    }
    try {
      setIsSaving(true)
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cardNumberInput.trim(), id_user: userId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "No se pudo asignar la tarjeta")
      }
      const created = (await res.json()) as CardInfo
      setCard(created)
      setIsEditingCard(false)
      toast.success("Tarjeta asignada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error asignando tarjeta")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCard = async () => {
    if (!card || !card.id) return
    if (!cardNumberInput || cardNumberInput.trim().length < 5) {
      toast.error("Ingresa un número de tarjeta válido (mín. 5 caracteres)")
      return
    }
    try {
      setIsSaving(true)
      const res = await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, name: cardNumberInput.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "No se pudo actualizar la tarjeta")
      }
      const updated = (await res.json()) as CardInfo
      setCard(updated)
      setIsEditingCard(false)
      toast.success("Tarjeta actualizada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error actualizando tarjeta")
    } finally {
      setIsSaving(false)
    }
  }

  const dayLabel: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
  }

  const handleDayToggle = (values: string[]) => {
    setSelectedDays(values)
    const updated = { ...timesByDay }
    values.forEach((d) => {
      if (!updated[d]) updated[d] = { startTime: "09:00", endTime: "12:00" }
    })
    Object.keys(updated).forEach((d) => {
      if (!values.includes(d)) delete updated[d]
    })
    setTimesByDay(updated)
  }

  const handleTimeChange = (day: string, field: "startTime" | "endTime", value: string) => {
    setTimesByDay((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const reloadSchedules = async () => {
    try {
      const res = await fetch(`/api/schedule`)
      if (!res.ok) return
      const all: ScheduleRow[] = await res.json()
      const userSchedules = all.filter((s) => s.id_user === userId)
      setSchedules(userSchedules)
      const initDays = userSchedules.map((s) => String(s.day_of_week))
      setSelectedDays(initDays)
      const initTimes: Record<string, { startTime: string; endTime: string }> = {}
      userSchedules.forEach((s) => {
        initTimes[String(s.day_of_week)] = {
          startTime: s.start_time?.slice(0, 5) || "09:00",
          endTime: s.end_time?.slice(0, 5) || "12:00",
        }
      })
      setTimesByDay(initTimes)
    } catch (error) {
      // ignore
    }
  }

  const handleSaveSchedule = async () => {
    if (!userId) return
    try {
      setIsSavingSchedule(true)
      const existingByDay = new Map<number, ScheduleRow>()
      schedules.forEach((s) => existingByDay.set(s.day_of_week, s))

      const selected = selectedDays.map((d) => Number.parseInt(d))
      const existingDays = new Set<number>(schedules.map((s) => s.day_of_week))

      const toCreate = selected.filter((d) => !existingDays.has(d))
      const toDelete = [...existingDays].filter((d) => !selected.includes(d))
      const toUpdate = selected.filter((d) => existingDays.has(d)).filter((d) => {
        const current = existingByDay.get(d)!
        const t = timesByDay[String(d)]
        return (
          current.start_time?.slice(0, 5) !== t.startTime || current.end_time?.slice(0, 5) !== t.endTime
        )
      })

      const ops: Array<Promise<any>> = []

      if (toCreate.length > 0) {
        const payload = toCreate.map((d) => ({
          id_user: userId,
          day_of_week: d,
          start_time: timesByDay[String(d)]?.startTime || "09:00",
          end_time: timesByDay[String(d)]?.endTime || "12:00",
          start_date: null,
          end_date: null,
        }))
        ops.push(
          fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((r) => {
            if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e?.error || "Fallo creando horarios")))
            return r.json()
          })
        )
      }

      toUpdate.forEach((d) => {
        const row = existingByDay.get(d)!
        const t = timesByDay[String(d)]
        ops.push(
          fetch("/api/schedule", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_schedule: row.id_schedule, day_of_week: d, start_time: t.startTime, end_time: t.endTime }),
          }).then((r) => {
            if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e?.error || "Fallo actualizando horario")))
          })
        )
      })

      toDelete.forEach((d) => {
        const row = existingByDay.get(d)!
        ops.push(
          fetch("/api/schedule", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_schedule: row.id_schedule }),
          }).then((r) => {
            if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e?.error || "Fallo eliminando horario")))
          })
        )
      })

      await Promise.all(ops)
      await reloadSchedules()
      setIsEditingSchedule(false)
      toast.success("Horario actualizado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error guardando horario")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  return (
    <main className="w-full px-4 py-6">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2"><CardContent className="p-6 space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></CardContent></Card>
          <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></CardContent></Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main form */}
          <Card className="xl:col-span-2 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">{/* <UserIcon className="h-5 w-5" /> */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {name?.[0]?.toUpperCase() || "U"}
                </div>
               Información de {name}
              </CardTitle>
              <Button variant="ghost" size="icon" aria-label="Editar información" onClick={() => setIsEditingInfo((v) => !v)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" disabled={!isEditingInfo} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@correo.com" disabled={!isEditingInfo} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="71024518" disabled={!isEditingInfo} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de nacimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-between", !birthdate && "text-muted-foreground")}
                          disabled={!isEditingInfo}
                        >
                          {birthdate && isValid(birthdate) ? format(birthdate, "PPP") : <span>Selecciona una fecha</span>}
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown-buttons"
                          fromYear={1920}
                          toYear={new Date().getUTCFullYear()}
                          selected={birthdate}
                          onSelect={setBirthdate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={idRole} onValueChange={setIdRole} disabled={!isEditingInfo}>
                        <SelectTrigger className="w-full pl-9">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Universidad</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={idUniversity ?? "none"} onValueChange={setIdUniversity} disabled={!isEditingInfo}>
                        <SelectTrigger className="w-full pl-9">
                          <SelectValue placeholder="Selecciona una universidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {universities.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {isEditingInfo && (
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditingInfo(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
                </div>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Horas registradas por día (min)</div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {chartRange?.from ? (
                            chartRange?.to ? (
                              <>
                                {format(chartRange.from, "dd/MM/yyyy")} - {format(chartRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(chartRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span>Rango</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          initialFocus
                          mode="range"
                          selected={chartRange}
                          onSelect={(val: any) => setChartRange(val ?? undefined)}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Restablecer rango"
                      onClick={() => {
                        if (initialRange?.from && initialRange?.to) {
                          setChartRange({ from: new Date(initialRange.from), to: new Date(initialRange.to) })
                        } else if (attendance.length > 0) {
                          const minD = attendance.reduce((min, r) => {
                            const d = new Date(r.check_in_time)
                            return d < min ? d : min
                          }, new Date(attendance[0].check_in_time))
                          const maxD = attendance.reduce((max, r) => {
                            const d = new Date(r.check_out_time ?? r.check_in_time)
                            return d > max ? d : max
                          }, new Date(attendance[0].check_out_time ?? attendance[0].check_in_time))
                          setChartRange({ from: minD, to: maxD })
                        }
                      }}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                      Total: {(() => { const h = chartPoints.reduce((a, b) => a + b.y, 0); return h.toFixed(2) })()} h
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-2 py-1 text-xs">
                      Pico: {(() => { const m = chartPoints.reduce((max, p) => p.y > max ? p.y : max, 0); return m.toFixed(2) })()} h
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">Gráfica original (puede mostrar &gt;24 h si una sesión cruza días)</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Ayuda gráfica original">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-sm" align="end">
                      Muestra horas por día sumando cada sesión al día de entrada. Si una sesión dura más de un día, ese día puede exceder 24 h. Usa horas decimales; el tooltip muestra día y duración formateada.
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="rounded-md border bg-background p-2 animate-in fade-in-50">
                  <SmoothLineChart
                    data={chartPoints}
                    width={900}
                    height={200}
                    valueFormatter={(v) => `${v.toFixed(2)} h`}
                    tooltipTitle={(x, label) => {
                      const d = new Date(x)
                      const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
                      return `${days[d.getDay()]} ${label}`
                    }}
                    tooltipFormatter={(v) => {
                      const hours = Math.floor(v)
                      const minutes = Math.round((v - hours) * 60)
                      return `${hours} h ${minutes} min`
                    }}
                    xTickMode="auto"
                    maxXTicks={10}
                    xLabelAngle={0}
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-muted-foreground">Horas por día (prorrateadas) — etiquetas (E)=Entrada, (S)=Salida</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Ayuda gráfica prorrateada">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-sm" align="end">
                        Reparte cada sesión entre los días que atraviesa: cuenta solo las horas dentro de cada día. Ningún día supera 24 h. Muestra marcadores (E) y (S) cuando hubo entrada/salida.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="rounded-md border bg-background p-2 animate-in fade-in-50">
                  <SmoothLineChart
                    data={chartPointsProrated}
                    width={900}
                    height={200}
                    valueFormatter={(v) => `${v.toFixed(2)} h`}
                    tooltipTitle={(x, label) => {
                      const d = new Date(x)
                      const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
                      return `${days[d.getDay()]} ${label}`
                    }}
                    tooltipFormatter={(v) => {
                      const hours = Math.floor(v)
                      const minutes = Math.round((v - hours) * 60)
                      return `${hours} h ${minutes} min`
                    }}
                    xTickMode="auto"
                    maxXTicks={10}
                    xLabelAngle={0}
                  />
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Sidebar info */}
          <div className="space-y-6">
            {/* Donut compacto debajo del resumen */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">Distribución semanal</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Ayuda donut semanal">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm" align="end">
                    Muestra qué porcentaje de horas del rango cae en cada día de la semana. Útil para ver los días más activos.
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardContent className="pt-0">
                <PieDonut data={donutByWeekday} height={200} valueFormatter={(v) => `${v.toFixed(2)} h`} />
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen del voluntario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{name || "Sin nombre"}</div>
                    <div className="text-sm text-muted-foreground truncate">{email}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Rol</div>
                  <div className="font-medium">{roles.find(r => r.id === idRole)?.name || "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Universidad</div>
                  <div className="font-medium">{universities.find(u => u.id === (idUniversity ?? ""))?.name || "Ninguna"}</div>
                </div>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><IdCard className="h-4 w-4" /> Tarjeta RFID</CardTitle>
                {card && (
                  <Button variant="ghost" size="icon" onClick={() => { setIsEditingCard((v) => !v); setCardNumberInput(card?.name ?? "") }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {card ? (
                  isEditingCard ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Editar número de tarjeta</div>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Número de tarjeta" value={cardNumberInput} onChange={(e) => setCardNumberInput(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsEditingCard(false)} disabled={isSaving}>Cancelar</Button>
                        <Button size="sm" onClick={handleUpdateCard} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Número</div>
                      <div className="font-mono">{card.name}</div>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Sin tarjeta asignada</div>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Ingresa número de tarjeta" value={cardNumberInput} onChange={(e) => setCardNumberInput(e.target.value)} />
                    </div>
                    <Button size="sm" onClick={handleAssignCard} disabled={isSaving}>{isSaving ? "Guardando..." : "Asignar tarjeta"}</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" /> Horario</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsEditingSchedule((v) => !v)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {!isEditingSchedule ? (
                  <div className="space-y-2">
                    {schedules.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Sin horarios asignados</div>
                    ) : (
                      <div className="space-y-2">
                        {schedules.map((s) => (
                          <div
                            key={s.id_schedule}
                            className="flex items-center justify-between rounded-md border p-2 bg-primary/5 hover:bg-primary/10 transition-colors"
                          >
                            <div className="text-sm font-medium">{dayLabel[s.day_of_week]}</div>
                            <div className="text-sm font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2">
                      <Label>Días de la semana</Label>
                      <ToggleGroup
                        type="multiple"
                        variant="outline"
                        className="justify-start flex-wrap"
                        value={selectedDays}
                        onValueChange={handleDayToggle}
                      >
                        {Object.entries(dayLabel).map(([value, label]) => (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className="w-12 h-12 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition"
                          >
                            {label[0]}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    {selectedDays.length > 0 && (
                      <div className="space-y-3">
                        <Label>Horarios</Label>
                        <div className="grid gap-3">
                          {selectedDays.map((d) => (
                            <div key={d} className="grid grid-cols-3 items-center gap-3 rounded-md border p-3">
                              <div className="text-sm font-medium">{dayLabel[Number(d)]}</div>
                              <div className="space-y-1">
                                <Label className="text-xs">Entrada</Label>
                                <Input type="time" value={timesByDay[d]?.startTime || "09:00"} onChange={(e) => handleTimeChange(d, "startTime", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Salida</Label>
                                <Input type="time" value={timesByDay[d]?.endTime || "12:00"} onChange={(e) => handleTimeChange(d, "endTime", e.target.value)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => { setIsEditingSchedule(false); reloadSchedules() }} disabled={isSavingSchedule}>Cancelar</Button>
                      <Button size="sm" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
                        {isSavingSchedule ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de registros del voluntario */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Registros de asistencia de {name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha entrada</TableHead>
                      <TableHead>Hora entrada</TableHead>
                      <TableHead>Fecha salida</TableHead>
                      <TableHead>Hora salida</TableHead>
                      <TableHead className="text-right">Total horas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length > 0 ? (
                      pageRows.map((r) => {
                        const inD = new Date(r.check_in_time)
                        const outD = r.check_out_time ? new Date(r.check_out_time) : null
                        const inDate = `${String(inD.getDate()).padStart(2, '0')}/${String(inD.getMonth()+1).padStart(2, '0')}/${inD.getFullYear()}`
                        const inTime = `${String(inD.getHours()).padStart(2, '0')}:${String(inD.getMinutes()).padStart(2, '0')}`
                        const outDate = outD ? `${String(outD.getDate()).padStart(2, '0')}/${String(outD.getMonth()+1).padStart(2, '0')}/${outD.getFullYear()}` : "-"
                        const outTime = outD ? `${String(outD.getHours()).padStart(2, '0')}:${String(outD.getMinutes()).padStart(2, '0')}` : "-"
                        const hours = r.total_hours ? toDecimalHours(r.total_hours) : (outD ? toDecimalHours(r.check_in_time, r.check_out_time) : 0)
                        return (
                          <TableRow key={r.id_record}>
                            <TableCell>{inDate}</TableCell>
                            <TableCell>{inTime}</TableCell>
                            <TableCell>{outDate}</TableCell>
                            <TableCell>{outTime}</TableCell>
                            <TableCell className="text-right">{r.check_out_time ? formatHoursHM((new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()) / 3600000) : (r.total_hours ? formatHoursHM(toDecimalHours(r.total_hours)) : "-")}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Sin registros</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">
                  Mostrando {totalRows === 0 ? 0 : pageStart + 1} a {Math.min(totalRows, pageEnd)} de {totalRows} resultado(s)
                </div>
                <Pagination page={tablePage} total={totalRows} pageSize={tablePageSize} onPageChange={setTablePage} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}


