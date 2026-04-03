'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Building2, Settings, Table, Save } from 'lucide-react';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(false);
  const [empresaData, setEmpresaData] = useState<any>({
    businessName: '',
    rif: '',
    address: '',
    phone: '',
    email: '',
    fiscalYear: 'ENERO-DICIEMBRE',
    currency: 'VES',
    taxRate: 0.16,
    invoicePrefix: 'F',
    invoiceControl: '',
    invoiceSeries: 'A',
    nextInvoiceNum: 1,
    checkStock: true,
    allowNegativeStock: false,
    commissionRate: 0,
    valuationMethod: 'PROMEDIO',
  });

  const [systemConfigs, setSystemConfigs] = useState<any>({});
  const [tablas, setTablas] = useState<any[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const [empresaRes, sistemaRes, tablasRes] = await Promise.all([
        api.get('/configuracion/empresa'),
        api.get('/configuracion/sistema'),
        api.get('/configuracion/tablas'),
      ]);

      if (empresaRes.data.data) {
        setEmpresaData({ ...empresaData, ...empresaRes.data.data });
      }

      setSystemConfigs(sistemaRes.data.data || {});
      setTablas(tablasRes.data.data || []);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpresa = async () => {
    try {
      await api.put('/configuracion/empresa', empresaData);
      alert('✅ Configuración de empresa guardada exitosamente');
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSystemConfigChange = async (group: string, key: string, value: string) => {
    try {
      await api.put(`/configuracion/sistema/${key}`, { value });
      setSystemConfigs((prev: any) => ({
        ...prev,
        [group]: prev[group].map((c: any) =>
          c.key === key ? { ...c, value } : c
        ),
      }));
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'sistema', label: 'Sistema', icon: Settings },
    { id: 'tablas', label: 'Tablas', icon: Table },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600">
            Gestiona la configuración de empresa, parámetros del sistema y catálogos
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {/* EMPRESA TAB */}
              {activeTab === 'empresa' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        value={empresaData.businessName}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, businessName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RIF *
                      </label>
                      <input
                        type="text"
                        value={empresaData.rif}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, rif: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección Fiscal
                      </label>
                      <input
                        type="text"
                        value={empresaData.address}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, address: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={empresaData.phone}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={empresaData.email}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ejercicio Fiscal
                      </label>
                      <select
                        value={empresaData.fiscalYear}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, fiscalYear: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="ENERO-DICIEMBRE">Enero - Diciembre</option>
                        <option value="OCTUBRE-SEPTIEMBRE">Octubre - Septiembre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moneda
                      </label>
                      <select
                        value={empresaData.currency}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, currency: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="VES">Bolívares (VES)</option>
                        <option value="USD">Dólares (USD)</option>
                        <option value="EUR">Euros (EUR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasa de IVA (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={empresaData.taxRate * 100}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, taxRate: parseFloat(e.target.value) / 100 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Valuación de Inventario
                      </label>
                      <select
                        value={empresaData.valuationMethod}
                        onChange={(e) =>
                          setEmpresaData({ ...empresaData, valuationMethod: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="PROMEDIO">Precio Promedio</option>
                        <option value="PEPS">PEPS (FIFO)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Configuración de Facturación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prefijo de Factura
                        </label>
                        <input
                          type="text"
                          value={empresaData.invoicePrefix}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, invoicePrefix: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Serie
                        </label>
                        <input
                          type="text"
                          value={empresaData.invoiceSeries}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, invoiceSeries: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Control
                        </label>
                        <input
                          type="text"
                          value={empresaData.invoiceControl}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, invoiceControl: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Configuración de Ventas
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={empresaData.checkStock}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, checkStock: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Verificar stock al facturar
                        </span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={empresaData.allowNegativeStock}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, allowNegativeStock: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Permitir stock negativo
                        </span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tasa de Comisión por Defecto (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={empresaData.commissionRate * 100}
                          onChange={(e) =>
                            setEmpresaData({ ...empresaData, commissionRate: parseFloat(e.target.value) / 100 })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSaveEmpresa}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              )}

              {/* SISTEMA TAB */}
              {activeTab === 'sistema' && (
                <div className="space-y-8">
                  {Object.entries(systemConfigs).map(([group, configs]: [string, any]) => (
                    <div key={group}>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                        {group}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {configs.map((config: any) => (
                          <div key={config.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {config.label}
                            </label>
                            {config.type === 'boolean' ? (
                              <select
                                value={config.value}
                                onChange={(e) =>
                                  handleSystemConfigChange(group, config.key, e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            ) : (
                              <input
                                type={config.type === 'number' ? 'number' : 'text'}
                                value={config.value}
                                onChange={(e) =>
                                  handleSystemConfigChange(group, config.key, e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TABLAS TAB */}
              {activeTab === 'tablas' && (
                <div className="space-y-6">
                  {tablas.map((tabla) => (
                    <div key={tabla.id}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tabla.description || tabla.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tabla._count.items} elementos
                          </p>
                        </div>
                        {!tabla.isSystem && (
                          <button className="text-sm text-indigo-600 hover:text-indigo-700">
                            Editar
                          </button>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          {tabla.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200"
                            >
                              {item.color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
