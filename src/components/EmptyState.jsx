import React from 'react';
import { PlusCircle } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No surplus records yet.',
  description = 'Start your first surplus report to assess rescue feasibility, calculate scores, and route to destinations.',
  actionLabel = 'Report Surplus Food',
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <div className="rounded-3xl bg-white border border-sky-100 p-10 md:p-14 text-center my-6 shadow-soft space-y-4 max-w-2xl mx-auto">
      <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center text-brand-600 shadow-inner text-3xl">
        🍲
      </div>

      <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-900">
        {title}
      </h3>

      <p className="text-xs sm:text-sm font-sans font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {(onAction || onSecondaryAction) && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onAction && (
            <Button
              variant="sun"
              size="md"
              onClick={onAction}
              icon={PlusCircle}
              className="w-full sm:w-auto text-xs px-6 py-2.5 font-display font-black shadow-sun"
            >
              {actionLabel}
            </Button>
          )}

          {onSecondaryAction && (
            <Button
              variant="secondary"
              size="md"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto text-xs px-5 py-2.5 font-display font-extrabold shadow-sm text-brand-800 hover:text-brand-900 hover:bg-teal-50/60 border-brand-200"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
