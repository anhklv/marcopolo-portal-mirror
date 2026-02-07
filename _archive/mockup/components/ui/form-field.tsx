"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormFieldChild = React.ReactElement<any>

interface FormFieldProps {
  label: string
  required?: boolean
  description?: string
  id?: string
  children: FormFieldChild
  className?: string
  error?: string
}

function FormField({
  label,
  required = false,
  description,
  id,
  children,
  className,
  error,
}: FormFieldProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  // childrenにidとaria属性を付与
  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    "aria-describedby": cn(descriptionId, errorId) || undefined,
    "aria-invalid": error ? true : undefined,
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {childWithProps}
      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
