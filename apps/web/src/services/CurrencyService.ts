/**
 * CurrencyService handles fetching exchange rates from BCV (Banco Central de Venezuela).
 * It uses the bcv-exchange-rates API.
 */

export interface BcvExchangeRate {
  symbol: string;
  value: string;
}

export interface BcvResponse {
  error: boolean;
  error_message: string[];
  data: {
    euro: BcvExchangeRate;
    yuan: BcvExchangeRate;
    lira: BcvExchangeRate;
    rublo: BcvExchangeRate;
    dolar: BcvExchangeRate;
    effective_date: string;
    run_timestamp: string;
  };
}

const PUBLIC_API_URL = "https://bcv-exchange-rates.vercel.app/get_bcv_exchange_rates";

export class CurrencyService {
  /**
   * Fetches the official BCV exchange rate for USD.
   * Falls back to public API if local one is not available.
   */
  static async getBcvRate(): Promise<number | null> {
    try {
      // Try local first if possible, but browsers might block it due to CORS
      // For now, we'll try the public API as it's more reliable for a web app
      const response = await fetch(PUBLIC_API_URL);
      if (!response.ok) throw new Error("API response not ok");

      const result: BcvResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error_message.join(", "));
      }

      // The value comes as a string with a comma, e.g., "36,1234"
      const dolarValueStr = result.data.dolar.value.replace(",", ".");
      const rate = parseFloat(dolarValueStr);

      if (isNaN(rate)) throw new Error("Invalid rate format");

      return rate;
    } catch (error) {
      console.error("[CurrencyService] Error fetching BCV rate:", error);
      return null;
    }
  }

  /**
   * Utility to format numbers to BS or USD
   */
  static formatCurrency(amount: number, currency: 'VES' | 'USD' = 'VES'): string {
    return new Intl.NumberFormat(currency === 'VES' ? 'es-VE' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
}
