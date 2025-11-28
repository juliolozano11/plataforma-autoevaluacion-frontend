import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { EvaluationConfig } from '@/types';

// Hook para obtener todas las configuraciones
export const useEvaluationConfigs = (sectionId?: string) => {
  return useQuery({
    queryKey: ['evaluation-config', sectionId],
    queryFn: async (): Promise<EvaluationConfig[]> => {
      const url = sectionId
        ? `${API_ENDPOINTS.evaluationConfig.list}?sectionId=${sectionId}`
        : API_ENDPOINTS.evaluationConfig.list;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener una configuración por ID
export const useEvaluationConfig = (id: string) => {
  return useQuery({
    queryKey: ['evaluation-config', id],
    queryFn: async (): Promise<EvaluationConfig> => {
      const { data } = await apiClient.get(API_ENDPOINTS.evaluationConfig.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear configuración
export const useCreateEvaluationConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configData: Partial<EvaluationConfig>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluationConfig.create, configData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-config'] });
    },
  });
};

// Hook para actualizar configuración
export const useUpdateEvaluationConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<EvaluationConfig>) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.evaluationConfig.update(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-config'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-config', variables.id] });
    },
  });
};

// Hook para toggle activo/inactivo
export const useToggleEvaluationConfigActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.evaluationConfig.toggleActive(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-config'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-config', id] });
    },
  });
};

// Hook para eliminar configuración
export const useDeleteEvaluationConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.evaluationConfig.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-config'] });
    },
  });
};

