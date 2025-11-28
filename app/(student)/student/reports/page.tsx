'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useSections } from '@/hooks/use-sections';
import { EvaluationStatus, Section } from '@/types';
import { useRouter } from 'next/navigation';

export default function StudentReportsPage() {
  const router = useRouter();
  const { data: evaluations, isLoading } = useEvaluations();
  const { data: sections } = useSections();

  const getSectionName = (sectionId: string | Section) => {
    if (typeof sectionId === 'object' && sectionId !== null) {
      return sectionId.displayName;
    }
    return sections?.find((section) => section._id === sectionId)?.displayName;
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Mis Resultados</h1>
          <p className='mt-2 text-gray-600'>
            Aún no has completado ninguna evaluación.
          </p>
        </div>
        <Card className='p-6 text-center'>
          <p className='text-gray-500'>
            Cuando completes tus evaluaciones, verás tus resultados aquí.
          </p>
          <Button
            className='mt-4'
            onClick={() => router.push('/student/evaluations')}
          >
            Ir a Mis Evaluaciones
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Mis Resultados</h1>
        <p className='mt-2 text-gray-600'>
          Consulta el estado y los resultados de tus evaluaciones.
        </p>
      </div>

      <div className='space-y-4'>
        {evaluations.map((evaluation) => {
          const sectionName = getSectionName(evaluation.sectionId) || 'Sección';
          const isCompleted = evaluation.status === EvaluationStatus.COMPLETED;
          const isInProgress =
            evaluation.status === EvaluationStatus.IN_PROGRESS;

          return (
            <Card
              key={evaluation._id}
              className='p-6 flex flex-col md:flex-row md:items-center justify-between gap-4'
            >
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {sectionName}
                </h3>
                <p className='text-sm text-gray-500 mt-1'>
                  Estado:{' '}
                  <span className='font-medium text-gray-900 capitalize'>
                    {evaluation.status.replace('_', ' ')}
                  </span>
                </p>
                {evaluation.completedAt && (
                  <p className='text-sm text-gray-500'>
                    Finalizada:{' '}
                    {new Date(evaluation.completedAt).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
                {evaluation.totalScore !== undefined &&
                  evaluation.maxScore !== undefined && (
                    <p className='text-sm text-gray-500'>
                      Puntaje: {evaluation.totalScore} / {evaluation.maxScore}
                    </p>
                  )}
              </div>

              <div className='flex gap-3'>
                {isCompleted && (
                  <Button
                    onClick={() =>
                      router.push(`/student/reports/${evaluation._id}`)
                    }
                  >
                    Ver Reporte
                  </Button>
                )}
                {isInProgress && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      const sectionId =
                        typeof evaluation.sectionId === 'object'
                          ? evaluation.sectionId._id
                          : evaluation.sectionId;
                      router.push(`/student/evaluations/${sectionId}`);
                    }}
                  >
                    Continuar
                  </Button>
                )}
                {!isCompleted && !isInProgress && (
                  <Button
                    variant='outline'
                    onClick={() => router.push('/student/evaluations')}
                  >
                    Ver Evaluaciones
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
