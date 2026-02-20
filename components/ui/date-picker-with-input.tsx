import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithInputProps {
  id?: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  onError?: (error: string | null) => void;
  className?: string;
}

function formatInputDate(d: Date | undefined) {
  if (!d) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}/${month}/${day}`
}

function validateDateInput(value: string): string | null {
  if (value === "") return null
  const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return "YYYY/MM/DD形式で入力してください"
  const year = parseInt(match[1])
  const month = parseInt(match[2]) - 1
  const day = parseInt(match[3])
  const d = new Date(year, month, day)
  if (isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return "存在しない日付です"
  }
  return null
}

export function DatePickerWithInput({
  id,
  date,
  setDate,
  onError,
  className,
}: DatePickerWithInputProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatInputDate(date))
  const [inputError, setInputError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setInputValue(formatInputDate(date))
    setInputError(null)
    onError?.(null)
    if (date) {
      setMonth(date)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setInputError(null)
    onError?.(null)

    const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
    if (match) {
      const year = parseInt(match[1])
      const m = parseInt(match[2]) - 1
      const day = parseInt(match[3])
      const newDate = new Date(year, m, day)

      if (!isNaN(newDate.getTime()) && newDate.getFullYear() === year && newDate.getMonth() === m && newDate.getDate() === day) {
        setDate(newDate)
        setMonth(newDate)
      }
    } else if (value === "") {
      setDate(undefined)
    }
  }

  const handleBlur = () => {
    const error = validateDateInput(inputValue)
    setInputError(error)
    onError?.(error)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={className}>
      <div className="relative flex gap-2">
        <Input
          id={id}
          type="text"
          value={inputValue}
          placeholder="YYYY/MM/DD"
          className={cn("bg-white pr-10", inputError && "border-destructive")}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0 h-auto w-auto hover:bg-transparent"
            >
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0 bg-white"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(newDate) => {
                setDate(newDate)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {inputError && (
        <p className="mt-1 text-xs text-destructive">{inputError}</p>
      )}
    </div>
  )
}
