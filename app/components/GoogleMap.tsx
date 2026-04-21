"use client";

import { useEffect, useRef, useState } from "react";

export interface HotelPin {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  index?: number; // 1-based position in hotel list
}

interface GoogleMapProps {
  venueCoords: { lat: number; lng: number } | null;
  venueName: string;
  hotels: HotelPin[];
  selectedId?: string | null;
  onMarkerClick?: (hotelId: string) => void;
  className?: string;
}

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#eaeae4" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#0D1B2E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f4f4ee" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8e8e0" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d8d8d0" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c8d8e0" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
];

// ── Custom SVG marker icons ───────────────────────────────────────────────────

function hotelMarkerUrl(num: number, selected: boolean): string {
  const bg = selected ? "#C8F000" : "#0D1B2E";
  const fg = selected ? "#0D1B2E" : "#ffffff";
  const stroke = selected ? "#0D1B2E" : "#ffffff";
  const r = selected ? 14 : 12;
  const size = r * 2 + 4;
  const cx = size / 2;
  const fontSize = num > 9 ? 10 : 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${bg}" stroke="${stroke}" stroke-width="2"/>
    <text x="${cx}" y="${cx + fontSize * 0.4}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${fg}">${num}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function venueMarkerUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#C8F000" stroke="#0D1B2E" stroke-width="2.5"/>
    <text x="16" y="21" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="11" font-weight="900" fill="#0D1B2E">V</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function GoogleMap({
  venueCoords,
  venueName,
  hotels,
  selectedId,
  onMarkerClick,
  className = "w-full h-full",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libRef = useRef<{ Marker: any; Size: any; Point: any; LatLngBounds: any } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const venueMarkerRef = useRef<any>(null);

  // ── 1. Initialize map ONCE ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    async function init() {
      const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
      setOptions({ key: apiKey!, v: "weekly" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [mapsLib, markerLib, coreLib] = await Promise.all([
        importLibrary("maps") as Promise<any>,
        importLibrary("marker") as Promise<any>,
        importLibrary("core") as Promise<any>,
      ]);

      if (!mapRef.current) return;

      const center = venueCoords ?? { lat: 30.2672, lng: -97.7431 };

      mapInstanceRef.current = new mapsLib.Map(mapRef.current, {
        center,
        zoom: 12,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
      });

      libRef.current = {
        Marker: markerLib.Marker,
        Size: coreLib.Size,
        Point: coreLib.Point,
        LatLngBounds: coreLib.LatLngBounds,
      };

      setMapReady(true);
    }

    init().catch((err) => {
      console.error("Google Maps error:", err);
      setMapError(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Venue marker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !libRef.current || !mapInstanceRef.current || !venueCoords) return;

    const { Marker, Size, Point } = libRef.current;
    const map = mapInstanceRef.current;

    if (venueMarkerRef.current) venueMarkerRef.current.setMap(null);

    venueMarkerRef.current = new Marker({
      map,
      position: venueCoords,
      title: venueName,
      icon: {
        url: venueMarkerUrl(),
        scaledSize: new Size(32, 32),
        anchor: new Point(16, 16),
      },
      zIndex: 100,
    });

    map.setCenter(venueCoords);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, venueCoords?.lat, venueCoords?.lng, venueName]);

  // ── 3. Hotel markers + auto-fit bounds ───────────────────────────────────
  useEffect(() => {
    if (!mapReady || !libRef.current || !mapInstanceRef.current) return;

    const { Marker, Size, Point, LatLngBounds } = libRef.current;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    const validHotels = hotels.filter((h) => h.lat != null && h.lng != null);

    validHotels.forEach((hotel) => {
      const isSelected = hotel.id === selectedId;
      const num = hotel.index ?? 1;
      const iconSize = isSelected ? 32 : 28;

      const marker = new Marker({
        map,
        position: { lat: hotel.lat!, lng: hotel.lng! },
        title: `${num}. ${hotel.name}`,
        icon: {
          url: hotelMarkerUrl(num, isSelected),
          scaledSize: new Size(iconSize, iconSize),
          anchor: new Point(iconSize / 2, iconSize / 2),
        },
        zIndex: isSelected ? 90 : 50,
      });

      if (onMarkerClick) {
        marker.addListener("click", () => onMarkerClick(hotel.id));
      }
      markersRef.current.set(hotel.id, marker);
    });

    // Tight auto-fit: only fit hotels cluster, not venue if it's far away
    if (validHotels.length > 0) {
      const bounds = new LatLngBounds();
      if (venueCoords) bounds.extend(venueCoords);
      validHotels.forEach((h) => bounds.extend({ lat: h.lat!, lng: h.lng! }));
      map.fitBounds(bounds, { top: 32, right: 24, bottom: 24, left: 24 });

      // Cap zoom: min 11 (don't zoom out too far), max 14 (don't zoom in too close)
      const listener = map.addListener("idle", () => {
        const z = map.getZoom();
        if (z > 14) map.setZoom(14);
        if (z < 11) map.setZoom(11);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google?.maps?.event?.removeListener?.(listener);
      });
    } else if (venueCoords) {
      map.setCenter(venueCoords);
      map.setZoom(13);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, hotels, venueCoords?.lat, venueCoords?.lng]);

  // ── 4. Re-render markers on selection change (update icon only) ───────────
  useEffect(() => {
    if (!libRef.current) return;
    const { Size, Point } = libRef.current;
    markersRef.current.forEach((marker, id) => {
      const hotel = hotels.find((h) => h.id === id);
      const isSelected = id === selectedId;
      const num = hotel?.index ?? 1;
      const iconSize = isSelected ? 32 : 28;
      marker.setIcon({
        url: hotelMarkerUrl(num, isSelected),
        scaledSize: new Size(iconSize, iconSize),
        anchor: new Point(iconSize / 2, iconSize / 2),
      });
      marker.setZIndex(isSelected ? 90 : 50);
    });
  }, [selectedId, hotels]);

  // ── Fallback SVG ──────────────────────────────────────────────────────────
  if (mapError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`${className} rounded-2xl shrink-0 relative`}
        style={{ border: "2px solid #C8F000", boxShadow: "0 0 0 1px rgba(200,240,0,0.3)" }}
      >
        <div
          className="w-full h-full rounded-[14px] overflow-hidden relative"
          style={{
            background: "#E8E8E2",
            backgroundImage: "repeating-linear-gradient(rgba(0,0,0,0.06) 0 1px,transparent 1px 100%),repeating-linear-gradient(90deg,rgba(0,0,0,0.06) 0 1px,transparent 1px 100%)",
            backgroundSize: "36px 36px",
          }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 500" preserveAspectRatio="none">
            <path d="M0 200 Q100 180 200 200 T400 190" stroke="#0D1B2E" strokeWidth="3" fill="none" />
            <path d="M180 0 Q200 250 190 500" stroke="#0D1B2E" strokeWidth="2" fill="none" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: "#C8F000" }} />
              <div className="relative w-5 h-5 rounded-full border-2 border-white" style={{ background: "#C8F000" }} />
            </div>
          </div>
          {hotels.filter((h) => h.lat != null).slice(0, 5).map((h) => (
            <div
              key={h.id}
              className="absolute w-6 h-6 rounded-full border-2 border-white cursor-pointer flex items-center justify-center text-[10px] font-black transition-all hover:scale-110"
              style={{
                background: h.id === selectedId ? "#C8F000" : "#0D1B2E",
                color: h.id === selectedId ? "#0D1B2E" : "#ffffff",
                top: `${25 + (h.index ?? 1) * 10}%`,
                left: `${15 + (h.index ?? 1) * 14}%`,
              }}
              onClick={() => onMarkerClick?.(h.id)}
            >
              {h.index}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-2xl shrink-0 relative`}
      style={{
        border: "2px solid #C8F000",
        boxShadow: "0 0 0 1px rgba(200,240,0,0.3), 0 4px 24px rgba(200,240,0,0.12)",
      }}
    >
      <div ref={mapRef} className="w-full h-full rounded-[14px] overflow-hidden" style={{ background: "#eaeae4" }} />
      <div
        className="absolute inset-0 rounded-[14px] pointer-events-none"
        style={{ background: "rgba(180,185,180,0.18)", mixBlendMode: "multiply" }}
      />
    </div>
  );
}
