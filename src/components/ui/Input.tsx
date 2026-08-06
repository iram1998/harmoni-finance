import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: string;
  fullWidth?: boolean;
};

export function Input({
  label,
  error,
  icon,
  className = '',
  fullWidth = true,
  ...props
}: InputProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-outline-variant focus:border-primary focus:ring-primary/20';

  return (
    <div className={`flex flex-col gap-1 ${widthClass}`}>
      {label && <label className="font-label-sm text-on-surface-variant uppercase tracking-wide">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline-variant">
            {icon}
          </span>
        )}
        <input
          className={`h-12 bg-surface-container-lowest border rounded-xl px-4 font-body-md text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant ${icon ? 'pl-10' : ''} ${errorClass} ${className} ${widthClass}`}
          onWheel={(e) => {
            if (props.type === 'number') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          {...props}
        />
      </div>
      {error && <p className="font-body-sm text-error mt-1">{error}</p>}
    </div>
  );
}
