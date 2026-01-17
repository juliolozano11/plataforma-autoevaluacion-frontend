'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import { useQuestionnaires } from '@/hooks/use-questionnaires';
import {
    useCreateQuestion,
    useDeleteQuestion,
    useQuestions,
    useToggleQuestionActive,
    useUpdateQuestion,
} from '@/hooks/use-questions';
import { Question, Questionnaire, QuestionType } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const baseQuestionSchema = z
  .object({
    questionnaireId: z.string().min(1, 'Debes seleccionar un cuestionario'),
    text: z.string().min(1, 'El texto de la pregunta es requerido'),
    type: z.nativeEnum(QuestionType),
    responseType: z.enum(['satisfaction', 'frequency', 'agreement', 'numeric']).optional(),
    points: z.number().min(0),
    order: z.number().min(0),
    minScale: z.literal(1).optional(), // Siempre debe ser 1
    maxScale: z
      .number()
      .min(5, 'El valor máximo debe ser al menos 5')
      .max(10, 'El valor máximo no puede ser mayor a 10'),
  })
  .refine((data) => data.maxScale > 1, {
    message: 'El valor máximo debe ser mayor que 1',
    path: ['maxScale'],
  });

type QuestionFormData = z.infer<typeof baseQuestionSchema>;

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const questionnaireIdParam = searchParams.get('questionnaireId');

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState(
    questionnaireIdParam || ''
  );

  const {
    data: questions,
    isLoading,
    error,
  } = useQuestions(selectedQuestionnaireId || undefined);
  const { data: questionnaires } = useQuestionnaires();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const toggleActive = useToggleQuestionActive();

  // Obtener órdenes existentes del cuestionario seleccionado
  const existingOrders = useMemo(() => {
    return questions
      ?.filter((q) => {
        if (!selectedQuestionnaireId) return false;
        const qId = typeof q.questionnaireId === 'object' ? q.questionnaireId._id : q.questionnaireId;
        return String(qId) === String(selectedQuestionnaireId) && q._id !== editingId;
      })
      .map((q) => q.order) || [];
  }, [questions, selectedQuestionnaireId, editingId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(baseQuestionSchema),
    defaultValues: {
      questionnaireId: selectedQuestionnaireId,
      type: QuestionType.SCALE,
      responseType: 'satisfaction',
      points: 1,
      order: 0,
      minScale: 1,
      maxScale: 5,
    },
  });

  // Calcular el siguiente orden disponible
  const getNextOrder = () => {
    if (!selectedQuestionnaireId || !questions) return 1;
    
    const questionsInQuestionnaire = questions.filter((q) => {
      const qId = typeof q.questionnaireId === 'object' ? q.questionnaireId._id : q.questionnaireId;
      return String(qId) === String(selectedQuestionnaireId);
    });
    
    if (questionsInQuestionnaire.length === 0) return 1;
    
    const maxOrder = Math.max(...questionsInQuestionnaire.map((q) => q.order || 0));
    return maxOrder + 1;
  };

  // Todas las preguntas son tipo scale, no necesitamos options

  useEffect(() => {
    if (questionnaireIdParam) {
      setSelectedQuestionnaireId(questionnaireIdParam);
      setValue('questionnaireId', questionnaireIdParam);
    }
  }, [questionnaireIdParam, setValue]);

  // Actualizar el orden automáticamente cuando se inicia la creación de una nueva pregunta
  useEffect(() => {
    if (isCreating && !editingId && selectedQuestionnaireId) {
      const nextOrder = getNextOrder();
      setValue('order', nextOrder);
    }
  }, [isCreating, editingId, selectedQuestionnaireId, questions, setValue]);

  const onSubmit = async (data: QuestionFormData) => {
    try {
      const questionData = {
        text: data.text,
        questionnaireId: data.questionnaireId,
        type: QuestionType.SCALE, // Todas son tipo scale
        responseType: data.responseType || 'satisfaction',
        points: data.points,
        order: data.order,
        minScale: 1, // Siempre 1
        maxScale: data.maxScale ?? 5,
      };

      if (editingId) {
        // Obtener la pregunta que se está editando para conocer su orden anterior
        const questionBeingEdited = questions?.find((q) => q._id === editingId);
        const oldOrder = questionBeingEdited?.order || 0;
        const newOrder = data.order;

        // Si el orden cambió, reordenar las demás preguntas
        if (oldOrder !== newOrder && selectedQuestionnaireId && questions) {
          // Obtener todas las preguntas del mismo cuestionario, ordenadas por orden actual
          const allQuestions = questions
            .filter((q) => {
              const qId = typeof q.questionnaireId === 'object' ? q.questionnaireId._id : q.questionnaireId;
              return String(qId) === String(selectedQuestionnaireId);
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          // Crear un nuevo array sin la pregunta que se está editando
          const questionsWithoutEdited = allQuestions.filter((q) => q._id !== editingId);

          // Insertar la pregunta editada en su nueva posición
          const reorderedQuestions = [...questionsWithoutEdited];
          reorderedQuestions.splice(newOrder - 1, 0, questionBeingEdited!);

          // Renumerar secuencialmente todas las preguntas
          const updates: Promise<any>[] = [];
          
          for (let i = 0; i < reorderedQuestions.length; i++) {
            const targetOrder = i + 1;
            const question = reorderedQuestions[i];
            const currentOrder = question.order || 0;
            
            // Solo actualizar si el orden cambió
            if (currentOrder !== targetOrder) {
              if (question._id === editingId) {
                // La pregunta editada se actualizará después con todos sus datos, pero actualizamos el orden ahora
                // No hacemos nada aquí, se actualizará en la siguiente línea
              } else {
                updates.push(
                  updateQuestion.mutateAsync({
                    id: question._id,
                    order: targetOrder,
                  })
                );
              }
            }
          }

          // Esperar a que todas las actualizaciones de otras preguntas se completen
          await Promise.all(updates);
        }

        // Actualizar la pregunta editada con todos sus datos (incluyendo el nuevo orden)
        await updateQuestion.mutateAsync({ id: editingId, ...questionData });
        setEditingId(null);
      } else {
        await createQuestion.mutateAsync(questionData);
        setIsCreating(false);
      }
      reset();
    } catch (err) {
      console.error('Error al guardar pregunta:', err);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingId(question._id);
    setIsCreating(false);
    const qId =
      typeof question.questionnaireId === 'object'
        ? question.questionnaireId._id
        : question.questionnaireId;
    setValue('questionnaireId', qId);
    setValue('text', question.text);
    setValue('type', QuestionType.SCALE); // Todas son tipo scale
    setValue('responseType', question.responseType || 'satisfaction');
    setValue('points', question.points);
    setValue('order', question.order);
    setValue('minScale', 1); // Siempre 1
    setValue('maxScale', question.maxScale ?? 5);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      await deleteQuestion.mutateAsync(id);
    }
  };

  const getQuestionnaireName = (qId: string | Questionnaire) => {
    if (typeof qId === 'object') {
      return qId?.title;
    }
    const questionnaire = questionnaires?.find((q) => q._id === qId);
    return questionnaire?.title || 'Cuestionario desconocido';
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message='Error al cargar las preguntas' />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestión de Preguntas
          </h1>
          <p className='mt-2 text-gray-600'>
            Administra las preguntas de los cuestionarios
          </p>
        </div>
        {!isCreating && !editingId && (
          <div className='flex gap-2'>
            <Button onClick={() => setIsCreating(true)}>
              ➕ Nueva Pregunta
            </Button>
            <Link href='/admin/upload'>
              <Button variant='outline'>📤 Cargar Preguntas</Button>
            </Link>
          </div>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Cuestionario
              </label>
              <select
                {...register('questionnaireId')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                disabled={!!editingId}
                onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
              >
                <option value=''>Selecciona un cuestionario</option>
                {questionnaires?.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title}
                  </option>
                ))}
              </select>
              {errors.questionnaireId && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.questionnaireId.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Texto de la Pregunta
              </label>
              <textarea
                {...register('text')}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                placeholder='Ej: ¿Cómo te sientes trabajando en equipo?'
              />
              {errors.text && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.text.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tipo de Respuesta
                </label>
                <select
                  {...register('responseType')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                  defaultValue='satisfaction'
                >
                  <option value='satisfaction'>Por Satisfacción</option>
                  <option value='frequency'>Por Frecuencia</option>
                  <option value='agreement'>Por Acuerdo</option>
                  <option value='numeric'>Por Valor Numérico</option>
                </select>
                <p className='mt-1 text-xs text-gray-500'>
                  Define cómo se interpretan las respuestas de la escala
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Puntos
                </label>
                <input
                  type='number'
                  {...register('points', { valueAsNumber: true })}
                  min='0'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                />
              </div>
            </div>

            {/* Configuración de escala - REQUERIDA para todas las preguntas */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Valor Mínimo de la Escala *
                </label>
                <input
                  type='number'
                  value={1}
                  disabled
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Valor mínimo que puede seleccionar el estudiante (siempre 1)
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Valor Máximo de la Escala *
                </label>
                <input
                  type='number'
                  {...register('maxScale', { valueAsNumber: true })}
                  min='5'
                  max='10'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                  placeholder='5'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Valor máximo que puede seleccionar el estudiante (entre 5 y 10)
                </p>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Orden
              </label>
              <input
                type='number'
                {...register('order', {
                  valueAsNumber: true,
                  validate: (value) => {
                    if (existingOrders.includes(value)) {
                      return 'Este orden ya está en uso. Por favor, elige otro orden.';
                    }
                    return true;
                  },
                })}
                min='0'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              />
              {errors.order && (
                <p className='mt-1 text-sm text-red-600'>{errors.order.message}</p>
              )}
            </div>

            <div className='flex gap-3'>
              <Button
                type='submit'
                isLoading={createQuestion.isPending || updateQuestion.isPending}
              >
                {editingId ? 'Guardar Cambios' : 'Crear Pregunta'}
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className='mb-4 flex items-center justify-between'>
        <div>
          {selectedQuestionnaireId ? (
            <p className='text-sm text-gray-600'>
              Filtrando por:{' '}
              <span className='font-medium'>
                {getQuestionnaireName(selectedQuestionnaireId)}
              </span>
            </p>
          ) : (
            <p className='text-sm text-gray-600'>
              Mostrando todas las preguntas
            </p>
          )}
        </div>
        <div>
          <select
            value={selectedQuestionnaireId}
            onChange={(e) => {
              setSelectedQuestionnaireId(e.target.value);
              setValue('questionnaireId', e.target.value);
            }}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white text-sm'
          >
            <option value=''>Todos los cuestionarios</option>
            {questionnaires?.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {questions && questions.length === 0 ? (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No hay preguntas creadas aún</p>
          </Card>
        ) : (
          questions
            ?.sort((a, b) => a.order - b.order)
            .map((question) => (
              <Card key={question._id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <span className='text-sm font-medium text-gray-500'>
                        #{question.order}
                      </span>
                      <span className='px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800'>
                        Escala de Likert
                      </span>
                      {question.minScale !== undefined &&
                        question.maxScale !== undefined && (
                          <span className='text-xs text-gray-500'>
                            ({question.minScale}-{question.maxScale})
                          </span>
                        )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {question.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className='text-sm text-gray-500'>
                        {question.points} puntos
                      </span>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {question.text}
                    </h3>
                    <p className='text-sm text-gray-500 mt-2'>
                      Cuestionario:{' '}
                      {getQuestionnaireName(question.questionnaireId)}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => toggleActive.mutate(question._id)}
                      disabled={toggleActive.isPending}
                    >
                      {question.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEdit(question)}
                      disabled={!!editingId || !!isCreating}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() => handleDelete(question._id)}
                      disabled={deleteQuestion.isPending}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
