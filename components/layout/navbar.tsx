'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { UserProfile } from './user-profile';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const isAdmin = user?.role === 'admin';

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear fecha y hora
  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return { date: dateStr, time: timeStr };
  };

  // Solo mostrar enlaces en el navbar para estudiantes
  const studentLinks = [
    { href: '/student', label: 'Dashboard' },
    { href: '/student/evaluations', label: 'Mis Evaluaciones' },
    { href: '/student/reports', label: 'Mis Resultados' },
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={isAdmin ? '/admin' : '/student'} className="text-xl font-bold text-indigo-600">
              Autoevaluación UG
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                Fecha: {formatDateTime(currentDateTime).date}
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-medium">
                Hora: {formatDateTime(currentDateTime).time}
              </span>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

