'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { useCreateUser, useUsers } from '@/hooks/use-users';
import { useActiveCareers } from '@/hooks/use-careers';
import { ApiErrorResponse, UserRole } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .refine((email) => email.endsWith('@ug.edu.ec'), {
      message: 'El correo debe ser del dominio @ug.edu.ec',
    }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  role: z.nativeEnum(UserRole),
  career: z.string().optional(),
  course: z.string().optional(),
  parallel: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createUser = useCreateUser();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: careers, isLoading: careersLoading } = useActiveCareers();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: UserRole.STUDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CreateUserFormData) => {
    setError(null);
    setSuccess(null);
    try {
      await createUser.mutateAsync(data);
      setSuccess('Usuario creado exitosamente');
      reset();
    } catch (err) {
      const error = err as ApiErrorResponse;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error al crear usuario'
      );
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Gestión de Usuarios</h1>
        <p className='mt-2 text-gray-600'>
          Crear y administrar usuarios del sistema
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Formulario de creación */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Crear Nuevo Usuario
          </h2>

          {error && <ErrorMessage message={error} className='mb-4' />}
          {success && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm'>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <Input
                label='Nombre'
                type='text'
                placeholder='Juan'
                error={errors.firstName?.message}
                {...registerField('firstName')}
              />

              <Input
                label='Apellido'
                type='text'
                placeholder='Pérez'
                error={errors.lastName?.message}
                {...registerField('lastName')}
              />
            </div>

            <Input
              label='Correo Electrónico'
              type='email'
              placeholder='usuario@ug.edu.ec'
              error={errors.email?.message}
              {...registerField('email')}
            />

            <Input
              label='Contraseña'
              type='password'
              placeholder='••••••••'
              error={errors.password?.message}
              showPasswordToggle
              {...registerField('password')}
            />

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tipo de Usuario
              </label>
              <select
                {...registerField('role')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              >
                <option value={UserRole.STUDENT}>Estudiante</option>
                <option value={UserRole.ADMIN}>Administrador</option>
              </select>
            </div>

            {selectedRole === UserRole.STUDENT && (
              <>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Carrera
                  </label>
                  {careersLoading ? (
                    <div className='text-sm text-gray-500'>Cargando carreras...</div>
                  ) : (
                    <select
                      {...registerField('career')}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                    >
                      <option value=''>Seleccione una carrera</option>
                      {careers?.map((career) => (
                        <option key={career._id} value={career.name}>
                          {career.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.career && (
                    <p className='mt-1 text-sm text-red-600'>{errors.career.message}</p>
                  )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <Input
                    label='Curso'
                    type='text'
                    placeholder='8vo'
                    error={errors.course?.message}
                    {...registerField('course')}
                  />

                  <Input
                    label='Paralelo'
                    type='text'
                    placeholder='A'
                    error={errors.parallel?.message}
                    {...registerField('parallel')}
                  />
                </div>
              </>
            )}

            <Button
              type='submit'
              className='w-full'
              isLoading={createUser.isPending}
              disabled={createUser.isPending}
            >
              Crear Usuario
            </Button>
          </form>
        </Card>

        {/* Lista de usuarios */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Usuarios Registrados
          </h2>

          {usersLoading ? (
            <Loading />
          ) : users && users.length > 0 ? (
            <div className='space-y-2 max-h-[600px] overflow-y-auto'>
              {users.map((user) => (
                <div
                  key={user._id}
                  className='p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className='text-sm text-gray-500'>{user.email}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Estudiante'}
                        </span>
                        {user.career && (
                          <span className='text-xs text-gray-500'>
                            {user.career}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={user.isActive ? 'Activo' : 'Inactivo'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-500 text-center py-8'>
              No hay usuarios registrados
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

