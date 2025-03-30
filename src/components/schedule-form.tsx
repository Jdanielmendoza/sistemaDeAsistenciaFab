"use client"

import type React from "react"

import { useState, useContext } from "react"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { ContextSelectedTab } from "@/app/dashboard/volunteers/create/Stepper"

const daysOfWeek = [
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mié" },
  { value: "4", label: "Jue" },
  { value: "5", label: "Vie" },
  { value: "6", label: "Sáb" },
  { value: "7", label: "Dom" },
]

export function ScheduleForm() {
  const {userForm } = useContext(ContextSelectedTab);
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [timesByDay, setTimesByDay] = useState<Record<string, { startTime: string; endTime: string }>>({})
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const handleDayToggle = (values: string[]) => {
    setSelectedDays(values)

    // Initialize times for newly selected days
    const newTimesByDay = { ...timesByDay }
    values.forEach((day) => {
      if (!newTimesByDay[day]) {
        newTimesByDay[day] = { startTime: "09:00", endTime: "12:00" }
      }
    })

    // Remove times for unselected days
    Object.keys(newTimesByDay).forEach((day) => {
      if (!values.includes(day)) {
        delete newTimesByDay[day]
      }
    })

    setTimesByDay(newTimesByDay)
  }

  const handleTimeChange = (day: string, field: "startTime" | "endTime", value: string) => {
    setTimesByDay({
      ...timesByDay,
      [day]: {
        ...timesByDay[day],
        [field]: value,
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const scheduleData = selectedDays.map((day) => ({
      id_user : userForm.getValues('id_user'),
      day_of_week: Number.parseInt(day),
      start_time: timesByDay[day].startTime,
      end_time: timesByDay[day].endTime,
      start_date: startDate,
      end_date: endDate,
    }))

    console.log("Schedule data:", scheduleData)
    const saveSchedule = async () => {
      try {
      const response = await fetch("http://localhost:3000/api/schedule", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error("Failed to save schedule");
      }

      const data = await response.json();
      console.log("Schedule saved successfully:", data);
      } catch (error) {
      console.error("Error saving schedule:", error);
      }
    };

    saveSchedule();
    // Here you would send the data to your backend
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Programar horario de asistencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period date selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha de inicio del periodo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="start-date">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccionar fecha de inicio</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha de fin del periodo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="end-date">
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccionar fecha de fin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => !startDate || date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Separator />


          {/* Days of week selection */}
          <div className="space-y-2">
            <Label>Días de la semana</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              className="justify-start flex-wrap"
              value={selectedDays}
              onValueChange={handleDayToggle}
            >
              {daysOfWeek.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  className="w-12 h-12 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Separator />

          {/* Time selection for each day */}
          {selectedDays.length > 0 && (
            <div className="space-y-4">
              <Label>Horarios por día</Label>
              <div className="grid gap-4">
                {selectedDays.map((day) => (
                  <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 rounded-md border">
                    <div className="font-medium">{daysOfWeek.find((d) => d.value === day)?.label}</div>
                    <div className="space-y-2">
                      <Label htmlFor={`start-time-${day}`}>Hora de entrada</Label>
                      <Input
                        id={`start-time-${day}`}
                        type="time"
                        value={timesByDay[day]?.startTime || "09:00"}
                        onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-time-${day}`}>Hora de salida</Label>
                      <Input
                        id={`end-time-${day}`}
                        type="time"
                        value={timesByDay[day]?.endTime || "12:00"}
                        onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={selectedDays.length === 0}
          >
            Guardar horario
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

