import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { Search, Plus, Eye, Edit2, Trash2, ChevronDown, X } from 'lucide-react';

const KB_CATS = [
  { id: 'all',        label: 'All Articles',       count: 126 },
  { id: 'it',         label: 'IT Support',         count: 45 },
  { id: 'hr',         label: 'HR Support',         count: 28 },
  { id: 'payroll',    label: 'Payroll',            count: 18 },
  { id: 'leave',      label: 'Leave & Attendance', count: 15 },
  { id: 'training',   label: 'Training',           count: 12 },
  { id: 'assets',     label: 'Assets',             count: 6 },
  { id: 'others',     label: 'Others',             count: 4 },
];

export function KnowledgeBase() {
  const { addToast } = useToast();
  const [selectedCat, setSelectedCat] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [articlesList, setArticlesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/tickets/kb/articles')
      .then(data => {
        if (Array.isArray(data)) {
          setArticlesList(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load KB articles:", err);
        setLoading(false);
      });
  }, []);
  const [formData, setFormData] = useState({
    articleTitle: '',
    category: '',
    keywords: '',
    content: '',
    attachment: null,
    status: 'Published'
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.articleTitle || !formData.category) return;
    const newItem = {
      title: formData.articleTitle,
      cat: formData.category,
      views: '0',
      status: formData.status,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setArticlesList([newItem, ...articlesList]);
    setShowAddModal(false);
    setFormData({ articleTitle: '', category: '', keywords: '', content: '', attachment: null, status: 'Published' });
    addToast('Article published to Knowledge Base!', 'success');
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Knowledge Base</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage knowledge base articles</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search articles..."
              style={{
                height: 38, paddingLeft: 34, paddingRight: 14,
                background: '#FFF', border: '1px solid #E5E7EB',
                borderRadius: 8, fontSize: 13, color: '#111827',
                outline: 'none', width: 220,
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ position: 'relative' }}>
            <AppDropdown options={[{value:'All Categories',label:'All Categories'},{value:'IT Support',label:'IT Support'},{value:'HR Support',label:'HR Support'},{value:'Payroll',label:'Payroll'}]} size="sm" />
            <ChevronDown size={13} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Primary Action Button */}
          <button onClick={() => setShowAddModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
            background: '#2952E3', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(41,82,227,0.25)',
          }}>
            <Plus size={16} /> Add Article
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT: LEFT SIDEBAR + CENTER DATA TABLE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Left Panel: Categories Sidebar */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: 16, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {KB_CATS.map((c) => {
              const isActive = selectedCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 500,
                    background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#2563EB' : '#4B5563',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  <span>{c.label}</span>
                  <span style={{ fontSize: 11, background: isActive ? '#DBEAFE' : '#F3F4F6', color: isActive ? '#2563EB' : '#6B7280', padding: '2px 6px', borderRadius: 10 }}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Main Table: Articles */}
        <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  {['Article Title', 'Category', 'Views', 'Status', 'Updated On', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articlesList.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.title}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#2563EB', whiteSpace: 'nowrap' }}>{r.cat}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.views}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Published' ? '#ECFDF5' : '#FEF3C7',
                        color: r.status === 'Published' ? '#059669' : '#D97706',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, color: '#6B7280' }}>
                        <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}><Eye size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}><Edit2 size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Showing 1 to 7 of 126 entries</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5, '...', 19].map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  style={{
                    minWidth: 28, height: 28, padding: '0 6px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: currentPage === page ? '#2563EB' : '#F3F4F6',
                    color: currentPage === page ? '#FFF' : '#374151',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add Knowledge Base Article Modal (1100px Standard) */}
      {showAddModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)} />
          <div className="modal-centered-content" style={{ width: '1100px', maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0A1629]">Add Knowledge Base Article</h2>
                <p className="text-sm text-slate-500 mt-1">Publish self-service troubleshooting guides and standard procedures.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Article Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.articleTitle} onChange={e => setFormData({ ...formData, articleTitle: e.target.value })} placeholder="e.g. How to reset domain password" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <AppDropdown
                value={formData.category}
                onChange={v => setFormData({ ...formData, category: v })}
                options={[{value:'',label:'Select Article Category'},{value:'IT Support',label:'IT Support'},{value:'HR Support',label:'HR Support'},{value:'Payroll',label:'Payroll'},{value:'Leave & Attendance',label:'Leave & Attendance'},{value:'Training',label:'Training'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Keywords / Tags <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} placeholder="e.g. password, reset, login, active directory" className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <AppDropdown
                value={formData.status}
                onChange={v => setFormData({ ...formData, status: v })}
                options={[{value:'Published',label:'Published'},{value:'Draft',label:'Draft'},{value:'Archived',label:'Archived'}]}
                size="sm"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Attachment</label>
                  <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Article Content <span className="text-red-500">*</span></label>
                  <textarea required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Write step-by-step instructions and guide content..." style={{ height: '110px' }} className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 h-12 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-8 h-12 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-md">Publish Article</button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}

export default KnowledgeBase;

