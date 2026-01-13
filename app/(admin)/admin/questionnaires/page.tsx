'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import {
  useCreateQuestionnaire,
  useDeleteQuestionnaire,
  useQuestionnaires,
  useToggleQuestionnaireActive,
  useUpdateQuestionnaire,
} from '@/hooks/use-questionnaires';
import { useSections } from '@/hooks/use-sections';
import { Questionnaire, Section, SectionName } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const questionnaireSchema = z.object({
  sectionId: z.string().min(1, 'Debes seleccionar una sección'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

export default function QuestionnairesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCompetence, setSelectedCompetence] = useState<SectionName | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const { data: questionnaires, isLoading, error } = useQuestionnaires();
  const { data: sections } = useSections();
  const createQuestionnaire = useCreateQuestionnaire();
  const updateQuestionnaire = useUpdateQuestionnaire();
  const deleteQuestionnaire = useDeleteQuestionnaire();
  const toggleActive = useToggleQuestionnaireActive();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
  });

  const onSubmit = async (data: QuestionnaireFormData) => {
    try {
      if (editingId) {
        await updateQuestionnaire.mutateAsync({ id: editingId, ...data });
        setEditingId(null);
      } else {
        await createQuestionnaire.mutateAsync(data);
        setIsCreating(false);
      }
      reset();
    } catch (err) {
      console.error('Error al guardar cuestionario:', err);
    }
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingId(questionnaire._id);
    setIsCreating(false);
    const sectionId =
      typeof questionnaire.sectionId === 'object'
        ? questionnaire.sectionId?._id
        : questionnaire?.sectionId;
    setValue('sectionId', sectionId);
    setValue('title', questionnaire.title);
    setValue('description', questionnaire.description || '');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cuestionario?')) {
      await deleteQuestionnaire.mutateAsync(id);
    }
  };

  const getSectionName = (sectionId: string | Section) => {
    if (typeof sectionId === 'object') {
      return sectionId?.displayName;
    }
    const section = sections?.find((s) => s._id === sectionId);
    return section?.displayName || 'Sección desconocida';
  };

  // Función para obtener el tipo de competencia de un cuestionario
  const getQuestionnaireCompetence = (questionnaire: Questionnaire): SectionName | null => {
    const sectionId = typeof questionnaire.sectionId === 'object' 
      ? questionnaire.sectionId?._id 
      : questionnaire.sectionId;
    
    if (!sectionId) return null;
    
    const section = sections?.find((s) => s._id === sectionId);
    return section?.name || null;
  };

  // Función para obtener el label del tipo de competencia
  const getCompetenceLabel = (competence: SectionName): string => {
    switch (competence) {
      case SectionName.BLANDAS:
        return 'Competencias Blandas';
      case SectionName.ADAPTATIVAS:
        return 'Competencias Adaptativas';
      case SectionName.TECNOLOGICAS:
        return 'Competencias Tecnológicas';
      default:
        return '';
    }
  };

  // Filtrar cuestionarios por competencia y sección seleccionadas
  const filteredQuestionnaires = questionnaires?.filter((questionnaire) => {
    // Filtro por competencia
    if (selectedCompetence !== 'all') {
      const competence = getQuestionnaireCompetence(questionnaire);
      if (competence !== selectedCompetence) {
        return false;
      }
    }

    // Filtro por sección
    if (selectedSection !== 'all') {
      const sectionId = typeof questionnaire.sectionId === 'object'
        ? questionnaire.sectionId?._id
        : questionnaire.sectionId;
      if (String(sectionId) !== selectedSection) {
        return false;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message='Error al cargar los cuestionarios' />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestión de Cuestionarios
          </h1>
          <p className='mt-2 text-gray-600'>
            Administra los cuestionarios de evaluación
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            ➕ Nuevo Cuestionario
          </Button>
        )}
      </div>

      {/* Filtros por competencia y sección */}
      <Card className='p-4'>
        <div className='flex flex-col md:flex-row items-start md:items-center gap-3'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium text-gray-700 whitespace-nowrap'>
              Filtrar por competencia:
            </label>
            <select
              value={selectedCompetence}
              onChange={(e) => {
                setSelectedCompetence(e.target.value as SectionName | 'all');
                setSelectedSection('all'); // Reset sección cuando cambia competencia
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900'
            >
              <option value='all'>Todas las competencias</option>
              <option value={SectionName.BLANDAS}>Competencias Blandas</option>
              <option value={SectionName.ADAPTATIVAS}>
                Competencias Adaptativas
              </option>
              <option value={SectionName.TECNOLOGICAS}>
                Competencias Tecnológicas
              </option>
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium text-gray-700 whitespace-nowrap'>
              Filtrar por sección:
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900'
            >
              <option value='all'>Todas las secciones</option>
              {sections
                ?.filter((section) => {
                  // Si hay un filtro de competencia activo, solo mostrar secciones de esa competencia
                  if (selectedCompetence !== 'all') {
                    return section.name === selectedCompetence;
                  }
                  return true;
                })
                .map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.displayName}
                  </option>
                ))}
            </select>
          </div>
          {(selectedCompetence !== 'all' || selectedSection !== 'all') && (
            <span className='text-sm text-gray-500 whitespace-nowrap ml-auto'>
              {filteredQuestionnaires?.length || 0} cuestionario(s) encontrado(s)
            </span>
          )}
        </div>
      </Card>

      {(isCreating || editingId) && (
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {editingId ? 'Editar Cuestionario' : 'Nuevo Cuestionario'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Sección
              </label>
              <select
                {...register('sectionId')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                disabled={!!editingId}
              >
                <option value=''>Selecciona una sección</option>
                {sections?.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.displayName}
                  </option>
                ))}
              </select>
              {errors.sectionId && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.sectionId.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Título
              </label>
              <input
                type='text'
                {...register('title')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                placeholder='Ej: Cuestionario de Comunicación Efectiva'
              />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Descripción (Opcional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                placeholder='Descripción del cuestionario...'
              />
            </div>

            <div className='flex gap-3'>
              <Button
                type='submit'
                isLoading={
                  createQuestionnaire.isPending || updateQuestionnaire.isPending
                }
              >
                {editingId ? 'Guardar Cambios' : 'Crear Cuestionario'}
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {!filteredQuestionnaires || filteredQuestionnaires.length === 0 ? (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>
              {selectedCompetence === 'all' && selectedSection === 'all'
                ? 'No hay cuestionarios creados aún'
                : 'No hay cuestionarios que coincidan con los filtros seleccionados'}
            </p>
          </Card>
        ) : (
          filteredQuestionnaires.map((questionnaire) => (
            <Card key={questionnaire._id} className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {questionnaire.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        questionnaire.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {questionnaire.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 mt-1'>
                    Sección: {getSectionName(questionnaire.sectionId)}
                  </p>
                  {questionnaire.description && (
                    <p className='text-sm text-gray-600 mt-2'>
                      {questionnaire.description}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Link
                    href={`/admin/questions?questionnaireId=${questionnaire._id}`}
                  >
                    <Button variant='outline' size='sm'>
                      ❓ Preguntas
                    </Button>
                  </Link>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleActive.mutate(questionnaire._id)}
                    disabled={toggleActive.isPending}
                  >
                    {questionnaire.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(questionnaire)}
                    disabled={!!editingId || !!isCreating}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => handleDelete(questionnaire._id)}
                    disabled={deleteQuestionnaire.isPending}
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
