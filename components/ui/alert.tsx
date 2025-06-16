import React, { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AlertProps = {
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
          className
        )}
        role='alert'
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };

export const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { className?: string }
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
});

AlertDescription.displayName = 'AlertDescription'; 