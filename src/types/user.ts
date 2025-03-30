import { z } from "zod"

export interface Iuniversity {
  id: string;
  name: string;
}

export const formUserSchema = z.object({
  id_user:z.string().uuid().optional(),
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