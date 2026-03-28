/**
 * useAttendance - Hook para gestión de asistencia de empleados
 */

import { useState, useEffect } from 'react';

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  leaveType?: 'sick' | 'vacation' | 'personal' | 'unpaid';
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');

  useEffect(() => {
    const mockAttendance: AttendanceRecord[] = [
      {
        id: 'ATT-001',
        date: '2026-03-06',
        employeeId: 'EMP-001',
        employeeName: 'Juan Pérez',
        department: 'Ventas',
        checkIn: '08:00',
        checkOut: '17:00',
        status: 'present',
        hoursWorked: 9,
        overtimeHours: 1,
        notes: 'Hora extra aprobada',
      },
      {
        id: 'ATT-002',
        date: '2026-03-06',
        employeeId: 'EMP-002',
        employeeName: 'María González',
        department: 'Administración',
        checkIn: '08:15',
        checkOut: '17:05',
        status: 'late',
        hoursWorked: 8.83,
        notes: 'Llegó 15 minutos tarde',
      },
      {
        id: 'ATT-003',
        date: '2026-03-06',
        employeeId: 'EMP-003',
        employeeName: 'Carlos Rodríguez',
        department: 'Inventario',
        checkIn: '08:00',
        checkOut: '12:00',
        status: 'half_day',
        hoursWorked: 4,
        notes: 'Medio día por cita médica',
      },
      {
        id: 'ATT-004',
        date: '2026-03-06',
        employeeId: 'EMP-004',
        employeeName: 'Ana López',
        department: 'RRHH',
        status: 'on_leave',
        leaveType: 'sick',
        notes: 'Incapacidad médica',
      },
      {
        id: 'ATT-005',
        date: '2026-03-06',
        employeeId: 'EMP-005',
        employeeName: 'Luis Hernández',
        department: 'Compras',
        status: 'absent',
        notes: 'Ausencia sin justificar',
      },
      {
        id: 'ATT-006',
        date: '2026-03-06',
        employeeId: 'EMP-006',
        employeeName: 'Patricia Sánchez',
        department: 'Ventas',
        checkIn: '08:00',
        checkOut: '17:00',
        status: 'present',
        hoursWorked: 9,
        overtimeHours: 1,
      },
      {
        id: 'ATT-007',
        date: '2026-03-05',
        employeeId: 'EMP-001',
        employeeName: 'Juan Pérez',
        department: 'Ventas',
        checkIn: '08:00',
        checkOut: '17:00',
        status: 'present',
        hoursWorked: 9,
        overtimeHours: 1,
      },
      {
        id: 'ATT-008',
        date: '2026-03-05',
        employeeId: 'EMP-002',
        employeeName: 'María González',
        department: 'Administración',
        status: 'on_leave',
        leaveType: 'vacation',
        notes: 'Vacaciones programadas',
      },
    ];

    setTimeout(() => {
      setAttendance(mockAttendance);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch = 
      record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = record.date === today || record.date === '2026-03-06'; // Mock today
    } else if (dateFilter === 'week') {
      // Last 7 days
      matchesDate = true;
    } else if (dateFilter === 'month') {
      const recordDate = new Date(record.date);
      const now = new Date();
      matchesDate = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
  });

  const stats = {
    totalRecords: attendance.length,
    presentToday: attendance.filter(a => a.date === '2026-03-06' && a.status === 'present').length,
    absentToday: attendance.filter(a => a.date === '2026-03-06' && a.status === 'absent').length,
    lateToday: attendance.filter(a => a.date === '2026-03-06' && a.status === 'late').length,
    onLeaveToday: attendance.filter(a => a.date === '2026-03-06' && a.status === 'on_leave').length,
    totalHoursToday: attendance
      .filter(a => a.date === '2026-03-06' && a.hoursWorked)
      .reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
    overtimeHoursToday: attendance
      .filter(a => a.date === '2026-03-06' && a.overtimeHours)
      .reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    attendanceRate: Math.round(
      (attendance.filter(a => a.date === '2026-03-06' && (a.status === 'present' || a.status === 'late')).length / 
      attendance.filter(a => a.date === '2026-03-06').length) * 100
    ),
  };

  const createAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `ATT-${String(attendance.length + 1).padStart(3, '0')}`,
    };
    setAttendance([newRecord, ...attendance]);
  };

  const updateAttendance = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendance(attendance.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteAttendance = (id: string) => {
    setAttendance(attendance.filter(a => a.id !== id));
  };

  const checkIn = (employeeId: string, employeeName: string, department: string) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const date = now.toISOString().split('T')[0];
    
    const status = time > '08:15' ? 'late' : 'present';
    
    createAttendance({
      date,
      employeeId,
      employeeName,
      department,
      checkIn: time,
      status,
    });
  };

  const checkOut = (id: string) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    
    const record = attendance.find(a => a.id === id);
    if (record && record.checkIn) {
      const checkInTime = new Date(`2000-01-01T${record.checkIn}`);
      const checkOutTime = new Date(`2000-01-01T${time}`);
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const overtimeHours = Math.max(0, hoursWorked - 8);
      
      updateAttendance(id, {
        checkOut: time,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
      });
    }
  };

  const markAsAbsent = (employeeId: string, employeeName: string, department: string, notes?: string) => {
    createAttendance({
      date: new Date().toISOString().split('T')[0],
      employeeId,
      employeeName,
      department,
      status: 'absent',
      notes,
    });
  };

  const markAsLeave = (
    employeeId: string, 
    employeeName: string, 
    department: string, 
    leaveType: 'sick' | 'vacation' | 'personal' | 'unpaid',
    notes?: string
  ) => {
    createAttendance({
      date: new Date().toISOString().split('T')[0],
      employeeId,
      employeeName,
      department,
      status: 'on_leave',
      leaveType,
      notes,
    });
  };

  return {
    attendance: filteredAttendance,
    allAttendance: attendance,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    dateFilter,
    setDateFilter,
    stats,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    checkIn,
    checkOut,
    markAsAbsent,
    markAsLeave,
  };
};
