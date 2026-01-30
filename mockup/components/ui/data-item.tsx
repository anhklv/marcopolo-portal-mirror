"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DataItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  children: React.ReactNode
}

function DataItem({ label, children, className, ...props }: DataItemProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-base">{children}</div>
    </div>
  )
}

export { DataItem }
