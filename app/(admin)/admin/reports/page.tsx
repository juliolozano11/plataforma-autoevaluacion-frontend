'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  exportGeneralReport,
  exportGroupReportByCareer,
  exportGroupReportByCourse,
  exportGroupReportByParallel,
  useProgressPanel,
} from '@/hooks/use-reports';
import { useSections } from '@/hooks/use-sections';
import { useStudents } from '@/hooks/use-users';
import { useState } from 'react';

export default function ReportsPage() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedParallel, setSelectedParallel] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: sections } = useSections();
  const { data: progress, isLoading: progressLoading } = useProgressPanel(
    selectedSectionId || undefined
  );

  // Obtener todos los estudiantes activos para los filtros
  const { data: allStudents } = useStudents();

  // Obtener carreras únicas de estudiantes activos
  const careers = Array.from(
    new Set(
      allStudents
        ?.filter((s) => s.isActive && s.career)
        .map((s) => s.career)
        .filter(Boolean) || []
    )
  ).sort();

  // Obtener cursos únicos según la carrera seleccionada
  const courses = Array.from(
    new Set(
      allStudents
        ?.filter(
          (s) =>
            s.isActive &&
            s.course &&
            (!selectedCareer || s.career === selectedCareer)
        )
        .map((s) => s.course)
        .filter(Boolean) || []
    )
  ).sort();

  // Obtener paralelos únicos según la carrera y curso seleccionados
  const parallels = Array.from(
    new Set(
      allStudents
        ?.filter(
          (s) =>
            s.isActive &&
            s.parallel &&
            (!selectedCareer || s.career === selectedCareer) &&
            (!selectedCourse || s.course === selectedCourse)
        )
        .map((s) => s.parallel)
        .filter(Boolean) || []
    )
  ).sort();

  // Manejar exportación de reporte general
  const handleExportGeneral = async () => {
    try {
      setIsExporting(true);
      await exportGeneralReport();
    } catch (error) {
      console.error('Error al exportar reporte general:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al exportar el reporte';
      alert(
        `Error al exportar el reporte: ${errorMessage}. Por favor, intenta nuevamente.`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Manejar exportación de reporte grupal
  const handleExportGroupReport = async () => {
    try {
      setIsExporting(true);
      if (
        selectedCareer &&
        selectedCourse &&
        selectedParallel &&
        selectedParallel !== 'all'
      ) {
        await exportGroupReportByParallel(
          selectedCareer,
          selectedCourse,
          selectedParallel,
          selectedSectionId || undefined
        );
      } else if (selectedCareer && selectedCourse) {
        // Si se selecciona "Todos los paralelos" o no se selecciona paralelo, usar reporte por curso
        await exportGroupReportByCourse(
          selectedCareer,
          selectedCourse,
          selectedSectionId || undefined
        );
      } else if (selectedCareer) {
        await exportGroupReportByCareer(
          selectedCareer,
          selectedSectionId || undefined
        );
      } else {
        alert('Por favor, selecciona al menos una carrera');
        setIsExporting(false);
        return;
      }
    } catch (error) {
      console.error('Error al exportar reporte grupal:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al exportar el reporte';
      alert(
        `Error al exportar el reporte: ${errorMessage}. Por favor, intenta nuevamente.`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Manejar ver estadísticas detalladas
  const handleViewDetailedStats = () => {
    // Por ahora, exportamos el reporte general con más detalles
    // En el futuro se podría crear una página dedicada
    handleExportGeneral();
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Reportes
        </h1>
        <p className='mt-2 text-gray-600'>
          Genera y exporta reportes grupales y generales de las evaluaciones
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
                {Array.isArray(progress)
                  ? progress.reduce(
                      (sum, item) =>
                        sum +
                        (item.completed || 0) +
                        (item.inProgress || 0) +
                        (item.pending || 0),
                      0
                    )
                  : progress?.totalEvaluations || 0}
              </p>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <p className='text-sm text-gray-600'>Completadas</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>
                {Array.isArray(progress)
                  ? progress.reduce(
                      (sum, item) => sum + (item.completed || 0),
                      0
                    )
                  : progress?.completedEvaluations || 0}
              </p>
            </div>
            <div className='text-center p-4 bg-yellow-50 rounded-lg'>
              <p className='text-sm text-gray-600'>En Progreso</p>
              <p className='text-3xl font-bold text-gray-900 mt-2'>
                {Array.isArray(progress)
                  ? progress.reduce(
                      (sum, item) => sum + (item.inProgress || 0),
                      0
                    )
                  : progress?.inProgressEvaluations || 0}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Distribución de Niveles */}
      {/* <Card className='p-6'>
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
      </Card> */}

      {/* Filtros para Reportes Grupales */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Reportes Grupales
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Carrera
            </label>
            <select
              value={selectedCareer}
              onChange={(e) => {
                setSelectedCareer(e.target.value);
                setSelectedCourse('');
                setSelectedParallel('');
              }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white'
            >
              <option value=''>Seleccionar</option>
              {careers.map((career) => (
                <option key={career} value={career}>
                  {career}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                !selectedCareer ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              Curso
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedParallel('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                !selectedCareer
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-900 bg-white'
              }`}
              disabled={!selectedCareer}
            >
              <option value=''>Seleccionar</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                !selectedCareer || !selectedCourse
                  ? 'text-gray-400'
                  : 'text-gray-700'
              }`}
            >
              Paralelo
            </label>
            <select
              value={selectedParallel}
              onChange={(e) => setSelectedParallel(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                !selectedCareer || !selectedCourse
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-900 bg-white'
              }`}
              disabled={!selectedCareer || !selectedCourse}
            >
              <option value=''>Seleccionar</option>
              <option value='all'>Todos los paralelos</option>
              {parallels.map((parallel) => (
                <option key={parallel} value={parallel}>
                  {parallel}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-end'>
            <Button
              onClick={handleExportGroupReport}
              disabled={!selectedCareer || isExporting}
            >
              {isExporting ? 'Exportando...' : 'Ver Reporte Grupal'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Configuraciones */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Configuraciones
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Button
            variant='outline'
            className='justify-start'
            onClick={handleExportGeneral}
            disabled={isExporting}
          >
            📊 {isExporting ? 'Exportando...' : 'Exportar Reporte General'}
          </Button>
          {/* <Button
            variant='outline'
            className='justify-start'
            onClick={handleViewDetailedStats}
            disabled={isExporting}
          >
            📈 {isExporting ? 'Exportando...' : 'Ver Estadísticas Detalladas'}
          </Button> */}
        </div>
      </Card>
    </div>
  );
}
