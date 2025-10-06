import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LifeSyncCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

const LifeSyncCard = forwardRef<HTMLDivElement, LifeSyncCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'lifesync-card';
    
    const variants = {
      default: 'gradient-card',
      elevated: 'gradient-card shadow-hover',
      outlined: 'bg-card border-2 border-primary/10',
    };

    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LifeSyncCard.displayName = 'LifeSyncCard';

export { LifeSyncCard };