import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Evaluation, SubmitAnswerDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Hook para obtener evaluaciones del usuario
export const useEvaluations = (sectionId?: string) => {
  return useQuery({
    queryKey: ['evaluations', sectionId],
    queryFn: async (): Promise<Evaluation[]> => {
      try {
        const url = sectionId
          ? `${API_ENDPOINTS.evaluations.list}?sectionId=${sectionId}`
          : API_ENDPOINTS.evaluations.list;
        const { data } = await apiClient.get(url);
        // Asegurar que siempre retornamos un array
        // Si el backend retorna un objeto único (cuando se filtra por sectionId), convertirlo a array
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object' && data !== null) {
          // Si es un objeto único, convertirlo a array
          return [data];
        } else {
          // Si es null, undefined, string vacío, etc., retornar array vacío
          return [];
        }
      } catch (error) {
        console.error('Error al obtener evaluaciones:', error);
        return [];
      }
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
      const { data } = await apiClient.post(
        API_ENDPOINTS.evaluations.create,
        evaluationData
      );
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
      const { data } = await apiClient.post(
        API_ENDPOINTS.evaluations.start(id)
      );
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
    mutationFn: async ({
      evaluationId,
      answer,
    }: {
      evaluationId: string;
      answer: SubmitAnswerDto;
    }) => {
      const { data } = await apiClient.post(
        API_ENDPOINTS.evaluations.submitAnswer(evaluationId),
        answer
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({
        queryKey: ['evaluations', variables.evaluationId],
      });
    },
  });
};

// Hook para completar evaluación
export const useCompleteEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data } = await apiClient.post(
          API_ENDPOINTS.evaluations.complete(id),
          {} // Body vacío para POST
        );
        return data;
      } catch (error) {
        console.error('Error al completar evaluación:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as {
            response?: { status?: number; data?: any };
          };
          console.error('Status:', axiosError.response?.status);
          console.error('Data:', axiosError.response?.data);
          console.error(
            'URL intentada:',
            API_ENDPOINTS.evaluations.complete(id)
          );
          console.error('Base URL:', apiClient.defaults.baseURL);
        }
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', id] });
    },
  });
};
