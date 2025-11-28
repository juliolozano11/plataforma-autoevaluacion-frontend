'use client';

import { ErrorBoundary } from '@/components/error-boundary';
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
import { cn } from '@/lib/utils/cn';
import { EvaluationStatus, QuestionType } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function EvaluationPageContent() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const {
    data: section,
    isLoading: sectionLoading,
    error: sectionError,
  } = useSection(sectionId);
  const {
    data: questionnaires,
    isLoading: questionnairesLoading,
    error: questionnairesError,
  } = useActiveQuestionnaires(sectionId);
  const questionnaireId = questionnaires?.[0]?._id;
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useQuestions(questionnaireId);
  const { data: evaluations, error: evaluationsError } =
    useEvaluations(sectionId);
  const createEvaluation = useCreateEvaluation();
  const startEvaluation = useStartEvaluation();
  const submitAnswer = useSubmitAnswer();
  const completeEvaluation = useCompleteEvaluation();

  // Ajustar el índice si es necesario cuando cambian las preguntas
  // ⚠️ IMPORTANTE: Este hook debe estar ANTES de cualquier return condicional
  useEffect(() => {
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const validIndex = Math.min(
        Math.max(0, currentQuestionIndex),
        questions.length - 1
      );
      if (currentQuestionIndex !== validIndex) {
        setCurrentQuestionIndex(validIndex);
      }
    }
  }, [questions, currentQuestionIndex]);

  // Buscar o crear evaluación
  useEffect(() => {
    try {
      // No crear evaluación si la sección está bloqueada
      if (section && !section.isActive) {
        return;
      }

      // No crear evaluación si no hay cuestionarios
      if (!questionnaires || questionnaires.length === 0) {
        return;
      }

      // No hacer nada si aún no hay datos de evaluaciones
      if (evaluations === undefined || evaluations === null) {
        return;
      }

      // Validar que evaluations sea un array
      // Si es un objeto (cuando se filtra por sectionId puede retornar un objeto), convertirlo a array
      let evaluationsArray: any[] = [];
      if (Array.isArray(evaluations)) {
        evaluationsArray = evaluations;
      } else if (typeof evaluations === 'object' && evaluations !== null) {
        // Si es un objeto único, convertirlo a array
        evaluationsArray = [evaluations];
      } else {
        // Si es string vacío u otro tipo, usar array vacío
        evaluationsArray = [];
      }

      const existingEvaluation = evaluationsArray.find((e) => {
        try {
          const evalSectionId =
            typeof e.sectionId === 'object' ? e.sectionId._id : e.sectionId;
          return evalSectionId === sectionId;
        } catch (err) {
          console.error('Error al procesar evaluación:', err);
          return false;
        }
      });

      if (existingEvaluation) {
        setEvaluationId(existingEvaluation._id);
        if (existingEvaluation.status === EvaluationStatus.IN_PROGRESS) {
          // Cargar respuestas existentes si hay
        }
      } else if (
        evaluationsArray.length === 0 &&
        !createEvaluation.isPending &&
        section?.isActive &&
        questionnaires.length > 0
      ) {
        // Crear nueva evaluación solo si la sección está activa
        createEvaluation.mutate(
          { sectionId },
          {
            onSuccess: (data) => {
              if (data?._id) {
                setEvaluationId(data._id);
              }
            },
            onError: (error) => {
              console.error('Error al crear evaluación:', error);
            },
          }
        );
      }
    } catch (error) {
      console.error('Error en useEffect de evaluación:', error);
    }
  }, [evaluations, sectionId, section, questionnaires, createEvaluation]);

  // Iniciar evaluación cuando esté lista
  useEffect(() => {
    try {
      if (
        !evaluationId ||
        !questions ||
        questions.length === 0 ||
        !evaluations
      ) {
        return;
      }

      // Validar que evaluations sea un array
      let evaluationsArray: any[] = [];
      if (Array.isArray(evaluations)) {
        evaluationsArray = evaluations;
      } else if (typeof evaluations === 'object' && evaluations !== null) {
        evaluationsArray = [evaluations];
      } else {
        evaluationsArray = [];
      }

      if (evaluationsArray.length === 0) {
        return;
      }

      const evaluation = evaluationsArray.find((e) => {
        try {
          return e?._id === evaluationId;
        } catch (err) {
          console.error('Error al buscar evaluación:', err);
          return false;
        }
      });

      if (evaluation && evaluation.status === EvaluationStatus.PENDING) {
        startEvaluation.mutate(evaluationId, {
          onError: (error) => {
            console.error('Error al iniciar evaluación:', error);
          },
        });
      }
    } catch (error) {
      console.error('Error en useEffect de iniciar evaluación:', error);
    }
  }, [evaluationId, questions, evaluations, startEvaluation]);

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
    if (!evaluationId || !questions) return;

    try {
      // Guardar todas las respuestas que no se hayan guardado aún
      const answersToSave = questions
        .filter((q) => {
          const answer = answers[q._id];
          return answer !== undefined && answer !== null && answer !== '';
        })
        .map((q) => ({
          questionId: q._id,
          value: answers[q._id],
        }));

      // Guardar todas las respuestas en paralelo
      await Promise.all(
        answersToSave.map((answer) =>
          submitAnswer.mutateAsync({
            evaluationId,
            answer,
          })
        )
      );

      // Completar la evaluación después de guardar todas las respuestas
      await completeEvaluation.mutateAsync(evaluationId);
      router.push(`/student/reports/${evaluationId}`);
    } catch (error) {
      console.error('Error al completar evaluación:', error);
    }
  };

  // Mostrar errores si existen
  if (
    sectionError ||
    questionnairesError ||
    questionsError ||
    evaluationsError
  ) {
    return (
      <div className='flex justify-center py-12'>
        <Card className='p-6 max-w-md'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Error al cargar datos
            </h2>
            <p className='text-gray-600 mb-4'>
              No se pudieron cargar los datos necesarios. Por favor, intenta
              recargar la página.
            </p>
            <Button onClick={() => window.location.reload()} variant='outline'>
              Recargar Página
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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

  // Validar que el índice esté dentro del rango
  const validQuestionIndex = Math.min(
    Math.max(0, currentQuestionIndex),
    questions.length - 1
  );
  const currentQuestion = questions[validQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion._id];
  const progress = ((validQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = validQuestionIndex === questions.length - 1;

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
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm text-gray-600'>
                  {currentQuestion.minScale ?? 1} (Muy bajo)
                </span>
                <span className='text-sm text-gray-600'>
                  {currentQuestion.maxScale ?? 10} (Muy alto)
                </span>
              </div>
              <div className='flex items-center justify-between gap-2'>
                {Array.from(
                  {
                    length:
                      (currentQuestion.maxScale ?? 10) -
                      (currentQuestion.minScale ?? 1) +
                      1,
                  },
                  (_, i) => {
                    const value = (currentQuestion.minScale ?? 1) + i;
                    const isSelected = currentAnswer === value;
                    return (
                      <label
                        key={value}
                        className={cn(
                          'flex-1 flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300'
                        )}
                      >
                        <span className='text-sm text-gray-600 mb-2'>
                          {value}
                        </span>
                        <input
                          type='radio'
                          name={`question-${currentQuestion._id}`}
                          value={value}
                          checked={isSelected}
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQuestion._id,
                              parseInt(e.target.value)
                            )
                          }
                          className='w-5 h-5 text-indigo-600 focus:ring-indigo-500'
                        />
                      </label>
                    );
                  }
                )}
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

export default function EvaluationPage() {
  return (
    <ErrorBoundary>
      <EvaluationPageContent />
    </ErrorBoundary>
  );
}
