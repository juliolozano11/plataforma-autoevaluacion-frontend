'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { EvaluationStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

export default function StudentReportsPage() {
  const queryClient = useQueryClient();
  const { data: evaluations, isLoading, refetch: refetchEvaluations } = useEvaluations();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Filtrar solo evaluaciones completadas
  const completedEvaluations = evaluations?.filter(
    (e) => e.status === EvaluationStatus.COMPLETED
  ) || [];

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

      {completedEvaluations.length === 0 ? (
        <Card className='p-6 text-center'>
          <p className='text-gray-500'>
            No tienes evaluaciones completadas aún. Completa una evaluación para ver tus resultados aquí.
          </p>
          <Link href='/student/evaluations' className='mt-4 inline-block'>
            <Button>Ver Evaluaciones Disponibles</Button>
          </Link>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {completedEvaluations.map((evaluation) => {
            const section = typeof evaluation.sectionId === 'object' 
              ? evaluation.sectionId 
              : null;
            
            const questionnaire = typeof evaluation.questionnaireId === 'object'
              ? evaluation.questionnaireId
              : null;

            const percentage = evaluation.maxScore && evaluation.totalScore
              ? ((evaluation.totalScore / evaluation.maxScore) * 100).toFixed(2)
              : '0.00';

            return (
              <Card key={evaluation._id} className='p-6 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {questionnaire?.title || section?.displayName || 'Evaluación'}
                    </h3>
                    <div className='mt-2 space-y-1'>
                      <p className='text-sm text-gray-600'>
                        <span className='font-medium'>Sección:</span> {section?.displayName || 'N/A'}
                      </p>
                      {evaluation.level && (
                        <p className='text-sm text-gray-600'>
                          <span className='font-medium'>Nivel:</span>{' '}
                          <span className='capitalize'>{evaluation.level.replace('_', ' ')}</span>
                        </p>
                      )}
                      {evaluation.totalScore !== undefined && evaluation.maxScore !== undefined && (
                        <p className='text-sm text-gray-600'>
                          <span className='font-medium'>Puntuación:</span>{' '}
                          {Number(evaluation.totalScore).toFixed(2)} / {Number(evaluation.maxScore).toFixed(2)} ({percentage}%)
                        </p>
                      )}
                      {evaluation.completedAt && (
                        <p className='text-sm text-gray-500'>
                          Completada: {new Date(evaluation.completedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='ml-4'>
                    <Link href={`/student/reports/${evaluation._id}`}>
                      <Button variant='outline'>Ver Detalles</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

