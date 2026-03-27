import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground/85 flex min-h-24 w-full rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,background-color,box-shadow] outline-none focus-visible:border-[var(--soft-gold)] focus-visible:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-[rgba(251,228,161,0.18)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
