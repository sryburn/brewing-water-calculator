/**
 * Quadratic Programming based optimizer for water chemistry
 * Uses quadprog to minimize squared deviations for naturally balanced errors
 * 
 * This implementation properly handles the 1-indexed arrays used by the
 * original quadprog library (Fortran heritage).
 */

import type { WaterProfile, SaltAdditions, OptimizationResult } from './types.js';
import { ION_CONTRIBUTIONS } from './salts.js';

/**
 * Build 1-indexed matrices for quadprog
 * The library uses Fortran-style 1-indexed arrays
 */
function buildQuadprogMatrices(
  volumeLiters: number,
  baseProfile: WaterProfile,
  targetProfile: WaterProfile
) {
  const ions = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'HCO3'] as const;
  const salts = [
    { key: 'gypsum', ions: ION_CONTRIBUTIONS.gypsum },
    { key: 'cacl2', ions: ION_CONTRIBUTIONS.calciumChloride },
    { key: 'epsom', ions: ION_CONTRIBUTIONS.epsomSalt },
    { key: 'nacl', ions: ION_CONTRIBUTIONS.tableSalt },
    { key: 'nahco3', ions: ION_CONTRIBUTIONS.bakingSoda }
  ];
  
  const numSalts = salts.length;
  const numIons = ions.length;
  
  // Calculate needed changes
  const needed: number[] = [0]; // Index 0 unused (1-indexed)
  ions.forEach(ion => {
    needed.push(targetProfile[ion] - baseProfile[ion]);
  });
  
  // Build contribution matrix (ions x salts)
  // A[i][j] = contribution of salt j to ion i
  const A: number[][] = [];
  for (let i = 0; i <= numIons; i++) {
    A[i] = [];
    for (let j = 0; j <= numSalts; j++) {
      A[i][j] = 0;
    }
  }
  
  // Fill contribution matrix
  for (let ionIdx = 1; ionIdx <= numIons; ionIdx++) {
    const ion = ions[ionIdx - 1];
    for (let saltIdx = 1; saltIdx <= numSalts; saltIdx++) {
      const salt = salts[saltIdx - 1];
      const contribution = (salt.ions as any)[ion] || 0;
      if (contribution > 0) {
        A[ionIdx][saltIdx] = contribution / volumeLiters;
      }
    }
  }
  
  // Build Hessian matrix H = 2 * A^T * A
  // This minimizes sum of squared deviations
  const H: number[][] = [];
  for (let i = 0; i <= numSalts; i++) {
    H[i] = [];
    for (let j = 0; j <= numSalts; j++) {
      H[i][j] = 0;
    }
  }
  
  // H = 2 * A^T * A
  for (let i = 1; i <= numSalts; i++) {
    for (let j = 1; j <= numSalts; j++) {
      let sum = 0;
      for (let k = 1; k <= numIons; k++) {
        sum += A[k][i] * A[k][j];
      }
      H[i][j] = 2 * sum;
    }
  }
  
  // Build linear term dvec for quadprog's formulation
  // quadprog minimizes: -dvec^T * x + 1/2 * x^T * Dmat * x
  // We want to minimize: (Ax - needed)^T * (Ax - needed)
  // Which expands to: x^T*A^T*A*x - 2*needed^T*A*x + const
  // So dvec = 2 * A^T * needed (positive, not negative)
  const dvec: number[] = [0]; // Index 0 unused
  for (let i = 1; i <= numSalts; i++) {
    let sum = 0;
    for (let k = 1; k <= numIons; k++) {
      sum += A[k][i] * needed[k];
    }
    dvec[i] = 2 * sum; // Positive for quadprog's formulation
  }
  
  // Build constraint matrix for quadprog
  // Amat: rows = variables (salts), columns = constraints
  // Constraint: A^T * x >= bvec
  // We need: salt[i] >= 0 for all i
  
  // For now, just use non-negativity constraints (5 constraints for 5 salts)
  const numConstraints = numSalts;
  
  // Initialize Amat (rows=salts+1, cols=constraints+1) with 1-indexing
  const Amat: number[][] = [];
  for (let i = 0; i <= numSalts; i++) {
    Amat[i] = [];
    for (let j = 0; j <= numConstraints; j++) {
      Amat[i][j] = 0;
    }
  }
  
  // Set up identity matrix for non-negativity
  // Column j represents constraint: salt[j] >= 0
  for (let i = 1; i <= numSalts; i++) {
    Amat[i][i] = 1; // salt[i] has coefficient 1 in its own constraint
  }
  
  // bvec: one entry per constraint
  const bvec: number[] = [0]; // Index 0 unused
  for (let i = 1; i <= numConstraints; i++) {
    bvec[i] = 0; // All salts >= 0
  }
  
  return { H, dvec, Amat, bvec, A, needed, numSalts, numIons };
}

/**
 * Optimize using Quadratic Programming with original quadprog library
 */
