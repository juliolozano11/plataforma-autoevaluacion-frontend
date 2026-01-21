'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useActiveSections } from '@/hooks/use-sections';
import { filterValidEvaluations, getQuestionnaireId, getSectionId, resolveSection } from '@/lib/utils/evaluations';
import { EvaluationStatus } from '@/types';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();
  const { data: sections, isLoading: sectionsLoading } = useActiveSections();
  const { data: activeQuestionnaires, isLoading: questionnairesLoading } =
    useActiveQuestionnaires();

  const isLoading =
    evaluationsLoading || sectionsLoading || questionnairesLoading;

  const validEvaluations = filterValidEvaluations(evaluations, sections);

  const stats = {
    pending:
      validEvaluations.filter((e) => e.status === EvaluationStatus.PENDING)
        .length || 0,
    inProgress:
      validEvaluations.filter((e) => e.status === EvaluationStatus.IN_PROGRESS)
        .length || 0,
    completed:
      validEvaluations.filter((e) => e.status === EvaluationStatus.COMPLETED)
        .length || 0,
  };

  // Obtener cuestionarios disponibles (sin evaluación completada y de secciones activas)
  const availableQuestionnaires =
    activeQuestionnaires?.filter((questionnaire) => {
      const qSectionId = getSectionId(questionnaire.sectionId);
      const section = resolveSection(sections, questionnaire.sectionId);

      if (!section?.isActive || !qSectionId) {
        return false;
      }

      const hasCompletedEvaluation = validEvaluations.some((evaluation) => {
        const evalSectionId = getSectionId(evaluation.sectionId);
        const evalQuestionnaireId = getQuestionnaireId(
          evaluation.questionnaireId
        );

        return (
          evalSectionId &&
          String(evalSectionId) === String(qSectionId) &&
          String(evalQuestionnaireId) === String(questionnaire._id) &&
          evaluation.status === EvaluationStatus.COMPLETED
        );
      });

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

          {/* Sección de Competencias */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Competencias Blandas */}
            <Card className='p-6 hover:shadow-lg transition-shadow'>
              <div className='flex flex-col items-center text-center'>
                <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
                  <span className='text-4xl'>🤝</span>
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                  Competencias Blandas
                </h3>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  Habilidades interpersonales y sociales que te permiten trabajar
                  eficazmente con otros, comunicarte claramente y adaptarte a
                  diferentes situaciones del entorno laboral y personal.
                </p>
              </div>
            </Card>

            {/* Competencias Adaptativas */}
            <Card className='p-6 hover:shadow-lg transition-shadow'>
              <div className='flex flex-col items-center text-center'>
                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4'>
                  <span className='text-4xl'>🔄</span>
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                  Competencias Adaptativas
                </h3>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  Capacidades para ajustarte y responder positivamente a los
                  cambios, aprender continuamente y mantener la flexibilidad
                  mental ante nuevas situaciones y desafíos.
                </p>
              </div>
            </Card>

            {/* Competencias Tecnológicas */}
            <Card className='p-6 hover:shadow-lg transition-shadow'>
              <div className='flex flex-col items-center text-center'>
                <div className='w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4'>
                  <span className='text-4xl'>💻</span>
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                  Competencias Tecnológicas
                </h3>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  Conocimientos y habilidades para utilizar eficientemente las
                  herramientas tecnológicas, software y plataformas digitales
                  necesarias en el ámbito profesional y académico.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
