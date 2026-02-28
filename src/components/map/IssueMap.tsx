import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapIssue {
  id: string;
  title: string;
  lat: number;
  lng: number;
  priority_score: number;
  status: string;
  category: string;
}

const priorityColor = (score: number) => {
  if (score >= 16) return "#ef4444";
  if (score >= 11) return "#f97316";
  if (score >= 6) return "#eab308";
  return "#22c55e";
};

export const IssueMap = ({ issues, height = "500px", showHeatmap = false }: { issues: MapIssue[]; height?: string; showHeatmap?: boolean }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [heatmapOn, setHeatmapOn] = useState(showHeatmap);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    issues.forEach((issue) => {
      const circle = L.circleMarker([issue.lat, issue.lng], {
        radius: 8,
        fillColor: priorityColor(issue.priority_score),
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      circle.bindPopup(`
        <div style="min-width:180px">
          <strong>${issue.title}</strong><br/>
          <span style="text-transform:capitalize">${issue.category.replace("_", " ")}</span><br/>
          <span>Priority: ${issue.priority_score}</span><br/>
          <span>Status: ${issue.status.replace("_", " ")}</span>
        </div>
      `);
    });

    if (issues.length > 0) {
      const bounds = L.latLngBounds(issues.map((i) => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [issues]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (heatmapOn && issues.length > 0 && (L as any).heatLayer) {
      const heatData = issues.map((i) => [i.lat, i.lng, i.priority_score / 20]);
      heatLayerRef.current = (L as any).heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map);
    }
  }, [heatmapOn, issues]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={heatmapOn} onChange={(e) => setHeatmapOn(e.target.checked)} className="rounded" />
          Heatmap overlay
        </label>
        <div className="flex items-center gap-2 ml-auto text-xs">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-success inline-block" /> Low</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-warning inline-block" /> Med</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#f97316" }} /> High</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-critical inline-block" /> Crit</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg border" />
    </div>
  );
};
