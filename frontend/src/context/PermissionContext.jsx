import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { hasPermission as checkHasPermission, normalizeBoolean } from '../lib/permissions';

const PermissionContext = createContext({
  permissions: null,
  userRole: 'EMPLOYEE',
  loadingPermissions: true,
  refreshPermissions: async () => {},
  hasPermission: () => false,
  canView: () => false,
  canCreate: () => false,
  canEdit: () => false,
  canUpdate: () => false,
  canDelete: () => false,
  canSeeModule: () => false,
});

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem('hrms_permissions');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    try {
      const auth = localStorage.getItem('hrms_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.role || (parsed.user && parsed.user.role) || 'EMPLOYEE';
      }
      return localStorage.getItem('userRole') || 'EMPLOYEE';
    } catch (e) {
      return 'EMPLOYEE';
    }
  });

  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const refreshPermissions = useCallback(async (roleOverride = null) => {
    try {
      let roleToUse = roleOverride;
      if (!roleToUse) {
        const auth = localStorage.getItem('hrms_auth');
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            roleToUse = parsed.role || (parsed.user && parsed.user.role);
          } catch (e) { }
        }
      }
      if (!roleToUse) roleToUse = localStorage.getItem('userRole') || 'EMPLOYEE';

      setUserRole(roleToUse);

      console.log('[PermissionContext] Fetching fresh permissions for role:', roleToUse);
      const res = await apiFetch(`/rbac/user-permissions?role=${encodeURIComponent(roleToUse)}`, {
        headers: { 'x-user-role': roleToUse }
      });

      if (res && res.success && (res.permissions || res.data)) {
        const freshPerms = res.permissions || res.data;
        setPermissions(freshPerms);
        localStorage.setItem('hrms_permissions', JSON.stringify(freshPerms));
        console.log('[PermissionContext] Fresh permissions synced to state & localStorage OK:', Object.keys(freshPerms).length, 'keys');
      }
    } catch (err) {
      console.error('[PermissionContext] Failed to fetch permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();

    const handlePermissionsUpdated = (e) => {
      console.log('[PermissionContext] permissionsUpdated event triggered, payload:', e.detail);
      if (e.detail && e.detail.permissions) {
        setPermissions(e.detail.permissions);
        if (e.detail.roleKey) setUserRole(e.detail.roleKey);
        setLoadingPermissions(false);
      } else if (e.detail && e.detail.roleKey) {
        refreshPermissions(e.detail.roleKey);
      } else {
        const storedAuth = localStorage.getItem('hrms_auth');
        if (!storedAuth) {
          setPermissions(null);
          setUserRole('EMPLOYEE');
          setLoadingPermissions(false);
        } else {
          refreshPermissions();
        }
      }
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'hrms_permissions' || e.key === 'hrms_auth' || e.key === 'userRole') {
        refreshPermissions();
      }
    });

    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdated);
    };
  }, [refreshPermissions]);

  const hasPerm = useCallback((...args) => {
    return checkHasPermission(permissions, userRole, ...args);
  }, [permissions, userRole]);

  const viewPerm = useCallback((...args) => {
    if (args.length === 1) return hasPerm(args[0], 'view');
    return hasPerm(args[0], args[1], 'view');
  }, [hasPerm]);

  const createPerm = useCallback((...args) => {
    if (args.length === 1) return hasPerm(args[0], 'create');
    return hasPerm(args[0], args[1], 'create');
  }, [hasPerm]);

  const editPerm = useCallback((...args) => {
    if (args.length === 1) return hasPerm(args[0], 'edit');
    return hasPerm(args[0], args[1], 'edit');
  }, [hasPerm]);

  const deletePerm = useCallback((...args) => {
    if (args.length === 1) return hasPerm(args[0], 'delete');
    return hasPerm(args[0], args[1], 'delete');
  }, [hasPerm]);

  const updatePerm = useCallback((...args) => {
    return editPerm(...args);
  }, [editPerm]);

  const seeModulePerm = useCallback((...args) => {
    return viewPerm(...args) || createPerm(...args) || editPerm(...args) || deletePerm(...args);
  }, [viewPerm, createPerm, editPerm, deletePerm]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        userRole,
        loadingPermissions,
        refreshPermissions,
        hasPermission: hasPerm,
        canView: viewPerm,
        canCreate: createPerm,
        canEdit: editPerm,
        canUpdate: updatePerm,
        canDelete: deletePerm,
        canSeeModule: seeModulePerm,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionContext);
}
