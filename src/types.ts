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
  volume_liters: number;
  base_profile: WaterProfile;
  target_profile: WaterProfile;
}

export interface BrewingAnalysis {
  alkalinity: number;  // ppm as CaCO3
  residual_alkalinity: number;  // ppm
  sulfate_chloride_ratio: number | null;  // null if Cl is 0
  sulfate_chloride_balance: string;  // e.g., "Bitter", "Balanced"
  total_hardness: number;  // Ca + Mg (ppm)
  effective_hardness: number;  // Ca/1.4 + Mg/1.7 (ppm) - Palmer's formula
  color_range: string;  // e.g., "5-12 EBC"
}

export interface CalculationResult {
  success: boolean;
  error?: string;
  additions: SaltAdditions;
  calculated_profile: WaterProfile;
  deviations: WaterProfile;
  total_salt_weight: number;
  brewing_analysis: BrewingAnalysis;
}

export interface OptimizationResult {
  saltAdditions: SaltAdditions;  // Precise values for calculations
  saltAdditionsDisplay: SaltAdditions;  // Rounded values for display
  calculatedProfile: WaterProfile;  // Based on precise values
  deviations: WaterProfile;  // Based on precise values
  feasible: boolean;
}


