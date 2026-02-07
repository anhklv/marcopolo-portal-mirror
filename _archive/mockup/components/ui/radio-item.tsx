"use client"

import * as React from "react"
import { RadioGroupItem } from "@/components/ui/radio-group"
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
      <label htmlFor={itemId} className="cursor-pointer text-base">
        {label}
      </label>
    </div>
  )
}

export { RadioItem }
