"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { ChangeEvent, ChangeEventHandler } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const title = "Date Picker with Month and Year Selector";

interface DatePickerProps {
  value?: Date; // Hoặc Date | undefined
  onChange: (date: Date | undefined) => void;
}

const DatePicker = ({ value, onChange }: DatePickerProps) => {
  const [month, setMonth] = useState<Date>(new Date());

  const handleCalendarChange = (value: string | number, event: ChangeEventHandler<HTMLSelectElement>) => {
    const newEvent = {
      target: {
        value: String(value)
      }
    } as ChangeEvent<HTMLSelectElement>;
    event(newEvent);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn("w-70 justify-start text-left font-normal", !value && "text-muted-foreground")}
          variant="outline"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          locale={vi}
          captionLayout="dropdown"
          components={{
            MonthCaption: (props) => <>{props.children}</>,
            DropdownNav: (props) => <div className="flex w-full items-center gap-2">{props.children}</div>,
            Dropdown: (props) => (
              <Select
                onValueChange={(value) => {
                  if (props.onChange) {
                    handleCalendarChange(value, props.onChange);
                  }
                }}
                value={String(props.value)}
              >
                <SelectTrigger className="first:flex-1 last:shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {props.options?.map((option) => (
                    <SelectItem disabled={option.disabled} key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }}
          hideNavigation
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelect={onChange}
          selected={value}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
