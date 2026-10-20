/**
 * TESTES DO MOTOR DETERMINÍSTICO (node:test + tsx)
 * Execução: npm test  →  node --import tsx --test src/engine/engine.test.ts
 * Cobertura §18: fórmulas metabólicas, consistência de macros, entradas
 * ausentes/inválidas, clamps de segurança, distribuição por refeições.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { estimateBmr, activityFactor, estimateTee } from './energy';
import { computeNutritionTargets, distributeMeals } from './macros';
import { ValidationError } from './types';

// ---------------------------------------------------------------------------
// 1. Fórmulas de repouso
// ---------------------------------------------------------------------------
describe('estimateBmr (Mifflin-St Jeor)', () => {
  it('masculino 79.5 kg / 178 cm / 28 anos → 1773 kcal (baseline do app)', () => {
    const r = estimateBmr({ weightKg: 79.5, heightCm: 178, ageYears: 28, sex: 'masculino' });
    assert.equal(r.bmrKcalPerDay, 1773);
    assert.equal(r.method, 'mifflin_st_jeor');
    assert.equal(r.leanMassKg, undefined);
    assert.ok(r.formula.length > 0);
    assert.ok(r.limitations.length > 10);
  });

  it('feminino usa −161 (60 kg / 165 cm / 25 anos → 1345 kcal)', () => {
    const r = estimateBmr({ weightKg: 60, heightCm: 165, ageYears: 25, sex: 'feminino' });
    assert.equal(r.bmrKcalPerDay, 1345);
  });

  it('com LBM de avaliador externo → Katch-McArdle', () => {
    const r = estimateBmr({
      weightKg: 79.5,
      heightCm: 178,
      ageYears: 28,
      sex: 'masculino',
      evaluatorLeanMassKg: 68.7,
    });
    assert.equal(r.method, 'katch_mcardle');
    assert.equal(r.bmrKcalPerDay, Math.round(370 + 21.6 * 68.7));
    assert.equal(r.leanMassKg, 68.7);
  });

  it('LBM de avaliador maior que o peso → erro (avaliação inconsistente)', () => {
    assert.throws(
      () =>
        estimateBmr({
          weightKg: 70,
          heightCm: 178,
          ageYears: 28,
          sex: 'masculino',
          evaluatorLeanMassKg: 75,
        }),
      /inconsistente/,
    );
  });

  it('entra inválida → ValidationError com nome do campo', () => {
    assert.throws(
      () => estimateBmr({ weightKg: 79.5, heightCm: 178, ageYears: NaN, sex: 'masculino' }),
      (e: unknown) => e instanceof ValidationError && e.field === 'ageYears',
    );
    assert.throws(
      () => estimateBmr({ weightKg: 20, heightCm: 178, ageYears: 28, sex: 'masculino' }),
      ValidationError,
    );
    // & undefined no lugar de número
    assert.throws(
      () =>
        estimateBmr({
          weightKg: undefined as unknown as number,
          heightCm: 178,
          ageYears: 28,
          sex: 'masculino',
        }),
      (e: unknown) => e instanceof ValidationError && /ausente|não numérico/.test(e.message),
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Fator de atividade e TEE
// ---------------------------------------------------------------------------
describe('estimateTee / activityFactor', () => {
  it('fatores ficam na faixa 1.25–1.65 e replicam o app (freq 4 + ativo → 1.5)', () => {
    assert.equal(activityFactor('ativo', 4), 1.5);
    assert.equal(activityFactor('sedentario', 0), 1.25);
    assert.equal(activityFactor('moderado', 3), 1.375);
    assert.equal(activityFactor('muito_ativo', 2), 1.65);
    for (const f of [1.25, 1.375, 1.5, 1.65]) assert.ok(f >= 1.2 && f <= 1.7);
  });

  it('TEE do baseline: 1773 × 1.5 = 2660 kcal/dia', () => {
    const r = estimateTee({
      weightKg: 79.5,
      heightCm: 178,
      ageYears: 28,
      sex: 'masculino',
      activityLevel: 'ativo',
      frequencyDaysPerWeek: 4,
    });
    assert.equal(r.teeKcalPerDay, 2660);
    assert.ok(r.limitations.includes('±10–15%'));
  });

  it('freq inválida (9 dias/semana) → erro', () => {
    assert.throws(
      () => activityFactor('ativo', 9),
      (e: unknown) => e instanceof ValidationError && e.field === 'frequencyDaysPerWeek',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Metas nutricionais
// ---------------------------------------------------------------------------
const baseInput = {
  goal: 'hipertrofia' as const,
  sex: 'masculino' as const,
  weightKg: 79.5,
  heightCm: 178,
  ageYears: 28,
  activityLevel: 'ativo' as const,
  frequencyDaysPerWeek: 4,
};

describe('computeNutritionTargets', () => {
  it('baseline hipertrofia: 2960 kcal · 159 P · 419 C · 72 F (replica o app)', () => {
    const r = computeNutritionTargets(baseInput);
    assert.equal(r.teeKcalPerDay, 2660);
    assert.equal(r.strategy, 'superavit');
    assert.equal(r.calorieDeltaKcalPerDay, 300);
    assert.equal(r.targets.caloriesKcalPerDay, 2960);
    assert.equal(r.targets.proteinGramsPerDay, 159);
    assert.equal(r.targets.carbsGramsPerDay, 419);
    assert.equal(r.targets.fatGramsPerDay, 72);
    assert.equal(r.targets.fiberGramsPerDay, 41);
    assert.equal(r.targets.waterMillilitersPerDay, 3180);
    assert.deepEqual(r.audit.warnings, []);
  });

  it('consistência energética 4/4/9 fecha em ≤ 10 kcal', () => {
    for (const goal of ['perda_gordura', 'recomposicao', 'hipertrofia', 'manutencao', 'ganho_peso', 'performance'] as const) {
      const r = computeNutritionTargets({ ...baseInput, goal });
      const kcal =
        r.targets.proteinGramsPerDay * 4 + r.targets.carbsGramsPerDay * 4 + r.targets.fatGramsPerDay * 9;
      assert.ok(
        Math.abs(r.targets.caloriesKcalPerDay - kcal) <= 10,
        `${goal}: meta ${r.targets.caloriesKcalPerDay} vs macros ${kcal}`,
      );
      assert.ok(Math.abs(r.audit.roundingSlackKcal) <= 10);
    }
  });

  it('piso calórico por sexo entra antes de vender meta extrema', () => {
    const r = computeNutritionTargets({
      ...baseInput,
      weightKg: 45,
      heightCm: 150,
      ageYears: 80,
      frequencyDaysPerWeek: 0,
      activityLevel: 'sedentario',
      sex: 'feminino',
      goal: 'perda_gordura',
    });
    assert.equal(r.targets.caloriesKcalPerDay, 1200);
    assert.ok(r.audit.warnings.some((w) => /piso/.test(w)));
  });

  it('déficit clampa em 25% do TEE (ganho de peso nunca autoriza +450 sobre TEE baixo)', () => {
    const r = computeNutritionTargets({
      ...baseInput,
      weightKg: 35,
      heightCm: 150,
      ageYears: 25,
      frequencyDaysPerWeek: 0,
      activityLevel: 'sedentario',
      goal: 'ganho_peso',
    });
    const maxSurplus = Math.round(r.teeKcalPerDay * 0.2);
    assert.equal(r.calorieDeltaKcalPerDay, maxSurplus);
    assert.ok(r.audit.warnings.some((w) => /superávit/.test(w)));
  });

  it('proteína parametrizável, mas presa no intervalo fundamentado [1.4, 2.7] g/kg', () => {
    const hi = computeNutritionTargets({
      ...baseInput,
      params: { proteinGramsPerKg: 3.5 },
    });
    assert.equal(hi.audit.proteinGramsPerKg, 2.7);
    assert.ok(hi.audit.warnings.some((w) => /proteína/.test(w)));

    const lo = computeNutritionTargets({
      ...baseInput,
      params: { proteinGramsPerKg: 1.6 },
    });
    assert.equal(hi.audit.proteinGramsPerKg, 2.7); // hi não contamina lo
    assert.equal(lo.audit.proteinGramsPerKg, 1.6);
    assert.deepEqual(lo.audit.warnings, []);
  });

  it('gordura mínima 0.6 g/kg respeitada com aviso', () => {
    const r = computeNutritionTargets({
      ...baseInput,
      params: { fatGramsPerKg: 0.3 },
    });
    assert.equal(r.audit.fatGramsPerKg, 0.6);
    assert.ok(r.audit.warnings.some((w) => /gordura/.test(w)));
  });

  it('meta que não fecha nem com proteína+gordura mínima: cancela com erro, nunca inventa carbo negativo', () => {
    // Obesidade grave (250 kg): déficit -450 sobre TEE 4634 → meta 4184 kcal,
    // mas proteína 2.7 g/kg permitido (675 g = 2700 kcal) + gordura 0.9 g/kg
    // (225 g = 2025 kcal) somam 4725 kcal > meta. O motor falha alto em vez
    // de inventar carbo negativo — caso real onde a prescrição exige
    // reavaliação profissional dos parâmetros, não arredondamento silencioso.
    assert.throws(() =>
      computeNutritionTargets({
        ...baseInput,
        weightKg: 250,
        heightCm: 160,
        ageYears: 50,
        sex: 'feminino',
        goal: 'perda_gordura',
        params: { proteinGramsPerKg: 2.7 },
      }),
      (e: unknown) => e instanceof ValidationError && e.field === 'targetCalories',
    );
  });

  it('dado ausente explodido explicitamente (nada de valor falso para ausente)', () => {
    assert.throws(
      () =>
        computeNutritionTargets({
          ...baseInput,
          ageYears: undefined as unknown as number,
        }),
      (e: unknown) => e instanceof ValidationError && e.field === 'ageYears',
    );
    assert.throws(
      () =>
        computeNutritionTargets({
          ...baseInput,
          activityLevel: 'maratonista' as never,
        }),
      ValidationError,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Distribuição por refeição
// ---------------------------------------------------------------------------
describe('distributeMeals', () => {
  const perDay = {
    caloriesKcalPerDay: 2960,
    proteinGramsPerDay: 159,
    carbsGramsPerDay: 419,
    fatGramsPerDay: 72,
  };

  it('soma das refeições fecha exatamente com o dia', () => {
    const meals = distributeMeals(perDay, [0.25, 0.35, 0.2, 0.2]);
    assert.equal(meals.length, 4);
    assert.equal(meals.reduce((a, m) => a + m.caloriesKcal, 0), 2960);
    assert.equal(meals.reduce((a, m) => a + m.proteinG, 0), 159);
    assert.equal(meals.reduce((a, m) => a + m.carbsG, 0), 419);
    assert.equal(meals.reduce((a, m) => a + m.fatG, 0), 72);
  });

  it('parcel difere ao mudar os pesos (4 refeições → 5 com lanche inicial)', () => {
    const four = distributeMeals(perDay, [0.25, 0.35, 0.2, 0.2]);
    const five = distributeMeals(perDay, [0.2, 0.3, 0.15, 0.2, 0.15]);
    assert.ok(
      Math.abs(four[0].caloriesKcal - five[0].caloriesKcal) > 0,
      'primeira refeição deve mudar entre layouts',
    );
    assert.equal(five.reduce((a, m) => a + m.caloriesKcal, 0), 2960);
  });

  it('pesos inválidos (0 → soma 0) rejeitados', () => {
    assert.throws(() => distributeMeals(perDay, [0.25, 0, -0.05]), ValidationError);
    assert.throws(() => distributeMeals(perDay, []), ValidationError);
  });
});
