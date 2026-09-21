import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { apiFetch } from '../../lib/api';
import { Package, Truck, Clock, Box, Plus, Settings, X } from 'lucide-react';
import { hasPermission } from '../../lib/permissions';

const kpiData = [
  { title: 'Total Kits', value: '45', icon: <Package size={20} color="#2952E3" />, bgColor: '#EFF6FF' },
  { title: 'Distributed This Month', value: '30', icon: <Truck size={20} color="#10B981" />, bgColor: '#ECFDF5' },
  { title: 'Pending Kits', value: '15', icon: <Clock size={20} color="#F59E0B" />, bgColor: '#FFFBEB' },
  { title: 'Kit Items', value: '8', icon: <Box size={20} color="#8B5CF6" />, bgColor: '#F5F3FF' },
];

const kitItemsData = [
  { name: 'Welcome Letter', quantity: 1 },
  { name: 'Company Handbook', quantity: 1 },
  { name: 'ID Card', quantity: 1 },
  { name: 'Pen', quantity: 1 },
  { name: 'Notebook', quantity: 1 },
  { name: 'Water Bottle', quantity: 1 },
  { name: 'T-Shirt', quantity: 1 },
  { name: 'Swag Pack', quantity: 1 },
];

export default function WelcomeKit() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [distributionList, setDistributionList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/tickets/welcome-kits')
      .then(data => {
        if (Array.isArray(data)) {
          setDistributionList(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load welcome kits:", err);
        setLoading(false);
      });
  }, []);
  const [formData, setFormData] = useState({
    employee: '',
    department: '',
    kitName: 'Standard Executive Welcome Kit',
    status: 'Dispatched',
    dispatchDate: '',
    notes: ''
  });

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.employee) return;
    const newItem = {
      id: 'EMP00' + (distributionList.length + 1),
      name: formData.employee,
      dept: formData.department || 'Engineering',
      date: formData.dispatchDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setDistributionList([newItem, ...distributionList]);
    setShowAddModal(false);
    setFormData({ employee: '', department: '', kitName: 'Standard Executive Welcome Kit', status: 'Dispatched', dispatchDate: '', notes: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif', paddingBottom: '24px' }}>
      
      {/* Manage Welcome Kit Modal (1100px Standard) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '1100px', maxWidth: '90vw', maxHeight: '90vh', background: 'white', borderRadius: '16px', zIndex: 1001, display: 'flex', flexDirection: 'column' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Manage Welcome Kit Allocation</h2>
                <p className="text-sm text-slate-500 mt-1">Assign and record welcome kit distribution for new joiners.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Employee Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })} placeholder="e.g. Rahul Sharma" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <AppDropdown
                value={formData.department}
                onChange={v => setFormData({ ...formData, department: v })}
                options={[{value:'',label:'Select Department'},{value:'Engineering',label:'Engineering'},{value:'Human Resources',label:'Human Resources'},{value:'Design',label:'Design'},{value:'Finance',label:'Finance'},{value:'Marketing',label:'Marketing'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Welcome Kit Bundle <span className="text-red-500">*</span></label>
                  <AppDropdown
                value={formData.kitName}
                onChange={v => setFormData({ ...formData, kitName: v })}
                options={[{value:'Standard Executive Welcome Kit',label:'Standard Executive Welcome Kit'},{value:'Engineering Swag & Tech Kit',label:'Engineering Swag & Tech Kit'},{value:'Leadership Onboarding Kit',label:'Leadership Onboarding Kit'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Dispatch Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.dispatchDate} onChange={e => setFormData({ ...formData, dispatchDate: e.target.value })} className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                value={formData.status}
                onChange={v => setFormData({ ...formData, status: v })}
                options={[{value:'Dispatched',label:'Dispatched'},{value:'Delivered',label:'Delivered'},{value:'Pending',label:'Pending'}]}
                size="sm"
              />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes / Tracking Number</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Courier tracking ID, shirt size, special items included..." style={{ height: '80px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md">Save Kit Allocation</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>Welcome Kit</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Manage welcome kits for new employees</p>
        </div>
        <div>
          {hasPermission('onboarding', 'welcome_kit', 'create') && (
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2952E3', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <Plus size={18} /> Manage Kit
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {kpiData.map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginBottom: '4px' }}>{kpi.title}</div>
              <div style={{ fontSize: '24px', color: '#1E293B', fontWeight: '700' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout (3 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Kit Items */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Kit Items</h3>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginBottom: '16px' }}>
              <span>Item Name</span>
              <span>Quantity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kitItemsData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ color: '#334155', fontWeight: '500' }}>{item.name}</span>
                  <span style={{ color: '#475569' }}>{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Welcome Kit Preview */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Welcome Kit Preview</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><Settings size={18} /></button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '12px', padding: '24px' }}>
            {/* Minimalist graphical representation of a welcome box */}
            <div style={{ position: 'relative', width: '260px', height: '220px', background: '#2952E3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', fontWeight: '700', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2), 0 20px 40px rgba(41, 82, 227, 0.3)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: '#1E3A8A', borderRadius: '8px 8px 0 0', opacity: 0.5 }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome</div>
                <div style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Aboard!</div>
              </div>
              {/* Fake items spilling out */}
              <div style={{ position: 'absolute', bottom: '20px', left: '-20px', width: '60px', height: '80px', background: '#FFF', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'rotate(-15deg)' }}></div>
              <div style={{ position: 'absolute', bottom: '10px', right: '-10px', width: '40px', height: '100px', background: '#FFF', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'rotate(10deg)' }}></div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Distributions */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Recent Distributions</h3>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginBottom: '16px' }}>
              <span>Employee</span>
              <span>Distributed On</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {distributionList.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                      {row.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{row.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{row.dept}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{row.date}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button style={{ background: 'none', border: 'none', color: '#2952E3', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
        </div>

      </div>

    </div>
  );
}
