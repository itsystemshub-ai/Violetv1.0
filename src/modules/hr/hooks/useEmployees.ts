/**
 * useEmployees - Hook para gestión de empleados
 */

import { useState, useEffect } from 'react';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: 'EMP-001',
        code: 'E001',
        firstName: 'Juan',
        lastName: 'Pérez García',
        fullName: 'Juan Pérez García',
        email: 'juan.perez@empresa.com',
        phone: '+52 55 1234 5678',
        position: 'Gerente de Ventas',
        department: 'Ventas',
        departmentId: 'DEPT-001',
        hireDate: '2023-01-15',
        salary: 35000,
        status: 'active',
        address: 'Calle Principal 123',
        city: 'Ciudad de México',
        emergencyContact: 'María Pérez',
        emergencyPhone: '+52 55 9876 5432',
        birthDate: '1985-05-20',
        taxId: 'PEGJ850520ABC',
        bankAccount: '1234567890',
      },
      {
        id: 'EMP-002',
        code: 'E002',
        firstName: 'María',
        lastName: 'González López',
        fullName: 'María González López',
        email: 'maria.gonzalez@empresa.com',
        phone: '+52 33 2345 6789',
        position: 'Contador',
        department: 'Finanzas',
        departmentId: 'DEPT-002',
        hireDate: '2023-03-01',
        salary: 28000,
        status: 'active',
        address: 'Av. Reforma 456',
        city: 'Guadalajara',
        emergencyContact: 'Carlos González',
        emergencyPhone: '+52 33 8765 4321',
        birthDate: '1990-08-15',
        taxId: 'GOLM900815XYZ',
        bankAccount: '0987654321',
      },
      {
        id: 'EMP-003',
        code: 'E003',
        firstName: 'Carlos',
        lastName: 'Rodríguez Sánchez',
        fullName: 'Carlos Rodríguez Sánchez',
        email: 'carlos.rodriguez@empresa.com',
        phone: '+52 81 3456 7890',
        position: 'Desarrollador Senior',
        department: 'Tecnología',
        departmentId: 'DEPT-003',
        hireDate: '2022-06-15',
        salary: 32000,
        status: 'active',
        address: 'Colonia Centro 789',
        city: 'Monterrey',
        emergencyContact: 'Ana Rodríguez',
        emergencyPhone: '+52 81 7654 3210',
        birthDate: '1988-12-10',
        taxId: 'ROSC881210DEF',
        bankAccount: '5678901234',
      },
      {
        id: 'EMP-004',
        code: 'E004',
        firstName: 'Ana',
        lastName: 'López Martínez',
        fullName: 'Ana López Martínez',
        email: 'ana.lopez@empresa.com',
        phone: '+52 55 4567 8901',
        position: 'Asistente Administrativo',
        department: 'Administración',
        departmentId: 'DEPT-004',
        hireDate: '2024-01-10',
        salary: 18000,
        status: 'on_leave',
        address: 'Zona Norte 321',
        city: 'Ciudad de México',
        emergencyContact: 'Luis López',
        emergencyPhone: '+52 55 6543 2109',
        birthDate: '1995-03-25',
        taxId: 'LOMA950325GHI',
        bankAccount: '3456789012',
      },
      {
        id: 'EMP-005',
        code: 'E005',
        firstName: 'Luis',
        lastName: 'Hernández Torres',
        fullName: 'Luis Hernández Torres',
        email: 'luis.hernandez@empresa.com',
        phone: '+52 33 5678 9012',
        position: 'Supervisor de Almacén',
        department: 'Operaciones',
        departmentId: 'DEPT-005',
        hireDate: '2021-09-01',
        salary: 22000,
        status: 'active',
        address: 'Industrial 654',
        city: 'Guadalajara',
        emergencyContact: 'Rosa Hernández',
        emergencyPhone: '+52 33 5432 1098',
        birthDate: '1987-07-18',
        taxId: 'HETL870718JKL',
        bankAccount: '7890123456',
      },
      {
        id: 'EMP-006',
        code: 'E006',
        firstName: 'Patricia',
        lastName: 'Sánchez Ramírez',
        fullName: 'Patricia Sánchez Ramírez',
        email: 'patricia.sanchez@empresa.com',
        phone: '+52 81 6789 0123',
        position: 'Gerente de RRHH',
        department: 'Recursos Humanos',
        departmentId: 'DEPT-006',
        hireDate: '2020-04-15',
        salary: 38000,
        status: 'active',
        address: 'Residencial 987',
        city: 'Monterrey',
        emergencyContact: 'Jorge Sánchez',
        emergencyPhone: '+52 81 4321 0987',
        birthDate: '1983-11-30',
        taxId: 'SARP831130MNO',
        bankAccount: '2345678901',
      },
    ];

    setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 500);
  }, []);

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
    avgSalary: Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length),
  };

  const createEmployee = (employee: Omit<Employee, 'id' | 'fullName'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      fullName: `${employee.firstName} ${employee.lastName}`,
    };
    setEmployees([newEmployee, ...employees]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(e => {
      if (e.id === id) {
        const updated = { ...e, ...updates };
        if (updates.firstName || updates.lastName) {
          updated.fullName = `${updated.firstName} ${updated.lastName}`;
        }
        return updated;
      }
      return e;
    }));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const activateEmployee = (id: string) => {
    updateEmployee(id, { status: 'active' });
  };

  const deactivateEmployee = (id: string) => {
    updateEmployee(id, { status: 'inactive' });
  };

  const setOnLeave = (id: string) => {
    updateEmployee(id, { status: 'on_leave' });
  };

  const terminateEmployee = (id: string) => {
    updateEmployee(id, { status: 'terminated' });
  };

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
