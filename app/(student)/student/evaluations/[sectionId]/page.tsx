'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import {
  useCompleteEvaluation,
  useCreateEvaluation,
  useEvaluations,
  useStartEvaluation,
  useSubmitAnswer,
} from '@/hooks/use-evaluations';
import { useActiveQuestionnaires } from '@/hooks/use-questionnaires';
import { useQuestions } from '@/hooks/use-questions';
import { useSection } from '@/hooks/use-sections';
import { EvaluationStatus, QuestionType } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const { data: section, isLoading: sectionLoading } = useSection(sectionId);
  const { data: questionnaires } = useActiveQuestionnaires(sectionId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(
    questionnaires?.[0]?._id
  );
  const { data: evaluations } = useEvaluations(sectionId);
  const createEvaluation = useCreateEvaluation();
  const startEvaluation = useStartEvaluation();
  const submitAnswer = useSubmitAnswer();
  const completeEvaluation = useCompleteEvaluation();

  // Buscar o crear evaluación
  useEffect(() => {
    // No crear evaluación si la sección está bloqueada
    if (section && !section.isActive) {
      return;
    }

    // No crear evaluación si no hay cuestionarios
    if (!questionnaires || questionnaires.length === 0) {
      return;
    }

    const existingEvaluation = evaluations?.find((e) =>
      typeof e.sectionId === 'object'
        ? e.sectionId._id === sectionId
        : e.sectionId === sectionId
    );

    if (existingEvaluation) {
      setEvaluationId(existingEvaluation._id);
      if (existingEvaluation.status === EvaluationStatus.IN_PROGRESS) {
        // Cargar respuestas existentes si hay
      }
    } else if (
      evaluations &&
      !createEvaluation.isPending &&
      section?.isActive
    ) {
      // Crear nueva evaluación solo si la sección está activa
      createEvaluation.mutate(
        { sectionId },
        {
          onSuccess: (data) => {
            setEvaluationId(data._id);
          },
          onError: (error) => {
            console.error('Error al crear evaluación:', error);
          },
        }
      );
    }
  }, [evaluations, sectionId, section, questionnaires, createEvaluation]);

  // Iniciar evaluación cuando esté lista
  useEffect(() => {
    if (evaluationId && questions && questions.length > 0) {
      const evaluation = evaluations?.find((e) => e._id === evaluationId);
      if (evaluation && evaluation.status === EvaluationStatus.PENDING) {
        startEvaluation.mutate(evaluationId, {
          onError: (error) => {
            console.error('Error al iniciar evaluación:', error);
          },
        });
      }
    }
  }, [evaluationId, questions, evaluations, startEvaluation]);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = async () => {
    if (!evaluationId || !questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answer = answers[currentQuestion._id];

    if (answer !== undefined && answer !== null && answer !== '') {
      try {
        await submitAnswer.mutateAsync({
          evaluationId,
          answer: {
            questionId: currentQuestion._id,
            value: answer,
          },
        });
      } catch (error) {
        console.error('Error al guardar respuesta:', error);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    if (!evaluationId) return;

    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion) {
      const answer = answers[currentQuestion._id];
      if (answer !== undefined && answer !== null && answer !== '') {
        await submitAnswer.mutateAsync({
          evaluationId,
          answer: {
            questionId: currentQuestion._id,
            value: answer,
          },
        });
      }
    }

    try {
      await completeEvaluation.mutateAsync(evaluationId);
      router.push(`/student/reports/${evaluationId}`);
    } catch (error) {
      console.error('Error al completar evaluación:', error);
    }
  };

  if (sectionLoading || questionsLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  // Verificar si la sección está bloqueada
  if (section && !section.isActive) {
    return (
      <div className='flex justify-center py-12'>
        <Card className='p-6 max-w-md'>
          <div className='text-center'>
            <div className='mb-4'>
              <span className='inline-block px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium'>
                Bloqueada
              </span>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Evaluación no disponible
            </h2>
            <p className='text-gray-600 mb-4'>
              Esta evaluación no está disponible en este momento. Por favor,
              contacta al administrador.
            </p>
            <Button
              onClick={() => router.push('/student/evaluations')}
              variant='outline'
            >
              Volver a Evaluaciones
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!section || !questions || questions.length === 0) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='No hay preguntas disponibles para esta evaluación' />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion._id];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {section.displayName}
        </h1>
        <p className='mt-2 text-gray-600'>{section.description}</p>
      </div>

      {/* Barra de progreso */}
      <Card className='p-4'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <span className='text-sm font-medium text-gray-700'>
            {Math.round(progress)}%
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-indigo-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Pregunta actual */}
      <Card className='p-6'>
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {currentQuestion.text}
            </h2>
            <span className='text-sm text-gray-500'>
              {currentQuestion.points} puntos
            </span>
          </div>

          {/* Renderizar input según tipo de pregunta */}
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <div className='space-y-3'>
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
                >
                  <input
                    type='radio'
                    name={`question-${currentQuestion._id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion._id, e.target.value)
                    }
                    className='mr-3'
                  />
                  <span className='text-gray-900'>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === QuestionType.SCALE && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>
                  {currentQuestion.minScale ?? 1} (Muy bajo)
                </span>
                <span className='text-sm text-gray-600'>
                  {currentQuestion.maxScale ?? 10} (Muy alto)
                </span>
              </div>
              <input
                type='range'
                min={currentQuestion.minScale ?? 1}
                max={currentQuestion.maxScale ?? 10}
                value={
                  currentAnswer ||
                  Math.round(
                    ((currentQuestion.minScale ?? 1) +
                      (currentQuestion.maxScale ?? 10)) /
                      2
                  )
                }
                onChange={(e) =>
                  handleAnswerChange(
                    currentQuestion._id,
                    parseInt(e.target.value)
                  )
                }
                className='w-full'
              />
              <div className='text-center'>
                <span className='text-2xl font-bold text-indigo-600'>
                  {currentAnswer ||
                    Math.round(
                      ((currentQuestion.minScale ?? 1) +
                        (currentQuestion.maxScale ?? 10)) /
                        2
                    )}
                </span>
              </div>
            </div>
          )}

          {currentQuestion.type === QuestionType.TEXT && (
            <textarea
              value={currentAnswer || ''}
              onChange={(e) =>
                handleAnswerChange(currentQuestion._id, e.target.value)
              }
              rows={6}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              placeholder='Escribe tu respuesta aquí...'
            />
          )}
        </div>

        {/* Botones de navegación */}
        <div className='flex justify-between mt-6'>
          <Button
            variant='outline'
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            ← Anterior
          </Button>
          {isLastQuestion ? (
            <Button
              onClick={handleComplete}
              isLoading={completeEvaluation.isPending}
              disabled={!currentAnswer}
            >
              Finalizar Evaluación
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentAnswer}
              isLoading={submitAnswer.isPending}
            >
              Siguiente →
            </Button>
          )}
        </div>
      </Card>

      {/* Indicador de preguntas */}
      <Card className='p-4'>
        <h3 className='text-sm font-medium text-gray-700 mb-3'>
          Progreso de la evaluación
        </h3>
        <div className='flex flex-wrap gap-2'>
          {questions.map((q, index) => {
            const isAnswered = answers[q._id] !== undefined;
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={q._id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
