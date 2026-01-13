'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { useActiveCareers } from '@/hooks/use-careers';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/use-users';
import { ApiErrorResponse, User, UserRole } from '@/types';
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

const updateUserSchema = z
  .object({
    email: z
      .string()
      .email('Correo electrónico inválido')
      .refine((email) => email.endsWith('@ug.edu.ec'), {
        message: 'El correo debe ser del dominio @ug.edu.ec',
      }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length === 0 || val.length >= 6, {
        message: 'La contraseña debe tener al menos 6 caracteres',
      }),
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().optional(),
    role: z.nativeEnum(UserRole),
    career: z.string().optional(),
    course: z.string().optional(),
    parallel: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si es administrador, el apellido puede estar vacío
      if (data.role === UserRole.ADMIN) {
        return true;
      }
      // Si es estudiante, el apellido debe tener al menos 2 caracteres
      return !data.lastName || data.lastName.length >= 2;
    },
    {
      message: 'El apellido debe tener al menos 2 caracteres',
      path: ['lastName'],
    }
  );

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
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

  // Formulario para editar usuario
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    watch: watchEdit,
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const selectedEditRole = watchEdit('role');

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditValue('firstName', user.firstName);
    setEditValue('lastName', user.lastName);
    setEditValue('email', user.email);
    setEditValue('role', user.role);
    setEditValue('career', user.career || '');
    setEditValue('course', user.course || '');
    setEditValue('parallel', user.parallel || '');
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    resetEdit();
    setError(null);
    setSuccess(null);
  };

  const onEditSubmit = async (data: UpdateUserFormData) => {
    if (!editingUser) return;

    setError(null);
    setSuccess(null);
    try {
      // No incluir password si no se cambió
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        career: data.career || undefined,
        course: data.course || undefined,
        parallel: data.parallel || undefined,
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      await updateUser.mutateAsync({ id: editingUser._id, ...updateData });
      setSuccess('Usuario actualizado exitosamente');
      setEditingUser(null);
      resetEdit();
    } catch (err) {
      const error = err as ApiErrorResponse;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error al actualizar usuario'
      );
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await deleteUser.mutateAsync(userId);
      setSuccess('Usuario eliminado exitosamente');
    } catch (err) {
      const error = err as ApiErrorResponse;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error al eliminar usuario'
      );
    }
  };

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
        <h1 className='text-3xl font-bold text-gray-900'>
          Gestión de Usuarios
        </h1>
        <p className='mt-2 text-gray-600'>
          Crear y administrar usuarios del sistema
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Formulario de creación o edición */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>

          {error && <ErrorMessage message={error} className='mb-4' />}
          {success && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm'>
              {success}
            </div>
          )}

          {editingUser ? (
            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className='space-y-4'
            >
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Nombre'
                  type='text'
                  placeholder='Juan'
                  error={editErrors.firstName?.message}
                  {...registerEdit('firstName')}
                />

                <Input
                  label='Apellido'
                  type='text'
                  placeholder='Pérez'
                  error={editErrors.lastName?.message}
                  {...registerEdit('lastName')}
                />
              </div>

              <Input
                label='Correo Electrónico'
                type='email'
                placeholder='usuario@ug.edu.ec'
                error={editErrors.email?.message}
                {...registerEdit('email')}
              />

              <Input
                label='Contraseña (dejar vacío para no cambiar)'
                type='password'
                placeholder='••••••••'
                error={editErrors.password?.message}
                showPasswordToggle
                {...registerEdit('password')}
              />

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tipo de Usuario
                </label>
                <select
                  {...registerEdit('role')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
                >
                  <option value={UserRole.STUDENT}>Estudiante</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>

              {selectedEditRole === UserRole.STUDENT && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Carrera
                    </label>
                    {careersLoading ? (
                      <div className='text-sm text-gray-500'>
                        Cargando carreras...
                      </div>
                    ) : (
                      <select
                        {...registerEdit('career')}
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
                    {editErrors.career && (
                      <p className='mt-1 text-sm text-red-600'>
                        {editErrors.career.message}
                      </p>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <Input
                      label='Curso'
                      type='text'
                      placeholder='8vo'
                      error={editErrors.course?.message}
                      {...registerEdit('course')}
                    />

                    <Input
                      label='Paralelo'
                      type='text'
                      placeholder='A'
                      error={editErrors.parallel?.message}
                      {...registerEdit('parallel')}
                    />
                  </div>
                </>
              )}

              <div className='flex gap-2'>
                <Button
                  type='submit'
                  className='flex-1'
                  isLoading={updateUser.isPending}
                  disabled={updateUser.isPending}
                >
                  Guardar Cambios
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCancelEdit}
                  disabled={updateUser.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
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
                      <div className='text-sm text-gray-500'>
                        Cargando carreras...
                      </div>
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
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.career.message}
                      </p>
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
          )}
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
                    <div className='flex-1'>
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
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={user.isActive ? 'Activo' : 'Inactivo'}
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(user)}
                        className='px-3 py-1 text-sm'
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          handleDelete(
                            user._id,
                            `${user.firstName} ${user.lastName}`
                          )
                        }
                        disabled={deleteUser.isPending}
                        className='px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50'
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
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
