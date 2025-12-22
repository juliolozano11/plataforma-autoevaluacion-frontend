import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Career } from '@/types';

// Hook para obtener todas las carreras
export const useCareers = () => {
  return useQuery({
    queryKey: ['careers'],
    queryFn: async (): Promise<Career[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.careers.list);
      return data;
    },
  });
};

// Hook para obtener carreras activas
export const useActiveCareers = () => {
  return useQuery({
    queryKey: ['careers', 'active'],
    queryFn: async (): Promise<Career[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.careers.active);
      return data;
    },
  });
};

// Hook para obtener una carrera por ID
export const useCareer = (id: string) => {
  return useQuery({
    queryKey: ['careers', id],
    queryFn: async (): Promise<Career> => {
      const { data } = await apiClient.get(API_ENDPOINTS.careers.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear carrera
export const useCreateCareer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (careerData: Partial<Career>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.careers.create, careerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
    },
  });
};

// Hook para actualizar carrera
export const useUpdateCareer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Career>) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.careers.update(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['careers', variables.id] });
    },
  });
};

// Hook para toggle activo/inactivo
export const useToggleCareerActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.careers.toggleActive(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['careers', id] });
    },
  });
};

// Hook para eliminar carrera
export const useDeleteCareer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.careers.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
    },
  });
};

