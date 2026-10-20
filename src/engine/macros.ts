/**
 * MOTOR DE MACRONUTRIENTES — metas diárias determinísticas
 * --------------------------------------------------------
 * Pipeline: TEE → Δ calórico por objetivo (com clamps de SEGURANÇA) →
 * proteína (g/kg parametrizável, fundamentada por perfil) → gordura mínima →
 * carboidrato como resíduo (consistência 4/4/9 kcal/g) → fibra → água.
 *
 * Regras de segurança embutidas (§15):
 * - || Δ || nunca excede 25% do TEE — evita déficit/superávit extremos.
 * - Piso calórico: 1500 kcal (M) / 1200 kcal (F) — abaixo disso a ingestão
 *   mínima de micronutrientes/fibra deixa de ser viável; encaminhar a
 *   profissional em vez de prescrever.
 * - Gordura mínima: 0.6 g/kg (hornonal/absorção de lipossolúveis).
 * - Proteína válida em [1.4, 2.7] g/kg (Morton 2018 / Helms et al. 2014);
 *   defaults por objetivo documentados abaixo.
 *
 * Energia: kcal = 4×P + 4×C + 9×F (Atwater truncado — ao final garantimos
 * |energia total − meta| ≤ 10 kcal para não vender uma meta que não fecha).
 */

import type {
  MacroAudit,
  MacroTargets,
  NutritionInput,
  NutritionParameters,
} from './types';
import type { GoalType } from '../types';
import { ValidationError, requireEnum, requireFiniteNumber } from './types';
import { estimateTee } from './energy';

export const DEFAULT_NUTRITION_PARAMETERS: NutritionParameters = {
  // Defaults por perfil (§5: nada de 2.5 g/kg universal):
  // - déficit: 2.2 g/kg (Morton 2018: 1.6 g/kg já retém LMM; subimos por
  //   saciedade e erro percentual quando a meta geral é agregada);
  // - superávit: 2.0 g/kg; manutenção/performance: 1.8 g/kg.
  proteinGramsPerKg: 2.0,
  fatGramsPerKg: 0.9,
  fiberGramsPer1000Kcal: 14,
  waterMillilitersPerKg: 40,
};

const GOAL_DEFAULTS: Record<
  GoalType,
  { deltaKcalPerDay: number; proteinGramsPerKg: number }
> = {
  perda_gordura: { deltaKcalPerDay: -450, proteinGramsPerKg: 2.2 },
  recomposicao: { deltaKcalPerDay: -200, proteinGramsPerKg: 2.2 },
  hipertrofia: { deltaKcalPerDay: 300, proteinGramsPerKg: 2.0 },
  ganho_peso: { deltaKcalPerDay: 450, proteinGramsPerKg: 1.8 },
  performance: { deltaKcalPerDay: 150, proteinGramsPerKg: 2.0 },
  manutencao: { deltaKcalPerDay: 0, proteinGramsPerKg: 1.8 },
};

const PROTEIN_RANGE = { min: 1.4, max: 2.7 } as const;
const FAT_MIN_PER_KG = 0.6;

/** Piso calórico por sexo (§15). */
const CALORIE_FLOOR: Record<'masculino' | 'feminino', number> = {
  masculino: 1500,
  feminino: 1200,
};

const MAX_DEFCIT_SHARE = 0.25; // déficit ≤ 25% do TEE
const MAX_SURPLUS_SHARE = 0.2; // superávit ≤ 20% do TEE

export interface NutritionTargetsResult {
  targets: MacroTargets;
  strategy: 'deficit' | 'superavit' | 'manutencao';
  calorieDeltaKcalPerDay: number;
  teeKcalPerDay: number;
  audit: MacroAudit;
}

/**
 * Resolve as metas diárias. Determinístico: mesma entrada → mesma saída.
 * Valores ausentes disparam ValidationError — o chamador decide o default.
 */
