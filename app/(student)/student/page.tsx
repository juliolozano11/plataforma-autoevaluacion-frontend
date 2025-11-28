'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import Link from 'next/link';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveSections } from '@/hooks/use-sections';
import { EvaluationStatus } from '@/types';

export default function StudentDashboardPage() {
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();
  const { data: sections, isLoading: sectionsLoading } = useActiveSections();

  const isLoading = evaluationsLoading || sectionsLoading;

  const stats = {
    pending: evaluations?.filter((e) => e.status === EvaluationStatus.PENDING).length || 0,
    inProgress: evaluations?.filter((e) => e.status === EvaluationStatus.IN_PROGRESS).length || 0,
    completed: evaluations?.filter((e) => e.status === EvaluationStatus.COMPLETED).length || 0,
  };

  // Obtener secciones sin evaluación o con evaluación pendiente
  const availableSections = sections?.filter((section) => {
    const evaluation = evaluations?.find((e) => 
      typeof e.sectionId === 'object' 
        ? e.sectionId._id === section._id 
        : e.sectionId === section._id
    );
    return !evaluation || evaluation.status === EvaluationStatus.PENDING;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido a la plataforma de autoevaluación
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Evaluaciones Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En Progreso</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completadas</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evaluaciones Disponibles</h2>
            {availableSections.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay evaluaciones disponibles en este momento
              </p>
            ) : (
              <div className="space-y-4">
                {availableSections.map((section) => {
                  const evaluation = evaluations?.find((e) =>
                    typeof e.sectionId === 'object'
                      ? e.sectionId._id === section._id
                      : e.sectionId === section._id
                  );
                  
                  return (
                    <div key={section._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{section.displayName}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {section.description || 'Sin descripción'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Estado: {evaluation ? 'Pendiente' : 'Nueva'}
                          </p>
                        </div>
                        <Link href={`/student/evaluations/${section._id}`}>
                          <Button>
                            {evaluation ? 'Continuar' : 'Comenzar'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {evaluations && evaluations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Evaluaciones</h2>
              <div className="space-y-3">
                {evaluations.map((evaluation) => {
                  const section = typeof evaluation.sectionId === 'object' 
                    ? evaluation.sectionId 
                    : sections?.find((s) => s._id === evaluation.sectionId);
                  
                  return (
                    <div key={evaluation._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {section?.displayName || 'Sección'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Estado: {evaluation.status === EvaluationStatus.PENDING && 'Pendiente'}
                            {evaluation.status === EvaluationStatus.IN_PROGRESS && 'En Progreso'}
                            {evaluation.status === EvaluationStatus.COMPLETED && 'Completada'}
                          </p>
                          {evaluation.level && (
                            <p className="text-sm text-gray-500">
                              Nivel: {evaluation.level}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {evaluation.status === EvaluationStatus.COMPLETED ? (
                            <Link href={`/student/reports/${evaluation._id}`}>
                              <Button variant="outline">Ver Resultados</Button>
                            </Link>
                          ) : (
                            <Link href={`/student/evaluations/${section?._id || evaluation.sectionId}`}>
                              <Button>
                                {evaluation.status === EvaluationStatus.IN_PROGRESS ? 'Continuar' : 'Comenzar'}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

