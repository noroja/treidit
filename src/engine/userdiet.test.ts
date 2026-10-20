/**
 * TESTES: treino próprio do usuário, dieta própria e refeição avulsa (§7).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildCustomProgram } from './training';
import { validateUserTargets } from './macros';
import { createFreeMeal, mealVsTarget } from './meals';
import { ValidationError } from './types';
import { applyUserDietTargets } from '../utils/calculations';
import { INITIAL_USER_PROFILE } from '../data/initialData';

describe('buildCustomProgram — treino que o usuário já faz', () => {
  const ex = (id: string, name: string) => ({
    exerciseId: id,
    exerciseName: name,
    targetMuscle: 'Peito',
    equipment: 'Barra',
    workingSets: 3,
    repsTarget: '8-12',
    targetRir: 2,
    restSeconds: 120,
  });

  it('monta programa válido com splitType personalizado', () => {
    const p = buildCustomProgram({
      name: 'Medsplit do normal',
      routines: [{ name: 'A', exercises: [ex('s1', 'Supino Reto')], focus: 'Push' }],
    });
    assert.equal(p.splitType, 'personalizado');
    assert.equal(p.routines[0].exercises[0].repsTarget, '8-12');
    assert.match(p.scienceNotes, /usuário/i);
  });

  it('rejeita faixa de reps irrecognoscível, séries fora de 1-10 e descanso absurdo', () => {
    assert.throws(() => buildCustomProgram({
      name: 'X',
      routines: [{ name: 'A', exercises: [{ ...ex('s1', 'Supino'), repsTarget: 'até falhar' }] }] as never,
    }), ValidationError);
    assert.throws(() => buildCustomProgram({
      name: 'X',
      routines: [{ name: 'A', exercises: [{ ...ex('s1', 'Supino'), workingSets: 12 }] }] as never,
    }), ValidationError);
    assert.throws(() => buildCustomProgram({
      name: 'X',
      routines: [{ name: 'A', exercises: [{ ...ex('s1', 'Supino'), restSeconds: 5 }] }] as never,
    }), ValidationError);
    assert.throws(() => buildCustomProgram({ name: '', routines: [] as never }), ValidationError);
  });
});

describe('validateUserTargets — dieta que o usuário já usa', () => {
  it('deriva calorias por Atwater 4/4/9 (nunca digitadas)', () => {
    const v = validateUserTargets(80, 'masculino', { proteinGrams: 160, carbsGrams: 300, fatGrams: 70 });
    assert.equal(v.caloriesKcal, 160 * 4 + 300 * 4 + 70 * 9);
  });

  it('bloqueia proteína fora de [0,6 ; 3,5] g/kg', () => {
    assert.throws(() => validateUserTargets(80, 'masculino', { proteinGrams: 300, carbsGrams: 200, fatGrams: 70 }), ValidationError);
    assert.throws(() => validateUserTargets(80, 'masculino', { proteinGrams: 30, carbsGrams: 200, fatGrams: 70 }), ValidationError);
  });

  it('bloqueia gordura < 0,6 g/kg e piso calórico por sexo', () => {
    assert.throws(() => validateUserTargets(80, 'masculino', { proteinGrams: 150, carbsGrams: 200, fatGrams: 40 }), ValidationError);
    assert.throws(() => validateUserTargets(80, 'masculino', { proteinGrams: 100, carbsGrams: 30, fatGrams: 50 }), ValidationError);
    assert.throws(() => validateUserTargets(60, 'feminino', { proteinGrams: 90, carbsGrams: 100, fatGrams: 40 }), ValidationError);
  });
});

describe('applyUserDietTargets — plano oficial mantido do usuário', () => {
  it('gera plano com metas do usuário, estratégia e auditoria honesta', () => {
    const plan = applyUserDietTargets(INITIAL_USER_PROFILE, { proteinGrams: 160, carbsGrams: 280, fatGrams: 70 });
    assert.equal(plan.targetMacros.calories, 160 * 4 + 280 * 4 + 70 * 9);
    assert.equal(plan.targetMacros.proteinGrams, 160);
    assert.ok(plan.meals.every((m) => m.items.length === 0), 'não inventa itens');
    assert.equal(plan.audit?.energyMethod, 'definido_pelo_usuario');
    assert.match(String(plan.audit?.warnings[0]), /USU/);
    assert.ok(plan.tdee > 0);
  });

  it('extremo é rejeitado — nada é silenciosamente corrigido', () => {
    assert.throws(() => applyUserDietTargets(INITIAL_USER_PROFILE, { proteinGrams: 400, carbsGrams: 0, fatGrams: 100 }), ValidationError);
  });
});

describe('createFreeMeal — registrar o que saiu do plano', () => {
  it('cria refeição avulsa vazia com nome seguro', () => {
    const m = createFreeMeal('meal_free_1', 'Festa de aniversário');
    assert.equal(m.id, 'meal_free_1');
    assert.equal(m.name, 'Festa de aniversário');
    assert.equal(m.targetCalories, 0);
    assert.deepEqual(m.items, []);

    const fallback = createFreeMeal('meal_free_2', '   ');
    assert.equal(fallback.name, 'Refeição avulsa');
  });

  it('id obrigatório', () => {
    assert.throws(() => createFreeMeal(''), ValidationError);
  });
});

describe('mealVsTarget — refeição avulsa sem meta (regressão do crash)', () => {
  it('targetCalories 0 é "sem meta": soma calórica, percento 0, sem exceção', () => {
    const meal = createFreeMeal('m1');
    const r = mealVsTarget(meal);
    assert.equal(r.hasTarget, false);
    assert.equal(r.percentOfTarget, 0);
    assert.equal(r.overKcal, 0);
  });

  it('refeição com meta continua retornando % do alvo', () => {
    const r = mealVsTarget({
      id: 'x', name: 'Almoço', time: '12:30', targetCalories: 800,
      items: [{ id: 'i', name: 'Frango', portion: '100g', calories: 200, protein: 40, carbs: 0, fat: 4 }],
      completed: false,
    });
    assert.equal(r.hasTarget, true);
    assert.equal(r.percentOfTarget, 25);
    assert.equal(r.overKcal, -600);
  });
});
