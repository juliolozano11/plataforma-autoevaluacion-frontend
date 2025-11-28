'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/use-auth';
import { ApiErrorResponse } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .refine((email) => email.endsWith('@ug.edu.ec'), {
      message: 'El correo debe ser del dominio @ug.edu.ec',
    }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login.mutateAsync(data);
    } catch (err) {
      const error = err as ApiErrorResponse;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error al iniciar sesión'
      );
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4'>
      <Card className='w-full max-w-md'>
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Iniciar Sesión
          </h1>
          <p className='text-gray-600'>
            Plataforma de Autoevaluación - Universidad de Guayaquil
          </p>
        </div>

        {error && <ErrorMessage message={error} className='mb-4' />}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <Input
            label='Correo Electrónico'
            type='email'
            placeholder='usuario@ug.edu.ec'
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label='Contraseña'
            type='password'
            placeholder='••••••••'
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type='submit'
            className='w-full'
            isLoading={login.isPending}
            disabled={login.isPending}
          >
            Iniciar Sesión
          </Button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            ¿No tienes una cuenta?{' '}
            <Link
              href='/auth/register'
              className='text-blue-600 hover:underline'
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
