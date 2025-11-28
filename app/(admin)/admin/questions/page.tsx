'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useToggleQuestionActive } from '@/hooks/use-questions';
import { useQuestionnaires } from '@/hooks/use-questionnaires';
import { QuestionType } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const questionSchema = z.object({
  questionnaireId: z.string().min(1, 'Debes seleccionar un cuestionario'),
  text: z.string().min(1, 'El texto de la pregunta es requerido'),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).optional(),
  points: z.number().min(0),
  order: z.number().min(0),
  correctAnswer: z.any().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const questionnaireIdParam = searchParams.get('questionnaireId');
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState(questionnaireIdParam || '');
  
  const { data: questions, isLoading, error } = useQuestions(selectedQuestionnaireId || undefined);
  const { data: questionnaires } = useQuestionnaires();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const toggleActive = useToggleQuestionActive();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionnaireId: selectedQuestionnaireId,
      type: QuestionType.MULTIPLE_CHOICE,
      points: 1,
      order: 0,
    },
  });

  const questionType = watch('type');
  const [options, setOptions] = useState<string[]>(['']);

  useEffect(() => {
    if (questionnaireIdParam) {
      setSelectedQuestionnaireId(questionnaireIdParam);
      setValue('questionnaireId', questionnaireIdParam);
    }
  }, [questionnaireIdParam, setValue]);

  const onSubmit = async (data: QuestionFormData) => {
    try {
      const questionData = {
        ...data,
        options: questionType === QuestionType.MULTIPLE_CHOICE 
          ? options.filter((opt) => opt.trim() !== '')
          : undefined,
      };

      if (editingId) {
        await updateQuestion.mutateAsync({ id: editingId, ...questionData });
        setEditingId(null);
      } else {
        await createQuestion.mutateAsync(questionData);
        setIsCreating(false);
      }
      reset();
      setOptions(['']);
    } catch (err) {
      console.error('Error al guardar pregunta:', err);
    }
  };

  const handleEdit = (question: any) => {
    setEditingId(question._id);
    setIsCreating(false);
    const qId = typeof question.questionnaireId === 'object' 
      ? question.questionnaireId._id 
      : question.questionnaireId;
    setValue('questionnaireId', qId);
    setValue('text', question.text);
    setValue('type', question.type);
    setValue('points', question.points);
    setValue('order', question.order);
    setValue('correctAnswer', question.correctAnswer);
    if (question.options) {
      setOptions(question.options);
    } else {
      setOptions(['']);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
    setOptions(['']);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      await deleteQuestion.mutateAsync(id);
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const getQuestionnaireName = (qId: string | any) => {
    if (typeof qId === 'object') {
      return qId.title;
    }
    const questionnaire = questionnaires?.find((q) => q._id === qId);
    return questionnaire?.title || 'Cuestionario desconocido';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Error al cargar las preguntas" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Preguntas</h1>
          <p className="mt-2 text-gray-600">
            Administra las preguntas de los cuestionarios
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            ➕ Nueva Pregunta
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuestionario
              </label>
              <select
                {...register('questionnaireId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                disabled={!!editingId}
                onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
              >
                <option value="">Selecciona un cuestionario</option>
                {questionnaires?.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title}
                  </option>
                ))}
              </select>
              {errors.questionnaireId && (
                <p className="mt-1 text-sm text-red-600">{errors.questionnaireId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto de la Pregunta
              </label>
              <textarea
                {...register('text')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Ej: ¿Cómo te sientes trabajando en equipo?"
              />
              {errors.text && (
                <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pregunta
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                >
                  <option value={QuestionType.MULTIPLE_CHOICE}>Opción Múltiple</option>
                  <option value={QuestionType.SCALE}>Escala</option>
                  <option value={QuestionType.TEXT}>Texto Libre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntos
                </label>
                  <input
                  type="number"
                  {...register('points', { valueAsNumber: true })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            {questionType === QuestionType.MULTIPLE_CHOICE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                        placeholder={`Opción ${index + 1}`}
                      />
                      {options.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    ➕ Agregar Opción
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden
              </label>
              <input
                type="number"
                {...register('order', { valueAsNumber: true })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={createQuestion.isPending || updateQuestion.isPending}
              >
                {editingId ? 'Guardar Cambios' : 'Crear Pregunta'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {selectedQuestionnaireId && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Filtrando por: <span className="font-medium">
              {getQuestionnaireName(selectedQuestionnaireId)}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {questions && questions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No hay preguntas creadas aún</p>
          </Card>
        ) : (
          questions
            ?.sort((a, b) => a.order - b.order)
            .map((question) => (
              <Card key={question._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{question.order}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {question.type === QuestionType.MULTIPLE_CHOICE && 'Opción Múltiple'}
                        {question.type === QuestionType.SCALE && 'Escala'}
                        {question.type === QuestionType.TEXT && 'Texto Libre'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {question.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {question.points} puntos
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {question.text}
                    </h3>
                    {question.options && question.options.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                        {question.options.map((option, idx) => (
                          <li key={idx}>{option}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Cuestionario: {getQuestionnaireName(question.questionnaireId)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive.mutate(question._id)}
                      disabled={toggleActive.isPending}
                    >
                      {question.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question)}
                      disabled={!!editingId || !!isCreating}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
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

