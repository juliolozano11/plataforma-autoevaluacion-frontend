'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  useCreateEvaluationConfig,
  useDeleteEvaluationConfig,
  useEvaluationConfigs,
  useToggleEvaluationConfigActive,
  useUpdateEvaluationConfig,
} from '@/hooks/use-evaluation-config';
import { useSections } from '@/hooks/use-sections';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const configSchema = z.object({
  sectionId: z.string().min(1, 'Debes seleccionar una sección'),
  muyBajo: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  bajo: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  intermedio: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  alto: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  muyAlto: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function EvaluationConfigPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSectionId, setFormSectionId] = useState<string>('');

  const { data: sections, isLoading: sectionsLoading } = useSections();
  // Siempre mostrar todas las configuraciones, no filtrar por sección
  const { data: configs, isLoading: configsLoading } = useEvaluationConfigs();
  const createConfig = useCreateEvaluationConfig();
  const updateConfig = useUpdateEvaluationConfig();
  const toggleActive = useToggleEvaluationConfigActive();
  const deleteConfig = useDeleteEvaluationConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      muyBajo: { min: 0, max: 20 },
      bajo: { min: 21, max: 40 },
      intermedio: { min: 41, max: 60 },
      alto: { min: 61, max: 80 },
      muyAlto: { min: 81, max: 100 },
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
    try {
      if (editingId) {
        await updateConfig.mutateAsync({ id: editingId, ...data });
      } else {
        await createConfig.mutateAsync(data);
      }
      reset();
      setEditingId(null);
      setFormSectionId('');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config._id);
    const sectionId = config.sectionId._id || config.sectionId;
    setFormSectionId(sectionId);
    setValue('sectionId', sectionId);
    setValue('muyBajo', config.muyBajo);
    setValue('bajo', config.bajo);
    setValue('intermedio', config.intermedio);
    setValue('alto', config.alto);
    setValue('muyAlto', config.muyAlto);
  };

  const handleCancel = () => {
    reset();
    setEditingId(null);
    setFormSectionId('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      await deleteConfig.mutateAsync(id);
    }
  };

  const getSectionName = (sectionId: string | any) => {
    if (typeof sectionId === 'object') {
      return sectionId?.displayName;
    }
    return sections?.find((s) => s._id === sectionId)?.displayName || 'Sección';
  };

  if (sectionsLoading || configsLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loading size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Configuración de Indicadores
          </h1>
          <p className='mt-2 text-gray-600'>
            Define los rangos de porcentaje para cada nivel de evaluación por
            sección
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card className='p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          {editingId ? 'Editar Configuración' : 'Nueva Configuración'}
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
              onChange={(e) => {
                setFormSectionId(e.target.value);
                // No afectar el filtro de configuraciones existentes
              }}
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

          {/* Rangos de porcentaje */}
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {[
              { key: 'muyBajo', label: 'Muy Bajo', color: 'bg-red-50' },
              { key: 'bajo', label: 'Bajo', color: 'bg-orange-50' },
              { key: 'intermedio', label: 'Intermedio', color: 'bg-yellow-50' },
              { key: 'alto', label: 'Alto', color: 'bg-green-50' },
              { key: 'muyAlto', label: 'Muy Alto', color: 'bg-blue-50' },
            ].map(({ key, label, color }) => (
              <div key={key} className={`p-4 rounded-lg ${color}`}>
                <h3 className='font-medium text-gray-900 mb-3'>{label}</h3>
                <div className='space-y-2'>
                  <div>
                    <label className='block text-xs text-gray-600 mb-1'>
                      Mínimo (%)
                    </label>
                    <input
                      type='number'
                      {...register(`${key}.min` as any, {
                        valueAsNumber: true,
                      })}
                      min='0'
                      max='100'
                      className='w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-gray-600 mb-1'>
                      Máximo (%)
                    </label>
                    <input
                      type='number'
                      {...register(`${key}.max` as any, {
                        valueAsNumber: true,
                      })}
                      min='0'
                      max='100'
                      className='w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white'
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className='flex gap-3'>
            <Button
              type='submit'
              isLoading={createConfig.isPending || updateConfig.isPending}
            >
              {editingId ? 'Guardar Cambios' : 'Crear Configuración'}
            </Button>
            {editingId && (
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Lista de configuraciones */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Configuraciones Existentes
        </h2>
        {configs && configs.length === 0 ? (
          <Card className='p-6 text-center'>
            <p className='text-gray-500'>No hay configuraciones creadas aún</p>
          </Card>
        ) : (
          configs?.map((config: any) => (
            <Card key={config._id} className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {getSectionName(config.sectionId)}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {config.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className='grid grid-cols-5 gap-2 text-sm'>
                    <div className='bg-red-50 p-2 rounded'>
                      <p className='font-medium text-gray-700'>Muy Bajo</p>
                      <p className='text-gray-600'>
                        {config.muyBajo.min}% - {config.muyBajo.max}%
                      </p>
                    </div>
                    <div className='bg-orange-50 p-2 rounded'>
                      <p className='font-medium text-gray-700'>Bajo</p>
                      <p className='text-gray-600'>
                        {config.bajo.min}% - {config.bajo.max}%
                      </p>
                    </div>
                    <div className='bg-yellow-50 p-2 rounded'>
                      <p className='font-medium text-gray-700'>Intermedio</p>
                      <p className='text-gray-600'>
                        {config.intermedio.min}% - {config.intermedio.max}%
                      </p>
                    </div>
                    <div className='bg-green-50 p-2 rounded'>
                      <p className='font-medium text-gray-700'>Alto</p>
                      <p className='text-gray-600'>
                        {config.alto.min}% - {config.alto.max}%
                      </p>
                    </div>
                    <div className='bg-blue-50 p-2 rounded'>
                      <p className='font-medium text-gray-700'>Muy Alto</p>
                      <p className='text-gray-600'>
                        {config.muyAlto.min}% - {config.muyAlto.max}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleActive.mutate(config._id)}
                    disabled={toggleActive.isPending}
                  >
                    {config.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(config)}
                    disabled={!!editingId}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => handleDelete(config._id)}
                    disabled={deleteConfig.isPending}
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
