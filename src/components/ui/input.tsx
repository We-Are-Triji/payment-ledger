import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/85 selection:bg-primary selection:text-primary-foreground h-11 w-full min-w-0 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-2 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,background-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[var(--soft-gold)] focus-visible:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-[rgba(251,228,161,0.18)]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
