'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useActiveSections } from '@/hooks/use-sections';
import { EvaluationStatus } from '@/types';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();
  const { data: sections, isLoading: sectionsLoading } = useActiveSections();
  const { data: activeQuestionnaires, isLoading: questionnairesLoading } =
    useActiveQuestionnaires();

  const isLoading =
    evaluationsLoading || sectionsLoading || questionnairesLoading;

  const stats = {
    pending:
      evaluations?.filter((e) => e.status === EvaluationStatus.PENDING)
        .length || 0,
    inProgress:
      evaluations?.filter((e) => e.status === EvaluationStatus.IN_PROGRESS)
        .length || 0,
    completed:
      evaluations?.filter((e) => e.status === EvaluationStatus.COMPLETED)
        .length || 0,
  };

  // Obtener cuestionarios disponibles (sin evaluación completada y de secciones activas)
  const availableQuestionnaires =
    activeQuestionnaires?.filter((questionnaire) => {
      const qSectionId =
        typeof questionnaire.sectionId === 'object'
          ? questionnaire.sectionId?._id
          : questionnaire?.sectionId;

      // Verificar que la sección esté activa
      const section =
        typeof questionnaire.sectionId === 'object'
          ? questionnaire.sectionId
          : sections?.find((s) => s._id === qSectionId);

      if (!section || !section.isActive) {
        return false; // No mostrar si la sección no está activa
      }

      // Verificar si este cuestionario tiene evaluación completada
      const hasCompletedEvaluation = evaluations?.some((e) => {
        // Verificar que e.sectionId y e.questionnaireId no sean null
        if (!e.sectionId || !e.questionnaireId) {
          return false;
        }

        const evalSectionId =
          typeof e.sectionId === 'object' ? e.sectionId?._id : e.sectionId;
        const evalQuestionnaireId =
          typeof e.questionnaireId === 'object'
            ? e.questionnaireId?._id
            : e.questionnaireId;

        return (
          String(evalSectionId) === String(qSectionId) &&
          String(evalQuestionnaireId) === String(questionnaire._id) &&
          e.status === EvaluationStatus.COMPLETED
        );
      });

      // Mostrar solo si NO tiene evaluación completada
      return !hasCompletedEvaluation;
    }) || [];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Mi Dashboard</h1>
        <p className='mt-2 text-gray-600'>
          Bienvenido a la plataforma de autoevaluación
        </p>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Loading size='lg' />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Evaluaciones Pendientes
                  </p>
                  <p className='text-2xl font-semibold text-gray-900 mt-2'>
                    {stats.pending}
                  </p>
                </div>
                <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                  <span className='text-2xl'>⏳</span>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    En Progreso
                  </p>
                  <p className='text-2xl font-semibold text-gray-900 mt-2'>
                    {stats.inProgress}
                  </p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <span className='text-2xl'>📝</span>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Completadas
                  </p>
                  <p className='text-2xl font-semibold text-gray-900 mt-2'>
                    {stats.completed}
                  </p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <span className='text-2xl'>✅</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className='p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Evaluaciones Disponibles
            </h2>
            {availableQuestionnaires.length === 0 ? (
              <p className='text-gray-500 text-sm text-center py-4'>
                No hay evaluaciones disponibles en este momento
              </p>
            ) : (
              <div className='space-y-4'>
                {availableQuestionnaires.map((questionnaire) => {
                  const section =
                    typeof questionnaire.sectionId === 'object'
                      ? questionnaire.sectionId
                      : sections?.find(
                          (s) => s._id === questionnaire.sectionId
                        );

                  const evaluation = evaluations?.find((e) => {
                    // Verificar que e.sectionId y e.questionnaireId no sean null
                    if (!e.sectionId || !e.questionnaireId) {
                      return false;
                    }

                    const evalSectionId =
                      typeof e.sectionId === 'object'
                        ? e.sectionId?._id
                        : e.sectionId;
                    const evalQuestionnaireId =
                      typeof e.questionnaireId === 'object'
                        ? e.questionnaireId?._id
                        : e.questionnaireId;
                    return (
                      String(evalSectionId) === String(section?._id) &&
                      String(evalQuestionnaireId) === String(questionnaire._id)
                    );
                  });

                  const getStatusText = () => {
                    if (evaluation?.status === EvaluationStatus.PENDING)
                      return 'Pendiente';
                    if (evaluation?.status === EvaluationStatus.IN_PROGRESS)
                      return 'En Progreso';
                    return 'Nueva';
                  };

                  return (
                    <div
                      key={questionnaire._id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-medium text-gray-900'>
                            {questionnaire.title || 'Cuestionario sin nombre'}
                          </h3>
                          <div className='mt-1 space-y-1'>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>Sección:</span>{' '}
                              {section?.displayName || 'Sección'}
                            </p>
                            {questionnaire.description && (
                              <p className='text-sm text-gray-600'>
                                <span className='font-medium'>
                                  Competencia:
                                </span>{' '}
                                {questionnaire.description}
                              </p>
                            )}
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>Estado:</span>{' '}
                              {getStatusText()}
                            </p>
                          </div>
                        </div>
                        <div className='ml-4'>
                          <Link
                            href={`/student/evaluations/${
                              section?._id || questionnaire.sectionId
                            }`}
                          >
                            <Button>
                              {evaluation ? 'Continuar' : 'Comenzar'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {evaluations && evaluations.length > 0 && (
            <Card className='p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Mis Evaluaciones
              </h2>
              <div className='space-y-3'>
                {evaluations.map((evaluation) => {
                  const section =
                    typeof evaluation.sectionId === 'object'
                      ? evaluation.sectionId
                      : sections?.find((s) => s._id === evaluation.sectionId);

                  const questionnaire =
                    typeof evaluation.questionnaireId === 'object'
                      ? evaluation.questionnaireId
                      : activeQuestionnaires?.find((q) => {
                          const qId =
                            typeof q._id === 'string' ? q._id : String(q._id);
                          const evalQId =
                            typeof evaluation.questionnaireId === 'string'
                              ? evaluation.questionnaireId
                              : String(evaluation.questionnaireId);
                          return qId === evalQId;
                        });

                  const getStatusText = () => {
                    if (evaluation.status === EvaluationStatus.PENDING)
                      return 'Pendiente';
                    if (evaluation.status === EvaluationStatus.IN_PROGRESS)
                      return 'En Progreso';
                    if (evaluation.status === EvaluationStatus.COMPLETED)
                      return 'Completada';
                    return 'Desconocido';
                  };

                  return (
                    <div
                      key={evaluation._id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-medium text-gray-900'>
                            {questionnaire?.title || 'Cuestionario sin nombre'}
                          </h3>
                          <div className='mt-1 space-y-1'>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>Sección:</span>{' '}
                              {section?.displayName || 'Sección'}
                            </p>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium'>Estado:</span>{' '}
                              {getStatusText()}
                            </p>
                            {evaluation.level && (
                              <p className='text-sm text-gray-600'>
                                <span className='font-medium'>Nivel:</span>{' '}
                                {evaluation.level}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='flex gap-2 ml-4'>
                          {evaluation.status === EvaluationStatus.COMPLETED ? (
                            <Link href={`/student/reports/${evaluation._id}`}>
                              <Button variant='outline'>Ver Resultados</Button>
                            </Link>
                          ) : (
                            <Link
                              href={`/student/evaluations/${
                                section?._id || evaluation.sectionId
                              }`}
                            >
                              <Button>
                                {evaluation.status ===
                                EvaluationStatus.IN_PROGRESS
                                  ? 'Continuar'
                                  : 'Comenzar'}
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
