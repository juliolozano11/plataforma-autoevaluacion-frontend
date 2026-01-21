'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import { ScaleQuestion } from '@/components/evaluations/scale-question';
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
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  // Refs para evitar loops infinitos
  const isCreatingEvaluation = useRef(false);
  const isStartingEvaluation = useRef(false);
  const lastEvaluationId = useRef<string | null>(null);
  const lastExistingEvaluationId = useRef<string | null>(null);

  const queryClient = useQueryClient();
  const { data: section, isLoading: sectionLoading } = useSection(sectionId);
  const { data: questionnaires, isLoading: questionnairesLoading } =
    useActiveQuestionnaires(sectionId);
  const questionnaireId = questionnaires?.[0]?._id;
  const { data: questions, isLoading: questionsLoading } =
    useQuestions(questionnaireId);
  const { data: evaluations } = useEvaluations(sectionId);
  const createEvaluation = useCreateEvaluation();
  const startEvaluation = useStartEvaluation();
  const submitAnswer = useSubmitAnswer();
  const completeEvaluation = useCompleteEvaluation();

  // Memoizar el array de evaluaciones para evitar re-renders innecesarios
  const evaluationsArray = useMemo(() => {
    return Array.isArray(evaluations) ? evaluations : [];
  }, [evaluations]);

  // Memoizar la evaluación existente para esta sección y cuestionario
  const existingEvaluation = useMemo(() => {
    if (!questionnaireId) return undefined;

    return evaluationsArray.find((e) => {
      const evalSectionId =
        typeof e.sectionId === 'object' ? e.sectionId?._id : e.sectionId;
      const evalQuestionnaireId =
        typeof e.questionnaireId === 'object'
          ? e.questionnaireId?._id
          : e?.questionnaireId;

      // Buscar por sección Y cuestionario
      return (
        String(evalSectionId) === String(sectionId) &&
        String(evalQuestionnaireId) === String(questionnaireId)
      );
    });
  }, [evaluationsArray, sectionId, questionnaireId]);

  // Memoizar solo el ID de la evaluación existente para usar en dependencias
  // Asegurar que siempre sea string o null, nunca undefined
  const existingEvaluationId = useMemo(() => {
    const id = existingEvaluation?._id;
    return id ? String(id) : null;
  }, [existingEvaluation?._id ?? null]); // Usar null en lugar de undefined

  // Memoizar questionnaireId para evitar cambios innecesarios
  const memoizedQuestionnaireId = useMemo(() => {
    return questionnaireId ? String(questionnaireId) : null;
  }, [questionnaireId]);

  // Buscar o crear evaluación - solo cuando cambian los datos necesarios
  useEffect(() => {
    // No crear evaluación si la sección está bloqueada
    if (section && !section.isActive) {
      return;
    }

    // No crear evaluación si no hay cuestionarios o questionnaireId
    if (
      !questionnaires ||
      questionnaires.length === 0 ||
      !memoizedQuestionnaireId
    ) {
      return;
    }

    // Si ya tenemos un evaluationId establecido y existe la evaluación, no hacer nada
    if (
      evaluationId &&
      existingEvaluation &&
      existingEvaluation._id === evaluationId
    ) {
      lastExistingEvaluationId.current = existingEvaluation._id;
      return;
    }

    // Si encontramos una evaluación existente, establecer el ID
    if (existingEvaluation) {
      // Solo actualizar si el ID cambió
      const evalId = existingEvaluation._id;
      if (lastExistingEvaluationId.current !== evalId) {
        setEvaluationId(evalId);
        lastEvaluationId.current = evalId;
        lastExistingEvaluationId.current = evalId;
      }
      return; // Salir temprano si encontramos una evaluación
    }

    // Si no hay evaluación existente pero antes había una, resetear el ref
    if (!existingEvaluation && lastExistingEvaluationId.current) {
      lastExistingEvaluationId.current = null;
    }

    // Solo crear si no hay evaluación existente y no estamos creando una
    if (
      !existingEvaluation &&
      !isCreatingEvaluation.current &&
      !createEvaluation.isPending &&
      section?.isActive &&
      memoizedQuestionnaireId
    ) {
      // Crear nueva evaluación solo si la sección está activa y no estamos ya creando una
      isCreatingEvaluation.current = true;
      createEvaluation.mutate(
        { sectionId, questionnaireId: memoizedQuestionnaireId },
        {
          onSuccess: (data) => {
            setEvaluationId(data._id);
            lastEvaluationId.current = data._id;
            isCreatingEvaluation.current = false;
            // Actualizar directamente el cache en lugar de invalidar para evitar re-fetch
            queryClient.setQueryData(['evaluations', sectionId], (old: any) => {
              if (Array.isArray(old)) {
                return [...old, data];
              }
              return [data];
            });
          },
          onError: (error: any) => {
            // Si el error es 409 (Conflict), significa que ya existe una evaluación
            // Usar refetch en lugar de invalidate para tener más control
            if (error?.response?.status === 409) {
              console.log(
                '[DEBUG] Evaluación ya existe, recargando evaluaciones...'
              );
              // Refetch solo cuando sea necesario, no invalidar (que causa re-renders)
              queryClient.refetchQueries({
                queryKey: ['evaluations', sectionId],
                exact: true,
              });
            } else {
              console.error('Error al crear evaluación:', error);
            }
            isCreatingEvaluation.current = false;
          },
        }
      );
    }
  }, [
    existingEvaluationId,
    sectionId,
    memoizedQuestionnaireId,
    Boolean(section?.isActive),
    questionnaires?.length ?? 0,
    Boolean(createEvaluation.isPending),
    evaluationId,
  ]);

  // Memoizar la evaluación actual por ID
  const currentEvaluation = useMemo(() => {
    return evaluationsArray.find((e) => e._id === evaluationId);
  }, [evaluationsArray, evaluationId]);

  // Memoizar el status de la evaluación actual para evitar re-renders
  const currentEvaluationStatus = useMemo(() => {
    return currentEvaluation?.status;
  }, [currentEvaluation?.status]);

  // Iniciar evaluación cuando esté lista
  useEffect(() => {
    if (!evaluationId || !questions || questions.length === 0) {
      return;
    }

    // Evitar iniciar múltiples veces
    if (isStartingEvaluation.current || startEvaluation.isPending) {
      return;
    }

    if (currentEvaluationStatus === EvaluationStatus.PENDING) {
      isStartingEvaluation.current = true;
      startEvaluation.mutate(evaluationId, {
        onSuccess: (data) => {
          isStartingEvaluation.current = false;
          // Actualizar directamente el cache en lugar de invalidar
          queryClient.setQueryData(['evaluations', sectionId], (old: any) => {
            if (Array.isArray(old)) {
              return old.map((e: any) =>
                e._id === evaluationId ? { ...e, ...data } : e
              );
            }
            return old;
          });
        },
        onError: (error) => {
          console.error('Error al iniciar evaluación:', error);
          isStartingEvaluation.current = false;
        },
      });
    }
  }, [
    evaluationId,
    questions?.length,
    currentEvaluationStatus,
    startEvaluation.isPending,
  ]);

  // Validar que el índice esté dentro del rango (debe estar antes de los returns)
  const validQuestionIndex = questions
    ? Math.min(Math.max(0, currentQuestionIndex), questions.length - 1)
    : 0;

  // Ajustar el índice solo cuando cambia la longitud de las preguntas (evitar loop infinito)
  useEffect(() => {
    if (
      questions &&
      questions.length > 0 &&
      currentQuestionIndex >= questions.length
    ) {
      setCurrentQuestionIndex(questions.length - 1);
    }
  }, [questions?.length, currentQuestionIndex]); // Solo cuando cambia la longitud de questions

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = async () => {
    if (!evaluationId || !questions || questions.length === 0) return;

    const validIndex = Math.min(currentQuestionIndex, questions.length - 1);
    const currentQuestion = questions[validIndex];
    if (!currentQuestion) return;

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

    if (validIndex < questions.length - 1) {
      setCurrentQuestionIndex(validIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    if (!evaluationId) {
      console.error('[DEBUG] No hay evaluationId para completar');
      return;
    }

    console.log('[DEBUG] Completando evaluación:', {
      evaluationId,
      sectionId,
      currentQuestionIndex,
      totalQuestions: questions?.length,
    });

    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion) {
      const answer = answers[currentQuestion._id];
      if (answer !== undefined && answer !== null && answer !== '') {
        console.log('[DEBUG] Guardando última respuesta antes de completar');
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
      console.log(
        '[DEBUG] Llamando a completeEvaluation con ID:',
        evaluationId
      );
      await completeEvaluation.mutateAsync(evaluationId);
      router.push(`/student/reports/${evaluationId}`);
    } catch (error) {
      console.error('Error al completar evaluación:', error);
    }
  };

  if (sectionLoading || questionnairesLoading || questionsLoading) {
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

  // Validar que existan los datos necesarios
  if (!section) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='Sección no encontrada' />
      </div>
    );
  }

  if (!questionnaires || questionnaires.length === 0) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='No hay cuestionarios disponibles para esta sección' />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className='flex justify-center py-12'>
        <ErrorMessage message='No hay preguntas disponibles para esta evaluación' />
      </div>
    );
  }

  // Obtener la pregunta actual (después de validar que questions existe)
  const currentQuestion = questions?.[validQuestionIndex];

  const currentAnswer = answers[currentQuestion._id];
  const progress = ((validQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = validQuestionIndex === questions.length - 1;

  // Obtener el cuestionario actual
  const currentQuestionnaire =
    questionnaires?.find((q) => {
      const qId = typeof q._id === 'string' ? q._id : String(q._id);
      const evalQId =
        typeof questionnaireId === 'string'
          ? questionnaireId
          : String(questionnaireId);
      return qId === evalQId;
    }) || questionnaires?.[0];

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {currentQuestionnaire?.title || 'Cuestionario'}
        </h1>
        <p className='mt-2 text-gray-600'>
          {section.displayName}
        </p>
      </div>

      {/* Barra de progreso */}
      <Card className='p-4'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            Pregunta {validQuestionIndex + 1} de {questions.length}
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
            <ScaleQuestion
              question={currentQuestion}
              value={currentAnswer as number | undefined}
              onChange={(val) =>
                handleAnswerChange(currentQuestion._id, val)
              }
            />
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
            disabled={validQuestionIndex === 0}
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
            const isCurrent = index === validQuestionIndex;
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
