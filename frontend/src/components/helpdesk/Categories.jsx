import React, { useState, useEffect } from 'react';
import AppDropdown from '../ui/AppDropdown';
import { useToast } from '../ui/Toast';
import { apiFetch } from '../../lib/api';
import { canCreate, canEdit, canDelete } from '../../lib/permissions';
import { Search, Plus, Edit2, Trash2, X, Loader2, FolderTree, RefreshCw } from 'lucide-react';

export function Categories() {
  const { addToast } = useToast();
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    status: 'Active'
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/tickets/categories');
      if (Array.isArray(data)) {
        setCategoryList(data);
      }
    } catch (err) {
      console.error("Failed to load helpdesk categories:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch('/tickets/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.categoryName.trim(),
          description: formData.description,
          status: formData.status
        })
      });
      await fetchCategories();
      setShowAddModal(false);
      setFormData({ categoryName: '', description: '', status: 'Active' });
      addToast('Category created successfully!', 'success');
    } catch (err) {
      addToast(err.message || "Failed to create category", 'error');
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCategory || !formData.categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/tickets/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.categoryName.trim(),
          description: formData.description,
          status: formData.status
        })
      });
      await fetchCategories();
      setEditingCategory(null);
      setFormData({ categoryName: '', description: '', status: 'Active' });
      addToast('Category updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || "Failed to update category", 'error');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await apiFetch(`/tickets/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
      addToast('Category deleted successfully', 'success');
    } catch (err) {
      addToast(err.message || "Failed to delete category", 'error');
    }
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      categoryName: cat.name || '',
      description: cat.desc || cat.description || '',
      status: cat.status || 'Active'
    });
  };

  const filteredCategories = categoryList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.desc && c.desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", width: '100%', boxSizing: 'border-box', background: '#F8FAFC', minHeight: '100vh', padding: 0 }}>
      
      {/* ── HEADER & TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Categories</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Manage ticket categories and view live ticket distributions</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search categories..."
              style={{
                height: 38, paddingLeft: 34, paddingRight: 14,
                background: '#FFF', border: '1px solid #E5E7EB',
                borderRadius: 8, fontSize: 13, color: '#111827',
                outline: 'none', width: 220,
              }}
            />
          </div>

          <button
            onClick={fetchCategories}
            title="Refresh"
            style={{
              height: 38, padding: '0 12px', background: '#FFF', border: '1px solid #E5E7EB',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Primary Action Button */}
          {canCreate('helpdesk', 'helpdesk_categories') && (
            <button 
              onClick={() => {
                setFormData({ categoryName: '', description: '', status: 'Active' });
                setShowAddModal(true);
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px',
                background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              }}
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN DATA TABLE: Categories ── */}
      <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['Category Name', 'Description', 'Total Tickets', 'Open', 'In Progress', 'Resolved', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                    <Loader2 className="animate-spin inline-block mr-2" size={18} /> Loading categories...
                  </td>
                </tr>
              ) : paginatedCategories.length > 0 ? (
                paginatedCategories.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', height: 48 }}>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FolderTree size={16} color="#2563EB" />
                        {r.name}
                      </div>
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#6B7280' }}>{r.desc}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>{r.total}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#EF4444', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.open || 0}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#F59E0B', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.in_progress || 0}</td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: '#10B981', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.resolved || 0}</td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: r.status === 'Active' ? '#ECFDF5' : '#F1F5F9',
                        color: r.status === 'Active' ? '#059669' : '#64748B',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, color: '#6B7280' }}>
                        {canEdit('helpdesk', 'helpdesk_categories') && (
                          <button 
                            onClick={() => openEditModal(r)}
                            title="Edit Category"
                            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 4 }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete('helpdesk', 'helpdesk_categories') && (
                          <button 
                            onClick={() => handleDelete(r.id, r.name)}
                            title="Delete Category"
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Showing {filteredCategories.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} entries
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    background: page === currentPage ? '#2563EB' : '#FFF',
                    color: page === currentPage ? '#FFF' : '#374151',
                    fontSize: 12, fontWeight: page === currentPage ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT CATEGORY MODAL ── */}
      {(showAddModal || editingCategory) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '620px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '22px',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            {/* Header */}
            <div style={{
              position: 'relative',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flex: 1, marginRight: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0
                }}>
                  <FolderTree size={22} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    {editingCategory ? 'Edit Help Desk Category' : 'Add Help Desk Category'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Configure ticket routing category for Help Desk support team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingCategory(null); }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  placeContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  lineHeight: 0,
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={16} color="#FFFFFF" style={{ display: 'block', margin: 'auto' }} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={editingCategory ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                
                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Category Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.categoryName} 
                    onChange={e => setFormData({ ...formData, categoryName: e.target.value })} 
                    placeholder="e.g. IT Hardware & Network Support" 
                    className="hrms-input"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      padding: '0 14px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Description
                  </label>
                  <textarea 
                    rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Brief summary of requests routed to this category..." 
                    className="hrms-input"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="hrms-input-group">
                  <label className="hrms-label" style={{ fontWeight: '600', color: '#334155', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    Status
                  </label>
                  <AppDropdown
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                    size="md"
                  />
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 28px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingCategory(null); }}
                  className="hrms-secondary-btn"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: '600',
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
                    color: '#475569',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hrms-btn-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '9px 24px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                    color: '#FFF',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Categories;
