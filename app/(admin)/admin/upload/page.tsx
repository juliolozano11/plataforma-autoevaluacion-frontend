'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuestionnaires } from '@/hooks/use-questionnaires';
import { useFormatInfo, useUploadQuestions } from '@/hooks/use-upload';
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ApiErrorResponse } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const uploadSchema = z.object({
  questionnaireId: z.string().min(1, 'Debes seleccionar un cuestionario'),
  format: z.enum(['excel', 'csv']),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { data: questionnaires } = useQuestionnaires();
  const uploadQuestions = useUploadQuestions();
  const { data: formatInfo } = useFormatInfo('excel');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      format: 'excel',
    },
  });

  const selectedFormat = watch('format');

  const { data: csvFormatInfo } = useFormatInfo(selectedFormat || 'excel');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.upload.template, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-preguntas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      alert('Error al descargar la plantilla. Por favor, intenta nuevamente.');
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      await uploadQuestions.mutateAsync({
        file: selectedFile,
        questionnaireId: data.questionnaireId,
        format: data.format,
      });
      alert('Preguntas cargadas exitosamente');
      setSelectedFile(null);
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      alert(
        apiError.response?.data?.message ||
          apiError.message ||
          'Error al cargar el archivo'
      );
    }
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Cargar Preguntas
        </h1>
        <p className='mt-2 text-gray-600'>
          Carga múltiples preguntas desde un archivo Excel o CSV
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Formulario de carga */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Subir Archivo
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Cuestionario
              </label>
              <select
                {...register('questionnaireId')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              >
                <option value=''>Selecciona un cuestionario</option>
                {questionnaires?.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title}
                  </option>
                ))}
              </select>
              {errors.questionnaireId && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.questionnaireId.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Formato del Archivo
              </label>
              <select
                {...register('format')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              >
                <option value='excel'>Excel (.xlsx, .xls)</option>
                <option value='csv'>CSV (.csv)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Archivo
              </label>
              <input
                type='file'
                accept={selectedFormat === 'excel' ? '.xlsx,.xls' : '.csv'}
                onChange={handleFileChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white'
              />
              {selectedFile && (
                <p className='mt-2 text-sm text-gray-600'>
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button
              type='submit'
              isLoading={uploadQuestions.isPending}
              disabled={!selectedFile}
              className='w-full'
            >
              📤 Cargar Preguntas
            </Button>
          </form>
        </Card>

        {/* Información del formato */}
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Formato Esperado
            </h2>
            <Button
              type='button'
              variant='outline'
              onClick={handleDownloadTemplate}
              className='flex items-center gap-2'
            >
              📥 Descargar Plantilla
            </Button>
          </div>
          {csvFormatInfo ? (
            <div className='space-y-4'>
              <div>
                <h3 className='font-medium text-gray-900 mb-2'>
                  {selectedFormat === 'excel' ? 'Excel' : 'CSV'}
                </h3>
                {csvFormatInfo.example && (
                  <p className='text-sm text-gray-600 mb-2'>
                    {selectedFormat === 'excel'
                      ? csvFormatInfo.example.excel ||
                        'Primera fila: encabezados, siguientes filas: datos'
                      : csvFormatInfo.example.csv ||
                        'Primera fila: encabezados, siguientes filas: datos separados por coma'}
                  </p>
                )}
                {csvFormatInfo.columns &&
                  Array.isArray(csvFormatInfo.columns) && (
                    <div>
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        Columnas requeridas:
                      </p>
                      <ul className='list-disc list-inside text-sm text-gray-600 space-y-1'>
                        {csvFormatInfo.columns.map(
                          (
                            col: { name: string; description: string },
                            idx: number
                          ) => (
                            <li key={idx}>
                              <strong>{col.name}:</strong> {col.description}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className='space-y-2 text-sm text-gray-600'>
              <p>
                <strong>Excel:</strong> Primera fila: encabezados, siguientes
                filas: datos
              </p>
              <p>
                <strong>CSV:</strong> Primera fila: encabezados, siguientes
                filas: datos separados por coma
              </p>
              <p className='mt-4'>
                <strong>Columnas requeridas:</strong>
              </p>
              <ul className='list-disc list-inside ml-4 space-y-1'>
                <li>
                  <strong>text:</strong> Texto de la pregunta (requerido)
                </li>
                <li>
                  <strong>type:</strong> Siempre debe ser "scale" (todas las
                  preguntas son tipo Likert)
                </li>
                <li>
                  <strong>minScale:</strong> Valor mínimo de la escala (default:
                  1)
                </li>
                <li>
                  <strong>maxScale:</strong> Valor máximo de la escala (default:
                  10)
                </li>
                <li>
                  <strong>responseType:</strong> Tipo de respuesta: "satisfaction", "frequency", "agreement" o "numeric" (default: "satisfaction")
                </li>
                <li>
                  <strong>points:</strong> Puntos que vale la pregunta (default:
                  1)
                </li>
                <li>
                  <strong>order:</strong> Orden de la pregunta (default:
                  secuencial)
                </li>
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
