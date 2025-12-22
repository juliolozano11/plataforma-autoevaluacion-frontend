'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProfile } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import { Loading } from '@/components/ui/loading';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, initialize } = useAuthStore();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializar el store al montar y esperar hidratación
  useEffect(() => {
    initialize();
    // Zustand persist necesita tiempo para hidratarse
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [initialize]);

  useEffect(() => {
    if (isInitializing) return;

    // Si no hay token, redirigir a login
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }

    // Si hay token pero no hay usuario y el perfil está cargando, esperar
    if (!user && profileLoading) {
      return;
    }

    // Si hay usuario pero es admin, redirigir
    if (user && user.role === 'admin') {
      router.push('/admin');
      return;
    }

    // Si no hay usuario después de cargar el perfil, redirigir a login
    if (!user && !profileLoading) {
      router.push('/auth/login');
    }
  }, [user, isAuthenticated, accessToken, router, isInitializing, profileLoading]);

  if (isInitializing || profileLoading || !accessToken || !user || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <StudentSidebar />
      <main className="pt-16 lg:pl-64">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

