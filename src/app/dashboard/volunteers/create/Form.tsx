"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useContext, useEffect, useState } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { ContextSelectedTab,StepperSelected } from "./Stepper"
const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debería tener al menos 2 caracteres.",
  }),
  email: z.coerce.string().email("El correo no es valido").min(5, {
    message: "El correo debería tener al menos 5 caracteres",
  }),
  birthdate: z.date({
    required_error: "La fecha de nacimiento es requerida.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debería tener al menos 6 caracteres",
  }),
  phone_number: z.coerce.number().positive("El número debe ser positivo"),
  id_university: z.string().optional(),
  id_role: z.string().uuid(),
})

interface Iuniversity {
  id: string
  name: string
}

export default function ProfileForm() {
  const [universities, setUniversities] = useState<Iuniversity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter(); 
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      birthdate: new Date("2000-08-21"),
      password: "",
      id_role: "b72ae401-6234-4039-978b-a089f81d7e05",
    },
  })

  const {setTabSelected} = useContext(ContextSelectedTab); 
  const getUniversities = async () => {
    try {
      setIsLoading(true)
      const result = await fetch("http://localhost:3000/api/university")
      const data = await result.json()
      setUniversities(data)
      return data
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const response = await fetch("http://localhost:3000/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: values.name,
                email: values.email,
                birthdate: values.birthdate.toISOString().split("T")[0],
                password: values.password,
                phone_number: values.phone_number.toString(),
                id_university: values.id_university || null,
                id_role: values.id_role,
            }),
        });
        if (!response.ok) {
            console.log(response);
            throw new Error("Error al registrar el voluntario");
        }
        const data = await response.json();
        console.log("Voluntario registrado exitosamente:", data);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setIsLoading(false);
        //router.back();
        console.log("next step");
        setTabSelected(StepperSelected.Card); 
    }
}

  useEffect(() => {
    getUniversities()
  }, [])

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">Registro de Voluntario</CardTitle>
        <CardDescription className="text-center">
          Complete el formulario para registrar un voluntario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="George..." {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de nacimiento */}
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown-buttons"
                          fromYear={1920}
                          toYear={new Date().getUTCFullYear()}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1910-01-01")}
                          classNames={{ caption_label: "hidden" }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Correo */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@gmail.com" type="email" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono - Fixed the name from password to phone_number */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="71024518"
                        {...field}
                        className="w-full"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Universidad */}
              <FormField
                control={form.control}
                name="id_university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Universidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una universidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ninguna">Ninguna</SelectItem>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>
                            Cargando universidades...
                          </SelectItem>
                        ) : (
                          universities.map((university) => (
                            <SelectItem key={university.id} value={university.id}>
                              {university.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto transition-all hover:scale-105">
                Registrar voluntario
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">Al registrar, ya puede asignar un horario al voluntario o el codigo de tarjeta</p>
      </CardFooter>
    </Card>
  )
}

