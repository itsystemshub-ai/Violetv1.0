import { FinancialTransaction } from "./index";

export interface BankStatementLine {
  date: string;
  description: string;
  amount: number;
  reference?: string;
}

export interface ReconciliationMatch {
  bankLine: BankStatementLine;
  systemTransaction?: FinancialTransaction;
  confidence: number; // 0 to 1
  reason?: string;
}

export class ReconciliationService {
  /**
   * Matches bank statement lines with system transactions.
   */
  static matchTransactions(
    bankLines: BankStatementLine[],
    systemTransactions: FinancialTransaction[],
    toleranceDays: number = 3
  ): ReconciliationMatch[] {
    return bankLines.map(line => {
      const bankDate = new Date(line.date);
      
      // Filter potential matches by amount and approximate date
      const potentialMatches = systemTransactions.filter(st => {
        const stAmount = st.type === 'debe' ? st.amount : -st.amount;
        if (Math.abs(stAmount - line.amount) > 0.01) return false;

        const stDate = new Date(st.date);
        const diffDays = Math.abs(bankDate.getTime() - stDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= toleranceDays;
      });

      if (potentialMatches.length === 0) {
        return { bankLine: line, confidence: 0, reason: "No matching amount found." };
      }

      // Try to match by reference if available
      if (line.reference) {
        const refMatch = potentialMatches.find(st => 
          st.description.toLowerCase().includes(line.reference!.toLowerCase()) ||
          st.id.includes(line.reference!)
        );
        if (refMatch) {
          return { bankLine: line, systemTransaction: refMatch, confidence: 1, reason: "Reference match." };
        }
      }

      // Default to best date match
      const bestMatch = potentialMatches.sort((a, b) => {
        const diffA = Math.abs(bankDate.getTime() - new Date(a.date).getTime());
        const diffB = Math.abs(bankDate.getTime() - new Date(b.date).getTime());
        return diffA - diffB;
      })[0];

      return { 
        bankLine: line, 
        systemTransaction: bestMatch, 
        confidence: 0.8, 
        reason: "Date and amount match." 
      };
    });
  }

  /**
   * Parses a CSV bank statement (Mock implementation)
   */
  static async parseCSV(fileContent: string): Promise<BankStatementLine[]> {
    // In a real scenario, use a CSV parser library
    const lines = fileContent.split('\n').slice(1); // skip header
    return lines.map(l => {
      const [date, description, amount, reference] = l.split(',');
      return {
        date,
        description,
        amount: parseFloat(amount),
        reference: reference?.trim()
      };
    }).filter(l => !isNaN(l.amount));
  }
}
