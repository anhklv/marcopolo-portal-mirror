"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function SectionHeading({ children, className, ...props }: SectionHeadingProps) {
  return (
    <div className={cn(className)} {...props}>
      <h2 className="text-lg font-semibold">{children}</h2>
      <Separator className="mt-2" />
    </div>
  )
}

export { SectionHeading }
