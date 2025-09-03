/**
 * Water Chemistry Types
 */

export interface WaterProfile {
  Ca: number;
  Mg: number;
  Na: number;
  SO4: number;
  Cl: number;
  HCO3: number;
}

export interface SaltAdditions {
  "Gypsum (CaSO4)": number;
  "Calcium Chloride (CaCl2)": number;
  "Epsom Salt (MgSO4)": number;
  "Table Salt (NaCl)": number;
  "Baking Soda (NaHCO3)": number;
  [key: string]: number; // Index signature for flexible access
}

export interface CalculationInput {
  volumeLiters: number;
  baseProfile: WaterProfile;
  targetProfile: WaterProfile;
}

export interface BrewingAnalysis {
  alkalinity: number;  // ppm as CaCO3
  residualAlkalinity: number;  // ppm
  sulfateChlorideRatio: number | null;  // null if Cl is 0
  sulfateChlorideBalance: string;  // e.g., "Bitter", "Balanced"
  totalHardness: number;  // Ca + Mg (ppm)
  effectiveHardness: number;  // Ca/1.4 + Mg/1.7 (ppm) - Palmer's formula
  colorRange: string;  // e.g., "5-12 EBC"
}

export interface CalculationResult {
  success: boolean;
  error?: string;
  additions: SaltAdditions;
  calculatedProfile: WaterProfile;
  deviations: WaterProfile;
  totalSaltWeight: number;
  brewingAnalysis: BrewingAnalysis;
}

export interface OptimizationResult {
  saltAdditions: SaltAdditions;  // Precise values for calculations
  saltAdditionsDisplay: SaltAdditions;  // Rounded values for display
  calculatedProfile: WaterProfile;  // Based on precise values
  deviations: WaterProfile;  // Based on precise values
  feasible: boolean;
}


