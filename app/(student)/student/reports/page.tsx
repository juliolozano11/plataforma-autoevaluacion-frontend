'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import {
  filterValidEvaluations,
  getEvaluationCompetence,
  getQuestionnaire,
  getQuestionnaireName,
  getSectionName,
  getSectionTypeLabel,
} from '@/lib/utils/evaluations';
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

  const sectionName = (sectionId: string | Section | null | undefined) =>
    getSectionName(sections, sectionId);

  const sectionType = (sectionId: string | Section | null | undefined) =>
    getSectionTypeLabel(sections, sectionId);

  const questionnaireData = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => getQuestionnaire(activeQuestionnaires, evaluation, sections);

  const questionnaireTitle = (
    evaluation: Partial<Evaluation> & {
      sectionId?: string | Section | null;
      questionnaireId?: string | Questionnaire | null;
    }
  ) => getQuestionnaireName(evaluation, sections, activeQuestionnaires);

  const evaluationCompetence = (evaluation: Evaluation) =>
    getEvaluationCompetence(evaluation, sections);

  const validEvaluations = filterValidEvaluations(evaluations, sections);

  const completedEvaluations =
    selectedCompetence === 'all'
      ? validEvaluations.filter(
          (evaluation) => evaluation.status === EvaluationStatus.COMPLETED
        )
      : validEvaluations.filter(
          (evaluation) =>
            evaluation.status === EvaluationStatus.COMPLETED &&
            evaluationCompetence(evaluation) === selectedCompetence
        );

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
            const questionnaire = questionnaireData(evaluation);
            const sectionTypeLabel = sectionType(evaluation.sectionId);

            return (
              <Card key={evaluation._id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {questionnaireTitle(evaluation)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      Sección: {sectionName(evaluation.sectionId)}
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
