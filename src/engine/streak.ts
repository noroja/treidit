/**
 * OFENSIVA (STREAK) & PROGRESSO SEMANAL
 * -------------------------------------
 * §19 (acompanhamento): o usuário precisa ver a própria constância dia a dia.
 * Regras determinísticas, sem IA:
 *
 * 1. Um dia conta como ATIVO quando houve treino registrado, pelo menos 3
 *    refeições concluídas ou um check-in/recovery registrado.
 * 2. A ofensiva atual pode terminar hoje ou ontem: se hoje ainda não houve
 *    registro, o dia não é "perdido" até a meia-noite.
 * 3. A melhor ofensiva é histórica e nunca é sobrescrita ao perder a atual.
 * 4. O progresso semanal usa os últimos 7 dias (não a semana ISO), para não
 *    punir quem começou a usar o app no meio da semana.
 */

import type { WorkoutProgram, WorkoutSessionLog } from '../types';
import { daysBetweenISO, shiftISODate, shortWeekday, toLocalISODate } from './dates';

export interface ActivityDay {
  /** YYYY-MM-DD local. */
  date: string;
  workouts: number;
  mealsCompleted: number;
  waterMl: number;
  checkin: boolean;
}

export interface ActivityPatch {
  date: string;
  /** Valor absoluto do dia (não incremental). */
  workouts?: number;
  /** Incremento no contador de treinos (ex.: +1 ao finalizar sessão). */
  workoutsDelta?: number;
  mealsCompleted?: number;
  waterMl?: number;
  waterMlDelta?: number;
  checkin?: boolean;
}

const MAX_DAYS_KEPT = 400;

const clampInt = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.round(v)));

export function emptyActivityDay(date: string): ActivityDay {
  return { date, workouts: 0, mealsCompleted: 0, waterMl: 0, checkin: false };
}

/** Upsert imutável de um dia; mantém no máximo 400 dias (ordem decrescente). */
export function mergeActivityDay(days: ActivityDay[], patch: ActivityPatch): ActivityDay[] {
  const existing = days.find((d) => d.date === patch.date) ?? emptyActivityDay(patch.date);
  const next: ActivityDay = {
    ...existing,
    workouts:
      patch.workouts !== undefined
        ? clampInt(patch.workouts, 0, 10)
        : clampInt(existing.workouts + (patch.workoutsDelta ?? 0), 0, 10),
    mealsCompleted:
      patch.mealsCompleted !== undefined
        ? clampInt(patch.mealsCompleted, 0, 12)
        : existing.mealsCompleted,
    waterMl:
      patch.waterMl !== undefined
        ? clampInt(patch.waterMl, 0, 20_000)
        : clampInt(existing.waterMl + (patch.waterMlDelta ?? 0), 0, 20_000),
    checkin: patch.checkin ?? existing.checkin,
  };
  const rest = days.filter((d) => d.date !== patch.date);
  return [next, ...rest].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, MAX_DAYS_KEPT);
}

/** Dia ativo: treino, 3+ refeições concluídas ou check-in. */
export function isActiveDay(day: ActivityDay): boolean {
  return day.workouts > 0 || day.mealsCompleted >= 3 || day.checkin;
}

export interface StreakSummary {
  current: number;
  best: number;
  lastActive: string | null;
  activeToday: boolean;
  /** Total de dias ativos nos últimos 30 dias (consistência). */
  activeLast30: number;
}

export function computeStreak(days: ActivityDay[], today: string = toLocalISODate()): StreakSummary {
  const active = new Set(days.filter(isActiveDay).map((d) => d.date));
  const sortedDesc = Array.from(active).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const lastActive = sortedDesc.find((d) => daysBetweenISO(d, today) >= 0) ?? null;
  const activeToday = active.has(today);

  let current = 0;
  if (activeToday || active.has(shiftISODate(today, -1))) {
    let cursor = activeToday ? today : shiftISODate(today, -1);
    while (active.has(cursor)) {
      current += 1;
      cursor = shiftISODate(cursor, -1);
    }
  }

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const iso of Array.from(active).sort()) {
    run = prev && daysBetweenISO(prev, iso) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = iso;
  }

  const activeLast30 = sortedDesc.filter((d) => {
    const diff = daysBetweenISO(d, today);
    return diff >= 0 && diff < 30;
  }).length;

  return { current, best, lastActive, activeToday, activeLast30 };
}

export interface WeekDay {
  date: string;
  weekday: string;
  active: boolean;
  workouts: number;
  mealsCompleted: number;
  isToday: boolean;
}

/** Últimos 7 dias, do mais antigo para hoje (para a tira de constância). */
export function weekActivity(days: ActivityDay[], today: string = toLocalISODate()): WeekDay[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftISODate(today, i - 6);
    const day = byDate.get(date) ?? emptyActivityDay(date);
    return {
      date,
      weekday: shortWeekday(date),
      active: isActiveDay(day),
      workouts: day.workouts,
      mealsCompleted: day.mealsCompleted,
      isToday: date === today,
    };
  });
}

export interface WeeklyProgress {
  sessionsDone: number;
  sessionsPlanned: number;
  sessionsPct: number;
  activeDays: number;
  consistencyPct: number;
  volumeKg: number;
  mealsCompleted: number;
  streak: StreakSummary;
}

export function weeklyProgress(input: {
  days: ActivityDay[];
  logs: WorkoutSessionLog[];
  program: WorkoutProgram;
  today?: string;
}): WeeklyProgress {
  const today = input.today ?? toLocalISODate();
  const week = weekActivity(input.days, today);
  const weekDates = new Set(week.map((d) => d.date));

  const sessionsDone = input.logs.filter((l) => weekDates.has(l.date)).length;
  const sessionsPlanned = Math.max(1, input.program.weeklyFrequency || input.program.routines.length || 1);
  const activeDays = week.filter((d) => d.active).length;
  const volumeKg = input.logs
    .filter((l) => weekDates.has(l.date))
    .reduce((sum, l) => sum + (Number.isFinite(l.totalVolumeLoadKg) ? l.totalVolumeLoadKg : 0), 0);
  const mealsCompleted = week.reduce((sum, d) => sum + d.mealsCompleted, 0);

  return {
    sessionsDone,
    sessionsPlanned,
    sessionsPct: Math.min(100, Math.round((sessionsDone / sessionsPlanned) * 100)),
    activeDays,
    consistencyPct: Math.round((activeDays / 7) * 100),
    volumeKg,
    mealsCompleted,
    streak: computeStreak(input.days, today),
  };
}
