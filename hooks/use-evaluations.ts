import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Evaluation, SubmitAnswerDto } from '@/types';

// Hook para obtener evaluaciones del usuario
export const useEvaluations = (sectionId?: string) => {
  return useQuery({
    queryKey: ['evaluations', sectionId],
    queryFn: async (): Promise<Evaluation[]> => {
      const url = sectionId
        ? `${API_ENDPOINTS.evaluations.list}?sectionId=${sectionId}`
        : API_ENDPOINTS.evaluations.list;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener una evaluación por ID
export const useEvaluation = (id: string) => {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: async (): Promise<Evaluation> => {
      const { data } = await apiClient.get(API_ENDPOINTS.evaluations.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear evaluación
export const useCreateEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evaluationData: { sectionId: string }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluations.create, evaluationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
};

// Hook para iniciar evaluación
export const useStartEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluations.start(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', id] });
    },
  });
};

// Hook para enviar respuesta
export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evaluationId, answer }: { evaluationId: string; answer: SubmitAnswerDto }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluations.submitAnswer(evaluationId), answer);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', variables.evaluationId] });
    },
  });
};

// Hook para completar evaluación
export const useCompleteEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluations.complete(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', id] });
    },
  });
};

