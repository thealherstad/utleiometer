import { useEffect, useRef, useState, type JSX } from "react";
import { doc, updateDoc } from "firebase/firestore";

import "../style/home.css";
import Layout from "../components/Layout";
import { db } from "../firebase";
import { getAllListings } from "../services/listingService";

type MapPoint = {
  id: string;
  addressLabel: string;
  lat: number;
  lon: number;
};

type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
  road?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;
  localities?: string[];
};

declare global {
  interface Window {
    L?: any;
  }
}

const QUICK_FALLBACKS: Record<string, GeocodeResult> = {
  "hogskoleringen 1 trondheim": {
    lat: 63.41957,
    lon: 10.40204,
    displayName: "Hogskoleringen 1, Trondheim, Norge",
    road: "Hogskoleringen",
    houseNumber: "1",
    postcode: "7034",
    city: "Trondheim",
  },
  "høgskoleringen 1 trondheim": {
    lat: 63.41957,
    lon: 10.40204,
    displayName: "Høgskoleringen 1, Trondheim, Norge",
    road: "Høgskoleringen",
    houseNumber: "1",
    postcode: "7034",
    city: "Trondheim",
  },
};

function normalizeLocationText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/trondhiem/gi, "trondheim")
    .replace(/osloe/gi, "oslo");
}

function normalizeKey(value: string) {
  return normalizeLocationText(value).toLowerCase();
}

function isLikelyValidAddress(value: string) {
  const text = value.trim();
  const hasLetter = /[a-zA-Z]/.test(text);
  const hasNumber = /\d/.test(text);
  const streetPart = text.replace(/\s+\d+[a-zA-Z]?$/, "").trim();
  const hasStreetSuffix =
    /(gate|gata|vei|veien|vegen|ringen|ring|all[eé]|plass|bakken|lia|stien|terrasse|tunet|svingen)$/i.test(
      streetPart,
    );
  const isClearlyFake = /(fake|test|asdf|qwerty|ikkeher|ingensteds|ukjent)/i.test(text);
  return text.length >= 6 && hasLetter && hasNumber && (hasStreetSuffix || streetPart.split(/\s+/).length >= 2) && !isClearlyFake;
}

function isValidPostalCode(value: string) {
  return /^\d{4}$/.test(value.trim());
}

function splitAddress(address: string) {
  const trimmed = address.trim();
  const match = trimmed.match(/^(.*?)[,\s]+(\d+[a-zA-Z]?)$/);
  if (match) {
    return {
      street: match[1].trim(),
      houseNumber: match[2].toLowerCase(),
    };
  }

  return {
    street: trimmed,
    houseNumber: "",
  };
}

function resolveLocality(poststed: string, city: string) {
  const normalizedPoststed = poststed.trim();
  const normalizedCity = city.trim();
  const hasLetters = /[a-zA-ZæøåÆØÅ]/.test(normalizedPoststed);

  if (hasLetters) {
    return normalizedPoststed;
  }

  if (normalizedCity.length > 0) {
    return normalizedCity;
  }

  return normalizedPoststed;
}

function normalizeCityName(value: string) {
  return normalizeKey(value).replace(/\bkommune\b/g, "").trim();
}

function isCityMatch(inputCity: string, returnedCity: string, displayName: string, localities: string[]) {
  const normalizedInput = normalizeCityName(inputCity);
  if (!normalizedInput) {
    return false;
  }

  const normalizedCandidates = [
    normalizeCityName(returnedCity),
    normalizeCityName(displayName),
    ...localities.map((value) => normalizeCityName(value)),
  ].filter(Boolean);

  return normalizedCandidates.some(
    (candidate) =>
      candidate.includes(normalizedInput) ||
      normalizedInput.includes(candidate),
  );
}

