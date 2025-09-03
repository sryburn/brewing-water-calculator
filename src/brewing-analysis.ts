/**
 * Brewing-specific water analysis calculations
 */

import { WaterProfile, BrewingAnalysis } from './types.js';

/**
 * Calculate brewing-specific water metrics
 */
export function calculateBrewingAnalysis(profile: WaterProfile): BrewingAnalysis {
  // Alkalinity (as CaCO3) = HCO3 * 50/61
  const alkalinity = profile.HCO3 * (50 / 61);
  
  // Residual Alkalinity = Alkalinity - (Ca/1.4 + Mg/1.7)
  const residualAlkalinity = alkalinity - (profile.Ca / 1.4 + profile.Mg / 1.7);
  
  // Sulfate/Chloride Ratio
  const sulfateChlorideRatio = profile.Cl > 0 ? profile.SO4 / profile.Cl : null;
  
  // Sulfate/Chloride Balance (descriptive)
  const sulfateChlorideBalance = getSulfateChlorideBalance(sulfateChlorideRatio);
  
  // Total Hardness = Ca + Mg (simple sum)
  const totalHardness = profile.Ca + profile.Mg;
  
  // Effective Hardness = Ca/1.4 + Mg/1.7 (Palmer's formula)
  // This represents the hardness that effectively neutralizes alkalinity
  const effectiveHardness = profile.Ca / 1.4 + profile.Mg / 1.7;
  
  // Color Range based on Residual Alkalinity
  const colorRange = getColorRange(residualAlkalinity);
  
  return {
    alkalinity: Math.round(alkalinity * 10) / 10,
    residualAlkalinity: Math.round(residualAlkalinity * 10) / 10,
    sulfateChlorideRatio: sulfateChlorideRatio !== null 
      ? Math.round(sulfateChlorideRatio * 100) / 100 
      : null,
    sulfateChlorideBalance,
    totalHardness: Math.round(totalHardness * 10) / 10,
    effectiveHardness: Math.round(effectiveHardness * 10) / 10,
    colorRange
  };
}

/**
 * Get descriptive sulfate/chloride balance
 */
function getSulfateChlorideBalance(ratio: number | null): string {
  if (ratio === null) return 'N/A (No Chloride)';
  
  if (ratio < 0.4) return 'Very Malty';
  if (ratio < 0.6) return 'Malty';
  if (ratio < 0.8) return 'Slightly Malty';
  if (ratio < 1.2) return 'Balanced';
  if (ratio < 2.0) return 'Slightly Bitter';
  if (ratio < 3.0) return 'Bitter';
  return 'Very Bitter';
}

/**
 * Get suggested beer color range based on Residual Alkalinity
 * Practical ranges that reflect real brewing - high RA doesn't mean infinitely dark beer
 */
function getColorRange(residualAlkalinity: number): string {
  if (residualAlkalinity < 0) return '2-8 EBC (Pilsner)';
  if (residualAlkalinity < 50) return '8-20 EBC (Pale)';
  if (residualAlkalinity < 100) return '20-35 EBC (Amber)';
  if (residualAlkalinity < 150) return '35-50 EBC (Brown)';
  if (residualAlkalinity < 200) return '50-60 EBC (Porter)';
  if (residualAlkalinity < 250) return '60-70 EBC (Stout)';
  // Very high RA indicates water may need adjustment rather than darker beer
  return '50-70 EBC (Porter/Stout)*';
}
