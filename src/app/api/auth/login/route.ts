import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

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

    // 3. Generate JWT token
    const token = jwt.sign(
      { id_user: user.id_user, name: user.name, email: user.email, role: user.role_name },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    // 4. Return token & user payload (omit password)
    return NextResponse.json(
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login error' }, { status: 500 });
  }
}
