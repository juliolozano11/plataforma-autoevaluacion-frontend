import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Función auxiliar para descargar archivos
const downloadFile = async (url: string, filename: string) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      credentials: 'include',
    });

    // Verificar si la respuesta es un error (JSON) en lugar de un archivo
    const contentType = response.headers.get('content-type');
    if (!response.ok || (contentType && contentType.includes('application/json'))) {
      // Intentar leer el error como JSON
      let errorMessage = 'Error al descargar el archivo';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si no es JSON, usar el mensaje por defecto
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta sea un archivo Excel
    if (!contentType || !contentType.includes('spreadsheetml')) {
      // Puede ser un error en formato HTML o texto
      const text = await response.text();
      if (text.includes('error') || text.includes('Error') || text.includes('<!DOCTYPE')) {
        throw new Error('El servidor devolvió un error en lugar del archivo');
      }
    }

    const blob = await response.blob();
    
    // Verificar que el blob no esté vacío
    if (blob.size === 0) {
      throw new Error('El archivo descargado está vacío');
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    throw error;
  }
};

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

// Función para exportar reporte general
export const exportGeneralReport = async () => {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://plataforma-autoevaluacion-backend-production.up.railway.app/api';
  const url = `${API_URL}${API_ENDPOINTS.reports.exportGeneral}`;
  const filename = `reporte-general-${new Date().toISOString().split('T')[0]}.xlsx`;
  await downloadFile(url, filename);
};

// Función para exportar reporte grupal por carrera
export const exportGroupReportByCareer = async (
  career: string,
  sectionId?: string
) => {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://plataforma-autoevaluacion-backend-production.up.railway.app/api';
  let url = `${API_URL}${API_ENDPOINTS.reports.exportGroupByCareer}?career=${encodeURIComponent(career)}`;
  if (sectionId) {
    url += `&sectionId=${encodeURIComponent(sectionId)}`;
  }
  const filename = `reporte-grupal-carrera-${career}-${new Date().toISOString().split('T')[0]}.xlsx`;
  await downloadFile(url, filename);
};

// Función para exportar reporte grupal por curso
export const exportGroupReportByCourse = async (
  career: string,
  course: string,
  sectionId?: string
) => {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://plataforma-autoevaluacion-backend-production.up.railway.app/api';
  let url = `${API_URL}${API_ENDPOINTS.reports.exportGroupByCourse}?career=${encodeURIComponent(career)}&course=${encodeURIComponent(course)}`;
  if (sectionId) {
    url += `&sectionId=${encodeURIComponent(sectionId)}`;
  }
  const filename = `reporte-grupal-curso-${career}-${course}-${new Date().toISOString().split('T')[0]}.xlsx`;
  await downloadFile(url, filename);
};

