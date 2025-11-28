import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Hook para obtener reporte individual
export const useIndividualReport = (userId?: string) => {
  return useQuery({
    queryKey: ['reports', 'individual', userId],
    queryFn: async () => {
      const url = userId
        ? API_ENDPOINTS.reports.individualById(userId)
        : API_ENDPOINTS.reports.individual;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener reporte grupal por carrera
export const useGroupReportByCareer = (career: string, sectionId?: string) => {
  return useQuery({
    queryKey: ['reports', 'group', 'career', career, sectionId],
    queryFn: async () => {
      const url = sectionId
        ? `${API_ENDPOINTS.reports.groupByCareer}?career=${career}&sectionId=${sectionId}`
        : `${API_ENDPOINTS.reports.groupByCareer}?career=${career}`;
      const { data } = await apiClient.get(url);
      return data;
    },
    enabled: !!career,
  });
};

// Hook para obtener reporte grupal por curso
export const useGroupReportByCourse = (career: string, course: string, sectionId?: string) => {
  return useQuery({
    queryKey: ['reports', 'group', 'course', career, course, sectionId],
    queryFn: async () => {
      const url = sectionId
        ? `${API_ENDPOINTS.reports.groupByCourse}?career=${career}&course=${course}&sectionId=${sectionId}`
        : `${API_ENDPOINTS.reports.groupByCourse}?career=${career}&course=${course}`;
      const { data } = await apiClient.get(url);
      return data;
    },
    enabled: !!career && !!course,
  });
};

// Hook para obtener panel de progreso
export const useProgressPanel = (sectionId?: string) => {
  return useQuery({
    queryKey: ['reports', 'progress', sectionId],
    queryFn: async () => {
      const url = sectionId
        ? `${API_ENDPOINTS.reports.progress}?sectionId=${sectionId}`
        : API_ENDPOINTS.reports.progress;
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook para obtener distribución de niveles
export const useLevelsDistribution = () => {
  return useQuery({
    queryKey: ['reports', 'levels-distribution'],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.reports.levelsDistribution);
      return data;
    },
  });
};

