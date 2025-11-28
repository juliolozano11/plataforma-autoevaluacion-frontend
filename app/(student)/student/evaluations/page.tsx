'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useSections } from '@/hooks/use-sections';
import { EvaluationStatus, Section } from '@/types';
import Link from 'next/link';

export default function EvaluationsPage() {
  const { data: evaluations, isLoading } = useEvaluations();
  // Mostrar todas las secciones (activas e inactivas) para que los estudiantes vean las bloqueadas
  const { data: sections } = useSections();

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  const getSectionName = (sectionId: string | Section) => {
    if (typeof sectionId === 'object') {
      return sectionId.displayName;
    }
    return sections?.find((s) => s._id === sectionId)?.displayName || 'Sección';
  };

  const getSectionId = (sectionId: string | Section) => {
    if (typeof sectionId === 'object') {
      return sectionId._id;
    }
    return sectionId;
  };

  const pendingEvaluations =
    evaluations?.filter((e) => e.status === EvaluationStatus.PENDING) || [];
  const inProgressEvaluations =
    evaluations?.filter((e) => e.status === EvaluationStatus.IN_PROGRESS) || [];
  const completedEvaluations =
    evaluations?.filter((e) => e.status === EvaluationStatus.COMPLETED) || [];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Mis Evaluaciones</h1>
        <p className='mt-2 text-gray-600'>
          Gestiona tus evaluaciones de autoevaluación
        </p>
      </div>

      {pendingEvaluations.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Evaluaciones Pendientes
          </h2>
          <div className='grid grid-cols-1 gap-4'>
            {pendingEvaluations.map((evaluation) => {
              const sectionId = getSectionId(evaluation.sectionId);
              const section = sections?.find((s) => s._id === sectionId);
              const isBlocked = !section?.isActive;

              return (
                <Card
                  key={evaluation._id}
                  className={`p-6 ${isBlocked ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {getSectionName(evaluation.sectionId)}
                        </h3>
                        {isBlocked && (
                          <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                            Bloqueada
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-500 mt-1'>
                        Estado: {isBlocked ? 'No disponible' : 'Pendiente'}
                      </p>
                      {isBlocked && (
                        <p className='text-sm text-red-600 mt-1'>
                          Esta evaluación no está disponible en este momento
                        </p>
                      )}
                    </div>
                    {isBlocked ? (
                      <Button disabled variant='outline'>
                        Bloqueada
                      </Button>
                    ) : (
                      <Link href={`/student/evaluations/${sectionId}`}>
                        <Button>Comenzar</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {inProgressEvaluations.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Evaluaciones en Progreso
          </h2>
          <div className='grid grid-cols-1 gap-4'>
            {inProgressEvaluations.map((evaluation) => (
              <Card key={evaluation._id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {getSectionName(evaluation.sectionId)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      Estado: En Progreso
                    </p>
                    {evaluation.startedAt && (
                      <p className='text-sm text-gray-500'>
                        Iniciada:{' '}
                        {new Date(evaluation.startedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/student/evaluations/${getSectionId(
                      evaluation.sectionId
                    )}`}
                  >
                    <Button>Continuar</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedEvaluations.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Evaluaciones Completadas
          </h2>
          <div className='grid grid-cols-1 gap-4'>
            {completedEvaluations.map((evaluation) => (
              <Card key={evaluation._id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {getSectionName(evaluation.sectionId)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      Estado: Completada
                    </p>
                    {evaluation.level && (
                      <p className='text-sm font-medium text-indigo-600 mt-1'>
                        Nivel: {evaluation.level}
                      </p>
                    )}
                    {evaluation.totalScore !== undefined &&
                      evaluation.maxScore !== undefined && (
                        <p className='text-sm text-gray-500 mt-1'>
                          Puntuación: {evaluation.totalScore} /{' '}
                          {evaluation.maxScore}
                        </p>
                      )}
                    {evaluation.completedAt && (
                      <p className='text-sm text-gray-500'>
                        Completada:{' '}
                        {new Date(evaluation.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link href={`/student/reports/${evaluation._id}`}>
                    <Button variant='outline'>Ver Resultados</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar secciones sin evaluaciones pero que existen */}
      {sections && sections.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Secciones Disponibles
          </h2>
          <div className='grid grid-cols-1 gap-4'>
            {sections
              .filter((section) => {
                // Mostrar solo secciones que no tienen evaluación pendiente o en progreso
                const hasEvaluation = evaluations?.some((e) => {
                  const evalSectionId =
                    typeof e.sectionId === 'object'
                      ? e.sectionId._id
                      : e.sectionId;
                  return (
                    evalSectionId === section._id &&
                    (e.status === EvaluationStatus.PENDING ||
                      e.status === EvaluationStatus.IN_PROGRESS)
                  );
                });
                return !hasEvaluation;
              })
              .map((section) => {
                const isBlocked = !section.isActive;
                return (
                  <Card
                    key={section._id}
                    className={`p-6 ${
                      isBlocked ? 'opacity-60 bg-gray-50' : ''
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {section.displayName}
                          </h3>
                          {isBlocked && (
                            <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                              Bloqueada
                            </span>
                          )}
                        </div>
                        {section.description && (
                          <p className='text-sm text-gray-500 mt-1'>
                            {section.description}
                          </p>
                        )}
                        {isBlocked && (
                          <p className='text-sm text-red-600 mt-1'>
                            Esta evaluación no está disponible en este momento
                          </p>
                        )}
                      </div>
                      {isBlocked ? (
                        <Button disabled variant='outline'>
                          Bloqueada
                        </Button>
                      ) : (
                        <Link href={`/student/evaluations/${section._id}`}>
                          <Button>Comenzar</Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {(!evaluations || evaluations.length === 0) &&
        (!sections || sections.length === 0) && (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No tienes evaluaciones disponibles</p>
          </Card>
        )}
    </div>
  );
}
