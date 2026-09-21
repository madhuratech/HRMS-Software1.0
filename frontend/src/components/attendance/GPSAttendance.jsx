import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import AppDropdown from '../ui/AppDropdown';
import {
  Filter, Navigation, MapPin, RefreshCw, CalendarIcon,
  CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { usePermissions } from '../../context/PermissionContext';
import { GeoPunch } from './GeoPunch';
import { useNavigate } from 'react-router-dom';
import EmployeeAvatar from '../employee/EmployeeAvatar';
import ClientVisits from './ClientVisits';

// Helper: Generate accurate GeoJSON circle polygon from center + radius in meters
function createGeoJSONCircle(center, radiusInMeters, points = 64) {
  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos(center[0] * Math.PI / 180));
  const distanceY = km / 110.574;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    ret.push([center[1] + distanceX * Math.cos(theta), center[0] + distanceY * Math.sin(theta)]);
  }
  ret.push(ret[0]);
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } };
}

// OpenStreetMap standard tile style object for MapLibre GL
const MAP_STYLE = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }]
};

// Auto-fit map bounds when geofences or records change
function AutoFitBounds({ geofences, records }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map) return;
    const pts = [];
    geofences.forEach(gf => { if (gf.lat && gf.lng) pts.push([gf.lng, gf.lat]); });
    records.forEach(r => { if (r.lat && r.lng) pts.push([r.lng, r.lat]); });
    if (pts.length === 0) return;
    const lngs = pts.map(p => p[0]);
    const lats = pts.map(p => p[1]);
    try { map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 15, duration: 1000 }); } catch { }
  }, [geofences, records, map]);
  return null;
}

