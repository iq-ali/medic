import { cn } from '@/lib/utils'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none',
        'placeholder:text-muted-foreground',
        'focus:border-ring focus:ring-3 focus:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'transition-all',
        className
      )}
      {...props}
    />
  )
}

export { Input }
