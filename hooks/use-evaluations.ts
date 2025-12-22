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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // No refetch al reconectar
    staleTime: 60000, // Considerar los datos frescos por 60 segundos (aumentado)
    gcTime: 300000, // Mantener en cache por 5 minutos (antes cacheTime)
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
    mutationFn: async (evaluationData: { sectionId: string; questionnaireId?: string }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.evaluations.create, evaluationData);
      return data;
    },
    onSuccess: (data, variables) => {
      // Actualizar el cache específico de la sección
      queryClient.setQueryData(['evaluations', variables.sectionId], (old: any) => {
        if (Array.isArray(old)) {
          return [...old, data];
        }
        return [data];
      });
      
      // También actualizar el cache general (sin sectionId) para que aparezca en la lista principal
      queryClient.setQueryData(['evaluations'], (old: any) => {
        if (Array.isArray(old)) {
          // Verificar si ya existe para evitar duplicados
          const exists = old.some((e: any) => e._id === data._id);
          if (!exists) {
            return [...old, data];
          }
          return old;
        }
        return [data];
      });
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
    onSuccess: (data, id) => {
      // Actualizar directamente el cache en lugar de invalidar para evitar re-fetches
      queryClient.setQueryData(['evaluations'], (old: any) => {
        if (Array.isArray(old)) {
          return old.map((e: any) => 
            e._id === id ? { ...e, ...data } : e
          );
        }
        return old;
      });
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
    onSuccess: (data, variables) => {
      // Actualizar directamente el cache en lugar de invalidar para evitar re-fetches
      queryClient.setQueryData(['evaluations'], (old: any) => {
        if (Array.isArray(old)) {
          return old.map((e: any) => 
            e._id === variables.evaluationId ? { ...e, ...data } : e
          );
        }
        return old;
      });
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

