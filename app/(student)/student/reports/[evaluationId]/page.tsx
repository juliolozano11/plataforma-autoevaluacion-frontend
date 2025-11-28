'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';
import { useEvaluation } from '@/hooks/use-evaluations';
import { useIndividualReport } from '@/hooks/use-reports';
import { EvaluationLevel } from '@/types';

const levelLabels: Record<EvaluationLevel, string> = {
  [EvaluationLevel.MUY_BAJO]: 'Muy Bajo',
  [EvaluationLevel.BAJO]: 'Bajo',
  [EvaluationLevel.INTERMEDIO]: 'Intermedio',
  [EvaluationLevel.ALTO]: 'Alto',
  [EvaluationLevel.MUY_ALTO]: 'Muy Alto',
};

const levelColors: Record<EvaluationLevel, string> = {
  [EvaluationLevel.MUY_BAJO]: 'bg-red-100 text-red-800',
  [EvaluationLevel.BAJO]: 'bg-orange-100 text-orange-800',
  [EvaluationLevel.INTERMEDIO]: 'bg-yellow-100 text-yellow-800',
  [EvaluationLevel.ALTO]: 'bg-blue-100 text-blue-800',
  [EvaluationLevel.MUY_ALTO]: 'bg-green-100 text-green-800',
};

// Helper function to validate and get level
const getValidLevel = (level: any): EvaluationLevel | null => {
  if (!level) return null;
  const validLevel = level as EvaluationLevel;
  return Object.values(EvaluationLevel).includes(validLevel) ? validLevel : null;
};

export default function IndividualReportPage() {
  const params = useParams();
  const evaluationId = params.evaluationId as string;

  const { data: evaluation, isLoading: evaluationLoading } = useEvaluation(evaluationId);
  const { data: report, isLoading: reportLoading } = useIndividualReport();

  if (evaluationLoading || reportLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!evaluation || !report) {
    return <ErrorMessage message="No se pudo cargar el reporte" />;
  }

  const sectionName = typeof evaluation.sectionId === 'object'
    ? evaluation.sectionId.displayName
    : 'Sección';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reporte Individual</h1>
        <p className="mt-2 text-gray-600">
          Resultados de tu evaluación: {sectionName}
        </p>
      </div>

      {/* Resumen principal */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Puntuación Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {evaluation.totalScore || 0} / {evaluation.maxScore || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Porcentaje</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {evaluation.maxScore && evaluation.totalScore
                ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Nivel Alcanzado</p>
            {(() => {
              const validLevel = getValidLevel(evaluation.level);
              return validLevel ? (
                <span
                  className={`inline-block px-4 py-2 rounded-full text-lg font-semibold mt-2 ${
                    levelColors[validLevel]
                  }`}
                >
                  {levelLabels[validLevel]}
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </Card>

      {/* Detalles por sección */}
      {report.sections && Array.isArray(report.sections) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Resultados por Sección
          </h2>
          {report.sections.map((sectionResult: any, index: number) => {
            const validLevel = getValidLevel(sectionResult.level);
            
            return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sectionResult.sectionName || `Sección ${index + 1}`}
                </h3>
                {validLevel && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      levelColors[validLevel]
                    }`}
                  >
                    {levelLabels[validLevel]}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Puntuación</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {sectionResult.score || 0} / {sectionResult.maxScore || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Porcentaje</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {sectionResult.maxScore && sectionResult.score
                      ? Math.round((sectionResult.score / sectionResult.maxScore) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Recomendaciones */}
      {evaluation.level && (
        <Card className="p-6 bg-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recomendaciones
          </h2>
          <p className="text-gray-700">
            {evaluation.level === EvaluationLevel.MUY_BAJO && 
              'Tu nivel es muy bajo. Te recomendamos buscar apoyo académico y practicar más.'}
            {evaluation.level === EvaluationLevel.BAJO && 
              'Tu nivel es bajo. Considera tomar cursos de nivelación y practicar regularmente.'}
            {evaluation.level === EvaluationLevel.INTERMEDIO && 
              'Tienes un nivel intermedio. Continúa practicando para mejorar tus habilidades.'}
            {evaluation.level === EvaluationLevel.ALTO && 
              'Tienes un nivel alto. ¡Sigue así! Considera ayudar a otros estudiantes.'}
            {evaluation.level === EvaluationLevel.MUY_ALTO && 
              '¡Excelente! Tienes un nivel muy alto. Eres un ejemplo para otros estudiantes.'}
          </p>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información de la Evaluación
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {evaluation.startedAt && (
            <div>
              <p className="text-gray-500">Fecha de Inicio</p>
              <p className="font-medium text-gray-900">
                {new Date(evaluation.startedAt).toLocaleString()}
              </p>
            </div>
          )}
          {evaluation.completedAt && (
            <div>
              <p className="text-gray-500">Fecha de Finalización</p>
              <p className="font-medium text-gray-900">
                {new Date(evaluation.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

