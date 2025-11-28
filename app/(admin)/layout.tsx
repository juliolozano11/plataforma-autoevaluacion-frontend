'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProfile } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';
import { Loading } from '@/components/ui/loading';

export default function AdminLayout({
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

    // Si hay usuario pero no es admin, redirigir
    if (user && user.role !== 'admin') {
      router.push('/student');
      return;
    }

    // Si no hay usuario después de cargar el perfil, redirigir a login
    if (!user && !profileLoading) {
      router.push('/auth/login');
    }
  }, [user, isAuthenticated, accessToken, router, isInitializing, profileLoading]);

  if (isInitializing || profileLoading || !accessToken || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

