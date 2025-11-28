'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthInitializer() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Inicializar el store desde localStorage al montar
    initialize();
  }, [initialize]);

  return null;
}

