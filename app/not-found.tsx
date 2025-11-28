'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Ir al Inicio</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

