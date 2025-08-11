import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { JWT_SECRET_STRING } from '@/lib/env';

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Login endpoint
 * Body: { email: string; password: string }
 * Response (200): { token: string; user: { id: string; name: string; email: string; role: string } }
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Verify user exists (any role) – join to get role name in one query
    const result = await query(
      `SELECT u.id_user, u.name, u.email, u.password, r.name AS role_name
       FROM Users u
       INNER JOIN Role r ON u.id_role = r.id
       WHERE u.email = $1 AND r.name = 'Administrador'`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found or not an administrator' }, { status: 401 });
    }

    const user = result.rows[0];

    // 2. Validate password (hashed with bcrypt)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Generate JWT token using jose
    const token = await new SignJWT({
      id_user: user.id_user,
      name: user.name,
      email: user.email,
      role: user.role_name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(SECRET_KEY);

    // 4. Set httpOnly cookie and return token & user payload (omit password)
    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id_user,
          name: user.name,
          email: user.email,
          role: user.role_name,
        },
      },
      { status: 200 }
    );

    // Determine if the request is HTTPS (behind proxy or direct)
    const url = new URL(req.url);
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || url.protocol === 'https:';

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login error' }, { status: 500 });
  }
}
