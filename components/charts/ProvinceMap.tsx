"use client";

// Thailand choropleth map — ported from data/charts.js map(). Fetches the same
// simplified GeoJSON CDN source at runtime and projects it with a manual
// equirectangular transform, colouring by pipeline value. Falls back to the
// bar view (via onFallback) if the fetch fails.
import { useEffect, useRef, useState } from "react";
import { fmtM } from "@/lib/format";
import type { ProvinceRow } from "@/lib/types";

interface GeoFeature {
  properties?: Record<string, string | undefined>;
  geometry: { type: string; coordinates: unknown };
}
interface GeoJson { features: GeoFeature[] }

let GEO_CACHE: GeoJson | null = null;
let GEO_PROMISE: Promise<GeoJson> | null = null;

const PROV_ALIAS: Record<string, string[]> = {
  Bangkok: ["Bangkok", "Krung Thep Maha Nakhon", "Bangkok Metropolis"],
  Chonburi: ["Chon Buri", "Chonburi"], "Chiang Mai": ["Chiang Mai"],
  Phuket: ["Phuket"], Nonthaburi: ["Nonthaburi", "Nonthaburi "],
  Rayong: ["Rayong"], "Samut Prakan": ["Samut Prakan", "Samut Prakarn"],
  "Pathum Thani": ["Pathum Thani"],
};

function eachCoord(coords: unknown, cb: (pt: [number, number]) => void) {
  if (typeof (coords as number[])[0] === "number") {
    cb(coords as [number, number]);
  } else {
    (coords as unknown[]).forEach((c) => eachCoord(c, cb));
  }
}

export function ProvinceMap({ data, onFallback }: { data: ProvinceRow[]; onFallback: () => void }) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onFallbackRef = useRef(onFallback);
  useEffect(() => {
    onFallbackRef.current = onFallback;
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!GEO_CACHE) {
          if (!GEO_PROMISE) {
            GEO_PROMISE = fetch("https://cdn.jsdelivr.net/gh/apisit/thailand.json@master/thailandWithName.json")
              .then((res) => res.json());
          }
          GEO_CACHE = await GEO_PROMISE;
        }
        const geo = GEO_CACHE;
        const feats = geo.features;
        let minX = 999, minY = 999, maxX = -999, maxY = -999;
        feats.forEach((f) => eachCoord(f.geometry.coordinates, ([x, y]) => {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }));
        const W = 240, H = 420, pad = 8;
        const sx = (W - pad * 2) / (maxX - minX), sy = (H - pad * 2) / (maxY - minY);
        const s = Math.min(sx, sy);
        const ox = pad + (W - pad * 2 - (maxX - minX) * s) / 2;
        const oy = pad + (H - pad * 2 - (maxY - minY) * s) / 2;
        const px = (x: number) => ox + (x - minX) * s;
        const py = (y: number) => oy + (maxY - y) * s;

        const lookup: Record<string, number> = {};
        data.forEach((d) => { lookup[d.province] = d.value; });
        const max = Math.max(...data.map((d) => d.value), 1);
        const nameKeys = Object.keys(PROV_ALIAS);
        const valueFor = (provName: string) => {
          for (const key of nameKeys) {
            if (PROV_ALIAS[key].some((a) => a.toLowerCase() === (provName || "").toLowerCase().trim())) return lookup[key] || 0;
          }
          return 0;
        };
        const color = (v: number) => {
          if (!v) return "#eef2f7";
          const t = Math.pow(v / max, 0.6);
          const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
          return `rgb(${lerp(207, 27)},${lerp(223, 79)},${lerp(243, 156)})`;
        };
        const pathFor = (geom: { type: string; coordinates: unknown }) => {
          const polys = geom.type === "Polygon" ? [geom.coordinates as unknown[]] : (geom.coordinates as unknown[]);
          let d = "";
          (polys as unknown[][]).forEach((poly) => (poly as [number, number][][]).forEach((ring) => {
            (ring as unknown as [number, number][]).forEach(([x, y], i) => {
              d += (i === 0 ? "M" : "L") + px(x).toFixed(1) + " " + py(y).toFixed(1);
            });
            d += "Z";
          }));
          return d;
        };

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
        feats.forEach((f) => {
          const nm = (f.properties && (f.properties.CHA_NE || f.properties.name || f.properties.NAME_1 || f.properties.CHANGWAT_E)) || "";
          const v = valueFor(nm);
          svg += `<path d="${pathFor(f.geometry)}" fill="${color(v)}" stroke="#fff" stroke-width="0.4">
            <title>${nm}${v ? " — " + fmtM(v) : ""}</title></path>`;
        });
        svg += `</svg>`;
        if (!cancelled) setSvgMarkup(svg);
      } catch {
        if (!cancelled) {
          setFailed(true);
          onFallbackRef.current();
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [data]);

  if (failed) return null;
  if (!svgMarkup) return <div className="map-svg map-loading">Loading map…</div>;
  return <div className="map-svg" dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
}
