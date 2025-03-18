import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';

// GET: Obtener todos los registros de asistencia
export async function GET() {
  try {
    const result = await query('SELECT * FROM Registro ORDER BY fecha DESC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo registros' }, { status: 500 });
  }
}

// POST: Registrar una nueva entrada
export async function POST(req: Request) {
  try {
    const { id_usuario } = await req.json();
    const newRegistroId = uuidv4();
    const fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const hora_entrada = new Date().toISOString().split('T')[1].split('.')[0]; // Formato HH:MM:SS

    // Verificar si el usuario ya tiene una entrada sin salida
    const existingEntry = await query(
      'SELECT * FROM Registro WHERE id_usuario = $1 AND fecha = $2 AND hora_salida IS NULL',
      [id_usuario, fecha]
    );

    if (existingEntry.rows.length > 0) {
      return NextResponse.json({ error: 'El usuario ya tiene una entrada sin salida' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO Registro (id_registro, id_usuario, fecha, hora_entrada) VALUES ($1, $2, $3, $4) RETURNING *',
      [newRegistroId, id_usuario, fecha, hora_entrada]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error registrando entrada' }, { status: 500 });
  }
}

// PUT: Registrar una salida
export async function PUT(req: Request) {
  try {
    const { id_usuario } = await req.json();
    const fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const hora_salida = new Date().toISOString().split('T')[1].split('.')[0]; // Formato HH:MM:SS

    // Buscar el último registro de entrada sin salida
    const result = await query(
      'UPDATE Registro SET hora_salida = $1, horas_totales = hora_salida - hora_entrada WHERE id_usuario = $2 AND fecha = $3 AND hora_salida IS NULL RETURNING *',
      [hora_salida, id_usuario, fecha]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'No hay entrada registrada para este usuario' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error registrando salida' }, { status: 500 });
  }
}
