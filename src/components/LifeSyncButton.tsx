import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LifeSyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const LifeSyncButton = forwardRef<HTMLButtonElement, LifeSyncButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseClasses = 'lifesync-button inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'gradient-ocean text-primary-foreground hover:brightness-110 shadow-ocean',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
      outline: 'border border-primary/20 bg-background hover:bg-accent/50 text-foreground',
      ghost: 'hover:bg-accent/50 text-foreground',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-6',
      lg: 'h-13 px-8 text-lg',
      icon: 'h-11 w-11',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  }
);

LifeSyncButton.displayName = 'LifeSyncButton';

export { LifeSyncButton };