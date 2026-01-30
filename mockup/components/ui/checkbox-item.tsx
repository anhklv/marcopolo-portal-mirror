"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CheckboxItemProps {
  id: string
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

function CheckboxItem({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxItemProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange?.(c === true)}
        disabled={disabled}
      />
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

export { CheckboxItem }
