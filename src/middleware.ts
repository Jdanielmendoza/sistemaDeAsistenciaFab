import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// Rutas protegidas
const protectedRoutes = ['/api/volunteers', '/api/registrations'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Si la ruta no es protegida, continuar sin validar el token
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Obtener el token del header Authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.headers.set('user', JSON.stringify(decoded)); 
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 403 });
  }
}

// Aplicar middleware solo en API routes
export const config = {
  matcher: ['/api/:path*'],
};
