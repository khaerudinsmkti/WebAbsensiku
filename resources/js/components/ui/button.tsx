import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-primary,#FF6B35)] bg-gradient-to-r from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand hover:brightness-105 active:brightness-95",
        primary:
          "bg-[var(--brand-primary,#FF6B35)] bg-gradient-to-r from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand hover:brightness-105 active:brightness-95",
        secondary:
          "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200/80 shadow-2xs dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700",
        success:
          "bg-gradient-to-r from-[#10B981] to-[#34D399] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:from-[#059669] hover:to-[#10B981]",
        warning:
          "bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:from-[#B45309] hover:to-[#F59E0B]",
        info:
          "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:from-[#1D4ED8] hover:to-[#3B82F6]",
        danger:
          "bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-[#DC2626] hover:to-[#EF4444]",
        destructive:
          "bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-[#DC2626] hover:to-[#EF4444]",
        outline:
          "border border-[var(--brand-primary,#FF6B35)] bg-transparent text-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-light,#FFF0EB)] dark:border-[var(--brand-primary,#FF6B35)] dark:text-white dark:hover:bg-[var(--brand-primary,#FF6B35)]/20",
        ghost:
          "border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
        link: "text-[var(--brand-primary,#FF6B35)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-base has-[>svg]:px-4",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
