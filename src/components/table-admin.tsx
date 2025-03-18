'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const estudiantes = [
  {
    carnet: "A12345",
    nombre: "Juan Pérez",
    correo: "juan.perez@universidad.edu",
    telefono: "1234-5678",
    codigoTarjeta: "T001",
    universidad: "Universidad Central",
  },
  {
    carnet: "B67890",
    nombre: "María García",
    correo: "maria.garcia@universidad.edu",
    telefono: "8765-4321",
    codigoTarjeta: "T002",
    universidad: "Universidad del Este",
  },
  {
    carnet: "C13579",
    nombre: "Carlos Rodríguez",
    correo: "carlos.rodriguez@universidad.edu",
    telefono: "9876-5432",
    codigoTarjeta: "T003",
    universidad: "Universidad del Norte",
  },
]

export function TableAdmin() {
  const handleEdit = (carnet: string) => {
    console.log(`Editar estudiante con carnet: ${carnet}`)
  }

  const handleDelete = (carnet: string) => {
    console.log(`Eliminar estudiante con carnet: ${carnet}`)
  }

  return (
    <Table>
      <TableCaption>Lista de estudiantes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Carnet</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Código Tarjeta</TableHead>
          <TableHead>Universidad</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {estudiantes.map((estudiante) => (
          <TableRow key={estudiante.carnet}>
            <TableCell>{estudiante.carnet}</TableCell>
            <TableCell>{estudiante.nombre}</TableCell>
            <TableCell>{estudiante.correo}</TableCell>
            <TableCell>{estudiante.telefono}</TableCell>
            <TableCell>{estudiante.codigoTarjeta}</TableCell>
            <TableCell>{estudiante.universidad}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(estudiante.carnet)}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(estudiante.carnet)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

