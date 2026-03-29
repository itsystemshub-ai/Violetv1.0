import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, LogOut, Menu, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const stats = [
    { icon: Package, label: 'Productos', value: '1,234', color: '#8b5cf6' },
    { icon: Users, label: 'Clientes', value: '567', color: '#10b981' },
    { icon: ShoppingCart, label: 'Ventas Hoy', value: '23', color: '#f59e0b' },
    { icon: DollarSign, label: 'Ingresos', value: '$12,345', color: '#3b82f6' },
  ];

  const menuItems = [
    { icon: TrendingUp, label: 'Dashboard', active: true },
    { icon: Package, label: 'Productos' },
    { icon: Users, label: 'Clientes' },
    { icon: ShoppingCart, label: 'Ventas' },
    { icon: DollarSign, label: 'Finanzas' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '80px',
        background: 'linear-gradient(180deg, #6d28d9 0%, #4c1d95 100%)',
        color: 'white',
        transition: 'width 0.3s',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            💜
          </div>
          {sidebarOpen && (
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Violet ERP</span>
          )}
        </div>

        {/* Menu */}
        <nav style={{ padding: '20px 10px' }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: item.active ? 'rgba(255,255,255,0.2)' : 'transparent',
                marginBottom: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !item.active && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => !item.active && (e.currentTarget.style.background = 'transparent')}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '10px',
          right: '10px'
        }}>
          <div
            onClick={logout}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'rgba(239,68,68,0.2)',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{user?.role}</p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user?.firstName?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px'
          }}>
            Dashboard
          </h1>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: stat.color + '20',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color
                }}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{stat.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Welcome Message */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            padding: '30px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
              ¡Bienvenido a Violet ERP! 💜
            </h2>
            <p style={{ opacity: 0.9 }}>
              Sistema de gestión empresarial listo para usar. Selecciona una opción del menú para comenzar.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
