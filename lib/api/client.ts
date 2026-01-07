import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://plataforma-autoevaluacion-backend-production.up.railway.app/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Intentar obtener el token de localStorage primero
      let token = localStorage.getItem('accessToken');
      
      // Si no hay token en localStorage, intentar obtenerlo del store de Zustand
      if (!token) {
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            token = parsed?.state?.accessToken;
            if (token) {
              // Sincronizar con localStorage para futuras peticiones
              localStorage.setItem('accessToken', token);
            }
          }
        } catch (e) {
          console.warn('[API Client] Error al leer auth-storage:', e);
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Log para debug: si no hay token, podría ser un problema
        console.warn('[API Client] No se encontró accessToken para la petición:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log para debug
    if (error.response?.status === 401) {
      console.error('[API Client] Error 401 - No autorizado:', {
        url: originalRequest?.url,
        hasToken: !!localStorage.getItem('accessToken'),
        error: error.response?.data,
      });
    }

    // Si el error es 401 y no hemos intentado refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('[API Client] Intentando refrescar token...');
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          console.log('[API Client] Token refrescado exitosamente');

          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } else {
          console.warn('[API Client] No hay refreshToken disponible');
        }
      } catch (refreshError) {
        console.error('[API Client] Error al refrescar token:', refreshError);
        // Si el refresh falla, limpiar tokens y redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
