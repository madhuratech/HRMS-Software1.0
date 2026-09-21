import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Helper to generate a circle polygon in GeoJSON
function createGeoJSONCircle(center, radiusInMeters, points = 64) {
  const coords = { latitude: center[0], longitude: center[1] };
  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret]
    }
  };
}

export default function GeofenceMap({ lat, lng, radius, onChange, readonly = false }) {
  const defaultLat = parseFloat(lat) || 11.0130;
  const defaultLng = parseFloat(lng) || 76.9567;
  const currentRadius = parseInt(radius) || 100;

  const [viewState, setViewState] = useState({
    longitude: defaultLng,
    latitude: defaultLat,
    zoom: 14
  });

  // Keep view in sync if lat/lng props change externally
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: defaultLng,
      latitude: defaultLat
    }));
  }, [defaultLat, defaultLng]);

  const onClick = useCallback((event) => {
    if (readonly || !onChange) return;
    const { lngLat } = event;
    onChange(lngLat.lat, lngLat.lng);
  }, [readonly, onChange]);

  const circleData = useMemo(() => {
    return createGeoJSONCircle([defaultLat, defaultLng], currentRadius);
  }, [defaultLat, defaultLng, currentRadius]);

  const mapStyle = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        onClick={onClick}
        cursor={readonly ? 'grab' : 'crosshair'}
      >
        <Source type="geojson" data={circleData}>
          <Layer
            id="geofence-circle-fill"
            type="fill"
            paint={{
              'fill-color': '#3B82F6',
              'fill-opacity': 0.2
            }}
          />
          <Layer
            id="geofence-circle-outline"
            type="line"
            paint={{
              'line-color': '#2563EB',
              'line-width': 2
            }}
          />
        </Source>
        <Marker longitude={defaultLng} latitude={defaultLat} anchor="center">
          <div style={{ width: '16px', height: '16px', backgroundColor: '#2563EB', border: '2px solid #FFFFFF', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
        </Marker>
      </Map>
    </div>
  );
}

