'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useLevelsDistribution, useProgressPanel } from '@/hooks/use-reports';
import { useSections } from '@/hooks/use-sections';
import { useStudents } from '@/hooks/use-users';
import { SectionDistribution } from '@/types';
import { useState } from 'react';

export default function ReportsPage() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  const { data: sections } = useSections();
  const { data: progress, isLoading: progressLoading } = useProgressPanel(
    selectedSectionId || undefined
  );
  const { data: distribution, isLoading: distributionLoading } =
    useLevelsDistribution();
  const { data: students } = useStudents(
    selectedCareer || undefined,
    selectedCourse || undefined
  );

  const careers = Array.from(
    new Set(students?.map((s) => s.career).filter(Boolean) || [])
  );
  const courses = Array.from(
    new Set(
      students
        ?.filter((s) => !selectedCareer || s.career === selectedCareer)
        .map((s) => s.course)
        .filter(Boolean) || []
    )
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Reportes y Estadísticas
        </h1>
        <p className='mt-2 text-gray-600'>
          Visualiza reportes individuales, grupales y estadísticas generales
        </p>
      </div>

      {/* Panel de Progreso */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Panel de Progreso
          </h2>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white'
          >
            <option value=''>Todas las secciones</option>
            {sections?.map((section) => (
              <option key={section._id} value={section._id}>
                {section.displayName}
              </option>
            ))}
          </select>
        </div>

        {progressLoading ? (
          <Loading />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <p className='text-sm text-gray-600'>Total de Evaluaciones</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>
                {progress?.totalEvaluations || 0}
              </p>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <p className='text-sm text-gray-600'>Completadas</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>
                {progress?.completedEvaluations || 0}
              </p>
            </div>
            <div className='text-center p-4 bg-yellow-50 rounded-lg'>
              <p className='text-sm text-gray-600'>En Progreso</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>
                {progress?.inProgressEvaluations || 0}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Distribución de Niveles */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Distribución de Niveles por Competencia
        </h2>
        {distributionLoading ? (
          <Loading />
        ) : (
          <div className='space-y-4'>
            {distribution?.sections?.map(
              (sectionDist: SectionDistribution, index: number) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                >
                  <h3 className='font-medium text-gray-900 mb-3'>
                    {sectionDist.sectionName || `Sección ${index + 1}`}
                  </h3>
                  <div className='grid grid-cols-5 gap-2'>
                    {(
                      [
                        'muy_bajo',
                        'bajo',
                        'intermedio',
                        'alto',
                        'muy_alto',
                      ] as const
                    ).map((level) => (
                      <div key={level} className='text-center'>
                        <p className='text-2xl font-bold text-gray-900'>
                          {sectionDist.levels?.[level] || 0}
                        </p>
                        <p className='text-xs text-gray-500 capitalize mt-1'>
                          {level.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* Filtros para Reportes Grupales */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Reportes Grupales
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Carrera
            </label>
            <select
              value={selectedCareer}
              onChange={(e) => {
                setSelectedCareer(e.target.value);
                setSelectedCourse('');
              }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white'
            >
              <option value=''>Todas las carreras</option>
              {careers.map((career) => (
                <option key={career} value={career}>
                  {career}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Curso
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white'
              disabled={!selectedCareer}
            >
              <option value=''>Todos los cursos</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-end'>
            <Button
              onClick={() => {
                // Aquí se implementaría la navegación a reporte grupal
                alert('Funcionalidad de reporte grupal en desarrollo');
              }}
              disabled={!selectedCareer}
            >
              Ver Reporte Grupal
            </Button>
          </div>
        </div>
      </Card>

      {/* Acciones Rápidas */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Acciones Rápidas
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Button variant='outline' className='justify-start'>
            📊 Exportar Reporte General
          </Button>
          <Button variant='outline' className='justify-start'>
            📈 Ver Estadísticas Detalladas
          </Button>
        </div>
      </Card>
    </div>
  );
}
