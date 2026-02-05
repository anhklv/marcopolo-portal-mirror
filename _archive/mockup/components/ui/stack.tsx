"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const gapMap = {
  xs: "gap-1",   // 4px
  sm: "gap-2",   // 8px
  md: "gap-4",   // 16px
  lg: "gap-6",   // 24px
  xl: "gap-8",   // 32px
} as const

type Gap = keyof typeof gapMap

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Gap
  children: React.ReactNode
}

function Stack({ gap = "md", className, children, ...props }: StackProps) {
  return (
    <div className={cn("flex flex-col", gapMap[gap], className)} {...props}>
      {children}
    </div>
  )
}

export { Stack, type Gap }
