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
  const residual_alkalinity = alkalinity - (profile.Ca / 1.4 + profile.Mg / 1.7);
  
  // Sulfate/Chloride Ratio
  const sulfate_chloride_ratio = profile.Cl > 0 ? profile.SO4 / profile.Cl : null;
  
  // Sulfate/Chloride Balance (descriptive)
  const sulfate_chloride_balance = getSulfateChlorideBalance(sulfate_chloride_ratio);
  
  // Total Hardness = Ca + Mg (simple sum)
  const total_hardness = profile.Ca + profile.Mg;
  
  // Effective Hardness = Ca/1.4 + Mg/1.7 (Palmer's formula)
  // This represents the hardness that effectively neutralizes alkalinity
  const effective_hardness = profile.Ca / 1.4 + profile.Mg / 1.7;
  
  // Color Range based on Residual Alkalinity
  const color_range = getColorRange(residual_alkalinity);
  
  return {
    alkalinity: Math.round(alkalinity * 10) / 10,
    residual_alkalinity: Math.round(residual_alkalinity * 10) / 10,
    sulfate_chloride_ratio: sulfate_chloride_ratio !== null 
      ? Math.round(sulfate_chloride_ratio * 100) / 100 
      : null,
    sulfate_chloride_balance,
    total_hardness: Math.round(total_hardness * 10) / 10,
    effective_hardness: Math.round(effective_hardness * 10) / 10,
    color_range
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
function getColorRange(ra: number): string {
  if (ra < 0) return '2-8 EBC (Pilsner)';
  if (ra < 50) return '8-20 EBC (Pale)';
  if (ra < 100) return '20-35 EBC (Amber)';
  if (ra < 150) return '35-50 EBC (Brown)';
  if (ra < 200) return '50-60 EBC (Porter)';
  if (ra < 250) return '60-70 EBC (Stout)';
  // Very high RA indicates water may need adjustment rather than darker beer
  return '50-70 EBC (Porter/Stout)*';
}
