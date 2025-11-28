import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

// Hook para login
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const { data } = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data);
      queryClient.setQueryData(['user'], data.user);
      router.push(data.user.role === 'admin' ? '/admin' : '/student');
    },
  });
};

// Hook para registro
export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (registerData: RegisterData): Promise<AuthResponse> => {
      const { data } = await apiClient.post(API_ENDPOINTS.auth.register, registerData);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data);
      queryClient.setQueryData(['user'], data.user);
      router.push(data.user.role === 'admin' ? '/admin' : '/student');
    },
  });
};

// Hook para obtener perfil
export const useProfile = () => {
  const { user, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get(API_ENDPOINTS.auth.profile);
      return data;
    },
    enabled: !!user,
  });

  // Actualizar store cuando los datos cambien
  if (query.data) {
    setUser(query.data);
  }

  return query;
};

// Hook para logout
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Aquí podrías hacer una llamada al backend para invalidar el token
      // Por ahora solo limpiamos el estado local
      return Promise.resolve();
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      router.push('/auth/login');
    },
  });
};