export async function optimizeWithQP(
  volumeLiters: number,
  baseProfile: WaterProfile,
  targetProfile: WaterProfile
): Promise<OptimizationResult> {
  try {
    // Import QP solver
    const { solveQP } = await import("quadprog");
    
    const { H, dvec, Amat, bvec, A, needed, numSalts, numIons } = buildQuadprogMatrices(
      volumeLiters,
      baseProfile,
      targetProfile
    );
    
    // Solve QP problem
    // meq = 0 means all constraints are inequalities
    const result = solveQP(H, dvec, Amat, bvec, 0);
    
    if (!result || !result.solution) {
      throw new Error(`QP solver failed: ${result?.message || 'No solution found'}`);
    }
    
    // Extract precise salt additions (1-indexed) - NO ROUNDING
    const saltAdditionsPrecise: SaltAdditions = {
      "Gypsum (CaSO4)": result.solution[1] || 0,
      "Calcium Chloride (CaCl2)": result.solution[2] || 0,
      "Epsom Salt (MgSO4)": result.solution[3] || 0,
      "Table Salt (NaCl)": result.solution[4] || 0,
      "Baking Soda (NaHCO3)": result.solution[5] || 0
    };
    
    // Create rounded versions for display
    const saltAdditionsDisplay: SaltAdditions = {
      "Gypsum (CaSO4)": Math.round(saltAdditionsPrecise["Gypsum (CaSO4)"] * 10) / 10,
      "Calcium Chloride (CaCl2)": Math.round(saltAdditionsPrecise["Calcium Chloride (CaCl2)"] * 10) / 10,
      "Epsom Salt (MgSO4)": Math.round(saltAdditionsPrecise["Epsom Salt (MgSO4)"] * 10) / 10,
      "Table Salt (NaCl)": Math.round(saltAdditionsPrecise["Table Salt (NaCl)"] * 10) / 10,
      "Baking Soda (NaHCO3)": Math.round(saltAdditionsPrecise["Baking Soda (NaHCO3)"] * 10) / 10
    };
    
    // Calculate achieved profile using PRECISE values
    const calculatedProfile: WaterProfile = { ...baseProfile };
    const ions = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'HCO3'] as const;
    
    // Apply salt contributions using PRECISE amounts
    const salts = [
      { name: "Gypsum (CaSO4)", ions: ION_CONTRIBUTIONS.gypsum },
      { name: "Calcium Chloride (CaCl2)", ions: ION_CONTRIBUTIONS.calciumChloride },
      { name: "Epsom Salt (MgSO4)", ions: ION_CONTRIBUTIONS.epsomSalt },
      { name: "Table Salt (NaCl)", ions: ION_CONTRIBUTIONS.tableSalt },
      { name: "Baking Soda (NaHCO3)", ions: ION_CONTRIBUTIONS.bakingSoda }
    ];
    
    salts.forEach(salt => {
      const amount = saltAdditionsPrecise[salt.name as keyof SaltAdditions];  // Use precise value
      if (amount > 0) {
        Object.entries(salt.ions).forEach(([ion, contribution]) => {
          const ionKey = ion as keyof WaterProfile;
          if (contribution > 0) {
            calculatedProfile[ionKey] += (contribution * amount) / volumeLiters;
          }
        });
      }
    });
    
    // Keep precise values in calculated profile for accurate deviation calculation
    // We'll round for display later
    ions.forEach(ion => {
      calculatedProfile[ion] = calculatedProfile[ion];  // Keep full precision
    });
    
    // Calculate deviations
    const deviations: WaterProfile = {
      Ca: calculatedProfile.Ca - targetProfile.Ca,
      Mg: calculatedProfile.Mg - targetProfile.Mg,
      Na: calculatedProfile.Na - targetProfile.Na,
      SO4: calculatedProfile.SO4 - targetProfile.SO4,
      Cl: calculatedProfile.Cl - targetProfile.Cl,
      HCO3: calculatedProfile.HCO3 - targetProfile.HCO3
    };
    
    return {
      saltAdditions: saltAdditionsPrecise,  // Precise values for calculations
      saltAdditionsDisplay,  // Rounded values for display
      calculatedProfile,  // Based on precise values
      deviations,  // Based on precise values
      feasible: true
    };
    
  } catch (error) {
    console.error('QP optimization failed:', error);
    
    // Return infeasible result
    const emptyAdditions = {
      "Gypsum (CaSO4)": 0,
      "Calcium Chloride (CaCl2)": 0,
      "Epsom Salt (MgSO4)": 0,
      "Table Salt (NaCl)": 0,
      "Baking Soda (NaHCO3)": 0
    };
    
    return {
      saltAdditions: emptyAdditions,
      saltAdditionsDisplay: emptyAdditions,
      calculatedProfile: baseProfile,
      deviations: {
        Ca: targetProfile.Ca - baseProfile.Ca,
        Mg: targetProfile.Mg - baseProfile.Mg,
        Na: targetProfile.Na - baseProfile.Na,
        SO4: targetProfile.SO4 - baseProfile.SO4,
        Cl: targetProfile.Cl - baseProfile.Cl,
        HCO3: targetProfile.HCO3 - baseProfile.HCO3
      },
      feasible: false
    };
  }
}
