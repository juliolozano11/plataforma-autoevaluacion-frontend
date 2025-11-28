import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Questionnaire } from '@/types';

// Hook para obtener todos los cuestionarios
export const useQuestionnaires = (sectionId?: string) => {
  return useQuery({
    queryKey: ['questionnaires', sectionId],
    queryFn: async (): Promise<Questionnaire[]> => {
      const url = sectionId
        ? `${API_ENDPOINTS.questionnaires.list}?sectionId=${sectionId}`
        : API_ENDPOINTS.questionnaires.list;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener cuestionarios activos
export const useActiveQuestionnaires = (sectionId?: string) => {
  return useQuery({
    queryKey: ['questionnaires', 'active', sectionId],
    queryFn: async (): Promise<Questionnaire[]> => {
      const url = sectionId
        ? `${API_ENDPOINTS.questionnaires.active}?sectionId=${sectionId}`
        : API_ENDPOINTS.questionnaires.active;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener un cuestionario por ID
export const useQuestionnaire = (id: string) => {
  return useQuery({
    queryKey: ['questionnaires', id],
    queryFn: async (): Promise<Questionnaire> => {
      const { data } = await apiClient.get(API_ENDPOINTS.questionnaires.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear cuestionario
export const useCreateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionnaireData: Partial<Questionnaire>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.questionnaires.create, questionnaireData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
  });
};

// Hook para actualizar cuestionario
export const useUpdateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Questionnaire>) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.questionnaires.update(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['questionnaires', variables.id] });
    },
  });
};

// Hook para toggle activo/inactivo
export const useToggleQuestionnaireActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.questionnaires.toggleActive(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['questionnaires', id] });
    },
  });
};

// Hook para eliminar cuestionario
export const useDeleteQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.questionnaires.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
  });
};

