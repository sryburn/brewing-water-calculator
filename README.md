# Brewing Water Calculator

A TypeScript library for calculating precise salt additions to achieve target water profiles in brewing. Uses quadratic programming to find optimal solutions that minimize deviations across all ions.

## Features

- **Optimal Salt Calculations**: Uses quadratic programming to find the best combination of brewing salts
- **Balanced Error Distribution**: Minimizes squared deviations for even error distribution across all ions
- **Comprehensive Brewing Analysis**: Calculates alkalinity, residual alkalinity, hardness, and sulfate/chloride balance
- **TypeScript Support**: Fully typed for excellent IDE support
- **Production Ready**: Battle-tested in production brewing applications

## Installation

```bash
npm install brewing-water-calculator
```

## Usage

```typescript
import { calculateWaterAdditions } from 'brewing-water-calculator';

// Define your base water profile (in ppm)
const baseProfile = {
  Ca: 22,
  Mg: 2.7,
  Na: 12,
  SO4: 6,
  Cl: 14,
  HCO3: 50
};

// Define your target water profile (in ppm)
const targetProfile = {
  Ca: 48,
  Mg: 2.7,
  Na: 12,
  SO4: 60,
  Cl: 40,
  HCO3: 50
};

// Calculate salt additions for 20 liters
const result = await calculateWaterAdditions(20, baseProfile, targetProfile);

console.log(result);
// {
//   success: true,
//   additions: {
//     "Gypsum (CaSO4)": 1.5,
//     "Calcium Chloride (CaCl2)": 0.8,
//     "Epsom Salt (MgSO4)": 0,
//     "Table Salt (NaCl)": 0.3,
//     "Baking Soda (NaHCO3)": 0
//   },
//   calculated_profile: {
//     Ca: 48.2,
//     Mg: 2.7,
//     Na: 12.5,
//     SO4: 59.8,
//     Cl: 39.9,
//     HCO3: 50
//   },
//   deviations: {
//     Ca: 0.2,
//     Mg: 0,
//     Na: 0.5,
//     SO4: -0.2,
//     Cl: -0.1,
//     HCO3: 0
//   },
//   total_salt_weight: 2.6,
//   brewing_analysis: {
//     alkalinity: 41,
//     residual_alkalinity: 5.8,
//     sulfate_chloride_ratio: 1.5,
//     sulfate_chloride_balance: "Slightly Bitter",
//     total_hardness: 50.9,
//     effective_hardness: 35.9,
//     color_range: "8-20 EBC (Pale)"
//   }
// }
```

## API

### `calculateWaterAdditions(volumeLiters, baseProfile, targetProfile)`

Calculates the optimal salt additions to achieve a target water profile.

**Parameters:**
- `volumeLiters` (number): Volume of water in liters
- `baseProfile` (WaterProfile): Starting water profile in ppm
- `targetProfile` (WaterProfile): Desired water profile in ppm

**Returns:** `Promise<CalculationResult>`
- `success` (boolean): Whether calculation succeeded
- `additions` (SaltAdditions): Grams of each salt to add
- `calculated_profile` (WaterProfile): Achieved water profile
- `deviations` (WaterProfile): Difference from target
- `total_salt_weight` (number): Total grams of salts
- `brewing_analysis` (BrewingAnalysis): Brewing-specific metrics

### Water Profile Interface

```typescript
interface WaterProfile {
  Ca: number;   // Calcium (ppm)
  Mg: number;   // Magnesium (ppm)
  Na: number;   // Sodium (ppm)
  SO4: number;  // Sulfate (ppm)
  Cl: number;   // Chloride (ppm)
  HCO3: number; // Bicarbonate (ppm)
}
```

## Brewing Salts

The calculator uses these common brewing salts:

| Salt | Formula | Primary Contributions |
|------|---------|----------------------|
| Gypsum | CaSO₄·2H₂O | Calcium, Sulfate |
| Calcium Chloride | CaCl₂·2H₂O | Calcium, Chloride |
| Epsom Salt | MgSO₄·7H₂O | Magnesium, Sulfate |
| Table Salt | NaCl | Sodium, Chloride |
| Baking Soda | NaHCO₃ | Sodium, Bicarbonate |

## Brewing Analysis Metrics

The calculator provides these brewing-specific metrics:

- **Alkalinity**: Total alkalinity as CaCO₃ (ppm)
- **Residual Alkalinity**: Effective alkalinity after calcium/magnesium compensation
- **Sulfate/Chloride Ratio**: Balance indicator for hop vs malt character
- **Total Hardness**: Ca + Mg (ppm)
- **Effective Hardness**: Palmer's formula (Ca/1.4 + Mg/1.7)
- **Color Range**: Suggested beer color based on residual alkalinity

## Algorithm

The calculator uses quadratic programming to minimize the sum of squared deviations:

```
minimize: Σ(achieved[ion] - target[ion])²
subject to: salt_additions ≥ 0
```

This approach ensures:
- Optimal solution that minimizes total error
- Balanced error distribution across all ions
- No negative salt additions
- Mathematically proven optimal solution

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.0.0 (for development)

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Clean build directory
npm run clean
```

## License

MIT © Scott Ryburn

## Contributing

Issues and pull requests are welcome! Please feel free to submit bug reports or feature requests.

## Links

- [GitHub Repository](https://github.com/sryburn/brewing-water-calculator)
- [NPM Package](https://www.npmjs.com/package/brewing-water-calculator)
- [Issue Tracker](https://github.com/sryburn/brewing-water-calculator/issues)