import { NextResponse } from 'next/server';

// Endpoint para obtener información del usuario autenticado
export async function GET(req: Request) {
  try {
    const user = req.headers.get('user');

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const userData = JSON.parse(user);
    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo datos del usuario' }, { status: 500 });
  }
}
