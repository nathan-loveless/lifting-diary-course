"use client";

import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Navigation only: the selected date goes in the URL, and the server
// component page fetches the data for it.
export function DatePicker({ date }: { date: string }) {
  const router = useRouter();
  const selected = parse(date, "yyyy-MM-dd", new Date());

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" className="w-56 justify-start" />}
      >
        <CalendarIcon />
        {format(selected, "do MMM yyyy")}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(next) =>
            next && router.push(`/dashboard?date=${format(next, "yyyy-MM-dd")}`)
          }
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
