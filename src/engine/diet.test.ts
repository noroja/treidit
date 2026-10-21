/**
 * Testes do construtor de dieta: refeições por padrão alimentar, porções
 * derivadas do banco e aderência honesta às metas (sem ajuste oculto).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDietPlan, defaultDietConstraints, type DietConstraints } from './dietBuilder';
import { deriveDietConstraints, type Anamnesis } from './anamnesis';
import { FOODS } from './foods';
import { ValidationError } from './types';

const targets = {
  caloriesKcalPerDay: 2400,
  proteinGramsPerDay: 160,
  carbsGramsPerDay: 280,
  fatGramsPerDay: 70,
};

function anamnesisWith(patch: Partial<Anamnesis['nutrition']>): Anamnesis {
  return {
    version: 1,
    createdAt: '',
    updatedAt: '',
    identification: { name: 'Teste', age: 30, sex: 'masculino', heightCm: 178, weightKg: 80 },
    health: { conditions: ['nenhuma'], medicalClearance: 'sim', medications: '', surgeries: '', smoker: false, alcohol: 'social' },
    injuries: { painRegions: [], painLevel: 0, notes: '' },
    training: {
      experience: 'intermediario',
      currentlyTrains: true,
      currentRoutineText: 'x',
      daysPerWeek: 4,
      sessionMinutes: 60,
      equipment: 'academia_completa',
      preferredExercises: [],
      dislikedExercises: [],
      cardio: '1-2x',
    },
    nutrition: {
      pattern: 'onivoro',
      restrictions: [],
      allergiesNotes: '',
      mealsPerDay: 4,
      cooksAtHome: 'sim',
      eatingOut: '1-2x',
      budget: 'medio',
      supplements: [],
      ...patch,
    },
    lifestyle: { sleepHours: 7.5, sleepQuality: 'boa', stress: 2, workContext: 'sentado' },
    measurements: { waistCm: 80, neckCm: 38 },
    goal: { primary: 'hipertrofia', pace: 'moderado', priority: 'saude' },
  };
}

test('monta 4 refeições com porções e kcal derivadas do banco', () => {
  const result = buildDietPlan({ targets });
  assert.equal(result.meals.length, 4);

  for (const meal of result.meals) {
    assert.ok(meal.items.length >= 2, `${meal.name} deveria ter ao menos 2 itens`);
    assert.ok(meal.targetCalories > 0);
    for (const item of meal.items) {
      assert.ok(item.foodId && FOODS.some((f) => f.id === item.foodId), 'item deve apontar para alimento do banco');
      assert.ok((item.grams ?? 0) >= 5);
      const expectedKcal = Math.round(item.protein * 4 + item.carbs * 4 + item.fat * 9);
      assert.equal(item.calories, expectedKcal, 'kcal do item deve fechar por Atwater');
    }
  }

  assert.ok(Math.abs(result.audit.deviationKcalPct) <= 15, `desvio ${result.audit.deviationKcalPct}%`);
  assert.equal(result.audit.missingSlots.length, 0);
});

test('padrão vegano só usa alimentos compatíveis', () => {
  const constraints: DietConstraints = deriveDietConstraints(anamnesisWith({ pattern: 'vegano' }));
  const result = buildDietPlan({ targets, mealsPerDay: 4, constraints });
  const blocked = new Set(constraints.blockedFoodIds);
  for (const meal of result.meals) {
    for (const item of meal.items) {
      assert.equal(blocked.has(item.foodId!), false, `${item.name} não deveria aparecer no vegano`);
      const food = FOODS.find((f) => f.id === item.foodId)!;
      assert.notEqual(food.group, 'proteina_animal');
      assert.notEqual(food.group, 'lacteo');
    }
  }
  assert.ok(result.audit.constraintsApplied.some((c) => c.includes('vegano')));
  assert.ok(result.meals.some((m) => m.items.some((i) => i.foodId === 'tofu_firmo' || i.foodId === 'proteina_soja_isolada')));
});

test('vegetariano sem lactose fecha kcal do alvo sem carne/laticínio (regressão de porção)', () => {
  const constraints = deriveDietConstraints(
    anamnesisWith({ pattern: 'vegetariano', restrictions: ['lactose'], mealsPerDay: 5 }),
  );
  const vegTargets = {
    caloriesKcalPerDay: 1568,
    proteinGramsPerDay: 124,
    carbsGramsPerDay: 142,
    fatGramsPerDay: 56,
  };
  const result = buildDietPlan({ targets: vegTargets, mealsPerDay: 5, constraints });

  const blocked = new Set(constraints.blockedFoodIds);
  for (const meal of result.meals) {
    for (const item of meal.items) {
      assert.equal(blocked.has(item.foodId!), false, `${item.name} não deveria aparecer`);
      const food = FOODS.find((f) => f.id === item.foodId)!;
      assert.notEqual(food.group, 'lacteo');
      assert.equal(['frango_peito_grelhado', 'patinho_grelhado', 'tilapia_grelhada', 'atum_agua'].includes(food.id), false);
    }
  }
  assert.ok(Math.abs(result.audit.deviationKcalPct) <= 12, `desvio ${result.audit.deviationKcalPct}%`);
});

test('quantidade de refeições respeita 3, 5 e 6', () => {
  for (const count of [3, 5, 6]) {
    const result = buildDietPlan({ targets, mealsPerDay: count });
    assert.equal(result.meals.length, count);
    const sumTargets = result.meals.reduce((s, m) => s + m.targetCalories, 0);
    assert.ok(Math.abs(sumTargets - targets.caloriesKcalPerDay) <= 2, 'kcal por refeição soma o alvo');
  }
});

test('restrição sem substituto registra lacuna em vez de inventar alimento', () => {
  const constraints: DietConstraints = {
    ...defaultDietConstraints(4),
    blockedGroups: ['fruta', 'carboidrato'],
  };
  const result = buildDietPlan({ targets, constraints });
  assert.ok(result.audit.missingSlots.length > 0);
  assert.ok(result.audit.notes.length > 0);
});

test('rejeita contagem de refeições fora de 3–6', () => {
  assert.throws(() => buildDietPlan({ targets, mealsPerDay: 7 }), ValidationError);
});
