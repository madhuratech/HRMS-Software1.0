import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';
import { hasPermission as globalHasPermission } from '../../lib/permissions';

export function PermissionGuard({ moduleKey, module, submoduleKey = null, action = 'view', inline = false, fallback = null, children }) {
  const navigate = useNavigate();
  const { userRole, permissions, loadingPermissions, hasPermission } = usePermissions();

  const modName = module || moduleKey;

  const normRole = String(userRole || '').toUpperCase().replace(/_/g, ' ');
  const isAdmin = normRole === 'SUPER ADMIN' || normRole === 'SUPERADMIN' || normRole === 'ADMIN';

  if (loadingPermissions) {
    if (inline) return null;
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-slate-500">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span>Verifying access permissions...</span>
      </div>
    );
  }

  const allowed = isAdmin || 
    (hasPermission && hasPermission(modName, submoduleKey, action)) ||
    globalHasPermission(permissions, userRole, modName, submoduleKey, action) ||
    globalHasPermission(modName, submoduleKey, action);

  if (!allowed) {
    if (inline || fallback !== null) {
      return fallback;
    }
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You do not have permission to access {submoduleKey || modName} ({action.toUpperCase()}). Please contact your administrator.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/20"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
