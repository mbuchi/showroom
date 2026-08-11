import type { ReactNode } from 'react';
import { LoadingFeedback } from '@aireon/shared';

interface PolicyLoadingFeedbackProps {
  skeleton: ReactNode;
  label: string;
  fill?: boolean;
}

export function PolicyLoadingFeedback({ skeleton, label, fill = false }: PolicyLoadingFeedbackProps) {
  const feedback = <LoadingFeedback skeleton={skeleton} label={label} />;
  if (!fill) return feedback;

  return (
    <div
      data-loading-feedback-fill="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center [&>div]:h-full [&>div]:w-full [&>div]:flex [&>div]:items-center [&>div]:justify-center"
    >
      {feedback}
    </div>
  );
}
