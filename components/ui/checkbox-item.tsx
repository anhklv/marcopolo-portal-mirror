"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface CheckboxItemProps {
  id: string
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  labelClassName?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

function CheckboxItem({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
  labelClassName,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: CheckboxItemProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange?.(c === true)}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
      <label htmlFor={id} className={cn("cursor-pointer text-base", labelClassName)}>
        {label}
      </label>
    </div>
  )
}

export { CheckboxItem }
