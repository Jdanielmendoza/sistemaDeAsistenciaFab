'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-purple via-brand-indigo to-brand-teal text-white p-6 text-center">
      <Construction className="w-16 h-16 mb-6 animate-bounce" />
      <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">404</h1>
      <p className="text-xl mb-8 max-w-md">🚧 Ups! Esta página todavía no está disponible, pero pronto estará lista.</p>
      <Button asChild variant="secondary" className="bg-white text-brand-indigo hover:bg-brand-teal/80 hover:text-white">
        <Link href="/dashboard">Regresar al Dashboard</Link>
      </Button>
    </div>
  );
} 