function isStrictAddressMatch(
  inputAddress: string,
  inputPostalCode: string,
  inputCity: string,
  geocode: GeocodeResult,
) {
  const input = splitAddress(inputAddress);
  const inputStreet = normalizeKey(input.street);
  const geocodeStreet = normalizeKey(geocode.road || geocode.displayName || "");

  const streetMatches =
    geocodeStreet.includes(inputStreet) ||
    inputStreet.includes(geocodeStreet);

  if (!streetMatches) {
    return false;
  }

  if (!input.houseNumber) {
    return false;
  }

  const returnedHouseNumber = normalizeKey(geocode.houseNumber || "");
  if (returnedHouseNumber !== input.houseNumber) {
    return false;
  }

  const normalizedInputPostalCode = inputPostalCode.trim();
  const normalizedReturnedPostalCode = (geocode.postcode || "").trim();
  if (!(normalizedInputPostalCode.length > 0 && normalizedInputPostalCode === normalizedReturnedPostalCode)) {
    return false;
  }

  return isCityMatch(
    inputCity,
    geocode.city || "",
    geocode.displayName || "",
    geocode.localities || [],
  );
}

async function loadLeaflet() {
  if (window.L) {
    return window.L;
  }

  const leafletCssId = "leaflet-css";
  const leafletScriptId = "leaflet-js";

  if (!document.getElementById(leafletCssId)) {
    const link = document.createElement("link");
    link.id = leafletCssId;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  return new Promise<any>((resolve, reject) => {
    const existingScript = document.getElementById(leafletScriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = leafletScriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const cacheKey = `geo:${query.toLowerCase()}`;

  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is GeocodeResult =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as GeocodeResult).lat === "number" &&
            typeof (item as GeocodeResult).lon === "number" &&
            typeof (item as GeocodeResult).displayName === "string",
        );
      }
      window.localStorage.removeItem(cacheKey);
    }
  } catch {
    // ignore cache read errors
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "nb",
      },
    });

    if (!response.ok) {
      return [];
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
      address?: {
        road?: string;
        pedestrian?: string;
        house_number?: string;
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        city_district?: string;
        suburb?: string;
        borough?: string;
        county?: string;
      };
    }>;
    if (!results.length) {
      return [];
    }

    const parsedResults: GeocodeResult[] = results.map((item) => ({
      lat: Number(item.lat),
      lon: Number(item.lon),
      displayName: item.display_name || "",
      road: item.address?.road || item.address?.pedestrian || "",
      houseNumber: item.address?.house_number || "",
      postcode: item.address?.postcode || "",
      city: item.address?.city || item.address?.town || item.address?.village || "",
      localities: [
        item.address?.municipality || "",
        item.address?.city_district || "",
        item.address?.suburb || "",
        item.address?.borough || "",
        item.address?.county || "",
      ].filter(Boolean),
    }));

    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(parsedResults));
    } catch {
      // ignore cache write errors
    }

    return parsedResults;
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function geocodeListing(listing: {
  id: string;
  address: string;
  postalCode: string;
  poststed: string;
  city: string;
}) {
  const rawAddress = listing.address.trim();
  const rawCity = resolveLocality(listing.poststed, listing.city);
  const rawPostalCode = listing.postalCode.trim();

  if (!isLikelyValidAddress(rawAddress) || rawCity.length === 0 || !/^\d{4}$/.test(rawPostalCode)) {
    return null;
  }

  const fallbackKey = normalizeKey(`${rawAddress} ${rawCity}`);
  if (fallbackKey in QUICK_FALLBACKS) {
    return QUICK_FALLBACKS[fallbackKey];
  }

  const normalizedAddress = normalizeLocationText(rawAddress);
  const normalizedCity = normalizeLocationText(rawCity);

  const queries = [
    `${rawAddress}, ${rawPostalCode} ${rawCity}, Norge`,
    `${rawAddress}, ${rawCity}, Norge`,
    `${normalizedAddress}, ${rawPostalCode} ${normalizedCity}, Norge`,
    `${normalizedAddress}, ${normalizedCity}, Norge`,
  ];

  for (const query of queries) {
    const matches = await geocodeAddress(query);
    const strictMatch = matches.find((match) =>
      isStrictAddressMatch(rawAddress, rawPostalCode, rawCity, match),
    );
    if (strictMatch) {
      return strictMatch;
    }
  }

  return null;
}

