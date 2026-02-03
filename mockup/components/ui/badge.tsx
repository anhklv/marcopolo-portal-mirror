import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-3 py-1 text-xs font-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border bg-white text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        premium:
          "border-[#061E29] bg-white text-[#061E29] [a&]:hover:bg-[#061E29]/5",
        audit:
          "border-transparent bg-[#0B485B] text-white [a&]:hover:bg-[#0B485B]/90",
        naikan:
          "border-transparent bg-[#088395] text-white [a&]:hover:bg-[#088395]/90",
        ai:
          "border-transparent bg-[#7AB2B2] text-white [a&]:hover:bg-[#7AB2B2]/90",
        online:
          "border-transparent bg-blue-100 text-blue-800 [a&]:hover:bg-blue-200",
        member: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        sponsor:
          "border-border bg-white text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        observer:
          "border-border bg-white text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        "non-member":
          "border-border bg-white text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
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
  const Comp = asChild ? Slot : "span"

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
