"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export function HomeLocationInput({
  apiKey,
  placeholder,
  fontColor,
  bgColor,
  borderColor,
  borderRadius,
}: {
  apiKey?: string;
  placeholder?: string;
  fontColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderRadius: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        new google.maps.places.Autocomplete(inputRef.current, { fields: ["formatted_address", "geometry", "name"] });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center px-3 bg-gray-100 text-muted-foreground text-xs" style={{ borderRadius }}>
        Google Maps API key required
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center gap-2 px-3"
      style={{ backgroundColor: bgColor ?? "#ffffff", border: `1px solid ${borderColor ?? "#e5e7eb"}`, borderRadius }}>
      <MapPin className="h-4 w-4 shrink-0" style={{ color: fontColor ?? "#111111" }} />
      <input
        ref={inputRef}
        placeholder={placeholder || "Enter location"}
        className="w-full text-sm outline-none bg-transparent"
        style={{ color: fontColor ?? "#111111" }}
      />
    </div>
  );
}
