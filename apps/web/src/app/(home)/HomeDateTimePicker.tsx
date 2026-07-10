"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";

type DateOption = "today" | "tomorrow" | "custom";

export function HomeDateTimePicker({
  defaultOption,
  customDate,
  time,
  fontColor,
  bgColor,
  borderColor,
  borderRadius,
}: {
  defaultOption?: DateOption;
  customDate?: string;
  time?: string;
  fontColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderRadius: number;
}) {
  const [option, setOption] = useState<DateOption>(defaultOption ?? "today");
  const [date, setDate] = useState(customDate ?? "");
  const [timeVal, setTimeVal] = useState(time ?? "09:00");
  const color = fontColor ?? "#111111";

  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 px-3 py-2"
      style={{ backgroundColor: bgColor ?? "#ffffff", border: `1px solid ${borderColor ?? "#e5e7eb"}`, borderRadius, color }}>
      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 shrink-0" />
        <div className="flex gap-1">
          {(["today", "tomorrow", "custom"] as DateOption[]).map((opt) => (
            <button key={opt} type="button" onClick={() => setOption(opt)}
              className="text-xs px-2 py-0.5 rounded border capitalize"
              style={{ borderColor: color, opacity: option === opt ? 1 : 0.5, fontWeight: option === opt ? 600 : 400 }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      {option === "custom" && (
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="text-sm bg-transparent border rounded px-2 py-1 w-fit" style={{ borderColor: color, color }} />
      )}
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 shrink-0" />
        <input type="time" value={timeVal} onChange={(e) => setTimeVal(e.target.value)}
          className="text-sm bg-transparent border rounded px-2 py-1" style={{ borderColor: color, color }} />
      </div>
    </div>
  );
}
