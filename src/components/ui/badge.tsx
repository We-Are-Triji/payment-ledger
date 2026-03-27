import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-[0.7rem] font-semibold whitespace-nowrap [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow,background-color]",
  {
    variants: {
      variant: {
        default: "bg-[rgba(168,213,186,0.18)] text-[var(--soft-mint)] [a&]:hover:bg-[rgba(168,213,186,0.24)]",
        secondary:
          "bg-white/[0.06] text-white [a&]:hover:bg-white/[0.08]",
        destructive:
          "bg-[rgba(243,166,175,0.18)] text-[var(--soft-danger)] [a&]:hover:bg-[rgba(243,166,175,0.24)] focus-visible:ring-destructive/20",
        outline:
          "border-white/10 text-foreground [a&]:hover:bg-white/[0.06]",
        ghost: "[a&]:hover:bg-white/[0.06] [a&]:hover:text-foreground",
        link: "text-[var(--soft-mint)] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
