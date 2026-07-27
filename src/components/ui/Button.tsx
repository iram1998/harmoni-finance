import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: string;
  isLoading?: boolean;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-surface-container-highest',
    outline: 'border border-outline-variant text-on-surface hover:bg-surface-container-low',
    ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
  };
  
  const sizes = {
    sm: 'px-4 py-1.5 font-label-sm',
    md: 'px-6 py-2.5 font-label-md',
    lg: 'px-8 py-3 font-label-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">progress_activity</span>
      ) : (
        icon && <span className="material-symbols-outlined mr-2 text-[20px]">{icon}</span>
      )}
      {children}
    </button>
  );
}
