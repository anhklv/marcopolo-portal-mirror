"use client"

import * as React from "react"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RadioItemProps {
  value: string
  label: string
  id?: string
  disabled?: boolean
  className?: string
}

function RadioItem({
  value,
  label,
  id,
  disabled,
  className,
}: RadioItemProps) {
  const itemId = id || value

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <RadioGroupItem value={value} id={itemId} disabled={disabled} />
      <Label htmlFor={itemId} className="cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

export { RadioItem }
