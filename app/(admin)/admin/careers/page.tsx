'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import {
  useCreateCareer,
  useDeleteCareer,
  useCareers,
  useToggleCareerActive,
  useUpdateCareer,
} from '@/hooks/use-careers';
import { Career } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const careerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

type CareerFormData = z.infer<typeof careerSchema>;

export default function CareersPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: careers, isLoading, error } = useCareers();
  const createCareer = useCreateCareer();
  const updateCareer = useUpdateCareer();
  const deleteCareer = useDeleteCareer();
  const toggleActive = useToggleCareerActive();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CareerFormData>({
    resolver: zodResolver(careerSchema),
  });

  const onSubmit = async (data: CareerFormData) => {
    try {
      if (editingId) {
        await updateCareer.mutateAsync({ id: editingId, ...data });
        setEditingId(null);
      } else {
        await createCareer.mutateAsync(data);
        setIsCreating(false);
      }
      reset();
    } catch (err) {
      console.error('Error al guardar carrera:', err);
    }
  };

  const handleEdit = (career: Career) => {
    setEditingId(career._id);
    setIsCreating(false);
    setValue('name', career.name);
    setValue('description', career.description || '');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta carrera?')) {
      await deleteCareer.mutateAsync(id);
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
    return <ErrorMessage message='Error al cargar las carreras' />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestión de Carreras
          </h1>
          <p className='mt-2 text-gray-600'>
            Administra las carreras disponibles en el sistema
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            reset();
          }}
          disabled={isCreating || !!editingId}
        >
          ➕ Nueva Carrera
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {editingId ? 'Editar Carrera' : 'Crear Nueva Carrera'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <Input
              label='Nombre de la Carrera'
              placeholder='Ingeniería en Sistemas'
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                placeholder='Descripción de la carrera...'
              />
            </div>

            <div className='flex gap-2'>
              <Button
                type='submit'
                isLoading={createCareer.isPending || updateCareer.isPending}
                disabled={createCareer.isPending || updateCareer.isPending}
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Carreras Registradas
        </h2>
        {careers && careers.length > 0 ? (
          <div className='space-y-3'>
            {careers.map((career) => (
              <div
                key={career._id}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-3'>
                    <h3 className='font-medium text-gray-900'>{career.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        career.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {career.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {career.description && (
                    <p className='text-sm text-gray-500 mt-1'>
                      {career.description}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleActive.mutate(career._id)}
                    disabled={toggleActive.isPending}
                  >
                    {career.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(career)}
                    disabled={isCreating || !!editingId}
                  >
                    Editar
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleDelete(career._id)}
                    disabled={deleteCareer.isPending}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500 text-center py-8'>
            No hay carreras registradas
          </p>
        )}
      </Card>
    </div>
  );
}