export function computeNutritionTargets(input: NutritionInput): NutritionTargetsResult {
  const weightKg = requireFiniteNumber(input.weightKg, 'weightKg', 35, 300);
  const sex = requireEnum(input.sex, 'sex', ['masculino', 'feminino'] as const);
  const goal = requireEnum(input.goal, 'goal', [
    'hipertrofia',
    'perda_gordura',
    'recomposicao',
    'manutencao',
    'ganho_peso',
    'performance',
  ] as const);
  const activityLevel = requireEnum(input.activityLevel, 'activityLevel', [
    'sedentario',
    'moderado',
    'ativo',
    'muito_ativo',
  ] as const);
  const frequencyDaysPerWeek = requireFiniteNumber(
    input.frequencyDaysPerWeek,
    'frequencyDaysPerWeek',
    0,
    7,
  );

  const tee = estimateTee({
    weightKg,
    heightCm: requireFiniteNumber(input.heightCm, 'heightCm', 120, 230),
    ageYears: requireFiniteNumber(input.ageYears, 'ageYears', 14, 90),
    sex,
    activityLevel,
    frequencyDaysPerWeek,
    evaluatorLeanMassKg: input.evaluatorLeanMassKg,
  });

  const defaults = GOAL_DEFAULTS[goal];
  const params: NutritionParameters = {
    ...DEFAULT_NUTRITION_PARAMETERS,
    ...input.params,
  };

  // Δ calórico: default por objetivo + clamp de segurança.
  const maxDeficit = Math.round(tee.teeKcalPerDay * MAX_DEFCIT_SHARE);
  const maxSurplus = Math.round(tee.teeKcalPerDay * MAX_SURPLUS_SHARE);
  let calorieDeltaKcalPerDay = defaults.deltaKcalPerDay;
  const clampWarn: string[] = [];
  if (calorieDeltaKcalPerDay < -maxDeficit) {
    calorieDeltaKcalPerDay = -maxDeficit;
    clampWarn.push(`déficit solicitado excedia o limite de 25% do TEE (${maxDeficit} kcal); ajustado para ${maxDeficit} kcal.`);
  }
  if (calorieDeltaKcalPerDay > maxSurplus) {
    calorieDeltaKcalPerDay = maxSurplus;
    clampWarn.push(`superávit solicitado excedia o limite de 20% do TEE (${maxSurplus} kcal); ajustado para ${maxSurplus} kcal.`);
  }

  // Estratégia derivada do Δ (não inversa).
  const strategy = calorieDeltaKcalPerDay < 0 ? 'deficit' : calorieDeltaKcalPerDay > 0 ? 'superavit' : 'manutencao';

  // Meta calórica com piso por sexo.
  const rawTargetKcal = tee.teeKcalPerDay + calorieDeltaKcalPerDay;
  const floor = CALORIE_FLOOR[sex];
  let targetCalories = Math.max(floor, Math.round(rawTargetKcal));
  if (targetCalories !== rawTargetKcal) {
    clampWarn.push(
      `meta calórica caía abaixo do piso de ${floor} kcal/dia (${sex}); mantida no piso.`,
    );
  }

  // Proteína: parametrizável no intervalo fundamentado.
  let proteinPerKg = params.proteinGramsPerKg ?? defaults.proteinGramsPerKg;
  if (proteinPerKg < PROTEIN_RANGE.min || proteinPerKg > PROTEIN_RANGE.max) {
    const clamped = Math.min(PROTEIN_RANGE.max, Math.max(PROTEIN_RANGE.min, proteinPerKg));
    clampWarn.push(
      `proteína ${proteinPerKg} g/kg fora do intervalo fundamentado [${PROTEIN_RANGE.min}, ${PROTEIN_RANGE.max}]; ajustada para ${clamped} g/kg.`,
    );
    proteinPerKg = clamped;
  }
  const proteinGrams = Math.round(weightKg * proteinPerKg);

  // Gordura: mínimo absoluto de segurança.
  const fatPerKg = Math.max(FAT_MIN_PER_KG, params.fatGramsPerKg);
  if (fatPerKg !== params.fatGramsPerKg) {
    clampWarn.push(
      `gordura solicitada em ${params.fatGramsPerKg} g/kg ficava abaixo do mínimo de ${FAT_MIN_PER_KG} g/kg; ajustada.`,
    );
  }
  const fatGrams = Math.round(weightKg * fatPerKg);

  // Carboidrato = resíduo energético; mínimo de células reservado.
  const proteinKcal = proteinGrams * 4;
  const fatKcal = fatGrams * 9;
  const residualKcal = targetCalories - proteinKcal - fatKcal;
  if (residualKcal < 0) {
    // Mesmo no piso de gordura/proteína a meta não fecha — cancela em vez de
    // inventar carboidrato negativo.
    throw new ValidationError(
      'targetCalories',
      `meta de ${targetCalories} kcal não comporta ${proteinGrams} g P + ${fatGrams} g F (sobra ${residualKcal} kcal)`,
    );
  }
  let carbsGrams = Math.round(residualKcal / 4);

  // Consistência 4/4/9: a meta declarada nunca mente mais de 10 kcal sobre
  // a soma dos macros. O ajuste (se necessário) é no carbo, o resíduo.
  const macroKcal = proteinKcal + carbsGrams * 4 + fatKcal;
  if (Math.abs(macroKcal - targetCalories) > 10) {
    carbsGrams = Math.round((targetCalories - proteinKcal - fatKcal) / 4);
  }
  const finalMacroKcal = proteinKcal + carbsGrams * 4 + fatKcal;
  const roundingSlackKcal = targetCalories - finalMacroKcal;

  const fiberGrams = Math.round((targetCalories / 1000) * params.fiberGramsPer1000Kcal);
  const waterMilliliters = Math.round(weightKg * params.waterMillilitersPerKg);

  const targets: MacroTargets = {
    caloriesKcalPerDay: targetCalories,
    proteinGramsPerDay: proteinGrams,
    carbsGramsPerDay: carbsGrams,
    fatGramsPerDay: fatGrams,
    fiberGramsPerDay: fiberGrams,
    waterMillilitersPerDay: waterMilliliters,
  };

  const audit: MacroAudit = {
    strategy,
    teeKcalPerDay: tee.teeKcalPerDay,
    calorieDeltaKcalPerDay,
    energyMethod: 'mifflin_st_jeor',
    proteinGramsPerKg: proteinPerKg,
    fatGramsPerKg: fatPerKg,
    roundingSlackKcal,
    warnings: clampWarn,
  };

  return { targets, teeKcalPerDay: tee.teeKcalPerDay, audit, strategy, calorieDeltaKcalPerDay };
}

