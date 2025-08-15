"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon, IdCard, Mail, Phone, Shield, GraduationCap, User as UserIcon, Pencil, Clock3 } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [timesByDay, setTimesByDay] = useState<Record<string, { startTime: string; endTime: string }>>({})
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const chartPoints = useMemo(() => {
    // Datos de Database.sql: AttendanceRecord con check_in_time, check_out_time
    // Graficamos minutos por día (últimos 14 días) y usamos etiquetas de día (DD/MM)
    const byDay = new Map<string, number>()
    attendance.forEach((r) => {
      if (!r.check_out_time) return
      const inDate = new Date(r.check_in_time)
      const outDate = new Date(r.check_out_time)
      const minutes = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / 60000))
      const key = inDate.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) || 0) + minutes)
    })
    const days: { x: number; y: number; label: string }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const y = byDay.get(key) || 0
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      days.push({ x: d.getTime(), y, label: `${dd}/${mm}` })
    }
    return days
  }, [attendance])

  useEffect(() => {
    if (!userId) return

    const loadAll = async () => {
      try {
        setIsLoading(true)
        const [userRes, rolesRes, univRes, cardsRes, scheduleRes, attendanceRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/roles`),
          fetch(`/api/university`),
          fetch(`/api/cards`),
          fetch(`/api/schedule`),
          fetch(`/api/attendance_record`),
        ])

        if (!userRes.ok) throw new Error("No se pudo cargar el usuario")
        const user: UserDetail = await userRes.json()

        const rolesData: Role[] = rolesRes.ok ? await rolesRes.json() : []
        const univData: University[] = univRes.ok ? await univRes.json() : []
        const cardsData: CardInfo[] = cardsRes.ok ? await cardsRes.json() : []
        const scheduleData: ScheduleRow[] = scheduleRes.ok ? await scheduleRes.json() : []
        const attendancePayload = attendanceRes.ok ? await attendanceRes.json() : { records: [] }
        const attendanceData: AttendanceRecord[] = Array.isArray(attendancePayload) ? attendancePayload : (attendancePayload?.records || [])

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
        setAttendance(attendanceData.filter((r) => r.id_user === userId))
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Información del voluntario</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@correo.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="71024518" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de nacimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-between", !birthdate && "text-muted-foreground")}
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
                      <Select value={idRole} onValueChange={setIdRole}>
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
                      <Select value={idUniversity ?? "none"} onValueChange={setIdUniversity}>
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

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/volunteers")}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Horas registradas (min) últimos 14 días</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-1">
                      Total: {Math.round(chartPoints.reduce((a, b) => a + b.y, 0))} min
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-600 px-2 py-1">
                      Pico: {(() => { const m = chartPoints.reduce((max, p) => p.y > max ? p.y : max, 0); return Math.round(m) })()} min
                    </span>
                  </div>
                </div>
                <div className="rounded-md border bg-background p-2 animate-in fade-in-50">
                  <SmoothLineChart
                    data={chartPoints}
                    width={900}
                    height={200}
                    valueFormatter={(v) => `${Math.round(v)} min`}
                  />
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Sidebar info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
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
            </Card>

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
        </div>
      )}
    </main>
  )
}


