'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
          <Card className='p-6 max-w-md w-full'>
            <div className='text-center'>
              <div className='mb-4'>
                <span className='inline-block px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium'>
                  Error
                </span>
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Algo salió mal
              </h2>
              <p className='text-gray-600 mb-4'>
                Ocurrió un error inesperado. Por favor, intenta recargar la
                página.
              </p>
              {this.state.error && (
                <p className='text-sm text-gray-500 mb-4'>
                  {this.state.error.message}
                </p>
              )}
              <div className='flex gap-3 justify-center'>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                >
                  Recargar Página
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = '/student/evaluations';
                  }}
                >
                  Volver a Evaluaciones
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
