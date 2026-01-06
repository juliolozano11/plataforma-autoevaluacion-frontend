import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Question } from '@/types';

// Hook para obtener todas las preguntas
export const useQuestions = (questionnaireId?: string) => {
  return useQuery({
    queryKey: ['questions', questionnaireId],
    queryFn: async (): Promise<Question[]> => {
      if (questionnaireId) {
        // Si hay questionnaireId, filtrar por ese cuestionario
        const url = `${API_ENDPOINTS.questions.list}?questionnaireId=${questionnaireId}`;
        const { data } = await apiClient.get(url);
        return data;
      } else {
        // Si no hay questionnaireId, obtener todas las preguntas
        const { data } = await apiClient.get(API_ENDPOINTS.questions.list);
        return data;
      }
    },
  });
};

// Hook para obtener una pregunta por ID
export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: async (): Promise<Question> => {
      const { data } = await apiClient.get(API_ENDPOINTS.questions.byId(id));
      return data;
    },
    enabled: !!id,
  });
};

// Hook para crear pregunta
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionData: Partial<Question>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.questions.create, questionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

// Hook para crear múltiples preguntas
export const useBulkCreateQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionnaireId, questions }: { questionnaireId: string; questions: Omit<Partial<Question>, 'questionnaireId'>[] }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.questions.bulkCreate, {
        questionnaireId,
        questions,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

// Hook para actualizar pregunta
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Question>) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.questions.update(id), updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', variables.id] });
    },
  });
};

// Hook para reordenar preguntas
export const useReorderQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionnaireId, questionIds }: { questionnaireId: string; questionIds: string[] }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.questions.reorder, {
        questionnaireId,
        questionIds,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

// Hook para toggle activo/inactivo
export const useToggleQuestionActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(API_ENDPOINTS.questions.toggleActive(id));
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
    },
  });
};

// Hook para eliminar pregunta
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.questions.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

