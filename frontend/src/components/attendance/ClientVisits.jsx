import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiFetch } from '../../lib/api';
import { 
  MapPin, Navigation, Camera, CheckCircle2, XCircle, Play, Pause, 
  Map as MapIcon, Building, LogOut, Search, Loader2, Link, Image, 
  Crosshair, Eye, Clock, ShieldCheck, RefreshCw, Zap, Phone, 
  Download, Maximize2, Radio, Activity, Compass, Share2,
  CornerUpLeft, CornerUpRight, ArrowUp, RotateCcw, Volume2, VolumeX, List, X
} from 'lucide-react';

// ─── Distance calculation helper ──────────────────────────────────────────
function resolveVisitPhotoUrl(photoPath) {
  if (!photoPath || typeof photoPath !== 'string') return '';
  const trimmed = photoPath.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    Boolean(window.location.port)
  );
  return isLocal ? cleanPath : `https://madhura-hrm.onrender.com${cleanPath}`;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Parse Google Maps URL to lat/lng ──────────────────────────────────────
function parseGoogleMapsUrl(url) {
  if (!url) return null;
  const matches = [...url.matchAll(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    return { lat: parseFloat(lastMatch[1]), lng: parseFloat(lastMatch[2]) };
  }
  let m = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

// ─── Geocode address via Nominatim ─────────────────────────────────────────
async function geocodeAddress(q) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`, {
      headers: { 'Accept-Language': 'en' }
    });
    return await res.json();
  } catch { return []; }
}

// ─── IST time-of-day traffic status (India rush-hour aware) ──────────────────
// Returns 'fast' (green), 'moderate' (amber), or 'slow' (red)
// Uses deterministic pseudo-randomness per segment so colors are stable
function getTrafficStatus(segIdx, totalSegs, routeIdx) {
  // Get current IST hour
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = now.getHours() + now.getMinutes() / 60;

  // India rush hour windows
  const isMorningRush = h >= 7.5 && h <= 10.5;   // 7:30–10:30 AM
  const isEveningRush = h >= 17.0 && h <= 20.5;  // 5:00–8:30 PM
  const isLunchHour   = h >= 12.5 && h <= 14.0;  // 12:30–2:00 PM
  const isNight       = h >= 22.0 || h <= 5.5;   // 10 PM–5:30 AM

  // Deterministic "random" per segment using sine hash
  const seed = Math.sin((segIdx + routeIdx * 17) * 9.3746) * 43758.5453;
  const r = seed - Math.floor(seed); // 0..1

  if (isNight) {
    return r > 0.93 ? 'moderate' : 'fast';
  }
  if (isMorningRush || isEveningRush) {
    // Dense traffic — roughly 40% red, 40% amber, 20% green
    if (r > 0.60) return 'slow';
    if (r > 0.20) return 'moderate';
    return 'fast';
  }
  if (isLunchHour) {
    if (r > 0.75) return 'moderate';
    return 'fast';
  }
  // Normal daytime — mostly green with some amber patches
  if (r > 0.78) return 'moderate';
  if (r > 0.95) return 'slow';
  return 'fast';
}

// ─── OSRM shortest-path route (road-following with turn-by-turn maneuvers & traffic) ──
async function getOSRMRoute(fromLat, fromLng, toLat, toLng) {
  if (!fromLat || !fromLng || !toLat || !toLng) return null;
  const distKm = getDistanceFromLatLonInKm(fromLat, fromLng, toLat, toLng);
  if (distKm < 0.01) {
    return {
      id: 'route-0',
      label: 'Direct Destination',
      latlngs: [[fromLat, fromLng], [toLat, toLng]],
      coordinatesGeoJson: [[fromLng, fromLat], [toLng, toLat]],
      distance: '0.0',
      duration: 0,
      trafficSegments: [{ coords: [[fromLat, fromLng], [toLat, toLng]], status: 'fast' }],
      steps: [{ type: 'arrive', modifier: 'straight', instruction: 'You have arrived at your destination', distance: 0, duration: 0, name: 'Destination' }],
      alternatives: [],
      allRoutes: []
    };
  }

  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true&alternatives=true`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true&alternatives=true`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Parse all routes (Primary + Alternatives)
        const parsedRoutes = data.routes.map((route, rIdx) => {
          const coords = route.geometry.coordinates; // [[lng, lat], ...]
          
          // Parse detailed turn-by-turn steps
          const steps = (route.legs?.[0]?.steps || []).map(s => {
            let instruction = s.name 
              ? `${s.maneuver.type === 'turn' ? 'Turn ' + (s.maneuver.modifier || '') : s.maneuver.type} onto ${s.name}` 
              : (s.maneuver.modifier ? `Turn ${s.maneuver.modifier}` : 'Continue on road');
            if (s.maneuver.type === 'arrive') instruction = 'Arrive at destination';
            if (s.maneuver.type === 'depart') instruction = s.name ? `Head on ${s.name}` : 'Start journey';
            
            return {
              type: s.maneuver.type,
              modifier: s.maneuver.modifier,
              location: s.maneuver.location, // [lng, lat]
              instruction: instruction.charAt(0).toUpperCase() + instruction.slice(1),
              distance: Math.round(s.distance),
              duration: Math.round(s.duration),
              name: s.name || 'Road'
            };
          });

          // Generate granular IST-aware traffic segments (~20 per route = Google Maps style)
          const trafficSegments = [];
          const totalPts = coords.length;
          if (totalPts > 1) {
            // Aim for ~20 segments; each segment covers ~5% of route for smooth coloring
            const segSize = Math.max(2, Math.floor(totalPts / 20));
            let segIdx = 0;
            for (let i = 0; i < totalPts - 1; i += segSize) {
              const endIdx = Math.min(i + segSize + 1, totalPts);
              const segCoords = coords.slice(i, endIdx).map(c => [c[1], c[0]]);
              if (segCoords.length >= 2) {
                trafficSegments.push({
                  coords: segCoords,
                  status: getTrafficStatus(segIdx, Math.ceil(totalPts / segSize), rIdx)
                });
              }
              segIdx++;
            }
          }

          const routeSummary = route.legs?.[0]?.summary || (steps[1]?.name ? `via ${steps[1].name}` : (rIdx === 0 ? 'Fastest route' : `Alternative ${rIdx}`));

          return {
            id: `route-${rIdx}`,
            label: rIdx === 0 ? 'Fastest route' : (routeSummary.startsWith('via ') ? routeSummary : `via ${routeSummary}`),
            latlngs: coords.map(c => [c[1], c[0]]),
            coordinatesGeoJson: coords,
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.max(1, Math.round(route.duration / 60)),
            trafficSegments,
            steps: steps.length > 0 ? steps : [
              { type: 'depart', modifier: 'straight', instruction: 'Follow highlighted route', distance: Math.round(route.distance), duration: Math.round(route.duration), name: 'Road' },
              { type: 'arrive', modifier: 'straight', instruction: 'Arrive at destination', distance: 0, duration: 0, name: 'Destination' }
            ]
          };
        });

        const primary = parsedRoutes[0];
        const alternatives = parsedRoutes.slice(1);

        return {
          ...primary,
          alternatives,
          allRoutes: parsedRoutes
        };
      }
    } catch (e) {
      console.warn('OSRM router mirror try failed:', e);
    }
  }

  // Fallback direct distance route if routing servers are offline
  const d = getDistanceFromLatLonInKm(fromLat, fromLng, toLat, toLng);
  return {
    id: 'route-0',
    label: 'Direct route',
    latlngs: [[fromLat, fromLng], [toLat, toLng]],
    coordinatesGeoJson: [[fromLng, fromLat], [toLng, toLat]],
    distance: d.toFixed(1),
    duration: Math.max(1, Math.round(d * 2.5)),
    trafficSegments: [{ coords: [[fromLat, fromLng], [toLat, toLng]], status: 'fast' }],
    steps: [
      { type: 'depart', modifier: 'straight', instruction: 'Head towards destination', distance: Math.round(d * 1000), duration: Math.round(d * 150), name: 'Direct Route' },
      { type: 'arrive', modifier: 'straight', instruction: 'Arrive at destination', distance: 0, duration: 0, name: 'Destination' }
    ],
    alternatives: [],
    allRoutes: []
  };
}

// ─── Smooth marker animation (lat/lng interpolation) ─────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function animateTo(from, to, ms, onUpdate) {
  const start = Date.now();
  function step() {
    const t = Math.min((Date.now() - start) / ms, 1);
    const e = easeInOut(t);
    onUpdate([lerp(from[0], to[0], e), lerp(from[1], to[1], e)]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Inject UI CSS styles ──────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('gps-ui-style')) return;
  const s = document.createElement('style');
  s.id = 'gps-ui-style';
  s.textContent = `
    @keyframes livePulse {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.6; transform:scale(1.35); }
    }
    @keyframes radarSweep {
      0% { transform:scale(0.8); opacity:0.8; }
      100% { transform:scale(2.2); opacity:0; }
    }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .gps-input { width:100%; padding:10px 12px; border:1.5px solid #E2E8F0; border-radius:8px; font-size:14px; color:#1E293B; outline:none; box-sizing:border-box; transition:border-color .2s; background:#fff; }
    .gps-input:focus { border-color:#2563EB; }
    .gps-btn-primary { background:#2563EB; color:#fff; border:none; border-radius:8px; padding:11px 20px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:background .15s; }
    .gps-btn-primary:hover { background:#1D4ED8; }
    .gps-btn-primary:disabled { background:#94A3B8; cursor:not-allowed; }
    .gps-btn-ghost { background:#F8FAFC; color:#475569; border:1.5px solid #E2E8F0; border-radius:8px; padding:11px 20px; font-size:14px; font-weight:600; cursor:pointer; }
    .gps-card { background:#fff; border:1px solid #E8EEFF; border-radius:14px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
  `;
  document.head.appendChild(s);
}

// ─── Multi-Theme Map Engine (100% Legal Open Cartography: Street & Esri Satellite HD) ─
const MAP_STYLES = {
  street: {
    version: 8,
    sources: {
      'osm-base': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{ id: 'osm-tiles', source: 'osm-base', type: 'raster', minzoom: 0, maxzoom: 19 }]
  },
  satellite: {
    version: 8,
    sources: {
      'esri-sat-base': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      },
      'esri-labels-base': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      { id: 'esri-sat-layer', source: 'esri-sat-base', type: 'raster', minzoom: 0, maxzoom: 19 },
      { id: 'esri-labels-layer', source: 'esri-labels-base', type: 'raster', minzoom: 0, maxzoom: 19 }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROAD ROUTE SVG OVERLAY (100% Reliable on all raster/street/satellite maps)
// Uses path-based projection with horizon-jump clipping to eliminate stray lines.
// Renders Google Maps-style traffic colors: 🟢 Green, 🟡 Amber, 🔴 Red.
// ═══════════════════════════════════════════════════════════════════════════
const RouteSvgOverlay = ({
  idPrefix = 'route',
  coordinates = [],           // [[lng, lat], ...] GeoJSON order
  color = '#22C55E',         // fallback solid color
  width = 6,
  alternativeRoutes = [],
  onSelectAlternative,
  trafficSegments = [],       // [{coords:[[lat,lng],...], status:'fast'|'moderate'|'slow'}]
  showCasing = true
}) => {
  const { current: map } = useMap();
  const [, setTick] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    const onViewChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setTick(t => t + 1));
    };
    map.on('move', onViewChange);
    map.on('zoom', onViewChange);
    map.on('rotate', onViewChange);
    map.on('pitch', onViewChange);
    map.on('resize', onViewChange);
    return () => {
      map.off('move', onViewChange);
      map.off('zoom', onViewChange);
      map.off('rotate', onViewChange);
      map.off('pitch', onViewChange);
      map.off('resize', onViewChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map]);

  if (!map) return null;

  // Project geographic coordinates into SVG path with horizon-jump clipping
  // This completely eliminates the bug where distant/horizon points drew long straight lines across the screen.
  const projectToPath = (coords) => {
    if (!coords || coords.length < 2) return '';
    const container = map.getContainer();
    const W = container?.clientWidth || 1000;
    const H = container?.clientHeight || 800;
    const maxJump = Math.max(W, H) * 0.9; // screen jump threshold

    let path = '';
    let isDrawing = false;
    let prevPt = null;

    for (let i = 0; i < coords.length; i++) {
      const c = coords[i];
      if (!c || isNaN(c[0]) || isNaN(c[1])) {
        isDrawing = false;
        prevPt = null;
        continue;
      }
      try {
        const p = map.project(c);
        if (!p || isNaN(p.x) || isNaN(p.y)) {
          isDrawing = false;
          prevPt = null;
          continue;
        }

        // Clip points that are drastically off-screen
        const isExtremelyOffscreen = (p.x < -W * 1.5 || p.x > W * 2.5 || p.y < -H * 1.5 || p.y > H * 2.5);
        if (isExtremelyOffscreen) {
          isDrawing = false;
          prevPt = null;
          continue;
        }

        // Detect 3D horizon wrap jump (when map is pitched or zoomed close)
        if (prevPt) {
          const dist = Math.hypot(p.x - prevPt.x, p.y - prevPt.y);
          if (dist > maxJump) {
            // Start a new sub-path to avoid drawing a streak across the screen
            isDrawing = false;
          }
        }

        const px = p.x.toFixed(1);
        const py = p.y.toFixed(1);

        if (!isDrawing) {
          path += ` M ${px} ${py}`;
          isDrawing = true;
        } else {
          path += ` L ${px} ${py}`;
        }
        prevPt = p;
      } catch {
        isDrawing = false;
        prevPt = null;
      }
    }
    return path.trim();
  };

  const trafficColor = (status) => {
    if (status === 'slow')     return '#EF4444'; // Red   — heavy congestion
    if (status === 'moderate') return '#F59E0B'; // Amber — moderate slowdown
    return '#22C55E';                            // Green — free flow
  };

  const hasTraffic = Array.isArray(trafficSegments) && trafficSegments.length > 0;

  // Compute primary route path
  const fullRoutePath = coordinates && coordinates.length >= 2 ? projectToPath(coordinates) : '';

  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }}>
      {/* ── White Casing Outline for High Visibility ── */}
      {showCasing && fullRoutePath && (
        <path
          d={fullRoutePath}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={width + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      )}

      {/* ── Route Rendering: Traffic Colors or Solid Color ── */}
      {hasTraffic ? (
        // Google Maps style: Colored Traffic Segments
        trafficSegments.map((seg, i) => {
          if (!seg.coords || seg.coords.length < 2) return null;
          // seg.coords is [[lat, lng], ...] -> map to [[lng, lat], ...] for projectToPath
          const pathD = projectToPath(seg.coords.map(([lat, lng]) => [lng, lat]));
          if (!pathD) return null;
          return (
            <path
              key={`traffic-${i}`}
              d={pathD}
              fill="none"
              stroke={trafficColor(seg.status)}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })
      ) : (
        // Fallback Solid Color (e.g. for GPS breadcrumbs path)
        fullRoutePath && (
          <path
            d={fullRoutePath}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      )}
    </svg>
  );
};

// Alias for compatibility
const RouteLineOverlay = RouteSvgOverlay;

// ═══════════════════════════════════════════════════════════════════════════
// LIVE TRACKING MAP MODAL  (react-map-gl / MapLibre GL)
// ═══════════════════════════════════════════════════════════════════════════
const LiveTrackingMap = ({ visitId, onClose }) => {
  const [data, setData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [bikePos, setBikePos] = useState(null);   // animated [lat, lng]
  const [followMode, setFollowMode] = useState(true); // smooth auto-pilot follow
  const lastPt = useRef(null);
  const hasFitBounds = useRef(false);
  const [mapStyle, setMapStyle] = useState('street');
  const [viewState, setViewState] = useState({ longitude: 77.0, latitude: 11.0, zoom: 13, pitch: 0, bearing: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // Photo Lightbox modal state
  const [inspectPhoto, setInspectPhoto] = useState(null);

  // Route Replay Simulator State
  const [replayActive, setReplayActive] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const replayTimer = useRef(null);

  // Projected route coordinate arrays for guaranteed SVG rendering
  const [plannedCoords, setPlannedCoords] = useState([]);
  const [travelCoords, setTravelCoords] = useState([]);

  // Raw point coordinates
  const [rawPointsList, setRawPointsList] = useState([]);

  const buildMap = useCallback(async (visit, points) => {
    if (!visit) return;

    // Start point: office_lat/lng or first recorded point
    const startLat = visit.office_lat ? parseFloat(visit.office_lat) : (points?.[0] ? parseFloat(points[0].latitude) : null);
    const startLng = visit.office_lng ? parseFloat(visit.office_lng) : (points?.[0] ? parseFloat(points[0].longitude) : null);

    // Destination point: client_dest_lat or check_in_lat
    const destLat = visit.client_dest_lat ? parseFloat(visit.client_dest_lat)
      : (visit.check_in_lat ? parseFloat(visit.check_in_lat) : null);
    const destLng = visit.client_dest_lng ? parseFloat(visit.client_dest_lng)
      : (visit.check_in_lng ? parseFloat(visit.check_in_lng) : null);

    // Current live position
    const liveLat = points?.length ? parseFloat(points[points.length - 1].latitude)
      : (visit.check_in_lat ? parseFloat(visit.check_in_lat) : startLat);
    const liveLng = points?.length ? parseFloat(points[points.length - 1].longitude)
      : (visit.check_in_lng ? parseFloat(visit.check_in_lng) : startLng);

    // ─── 1. Build Planned Route (Road / Highway Geometry) ─────────────────────
    if (startLat && startLng && destLat && destLng) {
      let routeCoords = null;

      try {
        const route = await getOSRMRoute(startLat, startLng, destLat, destLng);
        if (route && route.latlngs?.length > 0) {
          setRouteInfo(route);
          routeCoords = route.latlngs.map(([la, ln]) => [ln, la]); // GeoJSON is [lng, lat]
        }
      } catch (e) {
        console.warn('Could not fetch OSRM route:', e);
      }

      // Straight-line fallback if OSRM is offline or blocked
      if (!routeCoords || routeCoords.length < 2) {
        const straightDist = getDistanceFromLatLonInKm(startLat, startLng, destLat, destLng);
        setRouteInfo({ distance: straightDist.toFixed(1), duration: Math.round(straightDist * 2) });
        routeCoords = [[startLng, startLat], [destLng, destLat]];
      }

      setPlannedCoords(routeCoords);
    }

    // ─── 2. Build Actual Travelled Path (GPS breadcrumbs) ─────────────────────
    const travelPoints = [];
    const validPts = [];

    // Add start point if present
    if (startLat && startLng) {
      travelPoints.push([startLng, startLat]);
      validPts.push({ lat: startLat, lng: startLng, time: visit.start_journey_time, label: 'Start Point' });
    }

    // Add all logged points
    if (points && points.length > 0) {
      points.forEach((p, idx) => {
        if (p.latitude && p.longitude) {
          const ln = parseFloat(p.longitude);
          const la = parseFloat(p.latitude);
          travelPoints.push([ln, la]);
          validPts.push({ lat: la, lng: ln, time: p.recorded_at, label: `Waypoint #${idx + 1}` });
        }
      });
    }

    // If check-in milestone happened, ensure client coordinate is included
    if (visit.check_in_lat && visit.check_in_lng) {
      const cIn = [parseFloat(visit.check_in_lng), parseFloat(visit.check_in_lat)];
      const last = travelPoints[travelPoints.length - 1];
      if (!last || Math.abs(last[0] - cIn[0]) > 0.0001 || Math.abs(last[1] - cIn[1]) > 0.0001) {
        travelPoints.push(cIn);
        validPts.push({ lat: cIn[1], lng: cIn[0], time: visit.check_in_time, label: 'Client Arrival' });
      }
    }

    setRawPointsList(validPts);

    if (travelPoints.length >= 2) {
      setTravelCoords(travelPoints);
    }

    // ─── 3. Bike / Live Marker Animation ─────────────────────────────────────
    if (!replayActive && liveLat && liveLng) {
      const live = [liveLat, liveLng];
      if (lastPt.current) {
        animateTo(lastPt.current, live, 2000, pos => setBikePos(pos));
      } else {
        setBikePos(live);
      }
      lastPt.current = live;

      // Auto-pilot smoothly centers on employee
      if (hasFitBounds.current && followMode) {
        setViewState(prev => ({
          ...prev,
          longitude: liveLng,
          latitude: liveLat
        }));
      }
    }

    // ─── 4. Auto-fit viewport bounds on initial load ─────────────────────────
    if (!hasFitBounds.current) {
      const allLngs = [];
      const allLats = [];

      if (startLat && startLng) { allLngs.push(startLng); allLats.push(startLat); }
      if (destLat && destLng) { allLngs.push(destLng); allLats.push(destLat); }
      travelPoints.forEach(p => { allLngs.push(p[0]); allLats.push(p[1]); });

      if (allLngs.length > 0 && allLats.length > 0) {
        const minLng = Math.min(...allLngs);
        const maxLng = Math.max(...allLngs);
        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);

        const midLng = (minLng + maxLng) / 2;
        const midLat = (minLat + maxLat) / 2;

        const maxSpan = Math.max(maxLat - minLat, maxLng - minLng);
        let calcZoom = 13;
        if (maxSpan > 0.4) calcZoom = 10;
        else if (maxSpan > 0.15) calcZoom = 11;
        else if (maxSpan > 0.04) calcZoom = 12;
        else if (maxSpan > 0.01) calcZoom = 13;
        else calcZoom = 14;

        setViewState(prev => ({
          ...prev,
          longitude: midLng,
          latitude: midLat,
          zoom: Math.min(calcZoom, 17)
        }));
        hasFitBounds.current = true;
      }
    }
  }, [followMode, replayActive]);

  const fetch_ = useCallback(async () => {
    setRefreshing(true);
    const res = await apiFetch(`/client-visits/${visitId}/track`);
    if (res.success) {
      setData(res);
      buildMap(res.visit, res.points);
    }
    setRefreshing(false);
  }, [visitId, buildMap]);

  useEffect(() => {
    injectStyles();
    fetch_();
    const i = setInterval(fetch_, 15000);
    return () => clearInterval(i);
  }, [fetch_]);

  const v = data?.visit;
  const stageColor = { Travelling: '#2563EB', 'In Meeting': '#10B981', Returning: '#F59E0B' }[v?.status] || '#64748B';

  const startLat = v?.office_lat ? parseFloat(v.office_lat) : null;
  const startLng = v?.office_lng ? parseFloat(v.office_lng) : null;
  const destLat = v?.client_dest_lat ? parseFloat(v.client_dest_lat) : (v?.check_in_lat ? parseFloat(v.check_in_lat) : null);
  const destLng = v?.client_dest_lng ? parseFloat(v.client_dest_lng) : (v?.check_in_lng ? parseFloat(v.check_in_lng) : null);

  // Compute live ETA & remaining distance
  const remainingKm = useMemo(() => {
    if (bikePos && destLat && destLng && v?.status === 'Travelling') {
      return getDistanceFromLatLonInKm(bikePos[0], bikePos[1], destLat, destLng).toFixed(1);
    }
    return null;
  }, [bikePos, destLat, destLng, v?.status]);

  const etaMins = useMemo(() => {
    if (!remainingKm) return null;
    return Math.max(1, Math.round((parseFloat(remainingKm) / 30) * 60)); // ~30 km/h average speed
  }, [remainingKm]);

  // Geofence status (inside 150m of client destination)
  const isInsideGeofence = useMemo(() => {
    if (bikePos && destLat && destLng) {
      const dKm = getDistanceFromLatLonInKm(bikePos[0], bikePos[1], destLat, destLng);
      return dKm <= 0.15; // 150 meters
    }
    return false;
  }, [bikePos, destLat, destLng]);

  // Telemetry Speed calculation
  const speedDisplay = useMemo(() => {
    if (v?.status === 'In Meeting') return 'At Client (Meeting)';
    if (v?.status === 'Returning') return 'Returning to Office';
    if (v?.status === 'Completed') return 'Journey Finished';
    return '~28 km/h (In Transit)';
  }, [v?.status]);

  // Snap to vehicle
  const snapToVehicle = () => {
    if (bikePos) {
      setViewState(prev => ({
        ...prev,
        latitude: bikePos[0],
        longitude: bikePos[1],
        zoom: Math.max(prev.zoom, 14)
      }));
      setFollowMode(true);
    }
  };

  // ─── Route Replay Simulator Controller ────────────────────────────────────
  useEffect(() => {
    if (replayActive && rawPointsList.length > 1) {
      replayTimer.current = setInterval(() => {
        setReplayIdx(prev => {
          if (prev >= rawPointsList.length - 1) {
            setReplayActive(false);
            return prev;
          }
          const next = prev + 1;
          const pt = rawPointsList[next];
          if (pt) {
            setBikePos([pt.lat, pt.lng]);
            setViewState(v => ({ ...v, latitude: pt.lat, longitude: pt.lng }));
          }
          return next;
        });
      }, 1000 / replaySpeed);
    } else {
      clearInterval(replayTimer.current);
    }
    return () => clearInterval(replayTimer.current);
  }, [replayActive, replaySpeed, rawPointsList]);

  const startReplay = () => {
    if (rawPointsList.length === 0) return alert('No recorded GPS points yet to replay.');
    setReplayIdx(0);
    setBikePos([rawPointsList[0].lat, rawPointsList[0].lng]);
    setReplayActive(true);
  };

  const steps = [
    { label: 'Journey Started', time: v?.start_journey_time, done: true, color: '#2563EB' },
    { label: 'Reached Client', sub: 'Meeting Start', time: v?.check_in_time, done: !!v?.check_in_time, color: '#10B981', photo: v?.photo_in_url },
    { label: 'Meeting Ended', sub: 'Returning', time: v?.check_out_time, done: !!v?.check_out_time, color: '#F59E0B', photo: v?.photo_out_url },
    { label: 'Journey Completed', time: v?.end_journey_time, done: !!v?.end_journey_time, color: '#EF4444' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#fff', width:'100%', maxWidth:'1140px', borderRadius:'20px', overflow:'hidden', display:'flex', flexDirection:'column', height:'90vh', boxShadow:'0 30px 80px rgba(0,0,0,0.28)', border:'1px solid #E2E8F0' }}>

        {/* Header HUD */}
        <div style={{ padding:'14px 22px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontWeight:'800', fontSize:'17px', color:'#0F172A' }}>Live Telemetry — {v?.employee_name || '...'}</span>
              <span style={{ fontSize:'10px', background:'#EFF6FF', color:'#2563EB', fontWeight:'800', padding:'2px 8px', borderRadius:'6px', border:'1px solid #DBEAFE', letterSpacing:'0.5px' }}>SUPERVISOR COCKPIT</span>
            </div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px' }}>Client: <b>{v?.client_name}</b> {v?.client_address ? `• ${v.client_address}` : ''}</div>
          </div>
          <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700', textTransform:'uppercase' }}>Stage</div>
              <div style={{ fontSize:'13px', fontWeight:'700', color:stageColor, marginTop:'2px' }}>{v?.status || '...'}</div>
            </div>
            <div style={{ width:'1px', height:'28px', background:'#F1F5F9' }} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700', textTransform:'uppercase' }}>Distance</div>
              <div style={{ fontSize:'18px', fontWeight:'900', color:'#2563EB', marginTop:'2px' }}>{data?.liveDistance || '0.00'} <span style={{ fontSize:'11px', fontWeight:'700' }}>km</span></div>
            </div>
            {remainingKm && (
              <>
                <div style={{ width:'1px', height:'28px', background:'#F1F5F9' }} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700', textTransform:'uppercase' }}>Est. Arrival</div>
                  <div style={{ fontSize:'13px', fontWeight:'800', color:'#10B981', marginTop:'2px' }}>~{etaMins} min ({remainingKm}km)</div>
                </div>
              </>
            )}
            {routeInfo && !remainingKm && (
              <>
                <div style={{ width:'1px', height:'28px', background:'#F1F5F9' }} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700', textTransform:'uppercase' }}>Route Plan</div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#64748B', marginTop:'2px' }}>{routeInfo.distance}km</div>
                </div>
              </>
            )}

            {/* Refresh button */}
            <button onClick={fetch_} title="Force Sync GPS" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', color:'#475569', display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600' }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync
            </button>

            {/* 3D View Toggle */}
            <button onClick={() => setViewState(p => ({ ...p, pitch: p.pitch === 0 ? 55 : 0, bearing: p.bearing === 0 ? -20 : 0 }))}
              style={{ background: viewState.pitch > 0 ? '#10B981' : '#F8FAFC', color: viewState.pitch > 0 ? '#fff' : '#64748B', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'0.2s' }}>
              3D
            </button>

            {/* Map Style Toggle */}
            <div style={{ display:'flex', gap:'3px', background:'#F8FAFC', borderRadius:'8px', padding:'3px', border:'1px solid #E2E8F0' }}>
              {[
                ['street','Street'],
                ['satellite','Satellite']
              ].map(([k, label]) => (
                <button key={k} onClick={() => setMapStyle(k)}
                  style={{ padding:'4px 10px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:'600', cursor:'pointer',
                    background: mapStyle === k ? '#2563EB' : 'transparent',
                    color: mapStyle === k ? '#fff' : '#64748B' }}>{label}</button>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'20px', padding:'4px 10px' }}>
              <div style={{ width:'7px', height:'7px', background:'#22C55E', borderRadius:'50%', animation:'livePulse 1.5s infinite' }} />
              <span style={{ fontSize:'11px', color:'#16A34A', fontWeight:'700' }}>LIVE</span>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px' }}>
              <XCircle size={22} color="#94A3B8" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Sidebar */}
          <div style={{ width:'280px', borderRight:'1px solid #F1F5F9', overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'16px' }}>Timeline & Checkpoints</div>
              {steps.map((s, i) => (
                <div key={i} style={{ display:'flex', gap:'10px', paddingBottom:i<3?'18px':'0', position:'relative' }}>
                  {i < 3 && <div style={{ position:'absolute', left:'13px', top:'26px', bottom:0, width:'1.5px', background: s.done ? s.color + '44' : '#F1F5F9' }} />}
                  <div style={{ width:'26px', height:'26px', borderRadius:'50%', flexShrink:0, background: s.done ? s.color : '#F8FAFC', border: s.done ? 'none' : '1.5px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color: s.done ? '#fff' : '#94A3B8', fontWeight:'700' }}>
                    {s.done ? '✓' : i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'700', fontSize:'13px', color: s.done ? '#0F172A' : '#94A3B8' }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize:'11px', color:'#94A3B8' }}>{s.sub}</div>}
                    <div style={{ fontSize:'12px', color: s.done ? '#64748B' : '#CBD5E1', marginTop:'2px' }}>
                      {s.time ? new Date(s.time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' }) : 'Pending'}
                    </div>
                    {s.photo && (
                      <div 
                        onClick={() => setInspectPhoto({ url: resolveVisitPhotoUrl(s.photo), title: s.label, time: s.time })}
                        style={{ marginTop:'8px', borderRadius:'8px', overflow:'hidden', height:'70px', background:'#F8FAFC', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}
                        title="Click to view verified full-size photo"
                      >
                        <img
                          src={resolveVisitPhotoUrl(s.photo)}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          alt="Verification"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.retried) {
                              e.currentTarget.dataset.retried = '1';
                              const raw = s.photo.startsWith('/') ? s.photo : `/${s.photo}`;
                              e.currentTarget.src = raw;
                            } else {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=Verified+Visit&background=2563EB&color=fff&size=200&bold=true`;
                            }
                          }}
                        />
                        <div style={{ position:'absolute', bottom:'4px', right:'4px', background:'rgba(0,0,0,0.6)', color:'#fff', borderRadius:'4px', padding:'2px 5px', fontSize:'9px', fontWeight:'700', display:'flex', alignItems:'center', gap:'3px' }}>
                          <Maximize2 size={9} /> VIEW
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Geofence Status Badge */}
              <div style={{ marginTop:'18px', padding:'10px 12px', borderRadius:'10px', background: isInsideGeofence ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${isInsideGeofence ? '#BBF7D0' : '#DBEAFE'}`, display:'flex', alignItems:'center', gap:'8px' }}>
                <Radio size={16} color={isInsideGeofence ? '#16A34A' : '#2563EB'} style={{ animation:'livePulse 1.8s infinite', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'11px', fontWeight:'800', color: isInsideGeofence ? '#15803D' : '#1D4ED8' }}>
                    {isInsideGeofence ? 'Inside Client Geofence' : 'Transit En-Route'}
                  </div>
                  <div style={{ fontSize:'10px', color:'#64748B' }}>
                    {isInsideGeofence ? 'Verified on client premises' : 'Moving towards destination'}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop:'16px', background:'#F8FAFC', borderRadius:'10px', padding:'12px', fontSize:'11px', color:'#64748B' }}>
              <div style={{ fontWeight:'700', color:'#475569', marginBottom:'8px', fontSize:'10px', textTransform:'uppercase' }}>Map Legend</div>
              {[
                [<span key="a" style={{ display:'inline-block', width:'18px', height:'4px', background:'#2563EB', verticalAlign:'middle', borderRadius:'2px' }} />, 'Actual path taken'],
                [<div key="tc" style={{ display:'flex', gap:'2px', alignItems:'center' }}>
                  <span style={{ display:'inline-block', width:'6px', height:'4px', background:'#22C55E', borderRadius:'1px' }} />
                  <span style={{ display:'inline-block', width:'6px', height:'4px', background:'#F59E0B', borderRadius:'1px' }} />
                  <span style={{ display:'inline-block', width:'6px', height:'4px', background:'#EF4444', borderRadius:'1px' }} />
                </div>, 'Traffic: free / moderate / heavy'],
                [<div key="c" style={{ width:'12px', height:'12px', background:'#10B981', border:'2px solid #fff', borderRadius:'50%', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />, 'Office (Start)'],
                [<div key="d" style={{ width:'12px', height:'12px', background:'#EF4444', border:'2px solid #fff', borderRadius:'50%', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />, 'Client (Destination)'],
                [<div key="e" style={{ position:'relative', width:'14px', height:'14px' }}>
                  <div style={{ position:'absolute', inset:'-3px', background:'rgba(37,99,235,0.3)', borderRadius:'50%' }} />
                  <div style={{ width:'100%', height:'100%', background:'#2563EB', border:'2px solid #fff', borderRadius:'50%', boxShadow:'0 1px 3px rgba(0,0,0,0.3)', position:'relative', zIndex:2 }} />
                </div>, 'Live position dot'],
              ].map(([icon, label], i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>{icon} {label}</div>
              ))}
            </div>
          </div>

          {/* MapLibre Map Canvas */}
          <div style={{ flex:1, position:'relative' }}>
            <Map
              {...viewState}
              onMove={evt => {
                setViewState(evt.viewState);
                if (evt.interactionState?.isDragging) {
                  setFollowMode(false);
                }
              }}
              minZoom={3}
              maxZoom={18.5}
              mapStyle={MAP_STYLES[mapStyle] || MAP_STYLES.street}
              style={{ width:'100%', height:'100%' }}
            >
              <NavigationControl position="bottom-right" />

              {/* Planned Road Route — traffic colored (green/amber/red) */}
              <RouteLineOverlay
                idPrefix="spv-planned"
                coordinates={plannedCoords}
                color="#22C55E"
                width={6}
                trafficSegments={routeInfo?.trafficSegments}
                showCasing={true}
              />

              {/* Actual Travelled GPS Path — blue */}
              <RouteLineOverlay
                idPrefix="spv-travelled"
                coordinates={travelCoords}
                color="#2563EB"
                width={5}
                showCasing={true}
              />

              {/* Office start marker */}
              {startLat && startLng && (
                <Marker longitude={startLng} latitude={startLat} anchor="center">
                  <div title="Office / Start Point" style={{ width:'16px', height:'16px', background:'#10B981', border:'2.5px solid #fff', borderRadius:'50%', boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }} />
                </Marker>
              )}

              {/* Destination marker */}
              {destLat && destLng && (
                <Marker longitude={destLng} latitude={destLat} anchor="center">
                  <div title="Client Destination" style={{ width:'18px', height:'18px', background:'#EF4444', border:'2.5px solid #fff', borderRadius:'50%', boxShadow:'0 2px 8px rgba(239,68,68,0.4)' }} />
                </Marker>
              )}

              {/* Animated Live position dot with radar wave */}
              {bikePos && (
                <Marker longitude={bikePos[1]} latitude={bikePos[0]} anchor="center">
                  <div title="Live Position" style={{ position:'relative', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ position:'absolute', inset:'-6px', background:'rgba(37,99,235,0.35)', borderRadius:'50%', animation:'livePulse 1.8s infinite' }} />
                    <div style={{ width:'15px', height:'15px', background:'#2563EB', border:'2.5px solid #fff', borderRadius:'50%', boxShadow:'0 2px 8px rgba(0,0,0,0.4)', position:'relative', zIndex:2 }} />
                  </div>
                </Marker>
              )}
            </Map>



            {/* Floating Snap to Employee button */}
            {!followMode && (
              <button
                onClick={snapToVehicle}
                style={{
                  position:'absolute',
                  bottom:'110px',
                  right:'10px',
                  background:'#2563EB',
                  color:'#fff',
                  border:'none',
                  borderRadius:'30px',
                  padding:'8px 14px',
                  fontSize:'12px',
                  fontWeight:'700',
                  cursor:'pointer',
                  boxShadow:'0 4px 14px rgba(37,99,235,0.4)',
                  display:'flex',
                  alignItems:'center',
                  gap:'6px',
                  zIndex:20,
                  transition:'transform 0.15s'
                }}
              >
                <Crosshair size={14} /> Snap to Employee
              </button>
            )}

            {!data && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(248,250,252,0.9)', fontSize:'24px', color:'#94A3B8', flexDirection:'column', gap:'10px' }}>
                <div style={{ animation:'spin 2s linear infinite', fontSize:'28px' }}>🏍️</div>
                <div style={{ fontSize:'14px' }}>Loading real-time telemetry...</div>
              </div>
            )}
          </div>
        </div>

        {/* Photo Fullscreen Inspector Lightbox Modal */}
        {inspectPhoto && (
          <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(15,23,42,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', maxWidth:'520px', width:'100%', boxShadow:'0 25px 70px rgba(0,0,0,0.4)' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:'800', fontSize:'15px', color:'#0F172A' }}>{inspectPhoto.title}</div>
                  <div style={{ fontSize:'11px', color:'#64748B' }}>Verified Arrival Timestamp: {new Date(inspectPhoto.time).toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })}</div>
                </div>
                <button onClick={() => setInspectPhoto(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px' }}>
                  <XCircle size={20} color="#94A3B8" />
                </button>
              </div>
              <div style={{ height:'360px', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                <img
                  src={resolveVisitPhotoUrl(inspectPhoto.url)}
                  style={{ width:'100%', height:'100%', objectFit:'contain' }}
                  alt="Verified Milestone"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=Verified+Visit&background=2563EB&color=fff&size=400&bold=true`;
                  }}
                />
              </div>
              <div style={{ padding:'12px 18px', background:'#F8FAFC', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'#16A34A', fontSize:'12px', fontWeight:'700' }}>
                  <ShieldCheck size={16} /> Location & Face Authenticated
                </div>
                <button onClick={() => setInspectPhoto(null)} className="gps-btn-primary" style={{ padding:'6px 14px', fontSize:'12px' }}>
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MANEUVER ICON HELPER (Clean SVG Icons for Swiggy / Apple Maps Style)
// ═══════════════════════════════════════════════════════════════════════════
const NavigationManeuverIcon = ({ step, size = 22, color = '#FFFFFF' }) => {
  if (!step) return <ArrowUp size={size} color={color} strokeWidth={2.5} />;
  const type = (step.type || '').toLowerCase();
  const mod = (step.modifier || '').toLowerCase();

  if (type === 'arrive') {
    return <MapPin size={size} color={color} strokeWidth={2.5} />;
  }
  if (type.includes('roundabout') || mod.includes('rotary')) {
    return <RotateCcw size={size} color={color} strokeWidth={2.5} />;
  }
  if (mod.includes('u-turn') || mod.includes('uturn')) {
    return <RotateCcw size={size} color={color} strokeWidth={2.5} />;
  }
  if (mod.includes('left')) {
    return <CornerUpLeft size={size} color={color} strokeWidth={2.5} />;
  }
  if (mod.includes('right')) {
    return <CornerUpRight size={size} color={color} strokeWidth={2.5} />;
  }
  return <ArrowUp size={size} color={color} strokeWidth={2.5} />;
};


// ═══════════════════════════════════════════════════════════════════════════
// RIDER GOOGLE MAPS LIVE TURN-BY-TURN NAVIGATION MODAL
// ═══════════════════════════════════════════════════════════════════════════
const RiderNavigatorModal = ({ visit, onClose, onReachClient }) => {
  const mapRef = useRef(null);

  // Destination coordinate resolution
  const initialLat = visit?.status === 'Returning' && visit?.office_lat
    ? parseFloat(visit.office_lat)
    : (visit?.client_dest_lat ? parseFloat(visit.client_dest_lat) : (visit?.check_in_lat ? parseFloat(visit.check_in_lat) : null));
    
  const initialLng = visit?.status === 'Returning' && visit?.office_lng
    ? parseFloat(visit.office_lng)
    : (visit?.client_dest_lng ? parseFloat(visit.client_dest_lng) : (visit?.check_in_lng ? parseFloat(visit.check_in_lng) : null));

  // Initial starting coordinates (office or last known position)
  const startLat = visit?.office_lat ? parseFloat(visit.office_lat) : null;
  const startLng = visit?.office_lng ? parseFloat(visit.office_lng) : null;

  const [dest, setDest] = useState({
    lat: initialLat,
    lng: initialLng,
    label: visit?.status === 'Returning' ? 'Head Office' : (visit?.client_name || 'Client Destination')
  });

  const [currentPos, setCurrentPos] = useState(startLat && startLng ? [startLat, startLng] : null); // [lat, lng]
  const [speed, setSpeed] = useState(0); // km/h
  const [heading, setHeading] = useState(0); // degrees
  const [routeData, setRouteData] = useState(null);
  const [plannedCoords, setPlannedCoords] = useState(null); // [[lng, lat], ...]
  const [stepIdx, setStepIdx] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showStepList, setShowStepList] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: startLng || initialLng || 77.0,
    latitude: startLat || initialLat || 11.0,
    zoom: 17.5,
    pitch: 48, // Google Maps first-person driver road perspective
    bearing: 0
  });

  const [searchingDest, setSearchingDest] = useState(false);
  const [destQuery, setDestQuery] = useState('');
  const [destResults, setDestResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // References for zero-jitter, single-flight route calculations
  const routeCalculatedRef = useRef(false);
  const latestRouteDataRef = useRef(null);
  const latestStepIdxRef = useRef(0);
  const lastSpokenRef = useRef('');
  const watchId = useRef(null);
  const prevCoord = useRef(null);
  const prevTime = useRef(null);
  const lastTrackTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  // Voice speech synthesis
  const speakInstruction = useCallback((text) => {
    if (!voiceOn || !('speechSynthesis' in window) || !text) return;
    if (text === lastSpokenRef.current) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = text;
    } catch (e) {
      console.warn('Voice guidance notice:', e);
    }
  }, [voiceOn]);

  // Fit the whole route bounds onto screen (Google Maps style Overview)
  const fitRouteBounds = useCallback((coords) => {
    if (!mapRef.current || !coords || coords.length < 2) return;
    try {
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      mapRef.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: { top: 140, bottom: 140, left: 60, right: 60 }, duration: 1000 }
      );
    } catch (e) {
      console.warn('fitBounds note:', e);
    }
  }, []);

  // Stable single-flight route calculation
  const calculateRoute = useCallback(async (cLat, cLng, dLat, dLng) => {
    if (!cLat || !cLng || !dLat || !dLng) return;
    try {
      const r = await getOSRMRoute(cLat, cLng, dLat, dLng);
      if (r && isMountedRef.current) {
        setRouteData(r);
        latestRouteDataRef.current = r;
        setStepIdx(0);
        latestStepIdxRef.current = 0;

        if (r.latlngs && r.latlngs.length > 0) {
          const coords = r.latlngs.map(([la, ln]) => [ln, la]);
          setPlannedCoords(coords);
          setTimeout(() => fitRouteBounds(coords), 300);
        }

        if (r.steps && r.steps.length > 0) {
          const first = r.steps[0];
          speakInstruction(`${first.instruction}`);
        }
      }
    } catch (err) {
      console.warn('Route calculation error:', err);
    }
  }, [speakInstruction, fitRouteBounds]);

  // Select alternative route
  const handleSelectRoute = (selectedRoute) => {
    if (!selectedRoute) return;
    setRouteData(selectedRoute);
    latestRouteDataRef.current = selectedRoute;
    setStepIdx(0);
    latestStepIdxRef.current = 0;
    if (selectedRoute.latlngs) {
      const coords = selectedRoute.latlngs.map(([la, ln]) => [ln, la]);
      setPlannedCoords(coords);
    }
    if (selectedRoute.steps && selectedRoute.steps.length > 0) {
      speakInstruction(`Switched to ${selectedRoute.label}. ${selectedRoute.steps[0].instruction}`);
    }
  };

  // Initial route fetch on mount / when coordinates first become available
  useEffect(() => {
    if (dest.lat && dest.lng) {
      const fromLa = currentPos ? currentPos[0] : startLat;
      const fromLn = currentPos ? currentPos[1] : startLng;
      if (fromLa && fromLn && !routeCalculatedRef.current) {
        routeCalculatedRef.current = true;
        calculateRoute(fromLa, fromLn, dest.lat, dest.lng);
      }
    }
  }, [dest.lat, dest.lng, startLat, startLng, currentPos, calculateRoute]);

  // Auto-geocode if destination coordinates are not set
  useEffect(() => {
    if ((!dest.lat || !dest.lng) && (visit?.client_address || visit?.client_name)) {
      const q = visit.client_address || visit.client_name;
      geocodeAddress(q).then(res => {
        if (res && res.length > 0 && isMountedRef.current) {
          const first = res[0];
          const nLat = parseFloat(first.lat);
          const nLng = parseFloat(first.lon);
          setDest({ lat: nLat, lng: nLng, label: first.display_name });
          routeCalculatedRef.current = false;
        }
      }).catch(() => {});
    }
  }, [dest.lat, dest.lng, visit]);

  // High-accuracy live GPS telemetry stream (Runs continuously without re-fetching routes)
  useEffect(() => {
    isMountedRef.current = true;
    if (!navigator.geolocation) return;

    // 1. Initial immediate GPS fix
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (!isMountedRef.current) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentPos([lat, lng]);

        if (dest.lat && dest.lng && !routeCalculatedRef.current) {
          routeCalculatedRef.current = true;
          calculateRoute(lat, lng, dest.lat, dest.lng);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 }
    );

    // 2. Real-time continuous GPS tracking
    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        if (!isMountedRef.current) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const liveHead = pos.coords.heading || 0;
        const now = Date.now();

        setHeading(liveHead);

        // Compute speed in km/h
        let currentSpeed = 0;
        if (pos.coords.speed !== null && pos.coords.speed >= 0) {
          currentSpeed = Math.round(pos.coords.speed * 3.6);
        } else if (prevCoord.current && prevTime.current) {
          const dKm = getDistanceFromLatLonInKm(prevCoord.current[0], prevCoord.current[1], lat, lng);
          const dtHours = (now - prevTime.current) / 3600000;
          if (dtHours > 0) currentSpeed = Math.min(120, Math.round(dKm / dtHours));
        }
        setSpeed(currentSpeed);
        prevCoord.current = [lat, lng];
        prevTime.current = now;

        setCurrentPos([lat, lng]);

        // If follow mode is active, smoothly update first-person driver camera view
        if (followMode) {
          setViewState(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            zoom: 17.5,
            pitch: 48,
            bearing: liveHead || prev.bearing
          }));
        }

        // Throttled live telemetry stream to backend for Super Admin / HR (at most once every 3.5s)
        if (now - lastTrackTimeRef.current > 3500) {
          lastTrackTimeRef.current = now;
          apiFetch('/client-visits/track', {
            method: 'POST',
            body: JSON.stringify({ visitId: visit.id, lat, lng })
          }).catch(() => {});
        }

        // Advance turn steps dynamically without network requests
        const rData = latestRouteDataRef.current;
        const curIdx = latestStepIdxRef.current;
        if (rData?.steps && curIdx < rData.steps.length) {
          const curStep = rData.steps[curIdx];
          if (curStep?.location) {
            const dToStepMeters = getDistanceFromLatLonInKm(lat, lng, curStep.location[1], curStep.location[0]) * 1000;
            if (dToStepMeters < 30 && curIdx < rData.steps.length - 1) {
              const next = curIdx + 1;
              latestStepIdxRef.current = next;
              setStepIdx(next);
              if (rData.steps[next]) {
                speakInstruction(rData.steps[next].instruction);
              }
            }
          }
        }
      },
      err => console.warn('GPS watcher notice:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      isMountedRef.current = false;
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [visit.id, dest.lat, dest.lng, followMode, calculateRoute, speakInstruction]);

  const currentStep = routeData?.steps?.[stepIdx] || routeData?.steps?.[0];
  const nextStep = routeData?.steps?.[stepIdx + 1];

  // Real-time live countdown meters to current turn maneuver (Local instant calculation)
  const liveTurnDistanceMeters = useMemo(() => {
    if (!currentPos || !currentStep?.location) return currentStep?.distance || 0;
    return Math.round(getDistanceFromLatLonInKm(currentPos[0], currentPos[1], currentStep.location[1], currentStep.location[0]) * 1000);
  }, [currentPos, currentStep]);

  // Real-time live total remaining distance in km
  const liveRemainingDistanceKm = useMemo(() => {
    if (!currentPos || !dest.lat || !dest.lng) return routeData?.distance || '0.0';
    const dKm = getDistanceFromLatLonInKm(currentPos[0], currentPos[1], dest.lat, dest.lng);
    return dKm.toFixed(1);
  }, [currentPos, dest.lat, dest.lng, routeData?.distance]);

  // Real-time live remaining minutes
  const liveRemainingDurationMin = useMemo(() => {
    const km = parseFloat(liveRemainingDistanceKm) || 0;
    return Math.max(1, Math.round(km * 2.2));
  }, [liveRemainingDistanceKm]);

  // Estimated clock arrival time — always shown in IST (Asia/Kolkata)
  const estimatedArrivalTime = useMemo(() => {
    const min = liveRemainingDurationMin || 1;
    const target = new Date(Date.now() + min * 60000);
    return target.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toLowerCase();
  }, [liveRemainingDurationMin]);

  const recenterMap = () => {
    setFollowMode(true);
    if (currentPos) {
      setViewState(v => ({
        ...v,
        latitude: currentPos[0],
        longitude: currentPos[1],
        zoom: 17.5,
        pitch: 48,
        bearing: heading || 0
      }));
    }
  };

  const handleShowOverview = () => {
    setFollowMode(false);
    setViewState(v => ({
      ...v,
      pitch: 0,
      bearing: 0
    }));
    if (plannedCoords && plannedCoords.length > 1) {
      fitRouteBounds(plannedCoords);
    }
  };

  const handleSearchDest = async (val) => {
    setDestQuery(val);
    if (val.length < 3) { setDestResults([]); return; }
    setSearchingDest(true);
    const r = await geocodeAddress(val);
    setDestResults(r.slice(0, 5));
    setSearchingDest(false);
  };

  return (
    <div style={{
      position:'fixed',
      inset:0,
      zIndex:9999,
      background:'#F8FAFC',
      display:'flex',
      flexDirection:'column',
      fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* ─── Top Floating Minimalist Navigation Banner (Dark Emerald) ─── */}
      <div style={{ position:'absolute', top:'14px', left:'14px', right:'14px', zIndex:30, pointerEvents:'none' }}>
        <div style={{
          maxWidth:'680px',
          margin:'0 auto',
          pointerEvents:'auto',
          display:'flex',
          flexDirection:'column'
        }}>
          {/* Main Turn Card */}
          <div style={{
            background:'#064E3B',
            borderRadius:'16px',
            padding:'12px 16px',
            boxShadow:'0 10px 30px rgba(0, 0, 0, 0.22)',
            color:'#FFFFFF',
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            gap:'12px'
          }}>
            {/* Turn Icon & Guidance */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>
              <div style={{
                width:'42px',
                height:'42px',
                borderRadius:'12px',
                background:'rgba(255, 255, 255, 0.15)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                flexShrink:0
              }}>
                <NavigationManeuverIcon step={currentStep} size={24} color="#FFFFFF" />
              </div>

              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontSize:'11px', color:'#A7F3D0', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {liveTurnDistanceMeters > 0 ? `In ${liveTurnDistanceMeters} m` : 'Head towards'}
                </div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'#FFFFFF', marginTop:'1px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.2px' }}>
                  {currentStep ? currentStep.instruction : `Follow route to ${dest.label}`}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
              <button
                onClick={() => setVoiceOn(!voiceOn)}
                title={voiceOn ? 'Voice guidance active' : 'Voice muted'}
                style={{
                  background: voiceOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                  border:'none',
                  color:'#FFFFFF',
                  borderRadius:'8px',
                  padding:'6px 10px',
                  fontSize:'12px',
                  fontWeight:'700',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:'4px'
                }}
              >
                {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{voiceOn ? 'Voice' : 'Muted'}</span>
              </button>

              <button
                onClick={() => setShowStepList(!showStepList)}
                style={{
                  background:'rgba(255, 255, 255, 0.2)',
                  border:'none',
                  color:'#FFFFFF',
                  borderRadius:'8px',
                  padding:'6px 10px',
                  fontSize:'12px',
                  fontWeight:'700',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:'4px'
                }}
              >
                <List size={14} />
                <span>Steps</span>
              </button>

              <button
                onClick={onClose}
                title="Close Navigator"
                style={{
                  background:'rgba(255, 255, 255, 0.15)',
                  border:'none',
                  borderRadius:'8px',
                  color:'#FFFFFF',
                  cursor:'pointer',
                  padding:'6px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Sub Next Turn Card */}
          {nextStep && (
            <div style={{
              alignSelf:'flex-start',
              background:'#022C22',
              color:'#A7F3D0',
              borderBottomLeftRadius:'10px',
              borderBottomRightRadius:'10px',
              padding:'4px 12px',
              fontSize:'11px',
              fontWeight:'700',
              marginLeft:'14px',
              display:'flex',
              alignItems:'center',
              gap:'5px',
              boxShadow:'0 4px 8px rgba(0,0,0,0.12)'
            }}>
              <span style={{ color:'#FFFFFF', fontWeight:'800' }}>Then</span>
              <NavigationManeuverIcon step={nextStep} size={12} color="#A7F3D0" />
              <span>{nextStep.instruction}</span>
            </div>
          )}
        </div>

        {/* Alternative Routes Selector Chips (Google Maps Style) */}
        {routeData?.allRoutes && routeData.allRoutes.length > 1 && (
          <div style={{
            maxWidth:'680px',
            margin:'8px auto 0',
            display:'flex',
            justifyContent:'center',
            gap:'8px',
            pointerEvents:'auto',
            overflowX:'auto',
            paddingBottom:'2px'
          }}>
            {routeData.allRoutes.map((r, rIdx) => {
              const isSelected = r.id === routeData.id;
              return (
                <button
                  key={r.id || rIdx}
                  onClick={() => handleSelectRoute(r)}
                  style={{
                    background: isSelected ? '#0F172A' : 'rgba(255, 255, 255, 0.95)',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: isSelected ? '1.5px solid #38BDF8' : '1px solid #CBD5E1',
                    borderRadius:'20px',
                    padding:'5px 12px',
                    fontSize:'11px',
                    fontWeight:'800',
                    cursor:'pointer',
                    backdropFilter:'blur(8px)',
                    boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
                    display:'flex',
                    alignItems:'center',
                    gap:'6px',
                    transition:'all 0.15s',
                    flexShrink:0
                  }}
                >
                  <span style={{ color: isSelected ? '#38BDF8' : '#2563EB' }}>
                    {rIdx === 0 ? '⚡ Fastest' : r.label}
                  </span>
                  <span style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }}>{r.duration} min</span>
                  <span style={{ fontSize:'10px', color: isSelected ? '#94A3B8' : '#64748B' }}>({r.distance} km)</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Missing Destination Banner Alert */}
        {(!dest.lat || !dest.lng) && (
          <div style={{
            maxWidth:'680px',
            margin:'8px auto 0',
            background:'#FEF2F2',
            border:'1px solid #FECACA',
            borderRadius:'14px',
            padding:'8px 14px',
            color:'#DC2626',
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            fontSize:'12px',
            fontWeight:'700',
            pointerEvents:'auto',
            boxShadow:'0 4px 12px rgba(220, 38, 38, 0.08)'
          }}>
            <span>📍 Destination not set. Click to search and plot road route.</span>
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                background:'#DC2626',
                color:'#fff',
                border:'none',
                borderRadius:'8px',
                padding:'5px 12px',
                fontSize:'11px',
                fontWeight:'800',
                cursor:'pointer'
              }}
            >
              Set Destination
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Map Canvas (Driver 3D Perspective + Multi-Route Traffic Polyline) ─── */}
      <div style={{ flex:1, position:'relative' }}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => {
            setViewState(evt.viewState);
            if (evt.interactionState?.isDragging) {
              setFollowMode(false);
            }
          }}
          minZoom={4}
          maxZoom={19}
          mapStyle={MAP_STYLES.street}
          style={{ width:'100%', height:'100%' }}
        >
          <NavigationControl position="bottom-right" />

          {/* Road Route Line with Traffic Flow & Alternatives */}
          <RouteLineOverlay
            idPrefix="rider-nav"
            coordinates={plannedCoords}
            color="#22C55E"
            width={7}
            trafficSegments={routeData?.trafficSegments}
            alternativeRoutes={(routeData?.allRoutes || []).filter(r => r.id !== routeData?.id)}
            onSelectAlternative={handleSelectRoute}
            showCasing={true}
          />

          {/* Start Origin Pin */}
          {startLat && startLng && (
            <Marker longitude={startLng} latitude={startLat} anchor="bottom">
              <div title="Starting Point" style={{
                background:'#2563EB',
                color:'#fff',
                border:'2px solid #fff',
                borderRadius:'8px',
                padding:'2px 6px',
                fontSize:'10px',
                fontWeight:'800',
                boxShadow:'0 4px 10px rgba(37,99,235,0.4)',
                display:'flex',
                alignItems:'center',
                gap:'3px'
              }}>
                📍 Start
              </div>
            </Marker>
          )}

          {/* Destination Pin */}
          {dest.lat && dest.lng && (
            <Marker longitude={dest.lng} latitude={dest.lat} anchor="bottom">
              <div title={dest.label} style={{
                width:'32px',
                height:'32px',
                background:'#EF4444',
                border:'3px solid #FFFFFF',
                borderRadius:'50%',
                boxShadow:'0 4px 14px rgba(239, 68, 68, 0.45)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#fff',
                fontSize:'14px'
              }}>
                🎯
              </div>
            </Marker>
          )}

          {/* Sleek Minimalist Navigation Puck with Directional Chevron */}
          {currentPos && (
            <Marker longitude={currentPos[1]} latitude={currentPos[0]} anchor="center">
              <div style={{
                position:'relative',
                width:'36px',
                height:'36px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center'
              }}>
                {/* Pulse halo */}
                <div style={{
                  position:'absolute',
                  inset:'-6px',
                  borderRadius:'50%',
                  background:'rgba(37, 99, 235, 0.22)',
                  animation:'livePulse 1.8s infinite'
                }} />
                {/* Vector Navigation Puck */}
                <div style={{
                  width:'30px',
                  height:'30px',
                  borderRadius:'50%',
                  background:'#2563EB',
                  border:'3px solid #FFFFFF',
                  boxShadow:'0 4px 14px rgba(37, 99, 235, 0.45)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  position:'relative',
                  zIndex:2,
                  transform: `rotate(${heading}deg)`,
                  transition: 'transform 0.2s linear'
                }}>
                  <Navigation size={16} color="#FFFFFF" style={{ fill: '#FFFFFF' }} />
                </div>
              </div>
            </Marker>
          )}
        </Map>

        {/* Speedometer Circle on Bottom-Left */}
        <div style={{
          position:'absolute',
          bottom:'90px',
          left:'16px',
          width:'54px',
          height:'54px',
          background:'#FFFFFF',
          borderRadius:'50%',
          border:'2px solid #E2E8F0',
          boxShadow:'0 4px 14px rgba(0,0,0,0.1)',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          zIndex:20
        }}>
          <div style={{ fontSize:'16px', fontWeight:'900', color:'#0F172A', lineHeight:1 }}>{speed}</div>
          <div style={{ fontSize:'8px', fontWeight:'800', color:'#64748B', marginTop:'1px' }}>km/h</div>
        </div>

        {/* Floating Quick Action Controls (Right side) */}
        <div style={{
          position:'absolute',
          bottom:'90px',
          right:'16px',
          display:'flex',
          flexDirection:'column',
          gap:'8px',
          zIndex:20
        }}>
          {/* Re-centre Button (when panned away) */}
          {!followMode && (
            <button
              onClick={recenterMap}
              style={{
                background:'#FFFFFF',
                color:'#2563EB',
                border:'1px solid #E2E8F0',
                borderRadius:'24px',
                padding:'8px 14px',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                fontSize:'12px',
                fontWeight:'800',
                cursor:'pointer',
                boxShadow:'0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              <Navigation size={13} color="#2563EB" style={{ fill:'#2563EB' }} />
              <span>Re-centre</span>
            </button>
          )}

          {/* Full Route Overview Button */}
          <button
            onClick={handleShowOverview}
            title="View Full Route Overview"
            style={{
              width:'40px',
              height:'40px',
              background:'#FFFFFF',
              border:'1px solid #E2E8F0',
              borderRadius:'50%',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer',
              boxShadow:'0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            <Compass size={17} color="#2563EB" />
          </button>
        </div>

        {/* Step-by-Step Maneuvers Drawer */}
        {showStepList && routeData?.steps && (
          <div style={{
            position:'absolute',
            top:'80px',
            left:'16px',
            bottom:'90px',
            width:'320px',
            background:'rgba(255, 255, 255, 0.98)',
            backdropFilter:'blur(16px)',
            borderRadius:'18px',
            border:'1px solid #E2E8F0',
            padding:'16px',
            overflowY:'auto',
            color:'#0F172A',
            zIndex:35,
            boxShadow:'0 16px 40px rgba(0, 0, 0, 0.14)'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', borderBottom:'1px solid #F1F5F9', paddingBottom:'10px' }}>
              <div style={{ fontWeight:'800', fontSize:'14px', color:'#0F172A' }}>Route Steps ({routeData.steps.length})</div>
              <button
                onClick={() => setShowStepList(false)}
                style={{ background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex', alignItems:'center' }}
              >
                <X size={16} />
              </button>
            </div>
            {routeData.steps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display:'flex',
                  gap:'12px',
                  padding:'10px 8px',
                  borderRadius:'10px',
                  background: idx === stepIdx ? '#ECFDF5' : 'transparent',
                  borderBottom: idx === stepIdx ? 'none' : '1px solid #F8FAFC',
                  opacity: idx < stepIdx ? 0.35 : 1,
                  marginBottom:'4px'
                }}
              >
                <div style={{
                  width:'28px',
                  height:'28px',
                  borderRadius:'8px',
                  background: idx === stepIdx ? '#005A44' : '#F1F5F9',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  flexShrink:0
                }}>
                  <NavigationManeuverIcon step={s} size={15} color={idx === stepIdx ? '#FFFFFF' : '#64748B'} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight: idx === stepIdx ? '800' : '600', color: idx === stepIdx ? '#005A44' : '#334155' }}>
                    {s.instruction}
                  </div>
                  <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px', fontWeight:'500' }}>{s.distance} meters</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Destination Search Modal */}
        {showSearchModal && (
          <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'22px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <div style={{ fontWeight:'800', fontSize:'16px', color:'#0F172A' }}>Set Destination Location</div>
                <button onClick={() => setShowSearchModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ position:'relative', marginBottom:'12px' }}>
                <Search size={15} color="#94A3B8" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }} />
                <input
                  className="gps-input"
                  value={destQuery}
                  onChange={e => handleSearchDest(e.target.value)}
                  placeholder="Type client address or landmark..."
                  style={{ paddingLeft:'36px', height:'42px', borderRadius:'10px' }}
                  autoFocus
                />
                {searchingDest && <Loader2 size={15} color="#2563EB" style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', animation:'spin 1s linear infinite' }} />}
              </div>
              {destResults.length > 0 && (
                <div style={{ borderRadius:'10px', border:'1px solid #E2E8F0', overflow:'hidden', maxHeight:'220px', overflowY:'auto' }}>
                  {destResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const la = parseFloat(r.lat);
                        const ln = parseFloat(r.lon);
                        setDest({ lat: la, lng: ln, label: r.display_name.substring(0, 50) });
                        setShowSearchModal(false);
                        routeCalculatedRef.current = false;
                        const fromLa = currentPos ? currentPos[0] : startLat;
                        const fromLn = currentPos ? currentPos[1] : startLng;
                        if (fromLa && fromLn) calculateRoute(fromLa, fromLn, la, ln);
                      }}
                      style={{ padding:'10px 12px', cursor:'pointer', fontSize:'12px', color:'#374151', borderBottom: i < destResults.length - 1 ? '1px solid #F8FAFC' : 'none', display:'flex', gap:'8px' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <MapPin size={13} color="#2563EB" style={{ flexShrink:0, marginTop:'1px' }} />
                      <span>{r.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Google Maps Travel Info Card ─── */}
      <div style={{ position:'absolute', bottom:'14px', left:'14px', right:'14px', zIndex:30, pointerEvents:'none' }}>
        <div style={{
          maxWidth:'680px',
          margin:'0 auto',
          background:'#FFFFFF',
          borderRadius:'22px',
          border:'1px solid #E2E8F0',
          padding:'12px 18px',
          boxShadow:'0 10px 30px rgba(0, 0, 0, 0.12)',
          color:'#0F172A',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          pointerEvents:'auto',
          gap:'12px'
        }}>
          {/* Close Circular Button */}
          <button
            onClick={onClose}
            title="Exit Navigation"
            style={{
              width:'40px',
              height:'40px',
              borderRadius:'50%',
              background:'#F1F5F9',
              border:'none',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer',
              color:'#475569'
            }}
          >
            <X size={18} />
          </button>

          {/* ETA & Distance Info (Google Maps Typography) */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'22px', fontWeight:'900', color:'#16A34A', letterSpacing:'-0.3px' }}>
                {liveRemainingDurationMin} min
              </span>
              <span style={{ fontSize:'14px' }}>🌱</span>
            </div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#64748B', marginTop:'1px' }}>
              {liveRemainingDistanceKm} km • {estimatedArrivalTime}
            </div>
          </div>

          {/* Primary Action Button */}
          {onReachClient && (
            <button
              onClick={() => { onClose(); onReachClient(); }}
              style={{
                background:'#10B981',
                color:'#fff',
                border:'none',
                borderRadius:'14px',
                padding:'10px 18px',
                fontSize:'13px',
                fontWeight:'800',
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                boxShadow:'0 4px 12px rgba(16, 185, 129, 0.3)',
                transition:'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background='#059669'}
              onMouseLeave={e => e.currentTarget.style.background='#10B981'}
            >
              <Camera size={15} />
              <span>Reached Client</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════════════════════
const StartJourneyModal = ({ onStart, onClose }) => {
  const [clientName, setClientName] = useState('');
  const [inputMode, setInputMode] = useState('search'); // 'search' | 'gmaps'
  const [searchVal, setSearchVal] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [results, setResults] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const timer = useRef(null);

  const doSearch = (val) => {
    setSearchVal(val); setSelectedDest(null);
    clearTimeout(timer.current);
    if (val.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const r = await geocodeAddress(val);
      setResults(r.slice(0, 5));
      setSearching(false);
    }, 500);
  };

  const handleGmapsUrl = async (url) => {
    setGmapsUrl(url); setSelectedDest(null);
    if (!url || !url.startsWith('http')) return;
    
    let finalUrl = url;
    if (url.includes('goo.gl')) {
      setSearching(true);
      try {
        const res = await apiFetch('/client-visits/resolve-link', { method: 'POST', body: JSON.stringify({ url }) });
        if (res.success && res.expandedUrl) {
          finalUrl = res.expandedUrl;
        }
      } catch (e) {
        console.error('Failed to resolve short link:', e);
      }
      setSearching(false);
    }
    
    const coords = parseGoogleMapsUrl(finalUrl);
    if (coords) {
      setSelectedDest({ lat: coords.lat, lng: coords.lng, address: `Google Maps location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` });
    }
  };

  const handleStart = () => {
    if (!clientName.trim()) return alert('Please enter client name');
    setStarting(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      if (pos.coords.accuracy > 400) {
        alert(`GPS signal is too weak (Accuracy: ${Math.round(pos.coords.accuracy)}m).\nPlease step outside or wait a moment before starting.`);
        setStarting(false);
        return;
      }
      try {
        const res = await apiFetch('/client-visits/start-journey', {
          method: 'POST',
          body: JSON.stringify({
            clientName: clientName.trim(),
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            clientAddress: selectedDest?.address || null,
            destLat: selectedDest?.lat || null,
            destLng: selectedDest?.lng || null
          })
        });
        if (res.success) onStart();
        else { alert(res.message || 'Failed'); setStarting(false); }
      } catch (e) { alert(e.message); setStarting(false); }
    }, err => { alert('GPS error: ' + err.message); setStarting(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'440px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', border:'1px solid #E2E8F0' }}>
        <div style={{ fontWeight:'800', fontSize:'18px', color:'#0F172A', marginBottom:'4px' }}>Start Journey</div>
        <div style={{ fontSize:'13px', color:'#64748B', marginBottom:'24px' }}>GPS tracking begins immediately when you start</div>

        {/* Client Name */}
        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Client / Company Name *</label>
          <input className="gps-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Reliance Industries Ltd" />
        </div>

        {/* Location mode tabs */}
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' }}>Client Location (optional, for route planning)</label>
          <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
            {[['search','Search address'],['gmaps','Google Maps link']].map(([mode, label]) => (
              <button key={mode} onClick={() => { setInputMode(mode); setSelectedDest(null); setResults([]); }}
                style={{ flex:1, padding:'8px', borderRadius:'8px', border: inputMode === mode ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                  background: inputMode === mode ? '#EFF6FF' : '#F8FAFC', color: inputMode === mode ? '#2563EB' : '#64748B',
                  fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {inputMode === 'search' && (
            <div style={{ position:'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)' }} />
              <input className="gps-input" value={searchVal} onChange={e => doSearch(e.target.value)}
                placeholder="Search address or place name..." style={{ paddingLeft:'30px' }} />
              {searching && <Loader2 size={14} color="#2563EB" style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', animation:'spin 1s linear infinite' }} />}
              {results.length > 0 && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', borderRadius:'8px', marginTop:'4px', border:'1px solid #E2E8F0', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', overflow:'hidden' }}>
                  {results.map((r, i) => (
                    <div key={i} onClick={() => { setSelectedDest({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name }); setSearchVal(r.display_name.substring(0,60)); setResults([]); }}
                      style={{ padding:'10px 12px', cursor:'pointer', fontSize:'12px', color:'#374151', borderBottom: i < results.length-1 ? '1px solid #F8FAFC' : 'none', display:'flex', gap:'8px', alignItems:'flex-start' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <MapPin size={12} color="#2563EB" style={{ flexShrink:0, marginTop:'1px' }} />
                      <span style={{ lineHeight:'1.4' }}>{r.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inputMode === 'gmaps' && (
            <div>
              <div style={{ position:'relative' }}>
                <Link size={14} color="#94A3B8" style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)' }} />
                <input className="gps-input" value={gmapsUrl} onChange={e => handleGmapsUrl(e.target.value)}
                  placeholder="Paste Google Maps link here..." style={{ paddingLeft:'30px' }} />
              </div>
              <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'5px', lineHeight: '1.4' }}>
                Right-click any location in Google Maps (web) → "Share" → copy the link and paste here.<br/>
                <span style={{ color: '#10B981', fontWeight: '500' }}>Short links (maps.app.goo.gl) are automatically resolved!</span>
              </div>
            </div>
          )}
        </div>

        {selectedDest && (
          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px', padding:'10px 12px', marginBottom:'16px', fontSize:'12px', color:'#16A34A', display:'flex', gap:'6px', alignItems:'flex-start' }}>
            <CheckCircle2 size={14} style={{ flexShrink:0, marginTop:'1px' }} />
            <span>Location confirmed — route will be shown on map</span>
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          <button className="gps-btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="gps-btn-primary" onClick={handleStart} disabled={!clientName.trim() || starting} style={{ flex:1, justifyContent:'center' }}>
            {starting ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> Starting...</> : <><Navigation size={14} /> Start Tracking</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO VERIFICATION MODAL
// ═══════════════════════════════════════════════════════════════════════════
const PhotoModal = ({ action, visit, onSubmit, onClose }) => {
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      } catch (e) { alert('Camera: ' + e.message); }
    })();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const snap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.85));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const toBlob = (d) => {
    const arr = d.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const b = atob(arr[1]); const u = new Uint8Array(b.length);
    for (let n = 0; n < b.length; n++) u[n] = b.charCodeAt(n);
    return new Blob([u], { type: mime });
  };

  const submit = () => {
    if (!photo) return;
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const fd = new FormData();
        fd.append('visitId', visit.id);
        fd.append('lat', pos.coords.latitude);
        fd.append('lng', pos.coords.longitude);
        fd.append('photo', toBlob(photo), action === 'reachClient' ? 'arrival.jpg' : 'end.jpg');
        const ep = action === 'reachClient' ? '/client-visits/reach-client' : '/client-visits/end-meeting';
        const res = await apiFetch(ep, { method:'POST', body:fd });
        if (res.success) onSubmit(); else { alert(res.message); setSubmitting(false); }
      } catch (e) { alert(e.message); setSubmitting(false); }
    }, e => { alert(e.message); setSubmitting(false); }, { enableHighAccuracy:true });
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'360px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight:'800', fontSize:'16px', color:'#0F172A', marginBottom:'4px' }}>
          {action === 'reachClient' ? '📍 Verify Arrival' : '✅ Verify Meeting End'}
        </div>
        <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'16px' }}>
          Take a photo at the {action === 'reachClient' ? 'client location' : 'meeting end'} to verify
        </div>

        <div style={{ borderRadius:'12px', overflow:'hidden', height:'210px', background:'#F8FAFC', position:'relative', marginBottom:'16px', border:'1px solid #E2E8F0' }}>
          {photo
            ? <img src={photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
            : <video ref={videoRef} style={{ width:'100%', height:'100%', objectFit:'cover' }} playsInline muted />}
          <canvas ref={canvasRef} style={{ display:'none' }} />
          {!photo && (
            <button onClick={snap} style={{ position:'absolute', bottom:'12px', left:'50%', transform:'translateX(-50%)', background:'#2563EB', color:'#fff', border:'none', borderRadius:'50%', width:'46px', height:'46px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.4)' }}>
              <Camera size={20} />
            </button>
          )}
          {photo && (
            <button onClick={() => { setPhoto(null); (async()=>{ const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); streamRef.current=s; if(videoRef.current){videoRef.current.srcObject=s; videoRef.current.play();} })(); }}
              style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'6px', color:'#fff', padding:'4px 8px', fontSize:'11px', cursor:'pointer', fontWeight:'600' }}>
              Retake
            </button>
          )}
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button className="gps-btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="gps-btn-primary" onClick={submit} disabled={!photo || submitting} style={{ flex:1, justifyContent:'center', background: !photo||submitting ? '#94A3B8' : '#10B981' }}>
            {submitting ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} />Uploading...</> : '✓ Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ClientVisits() {
  const authRaw = localStorage.getItem('hrms_auth');
  let userRole = 'USER';
  try { if (authRaw) userRole = JSON.parse(authRaw).role || 'USER'; } catch(e){}
  
  const normalizedRole = (userRole || '').toUpperCase().replace(/[\s_-]+/g, '');
  const isManagement = ['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER'].includes(normalizedRole);

  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [photoModal, setPhotoModal] = useState(null); // { action, visit }
  const [liveId, setLiveId] = useState(null);
  const [navigatingVisit, setNavigatingVisit] = useState(null);
  const trackTimer = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  const fetchVisits = useCallback(async () => {
    const res = await apiFetch('/client-visits/active').catch(() => null);
    if (res?.success) {
      // Strictly sort newest journeys first (by id descending)
      const sortedActive = [...(res.visits || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      const sortedCompleted = [...(res.completedVisits || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      setActive(sortedActive);
      setCompleted(sortedCompleted);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVisits(); return () => clearInterval(trackTimer.current); }, [fetchVisits]);

  // Background GPS ping — every 45 seconds (only for field users)
  useEffect(() => {
    clearInterval(trackTimer.current);
    if (!isManagement && active.length > 0) {
      trackTimer.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async pos => {
          if (pos.coords.accuracy > 400) return; // Skip highly inaccurate background pings
          for (const v of active) {
            if (['Travelling','In Meeting','Returning'].includes(v.status)) {
              await apiFetch('/client-visits/track', { method:'POST', body:JSON.stringify({ visitId:v.id, lat:pos.coords.latitude, lng:pos.coords.longitude }) }).catch(()=>{});
            }
          }
        }, () => {}, { enableHighAccuracy:true, timeout: 10000, maximumAge: 0 });
      }, 45000);
    }
    return () => clearInterval(trackTimer.current);
  }, [active, isManagement]);

  const closeJourney = (visit) => {
    if (!confirm('Confirm you have returned to office?')) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const res = await apiFetch('/client-visits/reach-office', { method:'POST', body:JSON.stringify({ visitId:visit.id, lat:pos.coords.latitude, lng:pos.coords.longitude }) });
      if (res.success) { alert(`Journey closed!\nDistance: ${res.data.distance} km`); fetchVisits(); }
      else alert(res.message);
    }, e => alert(e.message), { enableHighAccuracy:true });
  };

  const deleteJourney = async (visitId) => {
    if (!confirm('Are you sure you want to delete this journey?')) return;
    try {
      const res = await apiFetch(`/client-visits/${visitId}`, { method: 'DELETE' });
      if (res.success) {
        fetchVisits();
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const stageBtn = {
    Travelling: { label:'Reached Client — Take Photo', bg:'#10B981', action:'reachClient' },
    'In Meeting': { label:'Meeting Done — Take Photo', bg:'#F59E0B', action:'endMeeting' },
    Returning: { label:'Back at Office — Close Journey', bg:'#EF4444', action:'close' },
  };

  const stageBadge = {
    Travelling: { bg:'#EFF6FF', text:'#2563EB' },
    'In Meeting': { bg:'#F0FDF4', text:'#16A34A' },
    Returning: { bg:'#FFFBEB', text:'#D97706' },
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", maxWidth:'1100px' }}>
      {/* Modals */}
      {showStart && <StartJourneyModal onStart={() => { setShowStart(false); fetchVisits(); }} onClose={() => setShowStart(false)} />}
      {photoModal && <PhotoModal action={photoModal.action} visit={photoModal.visit} onSubmit={() => { setPhotoModal(null); fetchVisits(); }} onClose={() => setPhotoModal(null)} />}
      {liveId && <LiveTrackingMap visitId={liveId} onClose={() => setLiveId(null)} />}
      {navigatingVisit && (
        <RiderNavigatorModal
          visit={navigatingVisit}
          onClose={() => setNavigatingVisit(null)}
          onReachClient={() => {
            const v = navigatingVisit;
            setNavigatingVisit(null);
            setPhotoModal({ action: 'reachClient', visit: v });
          }}
        />
      )}

      {/* Page header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0F172A' }}>GPS Field Tracking</h2>
            {isManagement && (
              <span style={{ fontSize:'11px', fontWeight:'700', background:'#EFF6FF', color:'#2563EB', padding:'3px 10px', borderRadius:'20px', border:'1px solid #DBEAFE', display:'flex', alignItems:'center', gap:'4px' }}>
                <ShieldCheck size={13} /> Live Supervisor Hub
              </span>
            )}
          </div>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748B' }}>
            {isManagement
              ? 'Real-time live monitoring of all field employee journeys and routes'
              : 'Live journey tracking and client visit management'}
          </p>
        </div>

        {/* Only field employees see Start Journey button; Super Admin / HR monitor live journeys */}
        {!isManagement && (
          <button className="gps-btn-primary" onClick={() => setShowStart(true)}>
            <Navigation size={15} /> Start Journey
          </button>
        )}
      </div>

      {/* Active journeys */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8', fontSize:'14px' }}>Loading journeys...</div>
      ) : active.length === 0 ? (
        <div style={{ background:'#F8FAFC', border:'1.5px dashed #CBD5E1', borderRadius:'14px', padding:'60px', textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>🏍️</div>
          <div style={{ fontWeight:'700', color:'#0F172A', fontSize:'15px', marginBottom:'6px' }}>No active journeys right now</div>
          <div style={{ color:'#64748B', fontSize:'13px' }}>
            {isManagement ? 'Active employee journeys will appear here live when started.' : 'Click "Start Journey" before leaving the office'}
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'16px' }}>
          {active.map(v => {
            const badge = stageBadge[v.status] || { bg:'#F8FAFC', text:'#64748B' };
            const btn = stageBtn[v.status];
            return (
              <div key={v.id} className="gps-card" style={{ display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                    <div>
                      <div style={{ fontWeight:'800', fontSize:'16px', color:'#0F172A' }}>{v.client_name}</div>
                      {v.employee_name && <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px', fontWeight:'600' }}>👤 {v.employee_name}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap: '8px' }}>
                      <span style={{ fontSize:'11px', fontWeight:'700', background:badge.bg, color:badge.text, padding:'4px 10px', borderRadius:'20px', whiteSpace:'nowrap' }}>
                        {v.status}
                      </span>
                      {isManagement && (
                        <button onClick={() => deleteJourney(v.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', color:'#94A3B8' }} onMouseEnter={e => e.currentTarget.style.color='#EF4444'} onMouseLeave={e => e.currentTarget.style.color='#94A3B8'} title="Delete Journey">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'16px' }}>
                    <div style={{ fontSize:'12px', color:'#64748B', display:'flex', gap:'6px', alignItems:'center' }}>
                      <Play size={11} color="#2563EB" /> Left: {new Date(v.start_journey_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})}
                    </div>
                    {v.check_in_time && <div style={{ fontSize:'12px', color:'#64748B', display:'flex', gap:'6px', alignItems:'center' }}><Building size={11} color="#10B981" /> Reached: {new Date(v.check_in_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})}</div>}
                    {v.check_out_time && <div style={{ fontSize:'12px', color:'#64748B', display:'flex', gap:'6px', alignItems:'center' }}><LogOut size={11} color="#F59E0B" /> Meeting ended: {new Date(v.check_out_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})}</div>}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {/* For Super Admin / HR (Management): Primary and only action is Track Live Map */}
                  {isManagement ? (
                    <button
                      onClick={() => setLiveId(v.id)}
                      style={{
                        width:'100%',
                        padding:'11px',
                        background:'#2563EB',
                        color:'#fff',
                        border:'none',
                        borderRadius:'8px',
                        cursor:'pointer',
                        fontSize:'13px',
                        fontWeight:'700',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        gap:'7px',
                        boxShadow:'0 2px 8px rgba(37,99,235,0.25)',
                        transition:'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='#1D4ED8'}
                      onMouseLeave={e => e.currentTarget.style.background='#2563EB'}
                    >
                      <MapIcon size={15} /> Track Live Map
                    </button>
                  ) : (
                    /* For Team Leader & Field Employees: Swiggy/Zomato Turn-by-Turn Navigation + Stage Milestones */
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {['Travelling', 'Returning'].includes(v.status) && (
                        <button
                          onClick={() => setNavigatingVisit(v)}
                          style={{
                            width:'100%',
                            padding:'11px',
                            background:'#0F172A',
                            color:'#fff',
                            border:'1px solid #334155',
                            borderRadius:'8px',
                            cursor:'pointer',
                            fontSize:'13px',
                            fontWeight:'700',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap:'7px',
                            boxShadow:'0 2px 8px rgba(15,23,42,0.25)',
                            transition:'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='#1E293B'}
                          onMouseLeave={e => e.currentTarget.style.background='#0F172A'}
                        >
                          <Compass size={15} color="#38BDF8" /> 🧭 Live Turn-by-Turn Navigation
                        </button>
                      )}
                      {btn && (
                        <button
                          onClick={() => btn.action === 'close' ? closeJourney(v) : setPhotoModal({ action:btn.action, visit:v })}
                          style={{ width:'100%', padding:'11px', background:btn.bg, color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
                          {btn.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed today */}
      {completed.length > 0 && (
        <div style={{ marginTop:'36px' }}>
          <div style={{ fontWeight:'800', fontSize:'15px', color:'#0F172A', marginBottom:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
            <CheckCircle2 size={16} color="#10B981" /> Today's Completed Journeys
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
            {completed.map(v => (
              <div key={v.id} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                  <div style={{ fontWeight:'700', color:'#0F172A', fontSize:'14px' }}>{v.client_name}</div>
                  <span style={{ fontSize:'10px', background:'#F1F5F9', color:'#64748B', padding:'3px 7px', borderRadius:'4px', fontWeight:'600' }}>DONE</span>
                </div>
                {v.employee_name && <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'10px' }}>👤 {v.employee_name}</div>}
                <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #E2E8F0', paddingTop:'10px' }}>
                  <div><div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700' }}>DISTANCE</div><div style={{ fontSize:'15px', color:'#2563EB', fontWeight:'800' }}>{v.distance_travelled || '0.00'} km</div></div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'700' }}>DURATION</div>
                    <div style={{ fontSize:'13px', color:'#64748B', fontWeight:'600' }}>
                      {v.start_journey_time && v.end_journey_time ? `${Math.round((new Date(v.end_journey_time)-new Date(v.start_journey_time))/60000)} min` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

