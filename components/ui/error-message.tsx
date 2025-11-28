import { cn } from '@/lib/utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg',
        className
      )}
    >
      <p className="text-sm">{message}</p>
    </div>
  );
};

