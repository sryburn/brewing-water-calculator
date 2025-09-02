// Main water chemistry calculator that orchestrates optimization, validation, and reporting

import { optimizeSaltAdditions, roundSmallAdditions, WaterProfile, SaltAdditions } from './optimizer.js';
import { validateInputs } from './validator.js';
import { calculateBrewingAnalysis } from './brewing-analysis.js';
import { CalculationResult, CalculationInput } from './types.js';

/**
 * Main function to calculate water chemistry salt additions
 * This is the primary interface used by the MCP server
 */
export async function calculateWaterAdditions(input: CalculationInput): Promise<CalculationResult> {
  const {
    volume_liters,
    base_profile,
    target_profile
  } = input;

  try {
    // Step 1: Validate inputs
    const validation = validateInputs(volume_liters, base_profile, target_profile);
    
    if (!validation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${validation.errors.join(', ')}`,
        additions: createEmptyAdditions(),
        calculated_profile: base_profile,
        deviations: createZeroDeviations(),
        total_salt_weight: 0,
        brewing_analysis: calculateBrewingAnalysis(base_profile)
      };
    }

      // Step 2: Run optimization algorithm
  const optimizationResult = await optimizeSaltAdditions(
    volume_liters,
    base_profile,
    target_profile
  );

    // Step 3: Clean up display additions (round small amounts to 0)
    const displayAdditions = roundSmallAdditions(optimizationResult.saltAdditionsDisplay);
    
    // Step 4: Round the calculated profile for display (but it's based on precise calculations)
    const displayProfile: WaterProfile = {
      Ca: Math.round(optimizationResult.calculatedProfile.Ca * 10) / 10,
      Mg: Math.round(optimizationResult.calculatedProfile.Mg * 10) / 10,
      Na: Math.round(optimizationResult.calculatedProfile.Na * 10) / 10,
      SO4: Math.round(optimizationResult.calculatedProfile.SO4 * 10) / 10,
      Cl: Math.round(optimizationResult.calculatedProfile.Cl * 10) / 10,
      HCO3: Math.round(optimizationResult.calculatedProfile.HCO3 * 10) / 10
    };

    // Step 5: Round deviations for display (but they're based on precise calculations)
    const displayDeviations: WaterProfile = {
      Ca: Math.round(optimizationResult.deviations.Ca * 10) / 10,
      Mg: Math.round(optimizationResult.deviations.Mg * 10) / 10,
      Na: Math.round(optimizationResult.deviations.Na * 10) / 10,
      SO4: Math.round(optimizationResult.deviations.SO4 * 10) / 10,
      Cl: Math.round(optimizationResult.deviations.Cl * 10) / 10,
      HCO3: Math.round(optimizationResult.deviations.HCO3 * 10) / 10
    };

    // Step 6: Calculate total salt weight for display
    const totalSaltWeight = Object.values(displayAdditions).reduce((sum, weight) => sum + weight, 0);

    // Step 7: Calculate brewing-specific analysis
    const brewingAnalysis = calculateBrewingAnalysis(displayProfile);

    return {
      success: true,
      additions: displayAdditions,  // Rounded for display
      calculated_profile: displayProfile,  // Rounded for display but based on precise calc
      deviations: displayDeviations,  // Rounded for display but based on precise calc
      total_salt_weight: Math.round(totalSaltWeight * 10) / 10,
      brewing_analysis: brewingAnalysis
    };

  } catch (error) {
    console.error('Water chemistry calculation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
    
    return {
      success: false,
      error: `Calculation error: ${errorMessage}`,
      additions: createEmptyAdditions(),
      calculated_profile: base_profile,
      deviations: createZeroDeviations(),
      total_salt_weight: 0,
      brewing_analysis: calculateBrewingAnalysis(base_profile)
    };
  }
}

function createEmptyAdditions(): SaltAdditions {
  return {
    "Gypsum (CaSO4)": 0,
    "Calcium Chloride (CaCl2)": 0,
    "Epsom Salt (MgSO4)": 0,
    "Table Salt (NaCl)": 0,
    "Baking Soda (NaHCO3)": 0
  };
}

function createZeroDeviations(): WaterProfile {
  return {
    Ca: 0,
    Mg: 0,
    Na: 0,
    SO4: 0,
    Cl: 0,
    HCO3: 0
  };
}

function calculateFinalProfileFromAdditions(
  baseProfile: WaterProfile,
  saltAdditions: SaltAdditions,
  volumeLiters: number
): WaterProfile {
  // Import contributions here to avoid circular dependency
  const ION_CONTRIBUTIONS = {
    gypsum: { Ca: 232.8, SO4: 557.9 },
    calciumChloride: { Ca: 272.6, Cl: 482.3 },
    epsomSalt: { Mg: 98.6, SO4: 389.6 },
    tableSalt: { Na: 393.4, Cl: 606.6 },
    bakingSoda: { Na: 273.6, HCO3: 726.4 }
  };

  const gypsum = saltAdditions["Gypsum (CaSO4)"];
  const cacl2 = saltAdditions["Calcium Chloride (CaCl2)"];
  const epsom = saltAdditions["Epsom Salt (MgSO4)"];
  const nacl = saltAdditions["Table Salt (NaCl)"];
  const nahco3 = saltAdditions["Baking Soda (NaHCO3)"];

  const contributions = {
    Ca: (gypsum * ION_CONTRIBUTIONS.gypsum.Ca + cacl2 * ION_CONTRIBUTIONS.calciumChloride.Ca) / volumeLiters,
    Mg: (epsom * ION_CONTRIBUTIONS.epsomSalt.Mg) / volumeLiters,
    Na: (nacl * ION_CONTRIBUTIONS.tableSalt.Na + nahco3 * ION_CONTRIBUTIONS.bakingSoda.Na) / volumeLiters,
    SO4: (gypsum * ION_CONTRIBUTIONS.gypsum.SO4 + epsom * ION_CONTRIBUTIONS.epsomSalt.SO4) / volumeLiters,
    Cl: (cacl2 * ION_CONTRIBUTIONS.calciumChloride.Cl + nacl * ION_CONTRIBUTIONS.tableSalt.Cl) / volumeLiters,
    HCO3: (nahco3 * ION_CONTRIBUTIONS.bakingSoda.HCO3) / volumeLiters
  };

  return {
    Ca: Math.round((baseProfile.Ca + contributions.Ca) * 10) / 10,
    Mg: Math.round((baseProfile.Mg + contributions.Mg) * 10) / 10,
    Na: Math.round((baseProfile.Na + contributions.Na) * 10) / 10,
    SO4: Math.round((baseProfile.SO4 + contributions.SO4) * 10) / 10,
    Cl: Math.round((baseProfile.Cl + contributions.Cl) * 10) / 10,
    HCO3: Math.round((baseProfile.HCO3 + contributions.HCO3) * 10) / 10
  };
}

function calculateDeviations(targetProfile: WaterProfile, calculatedProfile: WaterProfile): WaterProfile {
  return {
    Ca: Math.round((calculatedProfile.Ca - targetProfile.Ca) * 10) / 10,
    Mg: Math.round((calculatedProfile.Mg - targetProfile.Mg) * 10) / 10,
    Na: Math.round((calculatedProfile.Na - targetProfile.Na) * 10) / 10,
    SO4: Math.round((calculatedProfile.SO4 - targetProfile.SO4) * 10) / 10,
    Cl: Math.round((calculatedProfile.Cl - targetProfile.Cl) * 10) / 10,
    HCO3: Math.round((calculatedProfile.HCO3 - targetProfile.HCO3) * 10) / 10
  };
}



/**
 * Utility function to format calculation results for display
 */
export function formatCalculationSummary(result: CalculationResult): string {
  if (!result.success) {
    return `Calculation failed: ${result.error}`;
  }

  const lines = [
    '=== Water Chemistry Calculation Results ===',
    '',
    'Salt Additions:',
    ...Object.entries(result.additions)
      .filter(([_, grams]) => grams > 0)
      .map(([salt, grams]) => `  ${salt}: ${grams.toFixed(1)}g`),
    '',
    `Total salt weight: ${result.total_salt_weight}g`,
    '',
    'Calculated Profile:',
    `  Ca: ${result.calculated_profile.Ca} ppm`,
    `  Mg: ${result.calculated_profile.Mg} ppm`,
    `  Na: ${result.calculated_profile.Na} ppm`,
    `  SO4: ${result.calculated_profile.SO4} ppm`,
    `  Cl: ${result.calculated_profile.Cl} ppm`,
    `  HCO3: ${result.calculated_profile.HCO3} ppm`,
  ];



  return lines.join('\n');
}

/**
 * Quick validation function for MCP parameter checking
 */
export function validateMCPInput(args: any): { valid: boolean; error?: string } {
  if (!args.volume_liters || typeof args.volume_liters !== 'number') {
    return { valid: false, error: 'volume_liters is required and must be a number' };
  }

  if (!args.base_profile || typeof args.base_profile !== 'object') {
    return { valid: false, error: 'base_profile is required and must be an object' };
  }

  if (!args.target_profile || typeof args.target_profile !== 'object') {
    return { valid: false, error: 'target_profile is required and must be an object' };
  }

  const requiredIons = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'HCO3'];
  for (const ion of requiredIons) {
    if (typeof args.base_profile[ion] !== 'number') {
      return { valid: false, error: `base_profile.${ion} is required and must be a number` };
    }
    if (typeof args.target_profile[ion] !== 'number') {
      return { valid: false, error: `target_profile.${ion} is required and must be a number` };
    }
  }

  return { valid: true };
}
