import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900/60 text-foreground placeholder:text-muted-foreground flex h-10 w-full min-w-0 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--brand-primary,#FF6B35)] focus-visible:ring-3 focus-visible:ring-[var(--brand-primary,#FF6B35)]/15",
        "aria-invalid:border-[#EF4444] aria-invalid:ring-[#EF4444]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
