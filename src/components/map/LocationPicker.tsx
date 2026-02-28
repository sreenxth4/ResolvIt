import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Fix default marker icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (loc: { lat: number; lng: number }) => void;
  height?: string;
}

export const LocationPicker = ({ value, onChange, height = "300px" }: LocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");

  // Place or move marker on the map
  const placeMarker = useCallback(
    (lat: number, lng: number) => {
      onChange({ lat, lng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
      }
    },
    [onChange],
  );

  // Reverse-geocode to get display address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddressLabel(data.display_name);
      }
    } catch {
      // silently ignore
    }
  }, []);

  // --- Leaflet map init ---
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.209], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync with external value changes
  useEffect(() => {
    if (!mapReady || !value || !mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    } else {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(mapInstanceRef.current);
    }
  }, [value, mapReady]);

  // --- Address search via Nominatim ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        placeMarker(parseFloat(lat), parseFloat(lon));
        setAddressLabel(display_name);
      } else {
        setAddressLabel(t("loc.noResults"));
      }
    } catch {
      setAddressLabel(t("loc.searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  // --- GPS location ---
  const handleGPS = () => {
    if (!navigator.geolocation) {
      setAddressLabel(t("loc.gpsUnsupported"));
      return;
    }
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setGettingGPS(false);
      },
      () => {
        setAddressLabel(t("loc.gpsFailed"));
        setGettingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder={t("loc.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
        />
        <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={handleGPS} disabled={gettingGPS} title={t("loc.gps")}>
          {gettingGPS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        </Button>
      </div>

      {/* Leaflet map */}
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg border" />

      {/* Coordinates & address */}
      {value ? (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            {addressLabel && <> — {addressLabel}</>}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("loc.clickMap")}
        </p>
      )}
    </div>
  );
};
