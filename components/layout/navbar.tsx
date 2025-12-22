'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserProfile } from './user-profile';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

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
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

