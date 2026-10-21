/**
 * CONSTRUTOR DE DIETA (§6/§19) — porções derivadas do banco TACO/USDA
 * -------------------------------------------------------------------
 * A dieta NÃO é um texto fixo: as metas de macro do motor (§2) são distribuídas
 * entre as refeições e cada item é montado a partir do banco de alimentos, com
 * porção em gramas calculada por regra de três e kcal SEMPRE derivada por
 * Atwater (4/4/9) — nunca digitada.
 *
 * Restrições da anamnese (vegano, sem lactose, sem glúten, alergias) filtram o
 * banco ANTES do cálculo. Se um papel da refeição não tiver alimento compatível,
 * a refeição fica sem o item e a auditoria registra a lacuna — o motor não
 * "inventa" substituto nutricional.
 *
 * Algoritmo por refeição: vegetal fixo → fruta (35% do carbo) → proteína (fecha
 * o alvo proteico) → carboidrato (fecha o carbo restante) → gordura (fecha o
 * lipídio restante). Porções em passos de 5 g e clamps conservadores.
 */

import type { MealItem, PlannedMeal } from '../types';
import {
  FOODS,
  PORTION_MAX_G,
  PORTION_MIN_G,
  foodKcalPer100g,
  foodRole,
  scaleMacros,
  type Food,
  type FoodGroup,
} from './foods';
import { ValidationError, requireFiniteNumber } from './types';

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

export interface DietConstraints {
  pattern: string;
  restrictions: string[];
  blockedFoodIds: string[];
  blockedGroups: FoodGroup[];
  mealsPerDay: number;
  notes: string[];
}

export function defaultDietConstraints(mealsPerDay = 4): DietConstraints {
  return {
    pattern: 'onivoro',
    restrictions: [],
    blockedFoodIds: [],
    blockedGroups: [],
    mealsPerDay,
    notes: [],
  };
}

export interface DietTargets {
  caloriesKcalPerDay: number;
  proteinGramsPerDay: number;
  carbsGramsPerDay: number;
  fatGramsPerDay: number;
}

export interface DietBuildAudit {
  targetKcal: number;
  builtKcal: number;
  deviationKcal: number;
  deviationKcalPct: number;
  builtProteinG: number;
  builtCarbsG: number;
  builtFatG: number;
  missingSlots: string[];
  constraintsApplied: string[];
  notes: string[];
}

export interface DietBuildResult {
  meals: PlannedMeal[];
  audit: DietBuildAudit;
}

// ---------------------------------------------------------------------------
// Templates de refeição (3 a 6 refeições) — somas de share = 1
// ---------------------------------------------------------------------------

type SlotKind = 'protein' | 'carb' | 'fruit' | 'veg' | 'fat';

interface MealTemplate {
  name: string;
  time: string;
  share: number;
  slots: SlotKind[];
}

const TEMPLATES: Record<number, MealTemplate[]> = {
  3: [
    { name: 'Café da manhã', time: '08:00', share: 0.3, slots: ['protein', 'carb', 'fruit'] },
    { name: 'Almoço', time: '13:00', share: 0.4, slots: ['protein', 'carb', 'veg', 'fat'] },
    { name: 'Jantar', time: '20:00', share: 0.3, slots: ['protein', 'carb', 'veg', 'fat'] },
  ],
  4: [
    { name: 'Café da manhã', time: '07:30', share: 0.25, slots: ['protein', 'carb', 'fruit'] },
    { name: 'Almoço', time: '12:30', share: 0.35, slots: ['protein', 'carb', 'veg', 'fat'] },
    { name: 'Lanche / pré-treino', time: '16:30', share: 0.15, slots: ['protein', 'fruit'] },
    { name: 'Jantar', time: '20:30', share: 0.25, slots: ['protein', 'carb', 'veg', 'fat'] },
  ],
  5: [
    { name: 'Café da manhã', time: '07:30', share: 0.2, slots: ['protein', 'carb', 'fruit'] },
    { name: 'Lanche da manhã', time: '10:30', share: 0.1, slots: ['protein', 'fruit'] },
    { name: 'Almoço', time: '13:00', share: 0.3, slots: ['protein', 'carb', 'veg', 'fat'] },
    { name: 'Lanche / pré-treino', time: '16:30', share: 0.15, slots: ['protein', 'carb'] },
    { name: 'Jantar', time: '20:30', share: 0.25, slots: ['protein', 'carb', 'veg', 'fat'] },
  ],
  6: [
    { name: 'Café da manhã', time: '07:00', share: 0.18, slots: ['protein', 'carb', 'fruit'] },
    { name: 'Lanche da manhã', time: '10:00', share: 0.1, slots: ['protein', 'fruit'] },
    { name: 'Almoço', time: '12:30', share: 0.28, slots: ['protein', 'carb', 'veg', 'fat'] },
    { name: 'Pré-treino', time: '16:00', share: 0.12, slots: ['protein', 'carb'] },
    { name: 'Jantar', time: '20:00', share: 0.22, slots: ['protein', 'carb', 'veg', 'fat'] },
    { name: 'Ceia', time: '22:30', share: 0.1, slots: ['protein', 'fat'] },
  ],
};

