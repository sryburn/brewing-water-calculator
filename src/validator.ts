// Input validation for water chemistry calculations

import { WaterProfile } from './optimizer.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationRanges {
  volume: { min: number; max: number };
  ions: {
    Ca: { min: number; max: number };
    Mg: { min: number; max: number };
    Na: { min: number; max: number };
    SO4: { min: number; max: number };
    Cl: { min: number; max: number };
    HCO3: { min: number; max: number };
  };
}

// Reasonable ranges for brewing water chemistry
const VALIDATION_RANGES: ValidationRanges = {
  volume: { min: 0.1, max: 1000 },
  ions: {
    Ca: { min: 0, max: 1000 },
    Mg: { min: 0, max: 200 },
    Na: { min: 0, max: 500 },
    SO4: { min: 0, max: 2000 },
    Cl: { min: 0, max: 1000 },
    HCO3: { min: 0, max: 1000 }
  }
};

export function validateInputs(
  volumeLiters: number,
  baseProfile: WaterProfile,
  targetProfile: WaterProfile
): ValidationResult {
  const errors: string[] = [];

  // Validate volume
  if (typeof volumeLiters !== 'number' || !isFinite(volumeLiters)) {
    errors.push('volume must be a valid number');
  } else if (volumeLiters <= 0) {
    errors.push('volume must be positive');
  } else if (volumeLiters < VALIDATION_RANGES.volume.min || volumeLiters > VALIDATION_RANGES.volume.max) {
    errors.push(`volume must be between ${VALIDATION_RANGES.volume.min} and ${VALIDATION_RANGES.volume.max} liters`);
  }

  // Validate water profiles
  const baseValidation = validateWaterProfile(baseProfile, 'base');
  const targetValidation = validateWaterProfile(targetProfile, 'target');
  
  errors.push(...baseValidation.errors, ...targetValidation.errors);



  return {
    valid: errors.length === 0,
    errors
  };
}

function validateWaterProfile(profile: WaterProfile, profileType: string): ValidationResult {
  const errors: string[] = [];

  // Check required properties
  const requiredIons: (keyof WaterProfile)[] = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'HCO3'];
  
  for (const ion of requiredIons) {
    const value = profile[ion];
    
    // Type and finite validation
    if (typeof value !== 'number' || !isFinite(value)) {
      errors.push(`${profileType} profile: ${ion} must be a valid number`);
      continue;
    }

    // Range validation
    const range = VALIDATION_RANGES.ions[ion];
    if (value < range.min || value > range.max) {
      errors.push(`${profileType} profile: ${ion} must be between ${range.min} and ${range.max} ppm`);
    }
  }

  return { valid: errors.length === 0, errors };
}