/**
 * Distribui as metas diárias entre N refeições por pesos relativos
 * (p.ex. 25% / 35% / 20% / 20%). Determinístico; o restante de cada macro
 * (arredondamento) é lançado na refeição MAIOR para fechar em 100%.
 */
export function distributeMeals(
  perDay: { caloriesKcalPerDay: number; proteinGramsPerDay: number; carbsGramsPerDay: number; fatGramsPerDay: number },
  weights: number[],
): Array<{ caloriesKcal: number; proteinG: number; carbsG: number; fatG: number } & { index: number }> {
  if (weights.length < 1) throw new ValidationError('weights', 'ao menos 1 refeição');
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new ValidationError('weights', 'soma dos pesos deve ser > 0');
  const share = (w: number, v: number) => Math.round((w / total) * v);

  const acc = { cal: 0, p: 0, c: 0, f: 0 };
  const meals = weights.map((w, index) => {
    if (w <= 0) throw new ValidationError('weights', `peso ${index} deve ser > 0`);
    const cal = share(w, perDay.caloriesKcalPerDay);
    const p = share(w, perDay.proteinGramsPerDay);
    const c = share(w, perDay.carbsGramsPerDay);
    const f = share(w, perDay.fatGramsPerDay);
    acc.cal += cal;
    acc.p += p;
    acc.c += c;
    acc.f += f;
    return { index, caloriesKcal: cal, proteinG: p, carbsG: c, fatG: f };
  });

  const biggest = meals.reduce((a, b) => (b.caloriesKcal > a.caloriesKcal ? b : a), meals[0]);
  biggest.caloriesKcal += perDay.caloriesKcalPerDay - acc.cal;
  biggest.proteinG += perDay.proteinGramsPerDay - acc.p;
  biggest.carbsG += perDay.carbsGramsPerDay - acc.c;
  biggest.fatG += perDay.fatGramsPerDay - acc.f;
  return meals;
}

// ---------------------------------------------------------------------------
// Dieta PRÓPRIA do usuário (§7: manter a dieta que já funciona, com auditoria)
// ---------------------------------------------------------------------------

import type { PhysiologicalSex } from './types';

export interface UserDietMacros {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface ValidatedUserDiet {
  /** kcal DERIVADAS por Atwater 4/4/9 a partir dos macros informados. */
  caloriesKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

/**
 * Valida as metas que o usuário JÁ usa. Calorias nunca são campo de digitação:
 * são derivadas de proteína/carboidrato/gordura por Atwater (consistência
 * energética obrigatória). Extremos são REJEITADOS — o app não "corrige"
 * em silêncio e não prescreve por cima da dieta do usuário.
 *
 * Limites de segurança (§11):
 *  - gordura mínima 0,6 g/kg (esteroidogênese, transporte de vitaminas);
 *  - proteína em [0,6 ; 3,5] g/kg (fora disso não é dieta COL audível);
 *  - carboidrato ≥ 0 g; proteína/carb/gordura inteiros gramas.
 */
export function validateUserTargets(
  weightKg: number,
  sex: PhysiologicalSex,
  input: UserDietMacros,
): ValidatedUserDiet {
  const w = requireFiniteNumber(weightKg, 'weightKg', 35, 300);
  const p = requireFiniteNumber(input.proteinGrams, 'proteinGrams', 0, 10000) / w;
  const c = requireFiniteNumber(input.carbsGrams, 'carbsGrams', 0, 10000) / w;
  const f = requireFiniteNumber(input.fatGrams, 'fatGrams', 0, 10000) / w;

  if (p < 0.6 || p > 3.5) {
    throw new ValidationError(
      'proteinGrams',
      `Proteína ${input.proteinGrams} g (${p.toFixed(2)} g/kg) está fora de [0,6 ; 3,5] g/kg — ajuste antes de aplicar.`,
    );
  }
  if (c < 0) {
    throw new ValidationError('carbsGrams', 'Carboidrato não pode ser negativo (g).');
  }
  if (f < 0.6) {
    throw new ValidationError(
      'fatGrams',
      `Gordura ${input.fatGrams} g (${f.toFixed(2)} g/kg) está abaixo do mínimo de 0,6 g/kg.`,
    );
  }

  const derivedCalories = Math.round(input.proteinGrams * 4 + input.carbsGrams * 4 + input.fatGrams * 9);
  const floor = sex === 'feminino' ? 1200 : 1500;
  if (derivedCalories < floor) {
    throw new ValidationError(
      'calories',
      `${derivedCalories} kcal está abaixo do piso de segurança de ${floor} kcal — dieta rejeitada.`,
    );
  }

  return {
    caloriesKcal: derivedCalories,
    proteinGrams: Math.round(input.proteinGrams),
    carbsGrams: Math.round(input.carbsGrams),
    fatGrams: Math.round(input.fatGrams),
  };
}
