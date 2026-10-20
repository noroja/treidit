/**
 * MOTOR DE REFEIÇÕES — somatórios e comparação com a meta
 * -------------------------------------------------------
 * §6: "recalcular automaticamente os macros ao alterar qualquer quantidade"
 * e "atualizar o total diário em tempo real". Aqui estão as operações PURAS
 * que a UI usa — nenhum componentd soma macros na mão.
 */

import type { MealItem, PlannedMeal } from '../types';
import { ValidationError, requireFiniteNumber } from './types';

export interface MealTotals {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

/** Somatório de uma refeição — sempre derivado dos itens, jamais editado à mão. */
export function sumMealItems(items: MealItem[]): MealTotals {
  const totals: MealTotals = { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const item of items) {
    totals.caloriesKcal += item.calories;
    totals.proteinG += item.protein;
    totals.carbsG += item.carbs;
    totals.fatG += item.fat;
    totals.fiberG += item.fiber ?? 0;
  }
  // kcal inteiras; macros 1 decimal (mesma precisão exibida nos itens).
  totals.caloriesKcal = Math.round(totals.caloriesKcal);
  totals.proteinG = Math.round(totals.proteinG * 10) / 10;
  totals.carbsG = Math.round(totals.carbsG * 10) / 10;
  totals.fatG = Math.round(totals.fatG * 10) / 10;
  totals.fiberG = Math.round(totals.fiberG * 10) / 10;
  return totals;
}

/** Consistência interna de um item: macros × Atwater não podem mentir a kcal. */
export function validateItemEnergy(item: MealItem): void {
  const kcal = Math.round(item.protein * 4 + item.carbs * 4 + item.fat * 9);
  if (Math.abs(item.calories - kcal) > 6) {
    throw new ValidationError(
      `item:${item.id}.calories`,
      `${item.calories} kcal não fecha com P ${item.protein} × C ${item.carbs} × F ${item.fat} (Atwater: ${kcal})`,
    );
  }
}

/** Consumo do dia derivado das refeições COMPLETADAS (mesma semântica do app). */
export function computeConsumedFromMeals(meals: PlannedMeal[]): MealTotals {
  const consumed: MealTotals = { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const meal of meals) {
    if (!meal.completed) continue;
    const totals = sumMealItems(meal.items);
    consumed.caloriesKcal += totals.caloriesKcal;
    consumed.proteinG += totals.proteinG;
    consumed.carbsG += totals.carbsG;
    consumed.fatG += totals.fatG;
    consumed.fiberG += totals.fiberG;
  }
  consumed.caloriesKcal = Math.round(consumed.caloriesKcal);
  consumed.proteinG = Math.round(consumed.proteinG);
  consumed.carbsG = Math.round(consumed.carbsG);
  consumed.fatG = Math.round(consumed.fatG);
  return consumed;
}

/**
 * Delta da refeição vs. meta — para a linha "×de ~meta kcal" com sinal.
 * Meta inválida (≤ 0) é recusada: quem gera a meta é o motor determinístico.
 */
export function mealVsTarget(meal: PlannedMeal): { overKcal: number; percentOfTarget: number; hasTarget: boolean } {
  const totals = sumMealItems(meal.items);
  // Refeição avulsa (§6) nasce sem meta — 0 kcal de alvo é "sem meta", não erro.
  if (meal.targetCalories === 0) {
    return { overKcal: Math.round(totals.caloriesKcal), percentOfTarget: 0, hasTarget: false };
  }
  const target = requireFiniteNumber(meal.targetCalories, 'meal.targetCalories', 1, 5000);
  return {
    overKcal: Math.round(totals.caloriesKcal - target),
    percentOfTarget: Math.round((totals.caloriesKcal / target) * 100),
    hasTarget: true,
  };
}

/**
 * Refeição AVULSA (§6): registro livre do que o usuário COMEU de fato,
 * fora do plano. Vira meal no fim da lista; consumo do dia é re-derivado
 * pelo mesmo caminho do resto (nunca somado "por fora").
 */
export function createFreeMeal(id: string, name?: string): PlannedMeal {
  if (!id || !id.trim()) {
    throw new ValidationError('id', 'id da refeição avulsa é obrigatório');
  }
  const n = (name ?? '').trim();
  return {
    id: id.trim(),
    name: n.length > 0 && n.length <= 40 ? n : 'Refeição avulsa',
    time: '',
    targetCalories: 0,
    items: [],
    completed: false,
  };
}
