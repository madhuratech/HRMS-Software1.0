/**
 * Centralized MapTiler Configuration for MapLibre GL
 * 
 * Securely reads VITE_MAPTILER_KEY from Vite environment variables.
 * Provides MapLibre-compatible vector tile style endpoints for Streets and Hybrid/Satellite.
 */

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

export const isMapTilerConfigured = () => {
  return typeof MAPTILER_KEY === 'string' && MAPTILER_KEY.trim().length > 0;
};

/**
 * Get MapTiler style URL for MapLibre GL
 * @param {'streets' | 'satellite' | 'basic' | 'topo'} theme 
 * @returns {string} Style URL
 */
export const getMapStyle = (theme = 'streets') => {
  if (!isMapTilerConfigured()) {
    console.error(
      '[MapConfig Error] VITE_MAPTILER_KEY is missing. ' +
      'Please configure VITE_MAPTILER_KEY in your frontend .env file.'
    );
    // Return a safe fallback style or blank structure so MapLibre doesn't throw a fatal JS crash
    return {
      version: 8,
      sources: {},
      layers: []
    };
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
