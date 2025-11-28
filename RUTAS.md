# Rutas de la Aplicación

## Rutas Públicas (Sin Autenticación)

- `/auth/login` - Página de inicio de sesión
- `/auth/register` - Página de registro

## Rutas de Administrador

Todas las rutas de admin requieren autenticación y rol de administrador.

- `/admin` - Dashboard de administración
- `/admin/sections` - Gestión de secciones
- `/admin/questionnaires` - Gestión de cuestionarios
- `/admin/questions` - Gestión de preguntas (puede filtrarse por `?questionnaireId=xxx`)
- `/admin/reports` - Reportes y estadísticas
- `/admin/upload` - Carga de archivos Excel/CSV

## Rutas de Estudiante

Todas las rutas de estudiante requieren autenticación y rol de estudiante.

- `/student` - Dashboard del estudiante
- `/student/evaluations` - Lista de evaluaciones
- `/student/evaluations/[sectionId]` - Página de evaluación dinámica
- `/student/reports/[evaluationId]` - Reporte individual de evaluación

## Rutas Especiales

- `/` - Redirige según autenticación y rol:
  - Si no está autenticado → `/auth/login`
  - Si es admin → `/admin`
  - Si es estudiante → `/student`

## Protección de Rutas

El middleware (`middleware.ts`) protege automáticamente:
- Redirige a `/auth/login` si no hay token y se intenta acceder a rutas protegidas
- Redirige a `/` si hay token y se intenta acceder a rutas públicas

Los layouts también validan:
- `(admin)/layout.tsx` - Solo permite acceso a usuarios con rol `admin`
- `(student)/layout.tsx` - Solo permite acceso a usuarios con rol `student`

