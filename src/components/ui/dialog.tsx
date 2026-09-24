import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <BaseDialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}>
      {children}
    </BaseDialog.Root>
  );
};

const DialogPortal = BaseDialog.Portal;

const DialogBackdrop = React.forwardRef<
  React.ElementRef<typeof BaseDialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
      className,
    )}
    {...props}
  />
));
DialogBackdrop.displayName = 'DialogBackdrop';

const DialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialog.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdrop />
    <BaseDialog.Popup
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 shadow-2xl duration-200 rounded-2xl dark:border-neutral-800 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
      <BaseDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </BaseDialog.Close>
    </BaseDialog.Popup>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof BaseDialog.Title>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-100',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof BaseDialog.Description>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
