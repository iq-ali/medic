import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none',
        'placeholder:text-muted-foreground',
        'focus:border-ring focus:ring-3 focus:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'resize-y transition-all',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
