import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Section } from '@/types';

// Hook para obtener todas las secciones
export const useSections = () => {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async (): Promise<Section[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.sections.list);
      return data;
    },
  });
};

// Hook para obtener secciones activas
export const useActiveSections = () => {
  return useQuery({
    queryKey: ['sections', 'active'],
    queryFn: async (): Promise<Section[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.sections.active);
      return data;
    },
  });
};

// Hook para obtener una sección por ID
export const useSection = (id: string) => {
  return useQuery({
    queryKey: ['sections', id],
    queryFn: async (): Promise<Section> => {
      const { data } = await apiClient.get(API_ENDPOINTS.sections.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear sección
export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionData: Partial<Section>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.sections.create, sectionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
};

// Hook para actualizar sección
export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Section>) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.sections.update(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['sections', variables.id] });
    },
  });
};

// Hook para toggle activo/inactivo
export const useToggleSectionActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.sections.toggleActive(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['sections', id] });
    },
  });
};

// Hook para eliminar sección
export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.sections.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
};

