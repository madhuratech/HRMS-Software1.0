/**
 * Centralized MapTiler Configuration for MapLibre GL
 * 
 * Securely reads VITE_MAPTILER_KEY from Vite environment variables.
 * Provides MapLibre-compatible vector tile style endpoints for Streets and Hybrid/Satellite.
 */

import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Register MapLibre GL worker URL for Vite production bundles
if (typeof window !== 'undefined' && setWorkerUrl && workerUrl) {
  setWorkerUrl(workerUrl);
}

export const DEFAULT_FALLBACK_KEY = 'EukJpWqJ1UzSEKZylRdZ';

export const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY && import.meta.env.VITE_MAPTILER_KEY.trim().length > 0)
  ? import.meta.env.VITE_MAPTILER_KEY.trim()
  : DEFAULT_FALLBACK_KEY;

export const CARTO_VOYAGER_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

export const isMapTilerConfigured = () => {
  return typeof MAPTILER_KEY === 'string' && MAPTILER_KEY.trim().length > 0;
};

/**
 * Get MapTiler style URL for MapLibre GL
 * @param {'streets' | 'satellite' | 'basic' | 'topo'} theme 
 * @returns {string | object} Style URL or CARTO Style Object
 */
export const getMapStyle = (theme = 'streets') => {
  if (!isMapTilerConfigured()) {
    console.warn(
      '[MapConfig Warning] VITE_MAPTILER_KEY is missing. ' +
      'Falling back to CARTO Voyager CDN map tiles.'
    );
    return CARTO_VOYAGER_STYLE;
  }

  const cleanKey = MAPTILER_KEY.trim();
  switch (theme) {
    case 'satellite':
    case 'hybrid':
      return `https://api.maptiler.com/maps/hybrid/style.json?key=${cleanKey}`;
    case 'basic':
      return `https://api.maptiler.com/maps/basic-v2/style.json?key=${cleanKey}`;
    case 'topo':
      return `https://api.maptiler.com/maps/topo-v2/style.json?key=${cleanKey}`;
    case 'streets':
    default:
      return `https://api.maptiler.com/maps/streets-v2/style.json?key=${cleanKey}`;
  }
};

export const DEFAULT_MAP_STYLE = getMapStyle('streets');
export const SATELLITE_MAP_STYLE = getMapStyle('satellite');

/**
 * Global handler for missing style images/sprites to prevent console warnings
 */
export const handleStyleImageMissing = (e) => {
  try {
    const map = e.target;
    const id = e.id;
    if (map && typeof map.hasImage === 'function' && !map.hasImage(id)) {
      map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
    }
  } catch (err) {
    // Non-fatal fallback
  }
};
