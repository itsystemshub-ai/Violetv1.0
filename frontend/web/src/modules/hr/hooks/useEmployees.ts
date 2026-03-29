/**
 * useEmployees - Hook para gestión de empleados
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  departmentId: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  address?: string;
  city?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  birthDate?: string;
  taxId?: string;
  bankAccount?: string;
  photo?: string;
}

export const useEmployees = () => {
  const { tenant } = useSystemConfig();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const fetchEmployees = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dbEmployees = await localDb.employees
        .where('tenant_id')
        .equals(tenant.id)
        .toArray();
      setEmployees(dbEmployees as Employee[]);
    } catch (error) {
      console.error('[useEmployees] Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    onLeaveEmployees: employees.filter(e => e.status === 'on_leave').length,
    totalPayroll: employees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.salary, 0),
    departments: [...new Set(employees.map(e => e.department))].length,
    newThisMonth: employees.filter(e => {
      const hireDate = new Date(e.hireDate);
      const now = new Date();
      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
    }).length,
    avgSalary: employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length) : 0,
  };

  const createEmployee = async (employee: Omit<Employee, 'id' | 'fullName'>) => {
    if (!tenant?.id || tenant.id === 'none') return;
    const newEmployee: Employee = {
      ...employee,
      id: `EMP-${Date.now()}`,
      fullName: `${employee.firstName} ${employee.lastName}`,
    };
    try {
      await localDb.employees.add({ ...newEmployee, tenant_id: tenant.id });
      setEmployees((prev) => [newEmployee, ...prev]);
    } catch (error) {
      console.error('[useEmployees] Error creating:', error);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    if (!tenant?.id || tenant.id === 'none') return;
    try {
      const updatedFullName = updates.firstName || updates.lastName 
        ? `${updates.firstName || ''} ${updates.lastName || ''}`.trim() 
        : undefined;

      const finalUpdates = updatedFullName ? { ...updates, fullName: updatedFullName } : updates;

      await localDb.employees.update(id, finalUpdates);
      
      setEmployees((prev) => prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          if (updatedFullName) updated.fullName = updatedFullName;
          return updated;
        }
        return e;
      }));
    } catch (error) {
      console.error('[useEmployees] Error updating:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!tenant?.id || tenant.id === 'none') return;
    try {
      await localDb.employees.delete(id);
      setEmployees((prev) => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('[useEmployees] Error deleting:', error);
    }
  };

  const activateEmployee = (id: string) => updateEmployee(id, { status: 'active' });
  const deactivateEmployee = (id: string) => updateEmployee(id, { status: 'inactive' });
  const setOnLeave = (id: string) => updateEmployee(id, { status: 'on_leave' });
  const terminateEmployee = (id: string) => updateEmployee(id, { status: 'terminated' });

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    stats,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    setOnLeave,
    terminateEmployee,
  };
};
