"use client";

import { useState } from "react";
import { CarFront } from "lucide-react";
import { getHomeIcon } from "@/lib/homepage-icons";

interface VehicleOption {
  id: string;
  label: string;
  iconId?: string;
  fareText?: string;
}

export function HomeVehicleSelector({
  options,
  defaultSelectedId,
  bgColor,
}: {
  options: VehicleOption[];
  defaultSelectedId?: string;
  bgColor?: string;
}) {
  const [selected, setSelected] = useState(defaultSelectedId ?? options[0]?.id);

  if (options.length === 0) return null;

  return (
    <div className="w-full h-full flex items-center gap-2" style={{ backgroundColor: bgColor === "transparent" ? "transparent" : (bgColor ?? "transparent") }}>
      {options.map((opt) => {
        const def = getHomeIcon(opt.iconId);
        const Ico = def?.Icon ?? CarFront;
        const isSelected = selected === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => setSelected(opt.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border min-w-0 transition-colors ${isSelected ? "border-black bg-muted" : "border-gray-200 hover:bg-muted/50"}`}>
            <Ico className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] font-medium truncate w-full text-center">{opt.label}</span>
            {opt.fareText && <span className="text-[10px] text-muted-foreground truncate w-full text-center">{opt.fareText}</span>}
          </button>
        );
      })}
    </div>
  );
}
