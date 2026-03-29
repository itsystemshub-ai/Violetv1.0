import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  canAccessModule,
  getAccessibleModules,
  MODULE_PERMISSIONS,
} from '../permissions';
import { User, Permission } from '@/lib';

describe('permissions', () => {
  // Mock users
  const superAdmin: User = {
    id: '1',
    username: 'superadmin',
    email: 'super@example.com',
    role: 'super_admin',
    isSuperAdmin: true,
    permissions: [],
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser: User = {
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    isSuperAdmin: false,
    permissions: [
      'view:dashboard',
      'view:finance',
      'finance:read',
      'finance:write',
      'view:inventory',
      'inventory:read',
    ] as Permission[],
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularUser: User = {
    id: '3',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    isSuperAdmin: false,
    permissions: [
      'view:dashboard',
      'view:sales',
      'sales:read',
    ] as Permission[],
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const limitedUser: User = {
    id: '4',
    username: 'limited',
    email: 'limited@example.com',
    role: 'viewer',
    isSuperAdmin: false,
    permissions: ['view:dashboard'] as Permission[],
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hasPermission', () => {
    it('should return true for super admin with any permission', () => {
      expect(hasPermission(superAdmin, 'view:dashboard')).toBe(true);
      expect(hasPermission(superAdmin, 'finance:write')).toBe(true);
      expect(hasPermission(superAdmin, 'settings:delete' as Permission)).toBe(true);
    });

    it('should return true when user has the permission', () => {
      expect(hasPermission(adminUser, 'view:finance')).toBe(true);
      expect(hasPermission(adminUser, 'finance:read')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      expect(hasPermission(regularUser, 'finance:write')).toBe(false);
      expect(hasPermission(limitedUser, 'sales:read')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'view:dashboard')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(hasPermission(adminUser, 'view:finance')).toBe(true);
      expect(hasPermission(adminUser, 'VIEW:FINANCE' as Permission)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true for super admin', () => {
      expect(hasAnyPermission(superAdmin, ['finance:write', 'sales:write'])).toBe(true);
    });

    it('should return true when user has at least one permission', () => {
      expect(hasAnyPermission(adminUser, ['finance:read', 'sales:write'])).toBe(true);
      expect(hasAnyPermission(regularUser, ['sales:read', 'finance:write'])).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      expect(hasAnyPermission(limitedUser, ['finance:read', 'sales:write'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAnyPermission(null, ['view:dashboard'])).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      expect(hasAnyPermission(adminUser, [])).toBe(false);
    });

    it('should handle single permission in array', () => {
      expect(hasAnyPermission(adminUser, ['finance:read'])).toBe(true);
      expect(hasAnyPermission(limitedUser, ['finance:read'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true for super admin', () => {
      expect(hasAllPermissions(superAdmin, ['finance:write', 'sales:write'])).toBe(true);
    });

    it('should return true when user has all permissions', () => {
      expect(hasAllPermissions(adminUser, ['view:finance', 'finance:read'])).toBe(true);
    });

    it('should return false when user is missing at least one permission', () => {
      expect(hasAllPermissions(adminUser, ['finance:read', 'sales:write'])).toBe(false);
      expect(hasAllPermissions(regularUser, ['sales:read', 'finance:read'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAllPermissions(null, ['view:dashboard'])).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      expect(hasAllPermissions(adminUser, [])).toBe(true);
    });

    it('should handle single permission in array', () => {
      expect(hasAllPermissions(adminUser, ['finance:read'])).toBe(true);
      expect(hasAllPermissions(limitedUser, ['finance:read'])).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      expect(hasRole(superAdmin, 'super_admin')).toBe(true);
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(regularUser, 'user')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(hasRole(adminUser, 'super_admin')).toBe(false);
      expect(hasRole(regularUser, 'admin')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(adminUser, 'Admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has at least one role', () => {
      expect(hasAnyRole(adminUser, ['admin', 'super_admin'])).toBe(true);
      expect(hasAnyRole(regularUser, ['user', 'admin'])).toBe(true);
    });

    it('should return false when user has none of the roles', () => {
      expect(hasAnyRole(regularUser, ['admin', 'super_admin'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAnyRole(null, ['admin'])).toBe(false);
    });

    it('should return false for empty roles array', () => {
      expect(hasAnyRole(adminUser, [])).toBe(false);
    });

    it('should handle single role in array', () => {
      expect(hasAnyRole(adminUser, ['admin'])).toBe(true);
      expect(hasAnyRole(regularUser, ['admin'])).toBe(false);
    });
  });

  describe('MODULE_PERMISSIONS', () => {
    it('should have permissions defined for all modules', () => {
      expect(MODULE_PERMISSIONS.dashboard).toBeDefined();
      expect(MODULE_PERMISSIONS.finance).toBeDefined();
      expect(MODULE_PERMISSIONS.inventory).toBeDefined();
      expect(MODULE_PERMISSIONS.sales).toBeDefined();
      expect(MODULE_PERMISSIONS.purchases).toBeDefined();
      expect(MODULE_PERMISSIONS.hr).toBeDefined();
      expect(MODULE_PERMISSIONS.settings).toBeDefined();
    });

    it('should have at least one permission per module', () => {
      Object.values(MODULE_PERMISSIONS).forEach(permissions => {
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it('should have view permission for each module', () => {
      expect(MODULE_PERMISSIONS.dashboard).toContain('view:dashboard');
      expect(MODULE_PERMISSIONS.finance).toContain('view:finance');
      expect(MODULE_PERMISSIONS.inventory).toContain('view:inventory');
      expect(MODULE_PERMISSIONS.sales).toContain('view:sales');
      expect(MODULE_PERMISSIONS.purchases).toContain('view:purchases');
      expect(MODULE_PERMISSIONS.hr).toContain('view:hr');
      expect(MODULE_PERMISSIONS.settings).toContain('view:settings');
    });
  });

  describe('canAccessModule', () => {
    it('should return true for super admin on any module', () => {
      expect(canAccessModule(superAdmin, 'dashboard')).toBe(true);
      expect(canAccessModule(superAdmin, 'finance')).toBe(true);
      expect(canAccessModule(superAdmin, 'inventory')).toBe(true);
    });

    it('should return true when user has required permissions', () => {
      expect(canAccessModule(adminUser, 'finance')).toBe(true);
      expect(canAccessModule(adminUser, 'inventory')).toBe(true);
      expect(canAccessModule(regularUser, 'sales')).toBe(true);
    });

    it('should return false when user lacks required permissions', () => {
      expect(canAccessModule(regularUser, 'finance')).toBe(false);
      expect(canAccessModule(limitedUser, 'sales')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canAccessModule(null, 'dashboard')).toBe(false);
    });

    it('should return false for non-existent module', () => {
      expect(canAccessModule(adminUser, 'nonexistent' as any)).toBe(false);
    });

    it('should allow access with any of the required permissions', () => {
      // adminUser has 'view:finance' and 'finance:read'
      expect(canAccessModule(adminUser, 'finance')).toBe(true);
    });
  });

  describe('getAccessibleModules', () => {
    it('should return all modules for super admin', () => {
      const modules = getAccessibleModules(superAdmin);
      expect(modules).toContain('dashboard');
      expect(modules).toContain('finance');
      expect(modules).toContain('inventory');
      expect(modules).toContain('sales');
      expect(modules).toContain('purchases');
      expect(modules).toContain('hr');
      expect(modules).toContain('settings');
      expect(modules.length).toBe(Object.keys(MODULE_PERMISSIONS).length);
    });

    it('should return only accessible modules for admin user', () => {
      const modules = getAccessibleModules(adminUser);
      expect(modules).toContain('dashboard');
      expect(modules).toContain('finance');
      expect(modules).toContain('inventory');
      expect(modules).not.toContain('sales');
      expect(modules).not.toContain('purchases');
    });

    it('should return only accessible modules for regular user', () => {
      const modules = getAccessibleModules(regularUser);
      expect(modules).toContain('dashboard');
      expect(modules).toContain('sales');
      expect(modules).not.toContain('finance');
      expect(modules).not.toContain('inventory');
    });

    it('should return only dashboard for limited user', () => {
      const modules = getAccessibleModules(limitedUser);
      expect(modules).toContain('dashboard');
      expect(modules.length).toBe(1);
    });

    it('should return empty array for null user', () => {
      const modules = getAccessibleModules(null);
      expect(modules).toEqual([]);
    });

    it('should not return duplicates', () => {
      const modules = getAccessibleModules(adminUser);
      const uniqueModules = [...new Set(modules)];
      expect(modules.length).toBe(uniqueModules.length);
    });
  });
});
