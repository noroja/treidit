/**
 * Testes da ofensiva (streak) e do progresso semanal.
 * Datas fixas para não depender do relógio da máquina.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStreak,
  emptyActivityDay,
  isActiveDay,
  mergeActivityDay,
  weekActivity,
  weeklyProgress,
  type ActivityDay,
} from './streak';
import type { WorkoutProgram, WorkoutSessionLog } from '../types';

const day = (date: string, patch: Partial<ActivityDay> = {}): ActivityDay => ({
  ...emptyActivityDay(date),
  ...patch,
});

test('mergeActivityDay incrementa treino do dia e mantém histórico ordenado', () => {
  let days: ActivityDay[] = [];
  days = mergeActivityDay(days, { date: '2026-10-20', workoutsDelta: 1 });
  days = mergeActivityDay(days, { date: '2026-10-20', workoutsDelta: 1, mealsCompleted: 3 });
  assert.equal(days.length, 1);
  assert.equal(days[0].workouts, 2);
  assert.equal(days[0].mealsCompleted, 3);

  days = mergeActivityDay(days, { date: '2026-10-21', waterMlDelta: 500 });
  assert.equal(days[0].date, '2026-10-21');
  assert.equal(days[1].date, '2026-10-20');
});

test('dia ativo exige treino, 3 refeições ou check-in', () => {
  assert.equal(isActiveDay(day('2026-10-20')), false);
  assert.equal(isActiveDay(day('2026-10-20', { mealsCompleted: 2 })), false);
  assert.equal(isActiveDay(day('2026-10-20', { mealsCompleted: 3 })), true);
  assert.equal(isActiveDay(day('2026-10-20', { workouts: 1 })), true);
  assert.equal(isActiveDay(day('2026-10-20', { checkin: true })), true);
});

test('ofensiva conta hoje e dias anteriores consecutivos', () => {
  const days = [
    day('2026-10-21', { workouts: 1 }),
    day('2026-10-20', { mealsCompleted: 3 }),
    day('2026-10-19', { checkin: true }),
    day('2026-10-16', { workouts: 1 }), // quebra
  ];
  const s = computeStreak(days, '2026-10-21');
  assert.equal(s.current, 3);
  assert.equal(s.best, 3);
  assert.equal(s.activeToday, true);
  assert.equal(s.lastActive, '2026-10-21');
  assert.equal(s.activeLast30, 4);
});

test('sem registro hoje, ofensiva de ontem continua válida', () => {
  const days = [day('2026-10-20', { workouts: 1 }), day('2026-10-19', { workouts: 1 })];
  const s = computeStreak(days, '2026-10-21');
  assert.equal(s.current, 2);
  assert.equal(s.activeToday, false);
});

test('dois dias sem registro zeram a ofensiva, mas a melhor é preservada', () => {
  const days = [
    day('2026-10-18', { workouts: 1 }),
    day('2026-10-17', { workouts: 1 }),
    day('2026-10-16', { workouts: 1 }),
  ];
  const s = computeStreak(days, '2026-10-21');
  assert.equal(s.current, 0);
  assert.equal(s.best, 3);
});

test('tira de 7 dias marca os dias ativos e o hoje', () => {
  const days = [day('2026-10-21', { workouts: 1 }), day('2026-10-19', { mealsCompleted: 3 })];
  const week = weekActivity(days, '2026-10-21');
  assert.equal(week.length, 7);
  assert.equal(week[6].isToday, true);
  assert.equal(week[6].active, true);
  assert.equal(week[4].active, true);
  assert.equal(week[5].active, false);
});

test('progresso semanal soma sessões, adesão e volume', () => {
  const program: WorkoutProgram = {
    id: 'p',
    name: 'Programa',
    splitType: 'upper_lower',
    weeklyFrequency: 4,
    currentWeek: 1,
    totalWeeks: 8,
    isDeloadWeek: false,
    routines: [],
    scienceNotes: '',
  };
  const logs: WorkoutSessionLog[] = [
    {
      id: 'l1',
      routineId: 'r1',
      routineName: 'Treino A',
      date: '2026-10-20',
      durationMinutes: 60,
      exercises: [],
      perceivedEffortRPE: 8,
      jointPainReported: false,
      notes: '',
      totalVolumeLoadKg: 5000,
    },
    {
      id: 'l2',
      routineId: 'r2',
      routineName: 'Treino B',
      date: '2026-10-10', // fora da janela de 7 dias
      durationMinutes: 60,
      exercises: [],
      perceivedEffortRPE: 8,
      jointPainReported: false,
      notes: '',
      totalVolumeLoadKg: 4000,
    },
  ];
  const days = [day('2026-10-20', { workouts: 1 }), day('2026-10-19', { mealsCompleted: 3 })];

  const wp = weeklyProgress({ days, logs, program, today: '2026-10-21' });
  assert.equal(wp.sessionsDone, 1);
  assert.equal(wp.sessionsPlanned, 4);
  assert.equal(wp.sessionsPct, 25);
  assert.equal(wp.activeDays, 2);
  assert.equal(wp.volumeKg, 5000);
  assert.equal(wp.streak.current, 2);
  assert.equal(wp.mealsCompleted, 3);
});
