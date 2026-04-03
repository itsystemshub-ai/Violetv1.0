'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, FileText, Calculator, TrendingUp, Plus, Trash2 } from 'lucide-react';

export default function ContabilidadPage() {
  const [activeTab, setActiveTab] = useState('asientos');
  const [loading, setLoading] = useState(false);
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);
  const [asientos, setAsientos] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    loadContabilidad();
  }, []);

  const loadContabilidad = async () => {
    setLoading(true);
    try {
      const [planCuentasRes, asientosRes] = await Promise.all([
        api.get('/contabilidad/plan-cuentas'),
        api.get('/contabilidad/asientos?limit=10'),
      ]);

      setPlanCuentas(planCuentasRes.data.data || []);
      setAsientos(asientosRes.data.data || []);
    } catch (error) {
      console.error('Error loading contabilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'asientos', label: 'Asientos', icon: FileText },
    { id: 'plan-cuentas', label: 'Plan de Cuentas', icon: BookOpen },
    { id: 'libros', label: 'Libros', icon: Calculator },
    { id: 'balances', label: 'Balances', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contabilidad
          </h1>
          <p className="text-gray-600">
            Gestión contable, asientos, libros y reportes financieros
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
              {/* ASIENTOS TAB */}
              {activeTab === 'asientos' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Asientos Contables
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      <Plus className="w-5 h-5" />
                      Nuevo Asiento
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Correlativo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Debe
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Haber
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {asientos.map((asiento) => (
                          <tr key={asiento.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {asiento.correlativo.toString().padStart(6, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(asiento.fecha).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {asiento.descripcion}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asiento.tipo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {asiento.totalDebe.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {asiento.totalHaber.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {asiento.anulado ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Anulado
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Registrado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PLAN DE CUENTAS TAB */}
              {activeTab === 'plan-cuentas' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Plan de Cuentas
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      <Plus className="w-5 h-5" />
                      Nueva Cuenta
                    </button>
                  </div>

                  <div className="space-y-2">
                    {planCuentas.map((cuenta) => (
                      <div
                        key={cuenta.id}
                        className={`
                          flex items-center justify-between p-4 rounded-lg border
                          ${cuenta.padreId ? 'ml-8' : ''}
                          ${cuenta.tipo === 'SINTETICA' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${cuenta.tipo === 'SINTETICA' ? 'bg-indigo-600' : 'bg-gray-200'}
                          `}>
                            <BookOpen className={`w-5 h-5 ${cuenta.tipo === 'SINTETICA' ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-gray-900">
                                {cuenta.codigo}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {cuenta.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                {cuenta.tipo}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                {cuenta.naturaleza}
                              </span>
                              {cuenta._count?.movimientos > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-600">
                                  {cuenta._count.movimientos} movimientos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {cuenta._count?.movimientos === 0 && (
                            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIBROS TAB */}
              {activeTab === 'libros' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Libros Contables
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="w-8 h-8" />
                        <h3 className="text-lg font-semibold">Libro Diario</h3>
                      </div>
                      <p className="text-indigo-100 text-sm mb-4">
                        Registro cronológico de todas las operaciones contables
                      </p>
                      <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                        Generar Libro Diario
                      </button>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <Calculator className="w-8 h-8" />
                        <h3 className="text-lg font-semibold">Libro Mayor</h3>
                      </div>
                      <p className="text-green-100 text-sm mb-4">
                        Movimientos detallados por cada cuenta contable
                      </p>
                      <button className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors">
                        Generar Libro Mayor
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BALANCES TAB */}
              {activeTab === 'balances' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Balances y Reportes
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calculator className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Balance de Comprobación
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Verifica que la suma del debe sea igual al haber
                      </p>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Generar Reporte
                      </button>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Situación Financiera
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Activos, pasivos y patrimonio de la empresa
                      </p>
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                        Generar Reporte
                      </button>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Estado de Resultados
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Ingresos, costos, gastos y utilidad del período
                      </p>
                      <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                        Generar Reporte
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
