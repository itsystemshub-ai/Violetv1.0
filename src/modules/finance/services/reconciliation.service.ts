import { FinancialTransaction } from '@/lib';

export interface BankStatementLine {
  date: string;
  description: string;
  amount: number;
  reference?: string;
}

export interface ReconciliationMatch {
  bankLine: BankStatementLine;
  systemTransaction?: FinancialTransaction;
  confidence: number;
  reason?: string;
}

export class ReconciliationService {
  static matchTransactions(
    bankLines: BankStatementLine[],
    systemTransactions: FinancialTransaction[],
    toleranceDays: number = 3
  ): ReconciliationMatch[] {
    return bankLines.map(line => {
      const bankDate = new Date(line.date);
      
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

      if (line.reference) {
        const refMatch = potentialMatches.find(st => 
          st.description.toLowerCase().includes(line.reference!.toLowerCase()) ||
          st.id.includes(line.reference!)
        );
        if (refMatch) {
          return { bankLine: line, systemTransaction: refMatch, confidence: 1, reason: "Reference match." };
        }
      }

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
}
