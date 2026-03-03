/**
 * useExchangeDifference
 * 
 * Hook para gestionar el Diferencial Cambiario en la UI.
 * Facilita el procesamiento de pagos con diferencial y visualización de reportes.
 */

import { useState, useEffect } from 'react';
import { ExchangeDifferenceService, type ExchangeDifference } from '@/lib/ExchangeDifferenceService';
import { useTenant } from './useTenant';
import { toast } from 'sonner';

export const useExchangeDifference = () => {
  const { tenant } = useTenant();
  const [differences, setDifferences] = useState<ExchangeDifference[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar diferenciales del tenant actual
  const loadDifferences = async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'GAIN' | 'LOSS';
  }) => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const data = await ExchangeDifferenceService.getExchangeDifferences(
        tenant.id,
        filters
      );
      setDifferences(data);
      
      const summaryData = await ExchangeDifferenceService.getSummary(
        tenant.id,
        filters?.startDate && filters?.endDate
          ? { start: filters.startDate, end: filters.endDate }
          : undefined
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('[useExchangeDifference] Error cargando diferenciales:', error);
      toast.error('Error al cargar diferenciales cambiarios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Procesar pago con diferencial cambiario
  const processPayment = async (
    invoice: any,
    paymentData: {
      amount_usd: number;
      payment_rate: number;
      payment_date: string;
      payment_method: string;
      reference?: string;
    }
  ) => {
    if (!tenant?.id) {
      toast.error('No hay tenant activo');
      return null;
    }
    
    setIsLoading(true);
    try {
      // Verificar si requiere diferencial
      const requiresDiff = ExchangeDifferenceService.requiresExchangeDifference(
        invoice,
        paymentData.payment_rate
      );
      
      if (!requiresDiff) {
        toast.info('No hay diferencial cambiario significativo');
        return null;
      }
      
      // Procesar pago con diferencial
      const payment = {
        payment_id: crypto.randomUUID(),
        invoice_id: invoice.id,
        ...paymentData,
      };
      
      const difference = await ExchangeDifferenceService.processPaymentWithExchangeDifference(
        invoice,
        payment,
        tenant
      );
      
      if (difference) {
        const diffType = difference.type === 'GAIN' ? 'Ganancia' : 'Pérdida';
        const diffAmount = Math.abs(difference.difference_bs).toFixed(2);
        
        toast.success(
          `Pago procesado con ${diffType} en Cambio de Bs.${diffAmount}`,
          {
            description: `Tasa factura: Bs.${difference.original_rate.toFixed(2)} → Tasa cobro: Bs.${difference.payment_rate.toFixed(2)}`,
          }
        );
        
        // Recargar diferenciales
        await loadDifferences();
        
        return difference;
      } else {
        toast.error('Error procesando el pago');
        return null;
      }
    } catch (error) {
      console.error('[useExchangeDifference] Error procesando pago:', error);
      toast.error('Error al procesar el pago con diferencial');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generar reporte
  const generateReport = async (period: { start: string; end: string }) => {
    if (!tenant?.id) return null;
    
    setIsLoading(true);
    try {
      const report = await ExchangeDifferenceService.generateReport(
        tenant.id,
        period
      );
      
      toast.success('Reporte generado exitosamente');
      return report;
    } catch (error) {
      console.error('[useExchangeDifference] Error generando reporte:', error);
      toast.error('Error al generar el reporte');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar al montar
  useEffect(() => {
    if (tenant?.id) {
      loadDifferences();
    }
  }, [tenant?.id]);
  
  return {
    differences,
    summary,
    isLoading,
    loadDifferences,
    processPayment,
    generateReport,
  };
};
