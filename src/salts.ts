// Salt definitions and ion contribution calculations for brewing water chemistry

export interface Salt {
  name: string;
  formula: string;
  molecularWeight: number;
  contributions: {
    Ca?: number;   // mg ion per g salt per L water
    Mg?: number;
    Na?: number; 
    SO4?: number;
    Cl?: number;
    HCO3?: number;
  };
  solubility: number; // g/L at 20°C
}

export const BREWING_SALTS: Salt[] = [
  {
    name: "Gypsum (CaSO4)",
    formula: "CaSO₄·2H₂O",
    molecularWeight: 172.17,
    contributions: {
      Ca: 232.8,   // (40.08 / 172.17) × 1000
      SO4: 557.9   // (96.06 / 172.17) × 1000
    },
    solubility: 2.1
  },
  {
    name: "Calcium Chloride (CaCl2)",
    formula: "CaCl₂·2H₂O", 
    molecularWeight: 147.01,
    contributions: {
      Ca: 272.6,   // (40.08 / 147.01) × 1000
      Cl: 482.3    // (70.90 / 147.01) × 1000
    },
    solubility: 745,

  },
  {
    name: "Epsom Salt (MgSO4)",
    formula: "MgSO₄·7H₂O",
    molecularWeight: 246.47,
    contributions: {
      Mg: 98.6,    // (24.31 / 246.47) × 1000
      SO4: 389.6   // (96.06 / 246.47) × 1000
    },
    solubility: 710,

  },
  {
    name: "Table Salt (NaCl)",
    formula: "NaCl",
    molecularWeight: 58.44,
    contributions: {
      Na: 393.4,   // (22.99 / 58.44) × 1000
      Cl: 606.6    // (35.45 / 58.44) × 1000
    },
    solubility: 360,

  },
  {
    name: "Baking Soda (NaHCO3)",
    formula: "NaHCO₃",
    molecularWeight: 84.01,
    contributions: {
      Na: 273.6,   // (22.99 / 84.01) × 1000
      HCO3: 726.4  // (61.02 / 84.01) × 1000
    },
    solubility: 96
  }
];

// Create lookup maps for easy access
export const SALT_BY_NAME = Object.fromEntries(
  BREWING_SALTS.map(salt => [salt.name, salt])
);

// Ion contribution matrix for calculations
export interface IonContributions {
  gypsum: { Ca: number; SO4: number };
  calciumChloride: { Ca: number; Cl: number };
  epsomSalt: { Mg: number; SO4: number };
  tableSalt: { Na: number; Cl: number };
  bakingSoda: { Na: number; HCO3: number };
}

export const ION_CONTRIBUTIONS: IonContributions = {
  gypsum: {
    Ca: SALT_BY_NAME["Gypsum (CaSO4)"].contributions.Ca!,
    SO4: SALT_BY_NAME["Gypsum (CaSO4)"].contributions.SO4!
  },
  calciumChloride: {
    Ca: SALT_BY_NAME["Calcium Chloride (CaCl2)"].contributions.Ca!,
    Cl: SALT_BY_NAME["Calcium Chloride (CaCl2)"].contributions.Cl!
  },
  epsomSalt: {
    Mg: SALT_BY_NAME["Epsom Salt (MgSO4)"].contributions.Mg!,
    SO4: SALT_BY_NAME["Epsom Salt (MgSO4)"].contributions.SO4!
  },
  tableSalt: {
    Na: SALT_BY_NAME["Table Salt (NaCl)"].contributions.Na!,
    Cl: SALT_BY_NAME["Table Salt (NaCl)"].contributions.Cl!
  },
  bakingSoda: {
    Na: SALT_BY_NAME["Baking Soda (NaHCO3)"].contributions.Na!,
    HCO3: SALT_BY_NAME["Baking Soda (NaHCO3)"].contributions.HCO3!
  }
};

// Solubility limits in grams per liter
export interface SolubilityLimits {
  gypsum: number;
  calciumChloride: number;
  epsomSalt: number;
  tableSalt: number;
  bakingSoda: number;
}

export const SOLUBILITY_LIMITS: SolubilityLimits = {
  gypsum: SALT_BY_NAME["Gypsum (CaSO4)"].solubility,
  calciumChloride: SALT_BY_NAME["Calcium Chloride (CaCl2)"].solubility,
  epsomSalt: SALT_BY_NAME["Epsom Salt (MgSO4)"].solubility,
  tableSalt: SALT_BY_NAME["Table Salt (NaCl)"].solubility,
  bakingSoda: SALT_BY_NAME["Baking Soda (NaHCO3)"].solubility
};