const KIND_GROUPS: Record<SlotKind, FoodGroup[]> = {
  protein: ['proteina_animal', 'proteina_vegetal', 'lacteo', 'suplemento'],
  carb: ['carboidrato'],
  fruit: ['fruta'],
  veg: ['vegetal'],
  fat: ['gordura'],
};

const KIND_LABEL: Record<SlotKind, string> = {
  protein: 'proteína',
  carb: 'carboidrato',
  fruit: 'fruta',
  veg: 'vegetal',
  fat: 'gordura',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const round5 = (grams: number): number => Math.max(PORTION_MIN_G, Math.round(grams / 5) * 5);
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const round1 = (v: number): number => Math.round(v * 10) / 10;

function allowedFoods(constraints: DietConstraints): Food[] {
  const blockedIds = new Set(constraints.blockedFoodIds);
  const blockedGroups = new Set(constraints.blockedGroups);
  return FOODS.filter((f) => !blockedIds.has(f.id) && !blockedGroups.has(f.group));
}

function poolFor(kind: SlotKind, allowed: Food[], mealName: string, pattern: string): Food[] {
  const groups = KIND_GROUPS[kind];
  let pool = allowed.filter((f) => groups.includes(f.group));

  // Fallbacks honestos quando a restrição elimina o grupo principal.
  if (pool.length === 0 && kind === 'fruit') pool = allowed.filter((f) => f.group === 'carboidrato');
  if (pool.length === 0 && kind === 'carb') pool = allowed.filter((f) => f.group === 'fruta');

  if (kind === 'protein') {
    // Prioriza fontes densas: evita 450 g de leguminosa para fechar proteína.
    const dense = pool.filter((f) => f.proteinPer100g >= 12);
    if (dense.length > 0) pool = dense;

    // Onívoro/pescetariano fecha proteína com comida de verdade; suplemento só
    // entra quando o padrão vegetariano/vegano exige concentrar proteína.
    if (pattern !== 'vegetariano' && pattern !== 'vegano') {
      const whole = pool.filter((f) => f.group !== 'suplemento');
      if (whole.length > 0) pool = whole;
    }

    // Mais densos primeiro.
    pool = [...pool].sort((a, b) => b.proteinPer100g - a.proteinPer100g);
  } else if (kind === 'carb') {
    const isBreakfast = /caf[eé]|manh[aã]/.test(mealName.toLowerCase());
    const isSnack = /lanche|pr[eé]-treino/.test(mealName.toLowerCase());

    if (isBreakfast) {
      const breakfast = pool.filter((f) => f.id === 'aveia_flocos' || f.id === 'pao_integral');
      if (breakfast.length > 0) pool = breakfast;
    } else if (isSnack) {
      const fruit = allowed.filter((f) => f.group === 'fruta');
      if (fruit.length > 0) pool = [...pool, ...fruit];
    } else {
      // Almoço/jantar: prefere fontes salgadas.
      const savoryIds = [
        'arroz_branco_cozido',
        'arroz_integral_cozido',
        'batata_doce_cozida',
        'batata_inglesa_cozida',
        'macarrao_integral_cozido',
        'quinoa_cozida',
      ];
      const savory = pool.filter((f) => savoryIds.includes(f.id));
      if (savory.length > 0) pool = savory;
    }
    pool = [...pool].sort((a, b) => b.carbsPer100g - a.carbsPer100g);
  } else if (kind === 'fat') {
    pool = [...pool].sort((a, b) => b.fatPer100g - a.fatPer100g);
  }
  return pool;
}

/** Escolha determinística com variedade limitada aos 3 melhores do papel. */
function pick(pool: Food[], mealIndex: number, slotIndex: number): Food | undefined {
  if (pool.length === 0) return undefined;
  const top = pool.slice(0, 3);
  return top[(mealIndex + slotIndex) % top.length];
}

/** Divide um total por shares inteiros, devolvendo a sobra ao maior share. */
function distributeInteger(total: number, shares: number[]): number[] {
  const raw = shares.map((s) => total * s);
  const rounded = raw.map((v) => Math.round(v));
  const diff = Math.round(total) - rounded.reduce((a, b) => a + b, 0);
  const maxIdx = shares.indexOf(Math.max(...shares));
  rounded[maxIdx] += diff;
  return rounded;
}

interface MealMacros {
  proteinG: number;
  carbsG: number;
  fatG: number;
  kcal: number;
}

const emptyMacros = (): MealMacros => ({ proteinG: 0, carbsG: 0, fatG: 0, kcal: 0 });

// ---------------------------------------------------------------------------
// Construtor
// ---------------------------------------------------------------------------

export interface DietBuildInput {
  targets: DietTargets;
  mealsPerDay?: number;
  constraints?: DietConstraints;
}

export function buildDietPlan(input: DietBuildInput): DietBuildResult {
  const constraints = input.constraints ?? defaultDietConstraints(input.mealsPerDay ?? 4);
  const mealCount = Math.round(input.mealsPerDay ?? constraints.mealsPerDay ?? 4);

  if (!TEMPLATES[mealCount]) {
    throw new ValidationError('mealsPerDay', `refeições por dia suportadas: 3 a 6 (recebido ${mealCount})`);
  }

  const targets = input.targets;
  const targetKcal = requireFiniteNumber(targets.caloriesKcalPerDay, 'targets.caloriesKcalPerDay', 800, 8000);
  const targetProtein = requireFiniteNumber(targets.proteinGramsPerDay, 'targets.proteinGramsPerDay', 20, 400);
  const targetCarbs = requireFiniteNumber(targets.carbsGramsPerDay, 'targets.carbsGramsPerDay', 20, 900);
  const targetFat = requireFiniteNumber(targets.fatGramsPerDay, 'targets.fatGramsPerDay', 15, 250);

  const templates = TEMPLATES[mealCount];
  const shares = templates.map((t) => t.share);

  const pByMeal = distributeInteger(targetProtein, shares);
  const cByMeal = distributeInteger(targetCarbs, shares);
  const fByMeal = distributeInteger(targetFat, shares);
  const kcalByMeal = distributeInteger(targetKcal, shares);

  const allowed = allowedFoods(constraints);
  const missingSlots: string[] = [];
  const notes: string[] = [];

  const meals: PlannedMeal[] = templates.map((template, mealIndex) => {
    const slots = new Set(template.slots);
    const order = (['veg', 'fruit', 'protein', 'carb', 'fat'] as SlotKind[]).filter((k) => slots.has(k));

    const mealId = `meal_${mealIndex + 1}`;
    const items: MealItem[] = [];
    const achieved = emptyMacros();
    let itemIndex = 0;

    const addFood = (food: Food, grams: number): void => {
      const portion = scaleMacros(food, clamp(round5(grams), PORTION_MIN_G, PORTION_MAX_G));
      items.push({
        id: `${mealId}_i${++itemIndex}`,
        name: food.name,
        portion: `${portion.grams}g`,
        calories: portion.caloriesKcal,
        protein: portion.proteinG,
        carbs: portion.carbsG,
        fat: portion.fatG,
        fiber: portion.fiberG > 0 ? portion.fiberG : undefined,
        foodId: food.id,
        grams: portion.grams,
        completed: false,
      });
      achieved.proteinG += portion.proteinG;
      achieved.carbsG += portion.carbsG;
      achieved.fatG += portion.fatG;
      achieved.kcal += portion.caloriesKcal;
    };

    let guard = 0;
    for (const kind of order) {
      if (guard++ > 8) break;
      const pool = poolFor(kind, allowed, template.name, constraints.pattern);
      const food = pick(pool, mealIndex, kind === 'protein' ? 0 : order.indexOf(kind));
      if (!food) {
        missingSlots.push(`${template.name}: ${KIND_LABEL[kind]}`);
        notes.push(`${template.name}: sem alimento compatível para ${KIND_LABEL[kind]} com as restrições atuais.`);
        continue;
      }

      const per100 = {
        protein: food.proteinPer100g / 100,
        carbs: food.carbsPer100g / 100,
        fat: food.fatPer100g / 100,
      };

      if (kind === 'veg') {
        addFood(food, 100);
        continue;
      }

      if (kind === 'fruit') {
        const desiredCarbs = cByMeal[mealIndex] * 0.35;
        const grams = per100.carbs > 0 ? clamp(desiredCarbs / per100.carbs, 40, 300) : 100;
        addFood(food, grams);
        continue;
      }

      if (kind === 'protein') {
        const remainingProtein = pByMeal[mealIndex] - achieved.proteinG;
        const grams = per100.protein > 0 ? clamp(remainingProtein / per100.protein, 10, 450) : 100;
        addFood(food, grams);
        continue;
      }

      if (kind === 'carb') {
        const remainingCarbs = cByMeal[mealIndex] - achieved.carbsG;
        if (remainingCarbs < 5) {
          notes.push(`${template.name}: carboidrato já fechado pelos outros itens; item omitido.`);
          continue;
        }
        const grams = per100.carbs > 0 ? clamp(remainingCarbs / per100.carbs, PORTION_MIN_G, 500) : PORTION_MIN_G;
        addFood(food, grams);
        continue;
      }

      // gordura
      const remainingFat = fByMeal[mealIndex] - achieved.fatG;
      if (remainingFat < 5) {
        notes.push(`${template.name}: gordura já fechada pelos outros itens; item omitido.`);
        continue;
      }
      const grams = per100.fat > 0 ? clamp(remainingFat / per100.fat, PORTION_MIN_G, 150) : PORTION_MIN_G;
      addFood(food, grams);
    }

    return {
      id: mealId,
      name: template.name,
      time: template.time,
      targetCalories: kcalByMeal[mealIndex],
      items,
      completed: false,
    };
  });

  // Auditoria: o plano é comparado com o alvo, não "forçado" a bater por ajuste oculto.
  const built = meals.reduce(
    (acc, meal) => {
      for (const item of meal.items) {
        acc.kcal += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const deviationKcal = Math.round(built.kcal - targetKcal);
  const deviationKcalPct = Math.round((deviationKcal / targetKcal) * 100);

  if (Math.abs(deviationKcalPct) > 12) {
    notes.push(
      `Plano montado com ${built.kcal} kcal vs. alvo de ${targetKcal} kcal (${deviationKcalPct}%). Ajuste fino pode ser necessário no check-in.`,
    );
  }
  if (Math.abs(built.protein - targetProtein) > targetProtein * 0.2) {
    notes.push(`Proteína do plano (${round1(built.protein)} g) distante do alvo (${targetProtein} g) — revisar fontes proteicas compatíveis.`);
  }

  const constraintsApplied = [
    `padrão ${constraints.pattern}`,
    ...constraints.restrictions,
    `${mealCount} refeições/dia`,
  ];

  return {
    meals,
    audit: {
      targetKcal: Math.round(targetKcal),
      builtKcal: Math.round(built.kcal),
      deviationKcal,
      deviationKcalPct,
      builtProteinG: round1(built.protein),
      builtCarbsG: round1(built.carbs),
      builtFatG: round1(built.fat),
      missingSlots,
      constraintsApplied,
      notes: [...constraints.notes, ...notes],
    },
  };
}

/** kcal por 100 g de um alimento (reexport para a UI/auditoria). */
export function foodKcal(food: Food): number {
  return foodKcalPer100g(food);
}

/** Papel funcional de um item já montado (para substituições na UI). */
export function mealItemRole(item: MealItem): ReturnType<typeof foodRole> | null {
  if (!item.foodId) return null;
  const food = FOODS.find((f) => f.id === item.foodId);
  return food ? foodRole(food.group) : null;
}
