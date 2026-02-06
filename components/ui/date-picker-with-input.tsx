import * as React from "react"
import { CalendarIcon } from "lucide-react"

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
  className?: string;
}

export function DatePickerWithInput({
  id,
  date,
  setDate,
  className,
}: DatePickerWithInputProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(date)

  // YYYY/MM/DD形式で表示
  const formatInputDate = (d: Date | undefined) => {
    if (!d) return ""
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}/${month}/${day}`
  }

  const [inputValue, setInputValue] = React.useState(formatInputDate(date))

  // dateプロパティが変更されたらinputValueを更新
  React.useEffect(() => {
    setInputValue(formatInputDate(date))
    if (date) {
      setMonth(date)
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // 入力値が有効な日付形式かチェック (YYYY/MM/DD)
    const match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
    if (match) {
      const year = parseInt(match[1])
      const month = parseInt(match[2]) - 1
      const day = parseInt(match[3])
      const newDate = new Date(year, month, day)

      if (!isNaN(newDate.getTime()) && newDate.getFullYear() === year && newDate.getMonth() === month && newDate.getDate() === day) {
        setDate(newDate)
        setMonth(newDate)
      }
    } else if (value === "") {
      setDate(undefined)
    }
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
          className="bg-white pr-10"
          onChange={handleInputChange}
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
    </div>
  )
}
