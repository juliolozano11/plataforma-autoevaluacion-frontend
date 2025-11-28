'use client';

import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useQuestionnaires } from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import { useStudents } from '@/hooks/use-users';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: sections, isLoading: sectionsLoading } = useSections();
  const { data: questionnaires, isLoading: questionnairesLoading } =
    useQuestionnaires();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();

  const stats = {
    sections: sections?.length || 0,
    questionnaires: questionnaires?.length || 0,
    students: students?.length || 0,
    evaluations: evaluations?.length || 0,
  };

  const isLoading =
    sectionsLoading ||
    questionnairesLoading ||
    studentsLoading ||
    evaluationsLoading;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Dashboard de Administración
        </h1>
        <p className='mt-2 text-gray-600'>
          Bienvenido al panel de administración de la plataforma de
          autoevaluación
        </p>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Loading size='lg' />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center'>
                    <span className='text-2xl'>📁</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>Secciones</p>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.sections}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <span className='text-2xl'>📝</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Cuestionarios
                  </p>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.questionnaires}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <span className='text-2xl'>👥</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Estudiantes
                  </p>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.students}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <span className='text-2xl'>📊</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Evaluaciones
                  </p>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.evaluations}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card className='p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Acciones Rápidas
              </h2>
              <div className='space-y-3'>
                <Link
                  href='/admin/sections'
                  className='block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-gray-900 hover:text-indigo-900'
                >
                  ➕ Crear Nueva Sección
                </Link>
                <Link
                  href='/admin/upload'
                  className='block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-gray-900 hover:text-indigo-900'
                >
                  📤 Cargar Preguntas desde Archivo
                </Link>
                <Link
                  href='/admin/config'
                  className='block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-gray-900 hover:text-indigo-900'
                >
                  ⚙️ Configurar Indicadores
                </Link>
                <Link
                  href='/admin/reports'
                  className='block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-gray-900 hover:text-indigo-900'
                >
                  📈 Ver Reportes
                </Link>
              </div>
            </Card>

            <Card className='p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Resumen
              </h2>
              <div className='space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Secciones activas:</span>
                  <span className='font-medium'>
                    {sections?.filter((s) => s.isActive).length || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Cuestionarios activos:</span>
                  <span className='font-medium'>
                    {questionnaires?.filter((q) => q.isActive).length || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    Evaluaciones completadas:
                  </span>
                  <span className='font-medium'>
                    {evaluations?.filter((e) => e.status === 'completed')
                      .length || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    Evaluaciones en progreso:
                  </span>
                  <span className='font-medium'>
                    {evaluations?.filter((e) => e.status === 'in_progress')
                      .length || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
