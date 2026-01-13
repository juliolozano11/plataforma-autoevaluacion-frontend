'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import { useEvaluation } from '@/hooks/use-evaluations';
import { QuestionType } from '@/types';
import { useParams, useRouter } from 'next/navigation';

export default function EvaluationAnswersPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.evaluationId as string;

  // Validar que evaluationId existe
  if (!evaluationId) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='ID de evaluación no válido' />
      </div>
    );
  }

  const { data: evaluation, isLoading, error } = useEvaluation(evaluationId);

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='Error al cargar las respuestas de la evaluación' />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='Evaluación no encontrada' />
      </div>
    );
  }

  // Obtener las respuestas del objeto evaluation de forma segura
  const answers = (evaluation && typeof evaluation === 'object' && 'answers' in evaluation)
    ? (evaluation as any).answers || []
    : [];
  
  // Ordenar respuestas por el orden de las preguntas de forma segura
  const sortedAnswers = Array.isArray(answers) 
    ? [...answers].sort((a: any, b: any) => {
        if (!a || !b) return 0;
        const orderA = typeof a.questionId === 'object' && a.questionId !== null && 'order' in a.questionId
          ? a.questionId.order 
          : 0;
        const orderB = typeof b.questionId === 'object' && b.questionId !== null && 'order' in b.questionId
          ? b.questionId.order 
          : 0;
        return orderA - orderB;
      })
    : [];

  const getQuestionText = (questionId: any): string => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.text || 'Pregunta sin texto';
    }
    return 'Pregunta no disponible';
  };

  const getQuestionType = (questionId: any): QuestionType => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.type || QuestionType.TEXT;
    }
    return QuestionType.TEXT;
  };

  const getQuestionOptions = (questionId: any): string[] => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.options || [];
    }
    return [];
  };

  const getQuestionMinScale = (questionId: any): number => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.minScale ?? 1;
    }
    return 1;
  };

  const getQuestionMaxScale = (questionId: any): number => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.maxScale ?? 10;
    }
    return 10;
  };

  const getQuestionPoints = (questionId: any): number => {
    if (typeof questionId === 'object' && questionId !== null) {
      return questionId.points || 0;
    }
    return 0;
  };

  const renderAnswer = (answer: any) => {
    const question = answer.questionId;
    const questionType = getQuestionType(question);
    const answerValue = answer.value;

    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        const options = getQuestionOptions(question);
        return (
          <div className='space-y-2'>
            {options.map((option: string, index: number) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  option === answerValue
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className='flex items-center'>
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      option === answerValue
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {option === answerValue && (
                      <div className='w-full h-full rounded-full bg-white scale-50'></div>
                    )}
                  </div>
                  <span
                    className={
                      option === answerValue
                        ? 'font-medium text-indigo-900'
                        : 'text-gray-600'
                    }
                  >
                    {option}
                  </span>
                  {option === answerValue && (
                    <span className='ml-auto text-sm text-indigo-600 font-medium'>
                      ✓ Seleccionada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case QuestionType.SCALE:
        const minScale = getQuestionMinScale(question);
        const maxScale = getQuestionMaxScale(question);
        const numericValue = typeof answerValue === 'number' 
          ? answerValue 
          : (typeof answerValue === 'string' ? parseInt(answerValue, 10) : minScale);
        
        // Validar que el valor esté en el rango
        const validValue = Math.max(minScale, Math.min(maxScale, numericValue || minScale));
        
        // Función para obtener el color según el valor
        const getColorForValue = (val: number) => {
          if (val === minScale) return '#DC2626'; // Rojo intenso
          if (val === maxScale) return '#15803D'; // Verde oscuro intenso
          
          const normalized = (val - minScale) / (maxScale - minScale);
          const groupSize = 1 / 5;
          const groupIndex = Math.floor(normalized / groupSize);
          const positionInGroup = (normalized % groupSize) / groupSize;
          
          const colorGroups = [
            { intense: '#DC2626', light: '#EF4444' },
            { intense: '#F97316', light: '#FB923C' },
            { intense: '#EAB308', light: '#FCD34D' },
            { intense: '#22C55E', light: '#4ADE80' },
            { intense: '#16A34A', light: '#15803D' },
          ];
          
          const group = colorGroups[Math.min(groupIndex, colorGroups.length - 1)];
          return positionInGroup < 0.5 ? group.intense : group.light;
        };
        
        const color = getColorForValue(validValue);
        const percentage = ((validValue - minScale) / (maxScale - minScale)) * 100;
        
        return (
          <div className='space-y-4'>
            <div className='flex items-center justify-between text-sm text-gray-600 relative'>
              <span>Muy bajo</span>
              <span className='absolute left-1/2 transform -translate-x-1/2'>Intermedio</span>
              <span>Muy alto</span>
            </div>
            <div className='relative'>
              <div className='w-full h-4 bg-gray-200 rounded-full relative overflow-hidden'>
                <div
                  className='h-full rounded-full'
                  style={{
                    width: `${Math.max(0, Math.min(100, percentage))}%`,
                    background: `linear-gradient(to right, 
                      #DC2626 0%, 
                      #EF4444 11.11%, 
                      #F97316 22.22%, 
                      #FB923C 33.33%, 
                      #EAB308 44.44%, 
                      #FCD34D 55.55%, 
                      #22C55E 66.66%, 
                      #4ADE80 77.77%, 
                      #16A34A 88.88%, 
                      #15803D 100%)`,
                  }}
                />
                <div
                  className='absolute top-0 h-full w-0.5 bg-gray-700 opacity-60'
                  style={{ left: `${Math.max(0, Math.min(100, percentage))}%` }}
                />
              </div>
            </div>
            <div className='text-center'>
              <span
                className='text-3xl font-bold'
                style={{ color }}
              >
                {validValue}
              </span>
            </div>
          </div>
        );

      case QuestionType.TEXT:
        return (
          <div className='p-4 border border-gray-300 rounded-lg bg-gray-50'>
            <p className='text-gray-900 whitespace-pre-wrap'>{answerValue || 'Sin respuesta'}</p>
          </div>
        );

      default:
        return (
          <div className='p-4 border border-gray-300 rounded-lg bg-gray-50'>
            <p className='text-gray-900'>{String(answerValue)}</p>
          </div>
        );
    }
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Mis Respuestas</h1>
          <p className='mt-2 text-gray-600'>
            Visualización de tus respuestas en esta evaluación
          </p>
        </div>
        <Button variant='outline' onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Información de la evaluación */}
      <Card className='p-6'>
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {evaluation && typeof evaluation === 'object' && 'sectionId' in evaluation
              ? (typeof evaluation.sectionId === 'object' && evaluation.sectionId && 'displayName' in evaluation.sectionId
                  ? (evaluation.sectionId as any).displayName
                  : 'Evaluación')
              : 'Evaluación'}
          </h2>
          {evaluation && typeof evaluation === 'object' && 'level' in evaluation && evaluation.level && (
            <p className='text-sm font-medium text-indigo-600'>
              Nivel: {evaluation.level}
            </p>
          )}
          {evaluation && typeof evaluation === 'object' && 'totalScore' in evaluation && 'maxScore' in evaluation 
            && evaluation.totalScore !== undefined && evaluation.maxScore !== undefined && (
            <p className='text-sm text-gray-600'>
              Puntuación: {Number(evaluation.totalScore).toFixed(2)} / {Number(evaluation.maxScore).toFixed(2)}
            </p>
          )}
          {evaluation && typeof evaluation === 'object' && 'completedAt' in evaluation && evaluation.completedAt && (
            <p className='text-sm text-gray-600'>
              Completada: {new Date(evaluation.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </Card>

      {/* Lista de preguntas y respuestas */}
      <div className='space-y-6'>
        {sortedAnswers.length > 0 ? (
          sortedAnswers.map((answer: any, index: number) => {
            const question = answer.questionId;
            const questionText = getQuestionText(question);
            const questionPoints = getQuestionPoints(question);
            const questionOrder = typeof question === 'object' && question?.order !== undefined 
              ? question.order 
              : index + 1;

            return (
              <Card key={answer._id} className='p-6'>
                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Pregunta {questionOrder}
                    </h3>
                    <span className='text-sm text-gray-500'>
                      {questionPoints} puntos
                    </span>
                  </div>
                  <p className='text-gray-700'>{questionText}</p>
                </div>
                <div className='mt-4'>
                  <p className='text-sm font-medium text-gray-700 mb-3'>Tu respuesta:</p>
                  {renderAnswer(answer)}
                  {answer.score !== undefined && (
                    <p className='text-sm text-gray-600 mt-3'>
                      Puntos obtenidos: {answer.score} / {questionPoints}
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No hay respuestas disponibles para esta evaluación</p>
          </Card>
        )}
      </div>
    </div>
  );
}
