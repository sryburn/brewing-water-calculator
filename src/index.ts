/**
 * @beerai/water-chemistry
 * 
 * Water chemistry calculator for brewing
 * Calculates optimal salt additions using quadratic programming
 */

// Main calculator function
export { calculateWaterAdditions } from './calculator.js';

// Types
export type {
  WaterProfile,
  SaltAdditions,
  BrewingAnalysis,
  CalculationInput,
  CalculationResult,
  OptimizationResult
} from './types.js';

// Brewing analysis utilities
export { calculateBrewingAnalysis } from './brewing-analysis.js';

// Salt definitions and constants
export { 
  BREWING_SALTS,
  SALT_BY_NAME,
  ION_CONTRIBUTIONS,
  SOLUBILITY_LIMITS
} from './salts.js';

// Input validation
export { validateInputs } from './validator.js';

// Optimizer functions (if someone wants lower-level access)
export { optimizeSaltAdditions } from './optimizer.js';
export { optimizeWithQP } from './optimizer-qp.js';
