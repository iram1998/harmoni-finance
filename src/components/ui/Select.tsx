import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  icon?: string;
  fullWidth?: boolean;
};

export function Select({
  label,
  error,
  icon,
  className = '',
  fullWidth = true,
  children,
  ...props
}: SelectProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-outline-variant focus:border-primary focus:ring-primary/20';

  return (
    <div className={`flex flex-col gap-1 ${widthClass}`}>
      {label && <label className="font-label-sm text-on-surface-variant uppercase tracking-wide">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline-variant z-10">
            {icon}
          </span>
        )}
        <select
          className={`h-12 bg-surface-container-lowest border rounded-xl px-4 font-body-md text-on-surface focus:outline-none focus:ring-2 transition-all appearance-none ${icon ? 'pl-10' : ''} ${errorClass} ${className} ${widthClass}`}
          {...props}
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
      </div>
      {error && <p className="font-body-sm text-error mt-1">{error}</p>}
    </div>
  );
}
