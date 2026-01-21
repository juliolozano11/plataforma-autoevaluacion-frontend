'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import {
  filterValidEvaluations,
  getQuestionnaire,
  getQuestionnaireId,
  getQuestionnaireName,
  getSectionId,
  getSectionName,
  getSectionTypeLabel,
  resolveSection,
} from '@/lib/utils/evaluations';
import {
  Evaluation,
  EvaluationStatus,
  Questionnaire,
  Section,
} from '@/types';
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

  const sectionName = (
    sectionId: string | Section | null | undefined,
    fallback?: string
  ) => getSectionName(sections, sectionId, fallback);

  const sectionTypeText = (sectionId: string | Section | null | undefined) =>
    getSectionTypeLabel(sections, sectionId);

  const questionnaireData = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => getQuestionnaire(activeQuestionnaires, evaluation, sections);

  const questionnaireName = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => getQuestionnaireName(evaluation, sections, activeQuestionnaires);

  const validEvaluations = filterValidEvaluations(evaluations, sections);

  // Debug temporal para entender el problema
  if (typeof window !== 'undefined') {
    console.log('🔍 Debug Evaluaciones:', {
      totalEvaluations: evaluations?.length || 0,
      totalSections: sections?.length || 0,
      validEvaluations: validEvaluations.length,
      inProgress: validEvaluations.filter(
        (e) => e.status === EvaluationStatus.IN_PROGRESS
      ).length,
      completed: validEvaluations.filter(
        (e) => e.status === EvaluationStatus.COMPLETED
      ).length,
      sectionIds: sections?.map((s) => s._id) || [],
      evaluationSectionIds:
        evaluations?.map((e) => {
          return getSectionId(e.sectionId);
        }) || [],
    });
  }

  const pendingEvaluations =
    validEvaluations.filter((e) => e.status === EvaluationStatus.PENDING) || [];
  const inProgressEvaluations =
    validEvaluations.filter((e) => e.status === EvaluationStatus.IN_PROGRESS) ||
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

      {/* Mostrar secciones sin evaluaciones pero que existen */}
      <div>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Evaluaciones Disponibles
        </h2>
        {sections && sections.length > 0 ? (
          <div className='grid grid-cols-1 gap-4'>
            {(() => {
              const availableCards = sections
                .filter((section) => {
                  // Obtener los cuestionarios activos de esta sección
                  const sectionQuestionnaires =
                    activeQuestionnaires?.filter((q) => {
                      const qSectionId = getSectionId(q.sectionId);
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

                        const evalSectionId = getSectionId(e.sectionId);
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
                        if (
                          evalSectionId &&
                          String(evalSectionId) === String(section._id)
                        ) {
                          // Si es el primer cuestionario de la sección y la evaluación está completada
                          const sortedQuestionnaires =
                            sectionQuestionnaires.sort((a, b) => {
                              const titleA = a.title || '';
                              const titleB = b.title || '';
                              return titleA.localeCompare(titleB);
                            });

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

                    const evalSectionId = getSectionId(e.sectionId);
                    return (
                      evalSectionId &&
                      String(evalSectionId) === String(section._id) &&
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
                        const qSectionId = getSectionId(q.sectionId);
                        return (
                          qSectionId &&
                          String(qSectionId) === String(section._id)
                        );
                      })
                      .filter((questionnaire) => {
                        // Filtrar cuestionarios que ya tienen evaluación completada
                        const hasCompletedEvaluation = evaluations?.some(
                          (e) => {
                            // Verificar que sectionId y questionnaireId no sean null
                            if (!e.sectionId || !e.questionnaireId) {
                              return false;
                            }

                            const evalQuestionnaireId = getQuestionnaireId(
                              e.questionnaireId
                            );
                            const evalSectionId = getSectionId(e.sectionId);

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
                              evalSectionId &&
                              String(evalSectionId) === String(section._id) &&
                              e.status === EvaluationStatus.COMPLETED
                            ) {
                              // Verificar si este es el primer cuestionario de la sección
                              const allSectionQuestionnaires =
                                activeQuestionnaires
                                  ?.filter((q) => {
                                    const qSecId = getSectionId(q.sectionId);
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
                          }
                        );

                        return !hasCompletedEvaluation;
                      }) || [];

                  // Si no hay cuestionarios disponibles, no mostrar la sección
                  if (sectionQuestionnaires.length === 0) {
                    return null;
                  }

                  const questionnaire = sectionQuestionnaires[0];
                  const sectionType = sectionTypeText(section._id);

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
                              {questionnaire?.title || section.displayName}
                            </h3>
                            {isBlocked && (
                              <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                                Bloqueada
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-gray-500 mt-1'>
                            Sección: {section.displayName}
                            {sectionType && (
                              <> | Tipo: {sectionType}</>
                            )}
                          </p>
                          {questionnaire?.createdAt && (
                            <p className='text-sm text-gray-500'>
                              Asignada:{' '}
                              {new Date(
                                questionnaire.createdAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                          {questionnaire?.description && (
                            <p className='text-sm text-gray-500 mt-1'>
                              {questionnaire.description}
                            </p>
                          )}
                          {!questionnaire?.description &&
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
                .filter((card) => card !== null);

              if (availableCards.length === 0) {
                return (
                  <Card className='p-6 text-center'>
                    <p className='text-gray-500'>
                      No hay nuevas evaluaciones para comenzar en este momento
                    </p>
                  </Card>
                );
              }

              return availableCards;
            })()}
          </div>
        ) : (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>
              No hay nuevas evaluaciones para comenzar en este momento
            </p>
          </Card>
        )}
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
                          {questionnaireName(evaluation)}
                        </h3>
                        {isBlocked && (
                          <span className='px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'>
                            Bloqueada
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-500 mt-1'>
                        {sectionName(evaluation.sectionId)}
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

      <div>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Evaluaciones en Progreso
        </h2>
        {inProgressEvaluations.length > 0 ? (
          <div className='grid grid-cols-1 gap-4'>
            {inProgressEvaluations.map((evaluation) => {
              const questionnaire = questionnaireData(evaluation);
              const sectionType = sectionTypeText(evaluation.sectionId);

              return (
                <Card key={evaluation._id} className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {questionnaireName(evaluation)}
                      </h3>
                      <p className='text-sm text-gray-500 mt-1'>
                        Sección: {sectionName(evaluation.sectionId)}
                        {sectionType && <> | Tipo: {sectionType}</>}
                      </p>
                      <p className='text-sm text-gray-500 mt-1'>
                        Estado: En Progreso
                      </p>
                      <p className='text-sm text-gray-500'>
                        {questionnaire?.createdAt && (
                          <>
                            Asignada:{' '}
                            {new Date(
                              questionnaire.createdAt
                            ).toLocaleDateString()}
                          </>
                        )}
                        {questionnaire?.createdAt && evaluation.startedAt && (
                          <> | </>
                        )}
                        {evaluation.startedAt && (
                          <>
                            Iniciada:{' '}
                            {new Date(
                              evaluation.startedAt
                            ).toLocaleDateString()}
                          </>
                        )}
                        {(questionnaire?.createdAt || evaluation.startedAt) &&
                          evaluation.updatedAt && <> | </>}
                        {evaluation.updatedAt && (
                          <>
                            Última modificación:{' '}
                            {new Date(
                              evaluation.updatedAt
                            ).toLocaleDateString()}
                          </>
                        )}
                      </p>
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
              );
            })}
          </div>
        ) : (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>
              No tienes evaluaciones en progreso en este momento
            </p>
          </Card>
        )}
      </div>

      {(!evaluations || evaluations.length === 0) &&
        (!sections || sections.length === 0) && (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No tienes evaluaciones disponibles</p>
          </Card>
        )}
    </div>
  );
}
