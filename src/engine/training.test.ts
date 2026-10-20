/**
 * TESTES DO MOTOR DE TREINAMENTO (§18: progressão, planejado × realizado,
 * sinais de fadiga/dor, semanas incompletas).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isCompound,
  parseRepsTarget,
  suggestProgression,
  summarizeSession,
  lastPerformanceFor,
  weeklyCompletion,
} from './training';
import { ValidationError } from './types';
import type { LoggedExercise, WorkoutProgram, WorkoutSessionLog } from '../types';

const ex = (name: string, workingSets = 3) => ({
  id: `ex_${name}`,
  name,
  targetMuscle: 'Peito',
  equipment: 'Barra',
  warmupSets: 1,
  workingSets,
  repsTarget: '8-12',
  targetRir: 2,
  restSeconds: 120,
  notes: '',
  personalRecord: undefined,
});

describe('parseRepsTarget / isCompound', () => {
  it('faixas "8-12", "12", "8 a 12"', () => {
    assert.deepEqual(parseRepsTarget('8-12'), { min: 8, max: 12 });
    assert.deepEqual(parseRepsTarget('12'), { min: 12, max: 12 });
    assert.deepEqual(parseRepsTarget('10 a 15'), { min: 10, max: 15 });
    assert.throws(() => parseRepsTarget('até a falha'), ValidationError);
    assert.throws(() => parseRepsTarget('0-5'), ValidationError);
  });

  it('multiarticulares vs isoladores', () => {
    assert.equal(isCompound('Supino Reto com Barra'), true);
    assert.equal(isCompound('Agachamento Livre'), true);
    assert.equal(isCompound('Elevação Lateral'), false);
    assert.equal(isCompound('Rosca Direta'), false);
  });
});

describe('summarizeSession — planejado × realizado', () => {
  const planned = [ex('Supino Reto com Barra', 3), ex('Elevação Lateral', 3)];

  it('soma só séries efetivas completas (work-up fora)', () => {
    const logged: LoggedExercise[] = [
      {
        exerciseId: 'ex_Supino Reto com Barra',
        exerciseName: 'Supino Reto com Barra',
        targetMuscle: 'Peito',
        sets: [
          { setNumber: 1, isWarmup: true, weightKg: 20, repsCompleted: 10, rirAchieved: 5, painScale: 0, completed: true },
          { setNumber: 2, isWarmup: false, weightKg: 80, repsCompleted: 10, rirAchieved: 1, painScale: 0, completed: true },
          { setNumber: 3, isWarmup: false, weightKg: 80, repsCompleted: 9, rirAchieved: 2, painScale: 0, completed: true },
          { setNumber: 4, isWarmup: false, weightKg: 80, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: false },
        ],
      },
      {
        exerciseId: 'ex_Elevação Lateral',
        exerciseName: 'Elevação Lateral',
        targetMuscle: 'Ombro',
        sets: [
          { setNumber: 1, isWarmup: false, weightKg: 10, repsCompleted: 12, rirAchieved: 1, painScale: 0, completed: true },
        ],
      },
    ];
    const s = summarizeSession(planned, logged);
    assert.equal(s.plannedSets, 6);
    assert.equal(s.completedSets, 3);
    assert.equal(s.volumeKg, 80 * 10 + 80 * 9 + 10 * 12);
    assert.equal(s.avgRirWorking, 1.3);
    assert.equal(s.completionShare, 0.5);
    assert.equal(s.painReported, false);
  });

  it('dor em série e em sessão são capturadas', () => {
    const logged: LoggedExercise[] = [
      {
        exerciseId: 'x',
        exerciseName: 'Supino Reto com Barra',
        targetMuscle: 'Peito',
        sets: [
          { setNumber: 1, isWarmup: false, weightKg: 60, repsCompleted: 8, rirAchieved: 2, painScale: 3, completed: true },
        ],
      },
    ];
    assert.equal(summarizeSession([ex('Supino Reto com Barra')], logged).painReported, true);
  });
});

describe('suggestProgression — regras de sobrecarga com segurança', () => {
  it('topo da faixa com RIR ≤ 1 → compound sobe +2,5 e reinicia faixa', () => {
    const s = suggestProgression({
      exerciseName: 'Agachamento Livre',
      repsTarget: '8-12',
      lastLoadKg: 100,
      lastReps: 12,
      lastRir: 1,
    });
    assert.equal(s.action, 'aumentar_carga');
    assert.equal(s.suggestedLoadKg, 102.5);
    assert.equal(s.repsTargetText, '8 reps');
    assert.match(s.rationale, /Reps alvo/);
  });

  it('isolador sobe +1,0', () => {
    const s = suggestProgression({
      exerciseName: 'Elevação Lateral',
      repsTarget: '10-15',
      lastLoadKg: 10,
      lastReps: 15,
      lastRir: 0,
    });
    assert.equal(s.suggestedLoadKg, 11);
  });

  it('RIR 12 com reps no alvo NÃO sobe: só com RIR ≤ 1', () => {
    const s = suggestProgression({
      exerciseName: 'Supino Reto com Barra',
      repsTarget: '8-12',
      lastLoadKg: 80,
      lastReps: 12,
      lastRir: 3,
    });
    assert.notEqual(s.action, 'aumentar_carga');
    assert.match(s.rationale, /folga/);
  });

  it('dor reportada bloqueia TUDO — carga mantida nunca aumentada (§7)', () => {
    const s = suggestProgression({
      exerciseName: 'Agachamento Livre',
      repsTarget: '8-12',
      lastLoadKg: 100,
      lastReps: 12,
      lastRir: 0,
      painReported: true,
    });
    assert.equal(s.action, 'manter_com_dor');
    assert.equal(s.suggestedLoadKg, 100);
    assert.match(s.rationale, /sem dor/);
  });

  it('volume incompleto vem antes de intensidade', () => {
    const s = suggestProgression({
      exerciseName: 'Supino Reto com Barra',
      repsTarget: '8-12',
      lastLoadKg: 80,
      lastReps: 12,
      lastRir: 1,
      completionShare: 0.75,
    });
    assert.equal(s.action, 'manter_completar_volume');
    assert.match(s.rationale, /75%/);
  });

  it('deload nunca sobe carga', () => {
    const s = suggestProgression({
      exerciseName: 'Supino Reto com Barra',
      repsTarget: '8-12',
      lastLoadKg: 80,
      lastReps: 12,
      lastRir: 0,
      isDeloadWeek: true,
    });
    assert.equal(s.action, 'deload_manter_carga');
    assert.equal(s.suggestedLoadKg, 80);
    assert.equal(s.repsTargetText, '8–11');
  });

  it('entradas inválidas recusadas', () => {
    assert.throws(
      () =>
        suggestProgression({
          exerciseName: 'Supino',
          repsTarget: '8-12',
          lastLoadKg: -5,
          lastReps: 10,
          lastRir: 2,
        }),
      ValidationError,
    );
    assert.throws(
      () =>
        suggestProgression({
          exerciseName: 'Supino',
          repsTarget: '8-12',
          lastLoadKg: 80,
          lastReps: 10,
          lastRir: 9,
        }),
      ValidationError,
    );
  });
});

describe('lastPerformanceFor — histórico ordenado novo→velho', () => {
  const logs: WorkoutSessionLog[] = [
    {
      id: 's2',
      routineId: 'r1',
      routineName: 'Treino A',
      date: '2026-10-18',
      durationMinutes: 60,
      perceivedEffortRPE: 8,
      jointPainReported: false,
      notes: '',
      totalVolumeLoadKg: 100,
      exercises: [
        {
          exerciseId: 'supino',
          exerciseName: 'Supino Reto com Barra',
          targetMuscle: 'Peito',
          sets: [
            { setNumber: 1, isWarmup: false, weightKg: 85, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: true },
          ],
        },
      ],
    },
    {
      id: 's1',
      routineId: 'r1',
      routineName: 'Treino A',
      date: '2026-10-15',
      durationMinutes: 60,
      perceivedEffortRPE: 8,
      jointPainReported: false,
      notes: '',
      totalVolumeLoadKg: 100,
      exercises: [
        {
          exerciseId: 'supino',
          exerciseName: 'Supino Reto com Barra',
          targetMuscle: 'Peito',
          sets: [
            { setNumber: 1, isWarmup: false, weightKg: 80, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: true },
          ],
        },
      ],
    },
  ];

  it('pega o registro mais novo e a carga correta', () => {
    const perf = lastPerformanceFor('supino', '8-12', logs);
    assert.ok(perf);
    assert.equal(perf.lastLoadKg, 85);
    assert.equal(perf.repsTarget, '8-12');
  });

  it('semana sem o exercício → null honesto (nada de dado falso)', () => {
    assert.equal(lastPerformanceFor('roscado', '8-12', logs), null);
  });
});

describe('weeklyCompletion — adesão semanal dedup por rotina/dia', () => {
  const program: WorkoutProgram = {
    id: 'p',
    name: 'p',
    splitType: 'pplul',
    weeklyFrequency: 5,
    currentWeek: 1,
    totalWeeks: 8,
    isDeloadWeek: false,
    routines: [],
    scienceNotes: '',
  };

  it('conta 3 sessões em 7 dias dedup, com 1 dor notificada', () => {
    const logs: WorkoutSessionLog[] = [
      { id: '1', routineId: 'A', routineName: 'A', date: '2026-10-19', durationMinutes: 60, perceivedEffortRPE: 8, jointPainReported: false, notes: '', totalVolumeLoadKg: 1000, exercises: [] },
      // duplicado acidental do mesmo dia/rotina — não infla adesão
      { id: '1b', routineId: 'A', routineName: 'A', date: '2026-10-19', durationMinutes: 60, perceivedEffortRPE: 8, jointPainReported: false, notes: '', totalVolumeLoadKg: 1000, exercises: [] },
      { id: '2', routineId: 'B', routineName: 'B', date: '2026-10-17', durationMinutes: 60, perceivedEffortRPE: 8, jointPainReported: true, notes: '', totalVolumeLoadKg: 800, exercises: [] },
      { id: '3', routineId: 'C', routineName: 'C', date: '2026-10-15', durationMinutes: 60, perceivedEffortRPE: 8, jointPainReported: false, notes: '', totalVolumeLoadKg: 900, exercises: [] },
      // fora da janela de 7 dias (cronológicamente mais antiga que a janela)
      { id: '4', routineId: 'D', routineName: 'D', date: '2026-10-08', durationMinutes: 60, perceivedEffortRPE: 8, jointPainReported: false, notes: '', totalVolumeLoadKg: 1000, exercises: [] },
    ];
    const w = weeklyCompletion(program, logs, '2026-10-20');
    assert.equal(w.realizedSessions, 3);
    assert.equal(w.plannedSessions, 5);
    assert.equal(w.adherenceShare, 0.6);
    assert.equal(w.volumeKg, 2700);
    assert.equal(w.sessionsWithPain, 1);
  });

  it('programa sem frequência válida → erro, não adesão mágica', () => {
    assert.throws(
      () => weeklyCompletion({ ...program, weeklyFrequency: 0 }, [], '2026-10-20'),
      ValidationError,
    );
  });
});
