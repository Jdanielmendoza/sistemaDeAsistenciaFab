import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    // Recibir los datos del nuevo administrador
    const { carnet, nombre, correo, contrasena, telefono, id_universidad, id_tarjeta } = await req.json();

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Obtener el ID del rol "Administrador"
    const resultRole = await query('SELECT id_rol FROM Rol WHERE nombre_rol = $1', ['administrador']);
    console.log(resultRole);
    if (resultRole.rows.length === 0) {
      return NextResponse.json({ error: 'Rol Administrador no encontrado' }, { status: 400 });
    }
    const id_rol = resultRole.rows[0].id_rol;

    // Crear un nuevo usuario administrador
    const newUserId = uuidv4();

    const result = await query(
      `INSERT INTO Usuario (id_usuario, carnet, nombre, correo, contrasena, telefono, id_rol, id_universidad, id_tarjeta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [newUserId, carnet, nombre, correo, hashedPassword, telefono, id_rol, id_universidad, id_tarjeta]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creando usuario administrador' + error }, { status: 500 });
  }
}
