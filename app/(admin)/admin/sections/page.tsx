'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Loading } from '@/components/ui/loading';
import {
  useCreateSection,
  useDeleteSection,
  useSections,
  useToggleSectionActive,
  useUpdateSection,
} from '@/hooks/use-sections';
import { Section, SectionName } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const sectionSchema = z.object({
  name: z.nativeEnum(SectionName),
  displayName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

export default function SectionsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: sections, isLoading, error } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const toggleActive = useToggleSectionActive();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
  });

  const onSubmit = async (data: SectionFormData) => {
    try {
      if (editingId) {
        await updateSection.mutateAsync({ id: editingId, ...data });
        setEditingId(null);
      } else {
        await createSection.mutateAsync(data);
        setIsCreating(false);
      }
      reset();
    } catch (err) {
      console.error('Error al guardar sección:', err);
    }
  };

  const handleEdit = (section: Section) => {
    setEditingId(section._id);
    setIsCreating(false);
    setValue('name', section.name);
    setValue('displayName', section.displayName);
    setValue('description', section.description || '');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta sección?')) {
      await deleteSection.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message='Error al cargar las secciones' />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestión de Secciones
          </h1>
          <p className='mt-2 text-gray-600'>
            Administra las secciones de evaluación (Blandas, Adaptativas,
            Tecnológicas)
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>➕ Nueva Sección</Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {editingId ? 'Editar Sección' : 'Nueva Sección'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nombre de la Sección
              </label>
              <select
                {...register('name')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                disabled={!!editingId}
              >
                <option value=''>Selecciona una opción</option>
                <option value={SectionName.BLANDAS}>Blandas</option>
                <option value={SectionName.ADAPTATIVAS}>Adaptativas</option>
                <option value={SectionName.TECNOLOGICAS}>Tecnológicas</option>
              </select>
              {errors.name && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nombre de Visualización
              </label>
              <input
                type='text'
                {...register('displayName')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                placeholder='Ej: Habilidades Blandas'
              />
              {errors.displayName && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.displayName.message}
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
                placeholder='Descripción de la sección...'
              />
            </div>

            <div className='flex gap-3'>
              <Button
                type='submit'
                isLoading={createSection.isPending || updateSection.isPending}
              >
                {editingId ? 'Guardar Cambios' : 'Crear Sección'}
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {sections && sections.length === 0 ? (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No hay secciones creadas aún</p>
          </Card>
        ) : (
          sections?.map((section) => (
            <Card key={section._id} className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {section.displayName}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        section.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {section.isActive
                        ? 'Visible para estudiantes'
                        : 'Oculta para estudiantes'}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 mt-1'>
                    Tipo: {section.name}
                  </p>
                  {section.description && (
                    <p className='text-sm text-gray-600 mt-2'>
                      {section.description}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleActive.mutate(section._id)}
                    disabled={toggleActive.isPending}
                  >
                    {section.isActive ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(section)}
                    disabled={!!editingId || !!isCreating}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => handleDelete(section._id)}
                    disabled={deleteSection.isPending}
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
