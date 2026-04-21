import { NextRequest, NextResponse } from "next/server";

const LITE_API_KEY = process.env.LITE_API_KEY ?? "";
const LITE_API_BASE = "https://api.liteapi.travel/v3.0";
const GOOGLE_GEOCODING_KEY =
  process.env.GOOGLE_GEOCODING_API_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ??
  "";

// ── Geocode via Google ──────────────────────────────────────────────────────

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_GEOCODING_KEY || !address) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

// ── Haversine distance (straight-line km) ───────────────────────────────────

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Mock fallback (used when LITE_API_KEY is missing) ───────────────────────

function buildMockHotels(venueCoords: { lat: number; lng: number } | null) {
  const offsets = [
    { name: "Grand Hyatt", addr: "332 Preston Rd", dlat: 0.02, dlng: 0.01, stars: 4, rating: 4.7, reviews: 842, amenities: ["Pool", "Breakfast", "Gym"] },
    { name: "Marriott Downtown", addr: "490 Commerce St", dlat: -0.01, dlng: 0.03, stars: 4, rating: 4.4, reviews: 612, amenities: ["Restaurant", "Gym", "Parking"] },
    { name: "Hilton Garden Inn", addr: "221 Main St", dlat: 0.04, dlng: -0.02, stars: 3, rating: 4.2, reviews: 389, amenities: ["Pool", "Breakfast", "Parking"] },
    { name: "Courtyard by Marriott", addr: "88 Lamar Ave", dlat: -0.03, dlng: -0.04, stars: 3, rating: 4.0, reviews: 271, amenities: ["Gym", "Parking"] },
  ];
  return offsets.map((h, i) => {
    const lat = venueCoords ? venueCoords.lat + h.dlat : null;
    const lng = venueCoords ? venueCoords.lng + h.dlng : null;
    const otaRate = [220, 240, 180, 160][i];
    const nikeRate = Math.round(otaRate * 0.85);
    let distanceMins: number | null = null;
    let distance = "";
    if (venueCoords && lat && lng) {
      const km = distanceKm(venueCoords.lat, venueCoords.lng, lat, lng);
      distanceMins = Math.max(1, Math.round(km / 0.5));
      distance = `${distanceMins} min`;
    }
    return {
      id: `mock-${i}`,
      name: h.name,
      address: h.addr,
      lat,
      lng,
      stars: h.stars,
      otaRate,
      nikeRate,
      savings: otaRate - nikeRate,
      distance,
      distanceMins,
      image: null,
      amenities: h.amenities,
      rating: h.rating,
      reviews: h.reviews,
      description: "Comfortable hotel near the tournament venue with excellent team amenities and dedicated group rates.",
    };
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { city, countryCode = "US", checkIn, checkOut, venueName, venueCity } = await req.json();

  if (!city || !checkIn || !checkOut) {
    return NextResponse.json({ error: "city, checkIn, checkOut required" }, { status: 400 });
  }

  // Geocode venue first — hotel search radius is centered on it
  const venueAddress = [venueName, venueCity ?? city].filter(Boolean).join(", ");
  const venueCoords = await geocode(venueAddress);

  // If no API key, return mock data
  if (!LITE_API_KEY) {
    return NextResponse.json({ hotels: buildMockHotels(venueCoords), venueCoords, mock: true });
  }

  // Helper to build liteAPI hotel search URL
  function hotelUrl(opts: { distance: number; stars?: string }) {
    const base = venueCoords
      ? `${LITE_API_BASE}/data/hotels?latitude=${venueCoords!.lat}&longitude=${venueCoords!.lng}&distance=${opts.distance}&distanceUnit=MILES&limit=20`
      : `${LITE_API_BASE}/data/hotels?countryCode=${countryCode}&cityName=${encodeURIComponent(city)}&limit=20`;
    return opts.stars ? `${base}&starRating=${opts.stars}` : base;
  }

  async function fetchHotels(url: string): Promise<any[]> {
    const res = await fetch(url, { headers: { "X-API-Key": LITE_API_KEY } });
    const data = await res.json();
    return data.data ?? [];
  }

  // Cascade: 10mi ≤3★ → 10mi any stars → mock
  // (Starting at 10mi since sports venues are often suburban with no hotels nearby)
  let hotels: any[] = await fetchHotels(hotelUrl({ distance: 10, stars: "1,2,3" }));

  if (hotels.length === 0)
    hotels = await fetchHotels(hotelUrl({ distance: 10 }));

  if (hotels.length === 0) {
    return NextResponse.json({ hotels: buildMockHotels(venueCoords), venueCoords, mock: true });
  }

  const hotelIds = hotels.slice(0, 10).map((h) => h.id);

  // Get rates
  const ratesRes = await fetch(`${LITE_API_BASE}/hotels/rates`, {
    method: "POST",
    headers: { "X-API-Key": LITE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      hotelIds,
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [{ adults: 2 }],
      currency: "USD",
      guestNationality: "US",
      maxRatesPerRoom: 1,   // cheapest rate only per room type
      timeout: 8,
    }),
  });

  const ratesData = await ratesRes.json();
  const rates: any[] = ratesData.data ?? [];

  const results = rates
    .filter((r) => r.roomTypes?.length > 0)
    .map((r) => {
      const info = hotels.find((h) => h.id === r.hotelId);
      const minRate = Math.min(
        ...r.roomTypes.flatMap((rt: any) =>
          (rt.rates ?? []).map(
            (rate: any) => rate.retailRate?.total?.[0]?.amount ?? Infinity
          )
        )
      );
      if (!isFinite(minRate)) return null;

      const otaRate = Math.round(minRate);
      const nikeRate = Math.round(minRate * 0.85);
      const hotelLat = info?.latitude ? Number(info.latitude) : null;
      const hotelLng = info?.longitude ? Number(info.longitude) : null;

      let distanceMins: number | null = null;
      let distance = "";
      if (venueCoords && hotelLat && hotelLng) {
        const km = distanceKm(venueCoords.lat, venueCoords.lng, hotelLat, hotelLng);
        distanceMins = Math.max(1, Math.round(km / 0.5));
        distance = `${distanceMins} min`;
      }

      return {
        id: r.hotelId,
        name: info?.name ?? "Unknown Hotel",
        address: [info?.address, info?.city].filter(Boolean).join(", "),
        lat: hotelLat,
        lng: hotelLng,
        stars: info?.starRating ?? 0,
        otaRate,
        nikeRate,
        savings: otaRate - nikeRate,
        distance,
        distanceMins,
        image: info?.main_photo ?? null,
        amenities: (info?.facilities ?? [])
          .slice(0, 4)
          .map((f: any) => (typeof f === "string" ? f : (f.name ?? ""))),
        rating: info?.guestScore ? Number(info.guestScore) : 0,
        reviews: info?.numberOfReviews ?? 0,
        description: info?.description ?? "",
      };
    })
    .filter(Boolean);

  // Sort by distance to venue
  results.sort((a: any, b: any) => a.nikeRate - b.nikeRate);

  return NextResponse.json({ hotels: results, venueCoords });
}
