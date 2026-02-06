"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

function ActionButton({
  children,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      className={cn("min-w-32 h-11 cursor-pointer", className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export { ActionButton }