export default function GPSAttendance() {
  const navigate = useNavigate();
  const getTodayDateStr = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  };

  const [records, setRecords] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [kpis, setKpis] = useState({ totalCheckins: 0, onSite: 0, remote: 0, activeGeofences: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [popupInfo, setPopupInfo] = useState(null);

  const auth = JSON.parse(localStorage.getItem('hrms_auth') || '{}');
  const userRole = String(auth?.user?.role || auth?.role || '').toUpperCase();
  const [activeTab, setActiveTab] = useState('gps');

  const [viewState, setViewState] = useState({ longitude: 76.9567, latitude: 11.0130, zoom: 12 });

  // GeoJSON FeatureCollection for all geofence circles
  const geofenceCircles = useMemo(() => ({
    type: 'FeatureCollection',
    features: geofences.filter(gf => gf.lat && gf.lng).map(gf => ({
      ...createGeoJSONCircle([gf.lat, gf.lng], gf.radius || 300),
      properties: { name: gf.name, radius: gf.radius }
    }))
  }), [geofences]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/attendance/gps-feed?date=${selectedDate}`);
      if (data && data.success) {
        setRecords(data.records || []);
        setGeofences(data.geofences || []);
        setKpis(data.kpis || { totalCheckins: 0, onSite: 0, remote: 0, activeGeofences: 0 });
      }
    } catch (err) {
      console.error("GPS feed error:", err);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadFeed();

    const handleAttendanceChange = () => {
      loadFeed();
    };
    window.addEventListener('attendance-updated', handleAttendanceChange);
    return () => window.removeEventListener('attendance-updated', handleAttendanceChange);
  }, [loadFeed]);

  // (activeTab switch no longer requires invalidateSize — react-map-gl handles this)



  const onSitePct = kpis.totalCheckins > 0
    ? ((kpis.onSite / kpis.totalCheckins) * 100).toFixed(1)
    : 0;

  const { canCreate } = usePermissions();
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'SUPERADMIN'].includes(userRole);
  const canPunch = isAdmin || (canCreate && canCreate('attendance', 'gps_attendance'));

  return (
    <div className="hrms-content">
      {/* Header */}
      <div className="hrms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>GPS Location & Geofencing Attendance</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {canPunch && (
            <button
              className="hrms-primary-btn"
              onClick={() => setShowPunchModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563EB' }}
            >
              <Navigation size={16} /> Punch Attendance
            </button>
          )}
          <button
            className="hrms-secondary-btn"
            onClick={loadFeed}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('gps')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'gps' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'gps' ? '#2563eb' : '#64748b', fontWeight: activeTab === 'gps' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}
        >
          Geofence GPS Attendance
        </button>
        <button
          onClick={() => setActiveTab('client')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'client' ? '2px solid #10B981' : '2px solid transparent', color: activeTab === 'client' ? '#10B981' : '#64748b', fontWeight: activeTab === 'client' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}
        >
          Client Visits & Live Tracking
        </button>
      </div>

      <div style={{ display: activeTab === 'gps' ? 'block' : 'none' }}>
        {/* Date Filter & Control Bar */}
        <div className="hrms-card hrms-mb-6" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px' }}>
              <CalendarIcon size={16} color="#64748B" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px' }}>
              <MapPin size={16} color="#64748B" />
              <AppDropdown options={[{ value: 'ALL', label: 'All Geofences' }, ...(geofences || [])]} size="sm" />
            </div>
          </div>

          <button className="hrms-secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="hrms-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Total Check-ins</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#2563EB', margin: '8px 0 0' }}>{kpis.totalCheckins}</h2>
          </div>
          <div className="hrms-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>On-Site Check-ins</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', margin: '8px 0 0' }}>{kpis.onSite}</h2>
          </div>
          <div className="hrms-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Remote Check-ins</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B', margin: '8px 0 0' }}>{kpis.remote}</h2>
          </div>
          <div className="hrms-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Active Geofence Locations</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#8B5CF6', margin: '8px 0 0' }}>{kpis.activeGeofences || geofences.length}</h2>
          </div>
        </div>

        {/* Main Grid: Interactive Map + Right Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Interactive Map */}
          <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Interactive Geofence Map</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Live monitoring powered by MapLibre GL — smooth, hardware-accelerated</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.25)', border: '2px solid #10b981', display: 'inline-block' }} /> On-Site (Inside Geofence)
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.25)', border: '2px solid #f59e0b', display: 'inline-block' }} /> Remote (Outside Geofence)
                </span>
              </div>
            </div>

            <div style={{ height: '380px', position: 'relative' }}>
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={MAP_STYLE}
                style={{ width: '100%', height: '100%' }}
              >
                <AutoFitBounds geofences={geofences} records={records} />

                {/* Geofence Circle Polygons */}
                {geofenceCircles.features.length > 0 && (
                  <Source type="geojson" data={geofenceCircles}>
                    <Layer id="geofence-fill" type="fill" paint={{ 'fill-color': '#3B82F6', 'fill-opacity': 0.15 }} />
                    <Layer id="geofence-outline" type="line" paint={{ 'line-color': '#2563EB', 'line-width': 2 }} />
                  </Source>
                )}

                {/* Geofence Center Markers */}
                {geofences.filter(gf => gf.lat && gf.lng).map(gf => (
                  <Marker key={`gf-${gf.id}`} longitude={gf.lng} latitude={gf.lat} anchor="center">
                    <div title={`${gf.name} (r=${gf.radius}m)`} style={{ width: '14px', height: '14px', backgroundColor: '#2563EB', border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(37,99,235,0.5)', cursor: 'pointer' }} />
                  </Marker>
                ))}

                {/* Employee Markers */}
                {records.filter(r => r.lat && r.lng).map((r, i) => {
                  const isInside = r.status === 'On-Site';
                  const color = isInside ? '#10B981' : '#F59E0B';
                  return (
                    <Marker key={`emp-${i}`} longitude={r.lng} latitude={r.lat} anchor="center">
                      <div
                        title={`${r.name} — ${r.status}`}
                        onClick={() => setPopupInfo(r)}
                        style={{ width: '18px', height: '18px', backgroundColor: color, border: '3px solid #fff', borderRadius: '50%', boxShadow: `0 3px 10px ${color}60`, cursor: 'pointer', transition: 'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </Marker>
                  );
                })}

                {/* Popup on marker click */}
                {popupInfo && (
                  <Marker longitude={popupInfo.lng} latitude={popupInfo.lat} anchor="bottom">
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px', minWidth: '160px', position: 'relative' }}>
                      <button onClick={() => setPopupInfo(null)} style={{ position: 'absolute', top: '6px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#94A3B8' }}>✕</button>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', marginBottom: '4px' }}>{popupInfo.name}</div>
                      <div style={{ color: '#475569' }}>{popupInfo.location || 'Logged Location'}</div>
                      <div style={{ color: '#475569' }}>Time: {popupInfo.checkIn || popupInfo.checkOut || '—'}</div>
                      <span style={{ display: 'inline-block', marginTop: '6px', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', background: popupInfo.status === 'On-Site' ? '#D1FAE5' : '#FEF3C7', color: popupInfo.status === 'On-Site' ? '#065F46' : '#92400E' }}>
                        {popupInfo.status || 'On-Site'} ({popupInfo.distance || 0}m from office)
                      </span>
                    </div>
                  </Marker>
                )}
              </Map>
            </div>
          </div>

          {/* Right Side Stats Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Location Distribution */}
            <div className="hrms-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Location Distribution</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', position: 'relative' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '12px solid #10B981', borderTopColor: '#F59E0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{kpis.totalCheckins}</span>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Active</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> On-Site
                  </span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{kpis.onSite} ({onSitePct}%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> Remote
                  </span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{kpis.remote} ({(100 - onSitePct).toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Active Geofenced Zones list */}
            <div className="hrms-card" style={{ padding: '20px', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>Active Geofenced Zones</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '200px' }}>
                {geofences.map(gf => (
                  <div key={gf.id} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{gf.name} <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 600 }}>r = {gf.radius}m</span></div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>Lat/Lng: {gf.lat?.toFixed(4)}°, {gf.lng?.toFixed(4)}°</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>0 Checked-in</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live GPS Attendance Feed Table */}
        <div className="hrms-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Live GPS Attendance Feed</h3>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{records.length} records today</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Loading GPS logs...</div>
            ) : records.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No GPS attendance records found for {selectedDate}.
              </div>
            ) : (
              <table className="hrms-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check IN</th>
                    <th>Check OUT</th>
                    <th>Working Hours</th>
                    <th>Location / Coordinates</th>
                    <th>Geofence Status</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <EmployeeAvatar name={r.name} photoUrl={r.avatar} size={32} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{r.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{r.dept}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                        {r.checkIn || '—'}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 700, color: r.checkOut && r.checkOut !== '--' ? '#2563EB' : '#94A3B8' }}>
                        {r.checkOut || '--'}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        {r.workingHours || '--'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>
                        <div style={{ fontWeight: 600 }}>{r.location || 'HQ Location'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}</div>
                      </td>
                      <td>
                        <span className={`hrms-badge ${r.status === 'On-Site' ? 'hrms-badge-active' : 'hrms-badge-warning'}`}>
                          {r.status || 'On-Site'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> GPS Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: activeTab === 'client' ? 'block' : 'none' }}>
        <ClientVisits />
      </div>

      {/* Punch Attendance Modal */}
      {showPunchModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 460,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', flexShrink: 0
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>GPS Mobile Punch</h3>
              <button onClick={() => setShowPunchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <GeoPunch />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
