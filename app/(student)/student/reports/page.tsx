'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import {
  Evaluation,
  EvaluationStatus,
  Questionnaire,
  Section,
  SectionName,
} from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

export default function StudentReportsPage() {
  const queryClient = useQueryClient();
  const {
    data: evaluations,
    isLoading,
    refetch: refetchEvaluations,
  } = useEvaluations();
  const { data: sections } = useSections();
  const { data: activeQuestionnaires } = useActiveQuestionnaires();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompetence, setSelectedCompetence] = useState<
    SectionName | 'all'
  >('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar y refetch las queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['evaluations'] }),
        refetchEvaluations(),
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

  // Funciones auxiliares para obtener información de secciones y cuestionarios
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

  const getSectionTypeLabel = (
    sectionId: string | Section | null | undefined
  ) => {
    if (!sectionId) {
      return '';
    }
    let section: Section | undefined;
    if (typeof sectionId === 'object') {
      section = sectionId;
    } else {
      section = sections?.find((s) => s._id === sectionId);
    }
    if (!section) {
      return '';
    }
    switch (section.name) {
      case SectionName.BLANDAS:
        return 'Competencias Blandas';
      case SectionName.ADAPTATIVAS:
        return 'Competencias Adaptativas';
      case SectionName.TECNOLOGICAS:
        return 'Competencias Tecnológicas';
      default:
        return '';
    }
  };

  const getQuestionnaire = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ): Questionnaire | null => {
    if (evaluation.questionnaireId) {
      if (
        typeof evaluation.questionnaireId === 'object' &&
        evaluation.questionnaireId !== null
      ) {
        return evaluation.questionnaireId;
      }
      return (
        activeQuestionnaires?.find(
          (q) => q._id === evaluation.questionnaireId
        ) || null
      );
    }
    const sectionId = getSectionId(evaluation.sectionId);
    if (!sectionId) {
      return null;
    }
    return (
      activeQuestionnaires?.find((q) => {
        const qSectionId = getQuestionnaireSectionId(q.sectionId);
        return String(qSectionId) === String(sectionId);
      }) || null
    );
  };

  const getQuestionnaireName = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => {
    const sectionId = getSectionId(evaluation.sectionId);
    if (!sectionId) {
      return 'Evaluación no disponible';
    }

    const sectionExists = sections?.some(
      (s) => String(s._id) === String(sectionId)
    );
    if (!sectionExists) {
      return 'Evaluación no disponible';
    }

    if (evaluation.questionnaireId) {
      if (
        typeof evaluation.questionnaireId === 'object' &&
        evaluation.questionnaireId !== null
      ) {
        return evaluation.questionnaireId.title || 'Cuestionario';
      }
      const questionnaire = activeQuestionnaires?.find(
        (q) => q._id === evaluation.questionnaireId
      );
      return questionnaire?.title || 'Cuestionario';
    }
    const questionnaire = activeQuestionnaires?.find((q) => {
      const qSectionId = getQuestionnaireSectionId(q.sectionId);
      return String(qSectionId) === String(sectionId);
    });
    return questionnaire?.title || getSectionName(evaluation.sectionId);
  };

  // Función para obtener el tipo de competencia de una evaluación
  const getEvaluationCompetence = (
    evaluation: Evaluation
  ): SectionName | null => {
    if (!evaluation.sectionId) {
      return null;
    }
    let section: Section | undefined;
    if (typeof evaluation.sectionId === 'object') {
      section = evaluation.sectionId;
    } else {
      section = sections?.find((s) => s._id === evaluation.sectionId);
    }
    return section?.name || null;
  };

  // Filtrar solo evaluaciones completadas
  const allCompletedEvaluations =
    evaluations?.filter((e) => e.status === EvaluationStatus.COMPLETED) || [];

  // Filtrar por competencia seleccionada
  const completedEvaluations =
    selectedCompetence === 'all'
      ? allCompletedEvaluations
      : allCompletedEvaluations.filter((e) => {
          const competence = getEvaluationCompetence(e);
          return competence === selectedCompetence;
        });

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Mis Resultados</h1>
          <p className='mt-2 text-gray-600'>
            Visualiza los resultados de tus evaluaciones completadas
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

      {/* Filtro por competencia */}
      <Card className='p-4'>
        <div className='flex items-center gap-4'>
          <label className='text-sm font-medium text-gray-700'>
            Filtrar por competencia:
          </label>
          <select
            value={selectedCompetence}
            onChange={(e) =>
              setSelectedCompetence(e.target.value as SectionName | 'all')
            }
            className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900'
          >
            <option value='all'>Todas las competencias</option>
            <option value={SectionName.BLANDAS}>Competencias Blandas</option>
            <option value={SectionName.ADAPTATIVAS}>
              Competencias Adaptativas
            </option>
            <option value={SectionName.TECNOLOGICAS}>
              Competencias Tecnológicas
            </option>
          </select>
          {selectedCompetence !== 'all' && (
            <span className='text-sm text-gray-500'>
              {completedEvaluations.length} evaluación(es) encontrada(s)
            </span>
          )}
        </div>
      </Card>

      {completedEvaluations.length === 0 ? (
        <Card className='p-6 text-center'>
          <p className='text-gray-500'>
            {selectedCompetence === 'all'
              ? 'No tienes evaluaciones completadas aún. Completa una evaluación para ver tus resultados aquí.'
              : 'No tienes evaluaciones completadas para esta competencia.'}
          </p>
          {selectedCompetence === 'all' && (
            <Link href='/student/evaluations' className='mt-4 inline-block'>
              <Button>Ver Evaluaciones Disponibles</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {completedEvaluations.map((evaluation) => {
            const questionnaire = getQuestionnaire(evaluation);
            const sectionTypeLabel = getSectionTypeLabel(evaluation.sectionId);

            return (
              <Card key={evaluation._id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {getQuestionnaireName(evaluation)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      Sección: {getSectionName(evaluation.sectionId)}
                      {sectionTypeLabel && <> | Tipo: {sectionTypeLabel}</>}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>
                      Estado: Finalizado
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
                          {new Date(evaluation.startedAt).toLocaleDateString()}
                        </>
                      )}
                      {(questionnaire?.createdAt || evaluation.startedAt) &&
                        evaluation.completedAt && <> | </>}
                      {evaluation.completedAt && (
                        <>
                          Finalizada:{' '}
                          {new Date(
                            evaluation.completedAt
                          ).toLocaleDateString()}
                        </>
                      )}
                    </p>
                    {evaluation.level && (
                      <p className='text-sm font-medium text-indigo-600 mt-1'>
                        Nivel: {evaluation.level}
                      </p>
                    )}
                  </div>
                  <Link href={`/student/reports/${evaluation._id}`}>
                    <Button variant='outline'>Ver Resultados</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
