import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true }, { status: 200 });

  const url = new URL(req.url);
  const isHttps = req.headers.get('x-forwarded-proto') === 'https' || url.protocol === 'https:';

  res.cookies.set('token', '', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
