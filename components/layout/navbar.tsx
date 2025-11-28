'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-auth';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();

  const isAdmin = user?.role === 'admin';

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/sections', label: 'Secciones' },
    { href: '/admin/questionnaires', label: 'Cuestionarios' },
    { href: '/admin/questions', label: 'Preguntas' },
    { href: '/admin/reports', label: 'Reportes' },
    { href: '/admin/upload', label: 'Cargar Archivos' },
  ];

  const studentLinks = [
    { href: '/student', label: 'Dashboard' },
    { href: '/student/evaluations', label: 'Mis Evaluaciones' },
    { href: '/student/reports', label: 'Mis Resultados' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout.mutateAsync();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                Autoevaluación UG
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              <span className="text-gray-500 ml-2">({user?.email})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              {logout.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

