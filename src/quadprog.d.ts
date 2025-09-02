declare module 'quadprog' {
  export interface QPResult {
    solution: number[];
    value: number[];
    unconstrained_solution: number[];
    iterations: number[];
    iact: number[];
    message: string;
    Lagrangian: number[];
  }

  export function solveQP(
    Dmat: number[][],
    dvec: number[],
    Amat: number[][],
    bvec: number[],
    meq?: number,
    factorized?: boolean
  ): QPResult;
}
