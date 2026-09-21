import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { 
  Users, 
  Building2, 
  Briefcase,
  ExternalLink
} from 'lucide-react';

const OrgNode = ({ node }) => {
  const navigate = useNavigate();
  if (!node) return null;

  const handleCardClick = () => {
    if (node.id) {
      localStorage.setItem('selectedEmployeeId', node.id);
      navigate('/employees/profile');
    }
  };

  const getAvatarUrl = () => {
    if (node.image) return node.image;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name || 'User')}&background=2952E3&color=ffffff&bold=true&size=150`;
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={handleCardClick}
        title={`Click to view ${node.name}'s Profile`}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-[280px] flex flex-col items-center relative z-10 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-sm mb-3 relative">
          <img 
            src={getAvatarUrl()} 
            alt={node.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name || 'User')}&background=2952E3&color=ffffff&bold=true&size=150`;
            }}
          />
        </div>
        <h3 className="text-[#0A1629] font-bold text-base mb-1 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
          {node.name}
          <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
        </h3>
        <p className="text-blue-600 font-medium text-[13px] mb-2">{node.title || 'Team Member'}</p>
        <div className="bg-slate-50 px-3 py-1.5 rounded-full text-slate-600 text-xs font-semibold flex items-center gap-1.5 border border-slate-100">
          <Briefcase size={12} />
          {node.department || 'General'}
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="relative flex flex-col items-center mt-6">
          {/* Vertical line down from parent */}
          <div className="absolute -top-6 w-px h-6 bg-slate-300"></div>
          
          <div className="flex relative pt-6">
            {node.children.map((child, index) => (
              <div key={child.id || index} className="relative flex flex-col items-center px-4">
                {/* Horizontal lines connecting children */}
                {index > 0 && (
                  <div className="absolute -top-6 right-1/2 w-1/2 h-px bg-slate-300"></div>
                )}
                {index < node.children.length - 1 && (
                  <div className="absolute -top-6 left-1/2 w-1/2 h-px bg-slate-300"></div>
                )}
                
                {/* Vertical line up from child */}
                <div className="absolute -top-6 w-px h-6 bg-slate-300"></div>
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganizationChart = () => {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/organization/org-chart')
      .then(data => {
        if (data) setOrgData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load org chart:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1629]">Organization Chart</h1>
          <p className="text-sm text-slate-500 mt-1">Hierarchical view of company structure. Click any profile card to view full employee details.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-slate-600">Executive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-slate-600">Management</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-sm font-medium text-slate-600">Staff</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 overflow-x-auto min-h-[600px]">
        <div className="inline-flex min-w-full justify-center py-8">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading organization chart...</div>
          ) : (
            <OrgNode node={orgData} />
          )}
        </div>
      </div>
    </div>
  );
};
