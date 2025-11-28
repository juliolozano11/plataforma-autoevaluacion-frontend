'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useEvaluations } from '@/hooks/use-evaluations';
import { useActiveSections } from '@/hooks/use-sections';
import { EvaluationStatus, Section } from '@/types';
import Link from 'next/link';

export default function EvaluationsPage() {
  const { data: evaluations, isLoading } = useEvaluations();
  const { data: sections } = useActiveSections();

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
            {pendingEvaluations.map((evaluation) => (
              <Card key={evaluation._id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {getSectionName(evaluation.sectionId)}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      Estado: Pendiente
                    </p>
                  </div>
                  <Link
                    href={`/student/evaluations/${getSectionId(
                      evaluation.sectionId
                    )}`}
                  >
                    <Button>Comenzar</Button>
                  </Link>
                </div>
              </Card>
            ))}
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

      {(!evaluations || evaluations.length === 0) && (
        <Card className='p-6 text-center'>
          <p className='text-gray-500'>No tienes evaluaciones disponibles</p>
        </Card>
      )}
    </div>
  );
}
