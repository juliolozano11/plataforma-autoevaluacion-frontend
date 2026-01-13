'use client';

import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/questionnaires', label: 'Cuestionarios', icon: '📝' },
    { href: '/admin/reports', label: 'Reportes', icon: '📈' },
  ];

  return (
    <aside className='hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-40'>
      <nav className='p-4 space-y-1'>
        {menuItems.map((item) => {
          // Para el dashboard, solo activo si es exactamente la ruta
          // Para otros, activo si la ruta empieza con el href
          const isActive =
            item.href === '/admin'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className='text-xl'>{item.icon}</span>
              <span className='text-sm'>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
