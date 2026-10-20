/**
 * TIPOS DO MOTOR DETERMINÍSTICO
 * -----------------------------
 * Regra do sistema: unidades explícitas nos nomes (Kg, Cm, Kcal, G, Ml, Min).
 * Valores são classificados apenas como MEDIDO (usuário registrou) ou ESTIMADO
 * (fórmula). A IA nunca preenche estes campos — só o motor determinístico.
 */

import type { GenderType, GoalType } from '../types';

/** Sexo fisiológico, somente onde as equações exigem. */
export type PhysiologicalSex = GenderType;

export type EnergyMethod = 'mifflin_st_jeor' | 'katch_mcardle';
export type Uncertainty = 'medido' | 'estimado';

export interface EnergyEstimate {
  /** kcal/dia (sem limiar inferior — representa o cálculo bruto da equação) */
  bmrKcalPerDay: number;
  method: EnergyMethod;
  uncertainty: Uncertainty;
  /** Fonte/variáveis usado na fórmula, para auditoria e exibição sob demanda. */
  formula: string;
  /**
   * Massa livre de gordura usada (somente Katch-McArdle).
   * Presença indica que o valor foi informado pelo avaliador (ex.: impedância,
   * dobras), não recalculado internamente, para não amortecer o erro duas vezes.
   */
  leanMassKg?: number;
  /** Observações de limitação do método. Nunca vazias. */
  limitations: string;
}

export type ActivityLevel = 'sedentario' | 'moderado' | 'ativo' | 'muito_ativo';

export interface TEEEstimate {
  /** kcal/dia */
  teeKcalPerDay: number;
  /** kcal/dia */
  bmrKcalPerDay: number;
  activityFactor: number;
  /** Fator reflète treino + NEAT; ambas as parcelas têm erro grande (±10–15%). */
  uncertainty: Uncertainty;
  limitations: string;
}

export interface MacroTargets {
  /** kcal/dia */
  caloriesKcalPerDay: number;
  /** g/dia */
  proteinGramsPerDay: number;
  /** g/dia */
  carbsGramsPerDay: number;
  /** g/dia */
  fatGramsPerDay: number;
  /** g/dia */
  fiberGramsPerDay: number;
  /** ml/dia */
  waterMillilitersPerDay: number;
}

export type DietStrategy = 'deficit' | 'superavit' | 'manutencao';

export interface NutritionParameters {
  /** g proteína por kg de peso corporal — AJUSTÁVEL, nunca valor universal. */
  proteinGramsPerKg: number;
  /** g gordura por kg de peso corporal. */
  fatGramsPerKg: number;
  /** g fibra por 1000 kcal da meta. */
  fiberGramsPer1000Kcal: number;
  /** ml água por kg de peso corporal. */
  waterMillilitersPerKg: number;
}

export interface MacroAudit {
  strategy: DietStrategy;
  /** kcal/dia */
  teeKcalPerDay: number;
  /** kcal/dia aplicada como Δ em relação ao TEE */
  calorieDeltaKcalPerDay: number;
  energyMethod: EnergyMethod;
  /** g/kg e g/kg usados de fato após validação/clamps */
  proteinGramsPerKg: number;
  fatGramsPerKg: number;
  /** kcal ≠ kcal dos macros (diferença de arredondamento, em kcal) */
  roundingSlackKcal: number;
  warnings: string[];
}

/** Entrada completa para computar as metas nutricionais diárias. */
export interface NutritionInput {
  goal: GoalType;
  sex: PhysiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  frequencyDaysPerWeek: number;
  /**
   * Massa livre de gordura SOMENTE se vinda de avaliação externa (DXA, dobras,
   * bioimpedância). Katch-McArdle só é usado quando este campo existe.
   */
  evaluatorLeanMassKg?: number;
  params?: Partial<NutritionParameters>;
}

/** Validação de entradas — rejeita (não corrige) valores inválidos. */
export class ValidationError extends Error {
  public readonly field: string;
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function requireFiniteNumber(
  v: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (!isFiniteNumber(v)) throw new ValidationError(field, 'valor ausente ou não numérico');
  if (v < min || v > max) {
    throw new ValidationError(field, `fora do intervalo aceitável [${min}, ${max}]`);
  }
  return v;
}

export function requireEnum<T extends string>(v: unknown, field: string, allowed: readonly T[]): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    throw new ValidationError(field, `esperado um de: ${allowed.join(', ')}`);
  }
  return v as T;
}

export function optionalLeanMass(v: unknown, field: string): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  return requireFiniteNumber(v, field, 20, 250);
}
