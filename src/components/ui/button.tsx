import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 press-scale disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--soft-gold)] text-[#1a1813] shadow-[0_16px_32px_rgba(251,228,161,0.22)] hover:brightness-[1.04]",
        destructive:
          "bg-[var(--soft-danger)] text-[#241317] shadow-[0_14px_28px_rgba(243,166,175,0.16)] hover:brightness-[1.03] focus-visible:ring-destructive/20",
        outline:
          "border border-white/8 bg-white/[0.04] text-foreground shadow-[var(--soft-shadow-sm)] hover:bg-white/[0.08]",
        secondary:
          "bg-[var(--soft-surface-3)] text-foreground shadow-[var(--soft-shadow-sm)] hover:bg-white/[0.08]",
        ghost:
          "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        link: "text-[var(--soft-mint)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-full px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-6 text-[0.95rem] has-[>svg]:px-5",
        icon: "size-11",
        "icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
