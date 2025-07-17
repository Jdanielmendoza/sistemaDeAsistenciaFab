'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react";

type Admin = {
  id_user: string;
  user_name: string;
  email: string;
  phone_number: number | null;
  university_name: string;
};

export function TableAdmin() {
  const [admins, setAdmins] = useState<Admin[]>([]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/users?role=administrador");
      const data = await res.json();
      setAdmins(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <Table>
      <TableCaption>Lista de administradores</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Universidad</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow key={admin.id_user}>
            <TableCell>{admin.user_name}</TableCell>
            <TableCell>{admin.email}</TableCell>
            <TableCell>{admin.phone_number ?? "-"}</TableCell>
            <TableCell>{admin.university_name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

