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

export const isMapTilerConfigured = () => {
  return typeof MAPTILER_KEY === 'string' && MAPTILER_KEY.trim().length > 0;
};

/**
 * Get MapTiler style URL for MapLibre GL
 * @param {'streets' | 'satellite' | 'basic' | 'topo'} theme 
 * @returns {string} MapTiler style endpoint URL
 */
export const getMapStyle = (theme = 'streets') => {
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
