/**
 * Testes da anamnese: triagem, derivação e personalização do programa.
 * Regra: risco alto BLOQUEIA prescrição normal; restrições alimentares filtram
 * o banco; lesões substituem exercícios; experiência limita séries.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAnamnesisToProgram,
  deriveAnthropometry,
  deriveDietConstraints,
  deriveProfile,
  triageAnamnesis,
  type Anamnesis,
} from './anamnesis';
import { generateWorkoutProgram } from '../utils/calculations';
import { FOODS } from './foods';

function baseAnamnesis(overrides: Partial<Anamnesis> = {}): Anamnesis {
  return {
    version: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    identification: { name: 'Joana Teste', age: 31, sex: 'feminino', heightCm: 168, weightKg: 68 },
    health: {
      conditions: ['nenhuma'],
      medicalClearance: 'sim',
      medications: '',
      surgeries: '',
      smoker: false,
      alcohol: 'social',
    },
    injuries: { painRegions: [], painLevel: 0, notes: '' },
    training: {
      experience: 'intermediario',
      currentlyTrains: true,
      currentRoutineText: 'Upper/lower 4x',
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
    },
    lifestyle: { sleepHours: 7.5, sleepQuality: 'boa', stress: 2, workContext: 'sentado' },
    measurements: { waistCm: 74, neckCm: 32, hipCm: 98, armCm: 32, thighCm: 56, calfCm: 35 },
    goal: { primary: 'hipertrofia', pace: 'moderado', priority: 'saude' },
    ...overrides,
  };
}

test('anamnese completa é reconhecida como triagem apta e sem red flags', () => {
  const triage = triageAnamnesis(baseAnamnesis());
  assert.equal(triage.complete, true);
  assert.equal(triage.completenessPct, 100);
  assert.equal(triage.risk, 'baixo');
  assert.equal(triage.requiresMedicalClearance, false);
  assert.equal(triage.redFlags.length, 0);
  assert.ok(triage.weeklySetCap >= 12 && triage.weeklySetCap <= 18);
  assert.equal(triage.recommendedFrequency, 4);
});

test('cardiopatia eleva risco e exige liberação médica', () => {
  const a = baseAnamnesis();
  a.health.conditions = ['cardiopatia'];
  a.health.medicalClearance = 'nao';
  const triage = triageAnamnesis(a);
  assert.equal(triage.risk, 'alto');
  assert.equal(triage.requiresMedicalClearance, true);
  assert.ok(triage.redFlags.some((f) => f.toLowerCase().includes('liberação médica')));
  assert.ok(triage.weeklySetCap <= 16);
});

test('dor intensa reduz frequência e volume', () => {
  const a = baseAnamnesis();
  a.injuries = { painRegions: ['joelho'], painLevel: 8, notes: 'dor ao agachar' };
  const triage = triageAnamnesis(a);
  assert.equal(triage.risk, 'alto');
  assert.ok(triage.recommendedFrequency <= 3);
  assert.ok(triage.weeklySetCap <= 14);
});

test('perfil derivado usa frequência triada, objetivo e limitações textuais', () => {
  const a = baseAnamnesis();
  a.goal.primary = 'perda_gordura';
  a.injuries = { painRegions: ['lombar'], painLevel: 3, notes: '' };
  const profile = deriveProfile(a);
  assert.equal(profile.name, 'Joana Teste');
  assert.equal(profile.goal, 'perda_gordura');
  assert.equal(profile.frequencyDays, 4);
  assert.match(profile.limitations, /lombar/i);
});

test('antropometria derivada não inventa medida não informada', () => {
  const a = baseAnamnesis();
  const anth = deriveAnthropometry(a, 24.5, '2026-10-20');
  assert.equal(anth.weightKg, 68);
  assert.equal(anth.waistCm, 74);
  assert.equal(anth.estimatedBodyFatPct, 24.5);
  assert.equal(anth.estimatedLeanMassKg, Math.round(68 * 0.755 * 10) / 10);
  assert.equal(anth.armCm, 32);
});

test('padrão vegano bloqueia carne, peixe, ovos, laticínios e whey', () => {
  const a = baseAnamnesis();
  a.nutrition.pattern = 'vegano';
  a.nutrition.restrictions = ['lactose', 'gluten'];
  const c = deriveDietConstraints(a);
  const blocked = new Set(c.blockedFoodIds);
  for (const id of ['frango_peito_grelhado', 'patinho_grelhado', 'tilapia_grelhada', 'ovo_cozido', 'iogurte_desnatado', 'whey_concentrado', 'pao_integral']) {
    assert.equal(blocked.has(id), true, `esperava ${id} bloqueado`);
  }
  assert.equal(blocked.has('tofu_firmo'), false);
  assert.ok(c.notes.some((n) => n.includes('vegano')));
});

test('programa personalizado remove exercícios de risco e aplica teto de séries', () => {
  const a = baseAnamnesis();
  a.injuries = { painRegions: ['joelho'], painLevel: 5, notes: '' };
  a.training.experience = 'iniciante';
  const triage = triageAnamnesis(a);
  const program = applyAnamnesisToProgram(generateWorkoutProgram(deriveProfile(a)), a, triage);

  const names = program.routines.flatMap((r) => r.exercises.map((e) => e.name.toLowerCase()));
  assert.equal(names.some((n) => n.includes('agachamento livre')), false);
  assert.ok(names.some((n) => n.includes('leg press')));

  const setsByGroup = new Map<string, number>();
  for (const routine of program.routines) {
    for (const ex of routine.exercises) {
      assert.ok(ex.workingSets >= 2 && ex.workingSets <= 5);
      const key = ex.targetMuscle.toLowerCase();
      setsByGroup.set(key, (setsByGroup.get(key) ?? 0) + ex.workingSets);
    }
  }
  for (const sets of setsByGroup.values()) {
    assert.ok(sets <= triage.weeklySetCap, `grupo com ${sets} séries excede teto ${triage.weeklySetCap}`);
  }

  const allHavePR = program.routines.some((r) => r.exercises.some((e) => e.personalRecord));
  assert.equal(allHavePR, false, 'programa novo não deve carregar PR de demonstração');
});

test('home gym substitui polia/máquina por variações com elástico/peso corporal', () => {
  const a = baseAnamnesis();
  a.training.equipment = 'peso_corporal_homegym';
  const program = applyAnamnesisToProgram(generateWorkoutProgram(deriveProfile(a)), a);
  const equipment = program.routines.flatMap((r) => r.exercises.map((e) => e.equipment.toLowerCase()));
  assert.equal(equipment.some((e) => e.includes('polia alta')), false);
  assert.ok(equipment.some((e) => e.includes('elástico') || e.includes('peso corporal')));
});

test('exercício evitado é substituído por alternativa do mesmo grupo', () => {
  const a = baseAnamnesis();
  a.training.dislikedExercises = ['Supino Reto'];
  const program = applyAnamnesisToProgram(generateWorkoutProgram(deriveProfile(a)), a);
  const names = program.routines.flatMap((r) => r.exercises.map((e) => e.name.toLowerCase()));
  assert.equal(names.some((n) => n.includes('supino reto com barra')), false);
  assert.ok(names.some((n) => n.includes('supino inclinado') || n.includes('supino reto com halteres')));

  for (const routine of program.routines) {
    const perRoutine = routine.exercises.map((e) => e.name.toLowerCase());
    assert.equal(perRoutine.length, new Set(perRoutine).size, 'substituição não deve duplicar exercício');
  }
});

test('banco de alimentos tem tofu vegano com macros coerentes (Atwater)', () => {
  const tofu = FOODS.find((f) => f.id === 'tofu_firmo');
  assert.ok(tofu, 'tofu deve existir');
  assert.equal(tofu!.group, 'proteina_vegetal');
  assert.ok(tofu!.proteinPer100g >= 15);
  assert.equal(tofu!.source, 'USDA');
});
