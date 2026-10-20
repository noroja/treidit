/**
 * TESTES DO BANCO DE ALIMENTOS E SUBSTITUIÇÕES (node:test + tsx)
 * §18: somatórios nutricionais, substituições, valores inválidos, unidades.
 * Execução: npm test (roda junto com engine.test.ts)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  FOODS,
  foodKcalPer100g,
  atwaterKcal,
  getFood,
  scaleMacros,
  findSubstitutes,
  foodRole,
  PORTION_MAX_G,
} from './foods';
import { sumMealItems, computeConsumedFromMeals, validateItemEnergy, mealVsTarget } from './meals';
import { ValidationError } from './types';
import type { MealItem, PlannedMeal } from '../types';

describe('banco de alimentos — integridade (§6: nunca inventar kcal)', () => {
  it('TODOS os alimentos: kcal = Atwater dos macros (a linha kcal nunca mente)', () => {
    for (const food of FOODS) {
      const derived = atwaterKcal(food.proteinPer100g, food.carbsPer100g, food.fatPer100g);
      assert.equal(
        foodKcalPer100g(food),
        derived,
        `${food.id}: kcal armazenada diverge do Atwater dos macros`,
      );
      assert.ok(food.source, `${food.id}: sem fonte documentada`);
      assert.ok(['TACO', 'USDA', 'rótulo', 'TACO/USDA'].includes(food.source));
      assert.ok(food.proteinPer100g >= 0 && food.carbsPer100g >= 0 && food.fatPer100g >= 0);
    }
  });

  it('ids únicos e grupos válidos', () => {
    const ids = new Set<string>();
    for (const f of FOODS) {
      assert.ok(!ids.has(f.id), `id duplicado: ${f.id}`);
      ids.add(f.id);
      assert.ok(foodRole(f.group));
    }
    assert.ok(FOODS.length >= 20, 'base curada deve ter pelo menos 20 alimentos');
  });

  it('getFood desconhecido → erro explícito (não undefined silencioso)', () => {
    assert.throws(() => getFood(' Pizza '), /desconhecido/);
    assert.equal(getFood('ovo_cozido').proteinPer100g, 13.3);
  });
});

describe('scaleMacros — proção com validação estrita', () => {
  const frango = getFood('frango_peito_grelhado');

  it('180 g de frango: P 55.8 · kcal 284 (31×1.8 e Atwater das macros escaladas)', () => {
    const p = scaleMacros(frango, 180);
    assert.equal(p.grams, 180);
    assert.equal(p.proteinG, 55.8);
    assert.equal(p.caloriesKcal, Math.round(55.8 * 4 + 3.6 * 1.8 * 9));
    assert.equal(p.fiberG, 0);
  });

  it('quantidades inválidas são REJEITADAS, não corrigidas', () => {
    assert.throws(() => scaleMacros(frango, 0), ValidationError);
    assert.throws(() => scaleMacros(frango, -50), ValidationError);
    assert.throws(() => scaleMacros(frango, NaN), ValidationError);
    assert.throws(() => scaleMacros(frango, PORTION_MAX_G + 1), ValidationError);
    assert.throws(() => scaleMacros(frango, undefined as unknown as number), /grams/);
  });

  it('fibras escalam com a porção (feijão 100 g → 8.5 g fibra)', () => {
    const feijao = getFood('feijao_preto_cozido');
    assert.equal(scaleMacros(feijao, 100).fiberG, 8.5);
    assert.equal(scaleMacros(feijao, 200).fiberG, 17);
  });
});

describe('findSubstitutes — equivalência por papel, não por peso', () => {
  const frango = getFood('frango_peito_grelhado');

  it('frango 180 g → sugestões do PAPEL proteico, sem o próprio, kcal ≈', () => {
    const subs = findSubstitutes(frango, 180);
    assert.ok(subs.length > 0);
    const roles = new Set(subs.map((s) => foodRole(s.food.group)));
    assert.equal(roles.size, 1);
    for (const s of subs) {
      assert.equal(foodRole(s.food.group), 'proteina');
      assert.notEqual(s.food.id, frango.id);
      assert.ok(s.suggestedGrams >= 5 && s.suggestedGrams % 5 === 0);
      // escala casa kcal dentro da tolerância
      assert.ok(Math.abs(s.portion.caloriesKcal - 284) < 284 * 0.35, `${s.food.id} fora da faixa`);
    }
  });

  it(' Gordura não sugere proteína: azeite ↔ itens de papel gordura', () => {
    const azeite = getFood('azeite_oliva');
    const subs = findSubstitutes(azeite, 8);
    for (const s of subs) {
      assert.equal(foodRole(s.food.group), 'gordura');
    }
    assert.ok(subs.length > 0, 'pasta de amendoim / castanha devem aparecer para azeite');
  });

  it('proteínas por proteína: patinho e atum aparecem; proteína delta exibida', () => {
    const patinho = getFood('patinho_grelhado');
    const subs = findSubstitutes(patinho, 130);
    for (const s of subs) assert.equal(foodRole(s.food.group), 'proteina');
    const hasProteinDelta = subs.every((s) => typeof s.proteinDeltaG === 'number');
    assert.ok(hasProteinDelta);
  });

  it(' vegetais (volume) substituem vegetais; porção sugerida ≥ mínimo', () => {
    const brocolis = getFood('brocolis_cenoura');
    const subs = findSubstitutes(brocolis, 120);
    assert.ok(subs.length > 0);
    for (const s of subs) {
      assert.equal(foodRole(s.food.group), 'vegetal');
      assert.ok(s.portion.proteinG < 8, 'vegetais não viram fontes proteicas de 30 g');
    }
  });
});

describe('somatórios de refeição — o total sempre deriva dos itens', () => {
  const items: MealItem[] = [
    { id: 'a', name: 'frango', portion: '180g', calories: 284, protein: 55.8, carbs: 0, fat: 6.5 },
    { id: 'b', name: 'arroz', portion: '160g', calories: 203, protein: 4, carbs: 44.8, fat: 0.3, fiber: 2.6 },
  ];

  it('sumMealItems fecha item a item e mantém fibra opcional', () => {
    const t = sumMealItems(items);
    assert.equal(t.caloriesKcal, 487);
    assert.equal(t.proteinG, 59.8);
    assert.equal(t.carbsG, 44.8);
    assert.equal(t.fatG, 6.8);
    assert.equal(t.fiberG, 2.6);
  });

  it('item com kcal mentirosa → recusado na validação energética', () => {
    const liar: MealItem = { id: 'x', name: 'x', portion: '1', calories: 999, protein: 1, carbs: 1, fat: 1 };
    assert.throws(() => validateItemEnergy(liar), (e: unknown) => e instanceof ValidationError);
    const honest: MealItem = { id: 'y', name: 'y', portion: '1', calories: 12, protein: 1, carbs: 1, fat: 1 };
    assert.doesNotThrow(() => validateItemEnergy(honest)); // 4+4+9=17, folga 6 → 12 passa? |12-17|=5 ✓
  });

  it('consumo do dia soma APENAS refeições completadas', () => {
    const meals: PlannedMeal[] = [
      { id: 'm1', name: 'a', time: '07:30', targetCalories: 500, completed: true, items },
      { id: 'm2', name: 'b', time: '12:30', targetCalories: 1000, completed: false, items },
    ];
    const consumed = computeConsumedFromMeals(meals);
    assert.equal(consumed.caloriesKcal, 487);
    assert.equal(consumed.proteinG, 60); // arredondado final
  });

  it('mealVsTarget: delta sinalizado contra a meta (meta ≤ 0 rejeitada)', () => {
    const meal: PlannedMeal = { id: 'm', name: 'a', time: '07:30', targetCalories: 500, completed: false, items };
    const delta = mealVsTarget(meal);
    assert.equal(delta.overKcal, -13); // 487 − 500
    assert.equal(delta.percentOfTarget, 97);
    assert.throws(() => mealVsTarget({ ...meal, targetCalories: 0 }), ValidationError);
  });
});
