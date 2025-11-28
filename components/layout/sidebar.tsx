'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const adminItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/sections', label: 'Secciones', icon: '📁' },
    { href: '/admin/questionnaires', label: 'Cuestionarios', icon: '📝' },
    { href: '/admin/questions', label: 'Preguntas', icon: '❓' },
    { href: '/admin/reports', label: 'Reportes', icon: '📈' },
    { href: '/admin/upload', label: 'Cargar Archivos', icon: '📤' },
  ];

  const studentItems: NavItem[] = [
    { href: '/student', label: 'Dashboard', icon: '📊' },
    { href: '/student/evaluations', label: 'Mis Evaluaciones', icon: '📋' },
    { href: '/student/reports', label: 'Mis Resultados', icon: '📈' },
  ];

  const items = isAdmin ? adminItems : studentItems;

  return (
    <aside className={cn('w-64 bg-white border-r border-gray-200 min-h-screen', className)}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isAdmin ? 'Panel de Administración' : 'Panel de Estudiante'}
        </h2>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

