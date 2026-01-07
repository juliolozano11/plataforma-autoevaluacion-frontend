'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import { Evaluation, EvaluationStatus, Questionnaire, Section } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

export default function EvaluationsPage() {
  const queryClient = useQueryClient();
  const {
    data: evaluations,
    isLoading,
    refetch: refetchEvaluations,
  } = useEvaluations();
  // Mostrar todas las secciones (activas e inactivas) para que los estudiantes vean las bloqueadas
  const { data: sections, refetch: refetchSections } = useSections();
  const { data: activeQuestionnaires, refetch: refetchQuestionnaires } =
    useActiveQuestionnaires(); // Obtener todos los cuestionarios activos
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar y refetch todas las queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['evaluations'] }),
        queryClient.invalidateQueries({ queryKey: ['sections'] }),
        queryClient.invalidateQueries({ queryKey: ['questionnaires'] }),
        refetchEvaluations(),
        refetchSections(),
        refetchQuestionnaires(),
      ]);
    } catch (error) {
      console.error('Error al actualizar datos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  const getSectionName = (sectionId: string | Section | null | undefined) => {
    if (!sectionId) {
      return 'Sección';
    }
    if (typeof sectionId === 'object') {
      return sectionId?.displayName || 'Sección';
    }
    return sections?.find((s) => s._id === sectionId)?.displayName || 'Sección';
  };

  const getSectionId = (sectionId: string | Section | null | undefined) => {
    if (!sectionId) {
      return null;
    }
    if (typeof sectionId === 'object' && sectionId !== null) {
      return sectionId?._id || null;
    }
    return sectionId;
  };

  // Función auxiliar para obtener el ID de questionnaireId de forma segura
  const getQuestionnaireId = (
    questionnaireId: string | Questionnaire | null | undefined
  ) => {
    if (!questionnaireId) {
      return null;
    }
    if (typeof questionnaireId === 'object' && questionnaireId !== null) {
      return questionnaireId?._id || null;
    }
    return questionnaireId;
  };

  // Función auxiliar para obtener el ID de sectionId de forma segura (para evaluaciones)
  const getEvaluationSectionId = (
    sectionId: string | Section | null | undefined
  ) => {
    if (!sectionId || sectionId === null) {
      return null;
    }
    if (typeof sectionId === 'object' && sectionId !== null) {
      return sectionId?._id || null;
    }
    return sectionId;
  };

  // Función auxiliar para obtener el ID de sectionId de cuestionarios de forma segura
  const getQuestionnaireSectionId = (
    sectionId: string | Section | null | undefined
  ) => {
    if (!sectionId || sectionId === null) {
      return null;
    }
    if (typeof sectionId === 'object' && sectionId !== null) {
      return sectionId?._id || null;
    }
    return sectionId;
  };

  // Función para obtener el nombre del cuestionario de una evaluación
  const getQuestionnaireName = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => {
    // Primero verificar que la evaluación tenga una sección válida
    const sectionId = getSectionId(evaluation.sectionId);
    if (!sectionId) {
      return 'Evaluación no disponible'; // Si no hay sección válida
    }

    // Verificar que la sección existe
    const sectionExists = sections?.some(
      (s) => String(s._id) === String(sectionId)
    );
    if (!sectionExists) {
      return 'Evaluación no disponible'; // Si la sección fue eliminada
    }

    // Si la evaluación tiene questionnaireId poblado
    if (evaluation.questionnaireId) {
      if (
        typeof evaluation.questionnaireId === 'object' &&
        evaluation.questionnaireId !== null
      ) {
        return evaluation.questionnaireId.title || 'Cuestionario';
      }
      // Si es un string, buscar en activeQuestionnaires
      const questionnaire = activeQuestionnaires?.find(
        (q) => q._id === evaluation.questionnaireId
      );
      return questionnaire?.title || 'Cuestionario';
    }
    // Si no tiene questionnaireId, buscar el primer cuestionario activo de la sección
    const questionnaire = activeQuestionnaires?.find((q) => {
      const qSectionId = getQuestionnaireSectionId(q.sectionId);
      return String(qSectionId) === String(sectionId);
    });
    return questionnaire?.title || getSectionName(evaluation.sectionId);
  };

  // Función auxiliar para verificar si una evaluación tiene una sección válida
  const hasValidSection = (evaluation: Evaluation) => {
    // Si no hay sectionId o es null, la evaluación no es válida
    if (!evaluation.sectionId) {
      return false;
    }

    const sectionId = getEvaluationSectionId(evaluation.sectionId);
    if (!sectionId) {
      return false; // Si no se puede obtener el ID, la evaluación no es válida
    }

    // Verificar que la sección existe en la lista de secciones
    // Esto es crítico: si la sección fue eliminada, no estará en la lista
    const sectionExists =
      sections?.some((s) => String(s._id) === String(sectionId)) ?? false;

    if (!sectionExists) {
      // La sección no existe, probablemente fue eliminada
      return false;
    }

    return true;
  };

  // Solo filtrar evaluaciones si las secciones ya se cargaron
  // Esto evita mostrar evaluaciones de secciones eliminadas
  const validEvaluations =
    sections && sections.length > 0
      ? evaluations?.filter(hasValidSection) || []
      : []; // Si no hay secciones cargadas, no mostrar evaluaciones

  const pendingEvaluations =
    validEvaluations.filter((e) => e.status === EvaluationStatus.PENDING) || [];
  const inProgressEvaluations =
    validEvaluations.filter((e) => e.status === EvaluationStatus.IN_PROGRESS) ||
    [];
  const completedEvaluations =
    validEvaluations.filter((e) => e.status === EvaluationStatus.COMPLETED) ||
    [];

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Mis Evaluaciones</h1>
          <p className='mt-2 text-gray-600'>
            Gestiona tus evaluaciones de autoevaluación
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          variant='outline'
          className='flex items-center gap-2'
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
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
                          {getQuestionnaireName(evaluation)}
                        </h3>
                        {isBlocked && (
                          <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                            Bloqueada
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-500 mt-1'>
                        {getSectionName(evaluation.sectionId)}
                      </p>
                      <p className='text-sm text-gray-500 mt-1'>
                        Estado: {isBlocked ? 'No disponible' : 'Pendiente'}
                      </p>
                      {isBlocked && (
                        <p className='text-sm text-red-600 mt-1'>
                          Esta evaluación no está disponible en este momento
                        </p>
                      )}
                    </div>
                    {isBlocked || !sectionId ? (
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
                      {getQuestionnaireName(evaluation)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      {getSectionName(evaluation.sectionId)}
                    </p>
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
                  {getSectionId(evaluation.sectionId) ? (
                    <Link
                      href={`/student/evaluations/${getSectionId(
                        evaluation.sectionId
                      )}`}
                    >
                      <Button>Continuar</Button>
                    </Link>
                  ) : (
                    <Button disabled variant='outline'>
                      No disponible
                    </Button>
                  )}
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
                      {getQuestionnaireName(evaluation)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      {getSectionName(evaluation.sectionId)}
                    </p>
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
                          Puntuación: {Number(evaluation.totalScore).toFixed(2)}{' '}
                          / {Number(evaluation.maxScore).toFixed(2)}
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
                // Obtener los cuestionarios activos de esta sección
                const sectionQuestionnaires =
                  activeQuestionnaires?.filter((q) => {
                    const qSectionId = getQuestionnaireSectionId(q.sectionId);
                    return (
                      qSectionId && String(qSectionId) === String(section._id)
                    );
                  }) || [];

                // Si no hay cuestionarios activos, no mostrar la sección
                if (sectionQuestionnaires.length === 0) {
                  return false;
                }

                // Verificar si hay algún cuestionario de esta sección que NO tenga evaluación completada
                const hasAvailableQuestionnaire = sectionQuestionnaires.some(
                  (questionnaire) => {
                    // Verificar si este cuestionario tiene una evaluación completada
                    const hasCompletedEvaluation = evaluations?.some((e) => {
                      // Verificar que sectionId y questionnaireId no sean null
                      if (!e.sectionId || !e.questionnaireId) {
                        return false;
                      }

                      const evalSectionId = getEvaluationSectionId(e.sectionId);
                      const evalQuestionnaireId = getQuestionnaireId(
                        e.questionnaireId
                      );

                      // Comparar por questionnaireId si existe
                      if (evalQuestionnaireId) {
                        return (
                          String(evalQuestionnaireId) ===
                            String(questionnaire._id) &&
                          e.status === EvaluationStatus.COMPLETED
                        );
                      }

                      // Si no tiene questionnaireId, comparar por sectionId y verificar si es el primer cuestionario
                      if (String(evalSectionId) === String(section._id)) {
                        // Si es el primer cuestionario de la sección y la evaluación está completada
                        const sortedQuestionnaires = sectionQuestionnaires.sort(
                          (a, b) => {
                            const titleA = a.title || '';
                            const titleB = b.title || '';
                            return titleA.localeCompare(titleB);
                          }
                        );

                        if (
                          sortedQuestionnaires.length > 0 &&
                          String(sortedQuestionnaires[0]._id) ===
                            String(questionnaire._id) &&
                          e.status === EvaluationStatus.COMPLETED
                        ) {
                          return true;
                        }
                      }

                      return false;
                    });

                    // Si no tiene evaluación completada, este cuestionario está disponible
                    return !hasCompletedEvaluation;
                  }
                );

                // Mostrar la sección solo si tiene al menos un cuestionario disponible
                // y no tiene evaluaciones pendientes o en progreso
                const hasPendingOrInProgress = evaluations?.some((e) => {
                  // Verificar que sectionId no sea null
                  if (!e.sectionId) {
                    return false;
                  }

                  const evalSectionId = getEvaluationSectionId(e.sectionId);
                  return (
                    evalSectionId === section._id &&
                    (e.status === EvaluationStatus.PENDING ||
                      e.status === EvaluationStatus.IN_PROGRESS)
                  );
                });

                return hasAvailableQuestionnaire && !hasPendingOrInProgress;
              })
              .map((section) => {
                const isBlocked = !section.isActive;
                // Obtener los cuestionarios activos de esta sección que NO están completados
                const sectionQuestionnaires =
                  activeQuestionnaires
                    ?.filter((q) => {
                      const qSectionId = getQuestionnaireSectionId(q.sectionId);
                      return (
                        qSectionId && String(qSectionId) === String(section._id)
                      );
                    })
                    .filter((questionnaire) => {
                      // Filtrar cuestionarios que ya tienen evaluación completada
                      const hasCompletedEvaluation = evaluations?.some((e) => {
                        // Verificar que sectionId y questionnaireId no sean null
                        if (!e.sectionId || !e.questionnaireId) {
                          return false;
                        }

                        const evalQuestionnaireId = getQuestionnaireId(
                          e.questionnaireId
                        );
                        const evalSectionId = getEvaluationSectionId(
                          e.sectionId
                        );

                        // Comparar por questionnaireId si existe
                        if (evalQuestionnaireId) {
                          return (
                            String(evalQuestionnaireId) ===
                              String(questionnaire._id) &&
                            e.status === EvaluationStatus.COMPLETED
                          );
                        }

                        // Si no tiene questionnaireId, comparar por sectionId
                        if (
                          String(evalSectionId) === String(section._id) &&
                          e.status === EvaluationStatus.COMPLETED
                        ) {
                          // Verificar si este es el primer cuestionario de la sección
                          const allSectionQuestionnaires =
                            activeQuestionnaires
                              ?.filter((q) => {
                                const qSecId = getQuestionnaireSectionId(
                                  q.sectionId
                                );
                                return (
                                  qSecId &&
                                  String(qSecId) === String(section._id)
                                );
                              })
                              .sort((a, b) => {
                                const titleA = a.title || '';
                                const titleB = b.title || '';
                                return titleA.localeCompare(titleB);
                              }) || [];

                          if (allSectionQuestionnaires.length > 0) {
                            return (
                              String(allSectionQuestionnaires[0]._id) ===
                              String(questionnaire._id)
                            );
                          }
                        }

                        return false;
                      });

                      return !hasCompletedEvaluation;
                    }) || [];

                // Si no hay cuestionarios disponibles, no mostrar la sección
                if (sectionQuestionnaires.length === 0) {
                  return null;
                }

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
                            {sectionQuestionnaires.length > 0
                              ? sectionQuestionnaires[0].title
                              : section.displayName}
                          </h3>
                          {isBlocked && (
                            <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                              Bloqueada
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-gray-500 mt-1'>
                          {section.displayName}
                        </p>
                        {sectionQuestionnaires[0]?.description && (
                          <p className='text-sm text-gray-500 mt-1'>
                            {sectionQuestionnaires[0].description}
                          </p>
                        )}
                        {!sectionQuestionnaires[0]?.description &&
                          section.description && (
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
              })
              .filter((card) => card !== null)}
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
