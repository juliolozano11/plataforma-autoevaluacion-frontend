import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Hook para cargar preguntas desde archivo
export const useUploadQuestions = () => {
  return useMutation({
    mutationFn: async ({ file, questionnaireId, format }: { file: File; questionnaireId: string; format: 'excel' | 'csv' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionnaireId', questionnaireId);
      formData.append('format', format);

      const { data } = await apiClient.post(API_ENDPOINTS.upload.questions, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
};

// Hook para obtener información del formato esperado
export const useFormatInfo = (format: 'excel' | 'csv') => {
  return useQuery({
    queryKey: ['upload', 'format-info', format],
    queryFn: async () => {
      const { data } = await apiClient.post(API_ENDPOINTS.upload.formatInfo, { format });
      return data;
    },
    enabled: !!format,
  });
};

