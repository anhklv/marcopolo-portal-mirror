import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { validateDateInput } from "@/lib/validations/customer"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/** 年ドロップダウンの下限（react-day-picker のデフォルトは約100年前） */
const CALENDAR_DROPDOWN_YEAR_MIN = 2020;

interface DatePickerWithInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

function parseDisplayDate(value: string): Date | undefined {
  if (!value) return undefined
  const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return undefined
  const year = parseInt(match[1])
  const month = parseInt(match[2]) - 1
  const day = parseInt(match[3])
  const d = new Date(year, month, day)
  if (isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return undefined
  }
  return d
}

export function DatePickerWithInput({
  id,
  value,
  onChange,
  error,
  className,
}: DatePickerWithInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputError, setInputError] = React.useState<string | null>(null)

  const parsedDate = parseDisplayDate(value)
  const [month, setMonth] = React.useState<Date | undefined>(parsedDate)

  // カレンダーの表示月を同期
  React.useEffect(() => {
    if (parsedDate) {
      setMonth(parsedDate)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setInputError(null)
  }

  const handleBlur = () => {
    setInputError(validateDateInput(value))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  const displayError = error || inputError

  // 年ドロップダウン: 2020年1月 〜 現在年+1年の12月まで
  const calendarStartMonth = new Date(CALENDAR_DROPDOWN_YEAR_MIN, 0);
  const calendarEndMonth = new Date(new Date().getFullYear() + 1, 11);

  return (
    <div className={className}>
      <div className="relative flex gap-2">
        <Input
          id={id}
          type="text"
          value={value}
          placeholder="YYYY/MM/DD"
          className={cn("bg-white pr-10", displayError && "border-destructive")}
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
              selected={parsedDate}
              captionLayout="dropdown"
              startMonth={calendarStartMonth}
              endMonth={calendarEndMonth}
              month={month}
              onMonthChange={setMonth}
              onSelect={(newDate) => {
                if (newDate) {
                  onChange(formatDate(newDate))
                  setInputError(null)
                }
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {displayError && (
        <p className="mt-1 text-xs text-destructive">{displayError}</p>
      )}
    </div>
  )
}
