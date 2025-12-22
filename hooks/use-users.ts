import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { User, RegisterData } from '@/types';

// Hook para obtener todos los usuarios (Solo Admin)
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.users.list);
      return data;
    },
  });
};

// Hook para obtener estudiantes
export const useStudents = (career?: string, course?: string) => {
  return useQuery({
    queryKey: ['users', 'students', career, course],
    queryFn: async (): Promise<User[]> => {
      let url = API_ENDPOINTS.users.students;
      const params = new URLSearchParams();
      if (career) params.append('career', career);
      if (course) params.append('course', course);
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener un usuario por ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get(API_ENDPOINTS.users.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear usuario (Solo Admin)
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<User> => {
      const { data } = await apiClient.post(API_ENDPOINTS.auth.register, userData);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook para actualizar usuario
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<User>) => {
      const { data } = await apiClient.put(API_ENDPOINTS.users.byId(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

// Hook para eliminar usuario
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.users.byId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
