"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

export function HomeMap({
  apiKey,
  centerLat,
  centerLng,
  zoom,
  markers,
  serviceRadiusKm,
  borderRadius,
}: {
  apiKey?: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  markers: MapMarker[];
  serviceRadiusKm?: number;
  borderRadius: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !ref.current) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !ref.current) return;
        const map = new google.maps.Map(ref.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom,
        });
        markers.forEach((m) => {
          new google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map, title: m.label });
        });
        if (serviceRadiusKm && serviceRadiusKm > 0) {
          new google.maps.Circle({
            center: { lat: centerLat, lng: centerLng },
            radius: serviceRadiusKm * 1000,
            map,
            fillColor: "#3b82f6",
            fillOpacity: 0.08,
            strokeColor: "#3b82f6",
            strokeOpacity: 0.4,
            strokeWeight: 1,
          });
        }
      })
      .catch(() => { if (!cancelled) setError("Failed to load Google Maps"); });
    return () => { cancelled = true; };
  }, [apiKey, centerLat, centerLng, zoom, markers, serviceRadiusKm]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-center px-3 bg-gray-100 text-muted-foreground text-xs" style={{ borderRadius }}>
        Google Maps API key required
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center px-3 bg-gray-100 text-muted-foreground text-xs" style={{ borderRadius }}>
        {error}
      </div>
    );
  }
  return <div ref={ref} className="w-full h-full" style={{ borderRadius, overflow: "hidden" }} />;
}
