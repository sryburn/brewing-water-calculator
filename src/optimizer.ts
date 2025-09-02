/**
 * Water Chemistry Optimizer
 * 
 * Uses Quadratic Programming (QP) to find mathematically optimal salt additions
 * that minimize squared deviations from the target profile, resulting in
 * more balanced errors across all ions.
 */

import { WaterProfile, SaltAdditions, OptimizationResult as BaseOptimizationResult } from './types.js';

// Re-export types for backward compatibility
export { WaterProfile, SaltAdditions };

// Extend the base optimization result to add iterations
export interface OptimizationResult extends BaseOptimizationResult {
  iterations?: number;
}

export interface IonDeltas {
  Ca: number;
  Mg: number;
  Na: number;
  SO4: number;
  Cl: number;
  HCO3: number;
}

/**
 * Main optimization function
 * Uses Quadratic Programming to minimize squared error for balanced solutions
 */
export async function optimizeSaltAdditions(
  volumeLiters: number,
  baseProfile: WaterProfile,
  targetProfile: WaterProfile
): Promise<OptimizationResult> {
  const { optimizeWithQP } = await import('./optimizer-qp.js');
  const result = await optimizeWithQP(volumeLiters, baseProfile, targetProfile);
  
  if (!result.feasible) {
    throw new Error('Unable to find a feasible solution for the target water profile');
  }
  
  return { ...result, iterations: 1 };
}

/**
 * Round small salt additions to practical amounts
 * Amounts below 0.1g are rounded to 0
 */
export function roundSmallAdditions(saltAdditions: SaltAdditions): SaltAdditions {
  const rounded = { ...saltAdditions };
  const threshold = 0.1; // grams
  
  Object.keys(rounded).forEach(salt => {
    const saltKey = salt as keyof SaltAdditions;
    if (rounded[saltKey] < threshold) {
      rounded[saltKey] = 0;
    } else {
      // Round to 1 decimal place
      rounded[saltKey] = Math.round(rounded[saltKey] * 10) / 10;
    }
  });
  
  return rounded;
}

