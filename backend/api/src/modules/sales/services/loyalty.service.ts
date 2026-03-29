import { localDb } from "./localDb";

export interface LoyaltyConfig {
  pointsPerDollar: number;
  pointsToDollarValue: number; // e.g., 100 points = $1
}

export const LoyaltyService = {
  /**
   * Awards points based on invoice total
   */
  async awardPoints(customerId: string, amountUSD: number): Promise<number> {
    const config: LoyaltyConfig = { pointsPerDollar: 1, pointsToDollarValue: 0.01 };
    
    const profile = await localDb.profiles.get(customerId);
    if (!profile) return 0;

    const earned = Math.floor(amountUSD * config.pointsPerDollar);
    const newPoints = (profile.loyalty_points || 0) + earned;

    await localDb.profiles.update(customerId, { loyalty_points: newPoints });
    return earned;
  },

  /**
   * Redeems points for a discount
   */
  async redeemPoints(customerId: string, pointsToRedeem: number): Promise<number> {
    const config: LoyaltyConfig = { pointsPerDollar: 1, pointsToDollarValue: 0.01 };
    
    const profile = await localDb.profiles.get(customerId);
    if (!profile || (profile.loyalty_points || 0) < pointsToRedeem) {
      throw new Error("Puntos insuficientes o cliente no encontrado.");
    }

    const discountValue = pointsToRedeem * config.pointsToDollarValue;
    const newPoints = profile.loyalty_points - pointsToRedeem;

    await localDb.profiles.update(customerId, { loyalty_points: newPoints });
    return discountValue;
  },

  /**
   * Gets current loyalty balance for a customer
   */
  async getBalance(customerId: string): Promise<number> {
    const profile = await localDb.profiles.get(customerId);
    return profile?.loyalty_points || 0;
  }
};
