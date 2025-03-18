import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function POST(req: Request) {
  try {
    const { correo, contrasena } = await req.json();

    // Verificar si el usuario existe y es un administrador
    const result = await query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.contrasena, r.nombre_rol 
       FROM Usuario u
       INNER JOIN Rol r ON u.id_rol = r.id_rol
       WHERE u.correo = $1 AND r.nombre_rol = 'administrador'`,
      [correo]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado o no es administrador' }, { status: 401 });
    }

    const usuario = result.rows[0];

    // Verificar contraseña
    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.nombre_rol },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    return NextResponse.json({ token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el login' }, { status: 500 });
  }
}
