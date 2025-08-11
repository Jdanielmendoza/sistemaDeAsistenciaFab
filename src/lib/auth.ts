import { jwtVerify, type JWTPayload } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'supersecretkey');

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}
