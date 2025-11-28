'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/use-auth';
import { ApiErrorResponse, UserRole } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const registerSchema = z.object({
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

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const register = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.STUDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await register.mutateAsync(data);
    } catch (err) {
      const error = err as ApiErrorResponse;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error al registrar usuario'
      );
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12'>
      <Card className='w-full max-w-md'>
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Crear Cuenta
          </h1>
          <p className='text-gray-600'>
            Plataforma de Autoevaluación - Universidad de Guayaquil
          </p>
        </div>

        {error && <ErrorMessage message={error} className='mb-4' />}

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
              <Input
                label='Carrera'
                type='text'
                placeholder='Ingeniería en Sistemas'
                error={errors.career?.message}
                {...registerField('career')}
              />

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
            isLoading={register.isPending}
            disabled={register.isPending}
          >
            Crear Cuenta
          </Button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            ¿Ya tienes una cuenta?{' '}
            <Link href='/auth/login' className='text-blue-600 hover:underline'>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
