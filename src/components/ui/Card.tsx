import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'primary' | 'primary-container';
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({ children, className = '', variant = 'default', ...props }: CardProps) {
  const baseStyles = 'rounded-2xl overflow-hidden';
  
  const variants = {
    default: 'bg-surface-container-lowest border border-outline-variant shadow-sm',
    outlined: 'bg-transparent border border-outline-variant',
    elevated: 'bg-surface-container-lowest shadow-md',
    primary: 'bg-primary text-on-primary border border-transparent shadow-md',
    'primary-container': 'bg-primary-container text-on-primary-container border border-primary-fixed',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pb-4 border-b border-outline-variant/50 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`font-headline-sm text-on-surface ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props}>{children}</div>;
}
