"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  backHref?: string
  backAction?: () => void
  title: string
  description?: string
}

function PageHeader({
  backHref,
  backAction,
  title,
  description,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} {...props}>
      {backHref && (
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {backAction && !backHref && (
        <Button variant="ghost" size="icon" onClick={backAction}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

export { PageHeader }