export default function Home(): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchAndResolvePoints = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        const listings = await getAllListings();

        if (listings.length === 0) {
          if (!cancelled) {
            setPoints([]);
          }
          return;
        }

        const pointsWithCoordinates: MapPoint[] = listings
          .filter((listing) => isLikelyValidAddress(listing.address))
          .filter((listing) => isValidPostalCode(listing.postalCode))
          .filter((listing) => typeof listing.latitude === "number" && typeof listing.longitude === "number")
          .map((listing) => ({
            id: listing.id,
            addressLabel: `${listing.address}, ${listing.postalCode} ${listing.poststed || listing.city}`,
            lat: listing.latitude as number,
            lon: listing.longitude as number,
          }));

        if (!cancelled && pointsWithCoordinates.length > 0) {
          setPoints(pointsWithCoordinates);
        }

        const unresolved = listings
          .filter(
            (listing) =>
              listing.geoVerified !== true ||
              !(typeof listing.latitude === "number" && typeof listing.longitude === "number"),
          )
          .filter((listing) => isLikelyValidAddress(listing.address));

        const requestBudget = 200;
        const timeBudgetMs = 30000;
        const deadline = Date.now() + timeBudgetMs;
        const geocodedPoints = [...pointsWithCoordinates];
        const prioritized = [...unresolved];

        let processed = 0;
        for (let index = 0; index < prioritized.length; index += 6) {
          if (Date.now() > deadline || processed >= requestBudget) {
            break;
          }

          const batch = prioritized.slice(index, index + 6);
          processed += batch.length;

          const batchResults = await Promise.allSettled(
            batch.map(async (listing) => {
              const match = await geocodeListing(listing);
              if (!match) {
                return null;
              }

              // Best-effort cache in Firestore so next loads are instant.
              try {
                await updateDoc(doc(db, "listings", listing.id), {
                  latitude: match.lat,
                  longitude: match.lon,
                  geoVerified: true,
                });
              } catch {
                // Ignore permission/network errors for write-back.
              }

              return {
                id: listing.id,
                addressLabel: `${listing.address}, ${listing.postalCode} ${listing.poststed || listing.city}`,
                lat: match.lat,
                lon: match.lon,
              } as MapPoint;
            }),
          );

          batchResults.forEach((result) => {
            if (result.status === "fulfilled" && result.value) {
              geocodedPoints.push(result.value);
            }
          });

          if (!cancelled) {
            setPoints([...geocodedPoints]);
          }
        }

        if (!cancelled && geocodedPoints.length === 0) {
          setMapError("Fant ingen gyldige adresser å vise på kartet.");
        }
      } catch (error) {
        console.error("Feil ved henting av kartdata:", error);
        if (!cancelled) {
          setMapError("Kunne ikke laste kartdata akkurat nå.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAndResolvePoints();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderMap = async () => {
      if (!mapContainerRef.current) {
        return;
      }

      const L = await loadLeaflet();
      if (cancelled) {
        return;
      }

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([63.4305, 10.3951], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current);

        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      markersLayerRef.current.clearLayers();

      if (points.length === 0) {
        mapRef.current.setView([63.4305, 10.3951], 5);
        return;
      }

      const bounds = L.latLngBounds([]);

      points.forEach((point) => {
        const marker = L.marker([point.lat, point.lon]).bindPopup(point.addressLabel);
        markersLayerRef.current.addLayer(marker);
        bounds.extend([point.lat, point.lon]);
      });

      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    };

    renderMap().catch((error) => {
      console.error("Feil ved rendering av kart:", error);
      setMapError("Kunne ikke vise kartet akkurat nå.");
    });

    return () => {
      cancelled = true;
    };
  }, [points]);

  return (
    <Layout>
      <section className="hero">
        <div className="hero__inner">
          <h1>Velkommen til Utleiometer</h1>
          <p>Del erfaringer og få et bedre bilde av leiemarkedet for studenter</p>
        </div>
      </section>

      <section className="map-section">
        <h2>Utforsk boliger på kartet</h2>

        {isLoading && <p className="map-status">Laster inn boliger og kart...</p>}
        {mapError && <p className="map-status map-status-error">{mapError}</p>}
        {!isLoading && !mapError && points.length === 0 && (
          <p className="map-status">Ingen boliger funnet ennå. Legg til en bolig for å se den på kartet.</p>
        )}

        <div ref={mapContainerRef} className="housing-map" role="img" aria-label="Kart over registrerte boliger" />
      </section>
    </Layout>
  );
}
