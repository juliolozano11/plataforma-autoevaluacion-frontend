import { Question, ResponseType } from '@/types';

type Props = {
  question: Question;
  value?: number;
  onChange: (value: number) => void;
};

const baseLabels: Record<ResponseType, string[]> = {
  satisfaction: [
    'Nada satisfecho',
    'Poco satisfecho',
    'Moderadamente satisfecho',
    'Satisfecho',
    'Totalmente satisfecho',
  ],
  frequency: ['Nunca', 'Pocas veces', 'Ocasionalmente', 'Frecuentemente', 'Siempre'],
  agreement: [
    'Totalmente en desacuerdo',
    'En desacuerdo',
    'Neutral',
    'De acuerdo',
    'Totalmente de acuerdo',
  ],
};

const pickLabelByValue = (
  value: number,
  type: ResponseType | 'numeric',
  min: number,
  max: number
): string => {
  if (type === 'numeric') {
    return String(value);
  }

  const labels = baseLabels[type];
  if (!labels) return String(value);

  const normalized = (value - min) / (max - min || 1);
  const index = Math.min(labels.length - 1, Math.max(0, Math.round(normalized * (labels.length - 1))));

  return labels[index];
};

const pickEmoji = (value: number, min: number, max: number) => {
  const normalized = (value - min) / (max - min || 1);
  if (normalized <= 0) return '😠';
  if (normalized <= 0.25) return '😕';
  if (normalized <= 0.5) return '😐';
  if (normalized <= 0.75) return '🙂';
  if (normalized < 1) return '😊';
  return '😄';
};

export function ScaleQuestion({ question, value, onChange }: Props) {
  const minScale = question.minScale ?? 1;
  const maxScale = question.maxScale ?? 10;
  const safeValue = typeof value === 'number' ? value : Math.round((minScale + maxScale) / 2);
  const responseType = (question.responseType || 'satisfaction') as ResponseType | 'numeric';

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between text-sm text-gray-600'>
        <span>Mínimo</span>
        <span>Intermedio</span>
        <span>Máximo</span>
      </div>
      <input
        type='range'
        min={minScale}
        max={maxScale}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className='w-full h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-green-600 rounded-lg appearance-none cursor-pointer accent-indigo-600'
      />
      <div className='flex items-center justify-between text-sm text-gray-500'>
        <span>{pickEmoji(safeValue, minScale, maxScale)}</span>
        <span className='text-lg font-semibold text-gray-900'>
          {pickLabelByValue(safeValue, responseType, minScale, maxScale)}
        </span>
      </div>
    </div>
  );
}
