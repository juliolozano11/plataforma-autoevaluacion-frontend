import { Question, ResponseType } from '@/types';

type Props = {
  question: Question;
  value?: number;
  onChange: (value: number) => void;
};

const labelSets: Record<
  ResponseType | 'numeric',
  Record<number, string[]> & { default: string[] }
> = {
  numeric: {
    default: [],
  },
  satisfaction: {
    5: [
      'Nada satisfecho',
      'Poco satisfecho',
      'Moderadamente satisfecho',
      'Satisfecho',
      'Totalmente satisfecho',
    ],
    6: [
      'Nada satisfecho',
      'Muy poco satisfecho',
      'Poco satisfecho',
      'Satisfecho',
      'Muy satisfecho',
      'Totalmente satisfecho',
    ],
    7: [
      'Nada satisfecho',
      'Muy poco satisfecho',
      'Poco satisfecho',
      'Moderadamente satisfecho',
      'Satisfecho',
      'Muy satisfecho',
      'Totalmente satisfecho',
    ],
    8: [
      'Nada satisfecho',
      'Casi nada satisfecho',
      'Muy poco satisfecho',
      'Poco satisfecho',
      'Satisfecho',
      'Muy satisfecho',
      'Casi totalmente satisfecho',
      'Totalmente satisfecho',
    ],
    9: [
      'Nada satisfecho',
      'Casi nada satisfecho',
      'Muy poco satisfecho',
      'Poco satisfecho',
      'Moderadamente satisfecho',
      'Satisfecho',
      'Muy satisfecho',
      'Casi totalmente satisfecho',
      'Totalmente satisfecho',
    ],
    10: [
      'Nada satisfecho',
      'Casi nada satisfecho',
      'Muy poco satisfecho',
      'Poco satisfecho',
      'Moderadamente satisfecho',
      'Satisfecho',
      'Muy satisfecho',
      'Casi totalmente satisfecho',
      'Prácticamente totalmente satisfecho',
      'Totalmente satisfecho',
    ],
    default: [
      'Nada satisfecho',
      'Poco satisfecho',
      'Moderadamente satisfecho',
      'Satisfecho',
      'Totalmente satisfecho',
    ],
  },
  frequency: {
    5: ['Nunca', 'Pocas veces', 'Ocasionalmente', 'Frecuentemente', 'Siempre'],
    6: [
      'Nunca',
      'Muy pocas veces',
      'Pocas veces',
      'Frecuentemente',
      'Muy frecuentemente',
      'Siempre',
    ],
    7: [
      'Nunca',
      'Muy pocas veces',
      'Pocas veces',
      'Ocasionalmente',
      'Frecuentemente',
      'Muy frecuentemente',
      'Siempre',
    ],
    8: [
      'Nunca',
      'Casi nunca',
      'Muy pocas veces',
      'Pocas veces',
      'Frecuentemente',
      'Muy frecuentemente',
      'Casi siempre',
      'Siempre',
    ],
    9: [
      'Nunca',
      'Casi nunca',
      'Muy pocas veces',
      'Pocas veces',
      'Ocasionalmente',
      'Frecuentemente',
      'Muy frecuentemente',
      'Casi siempre',
      'Siempre',
    ],
    10: [
      'Nunca',
      'Casi nunca',
      'Muy pocas veces',
      'Pocas veces',
      'Ocasionalmente',
      'Frecuentemente',
      'Muy frecuentemente',
      'Casi siempre',
      'Prácticamente siempre',
      'Siempre',
    ],
    default: [
      'Nunca',
      'Pocas veces',
      'Ocasionalmente',
      'Frecuentemente',
      'Siempre',
    ],
  },
  agreement: {
    5: [
      'Totalmente en desacuerdo',
      'En desacuerdo',
      'Neutral',
      'De acuerdo',
      'Totalmente de acuerdo',
    ],
    6: [
      'Totalmente en desacuerdo',
      'Muy en desacuerdo',
      'En desacuerdo',
      'De acuerdo',
      'Muy de acuerdo',
      'Totalmente de acuerdo',
    ],
    7: [
      'Totalmente en desacuerdo',
      'Muy en desacuerdo',
      'En desacuerdo',
      'Neutral',
      'De acuerdo',
      'Muy de acuerdo',
      'Totalmente de acuerdo',
    ],
    8: [
      'Totalmente en desacuerdo',
      'Casi totalmente en desacuerdo',
      'Muy en desacuerdo',
      'En desacuerdo',
      'De acuerdo',
      'Muy de acuerdo',
      'Casi totalmente de acuerdo',
      'Totalmente de acuerdo',
    ],
    9: [
      'Totalmente en desacuerdo',
      'Casi totalmente en desacuerdo',
      'Muy en desacuerdo',
      'En desacuerdo',
      'Neutral',
      'De acuerdo',
      'Muy de acuerdo',
      'Casi totalmente de acuerdo',
      'Totalmente de acuerdo',
    ],
    10: [
      'Totalmente en desacuerdo',
      'Casi totalmente en desacuerdo',
      'Muy en desacuerdo',
      'En desacuerdo',
      'Ligeramente en desacuerdo',
      'Ligeramente de acuerdo',
      'De acuerdo',
      'Muy de acuerdo',
      'Casi totalmente de acuerdo',
      'Totalmente de acuerdo',
    ],
    default: [
      'Totalmente en desacuerdo',
      'En desacuerdo',
      'Neutral',
      'De acuerdo',
      'Totalmente de acuerdo',
    ],
  },
};

const pickLabels = (
  type: ResponseType | 'numeric',
  total: number
): string[] | null => {
  const set = labelSets[type];
  if (!set) return null;
  return set[total] || set.default || null;
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

  const labels = pickLabels(type, max - min + 1);
  if (!labels || labels.length === 0) {
    return String(value);
  }

  const normalized = (value - min) / (max - min || 1);
  const index = Math.min(
    labels.length - 1,
    Math.max(0, Math.round(normalized * (labels.length - 1)))
  );

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
  const safeValue =
    typeof value === 'number' ? value : Math.round((minScale + maxScale) / 2);
  const responseType = (question.responseType ||
    'satisfaction') as ResponseType | 'numeric';

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
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
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
