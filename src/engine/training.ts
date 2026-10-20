/**
 * MOTOR DE TREINAMENTO — planejado × realizado e progressão segura
 * ----------------------------------------------------------------
 * §7/§8 do plano: distinguir treino planejado de realizado, registrar o que
 * foi executado e NÃO aumentar volume/intensidade com sinais persistentes de
 * fadiga, dor ou queda de desempenho (§7). Tudo determinístico e testável:
 * a IA pode NARRAR a progressão, nunca prescrevê-la fora destas regras.
 *
 * Regras de progressão (dupla progressão decodificada):
 * 1. Segurança primeiro: dor articular reportada (painScale > 0 na sessão ou
 *    nas séries) → NUNCA sugere carga; mantém peso, recomenda RIR +1.
 * 2. De reach de reps com RIR ≤ 1 → sobe carga (compound +2,5 kg; isolation
 *    +1,0 kg) e volta ao piso inferior da faixa de reps.
 * 3. RIR ≥ 3 (fácil demais para a meta) → mantém carga, busca +1 rep.
 * 4. Inconsistente (séries < planejadas) → mantém carga e prioriza completar
 *    o volume antes de subi-lo (volume antes de intensidade).
 * 5. Deload programado → mantém carga, reduz reps-alvo em 1 e RIR +2.
 */

import type {
  ExerciseDefinition,
  LoggedExercise,
  WorkoutProgram,
  WorkoutRoutine,
  WorkoutSessionLog,
} from '../types';
import { ValidationError, requireFiniteNumber } from './types';

/** Multiarticulares: incremento maior no sucesso (mais capazes de tolerar +2,5 kg). */
const COMPOUND_KEYWORDS = [
  'agachamento',
  'supino',
  'levantamento terra',
  'terra ',
  'remada curvada',
  'desenvolvimento',
  'overhead',
  'leg press',
  'barra fixa',
  'paralelas',
  'stiff',
  'afundo',
  'bulgarian',
];

export function isCompound(exerciseName: string): boolean {
  const n = exerciseName.toLowerCase();
  return COMPOUND_KEYWORDS.some((k) => n.includes(k));
}

/** Parseia "8-12" | "12" | "8 a 12" → { min, max }. */
export function parseRepsTarget(repsTarget: string): { min: number; max: number } {
  const nums = repsTarget.match(/\d+/g);
  if (!nums || nums.length === 0) {
    throw new ValidationError('repsTarget', `faixa irrecognoscível: "${repsTarget}"`);
  }
  const parsed = nums.slice(0, 2).map(Number);
  if (parsed.some((v) => !Number.isFinite(v) || v < 1 || v > 100)) {
    throw new ValidationError('repsTarget', `valores fora de [1, 100]: "${repsTarget}"`);
  }
  return parsed.length === 1
    ? { min: parsed[0], max: parsed[0] }
    : { min: parsed[0], max: parsed[1] };
}

// ---------------------------------------------------------------------------
// Planejado × realizado (sessão)
// ---------------------------------------------------------------------------

export interface SessionSummary {
  plannedSets: number;
  completedSets: number;
  volumeKg: number;
  avgRirWorking: number;
  painReported: boolean;
  /** séries efetivas / séries planejadas (0–1). */
  completionShare: number;
}

export function summarizeSession(
  planned: ExerciseDefinition[],
  logged: LoggedExercise[],
): SessionSummary {
  const plannedSets = requireFiniteNumber(
    planned.reduce((a, e) => a + e.workingSets, 0),
    'plannedSets',
    0,
    200,
  );

  let completedSets = 0;
  let volumeKg = 0;
  let rirSum = 0;
  let rirCount = 0;
  let pain = false;

  for (const ex of logged) {
    for (const set of ex.sets) {
      if (set.isWarmup) continue;
      if (!set.completed) continue;
      completedSets += 1;
      volumeKg += set.weightKg * set.repsCompleted;
      rirSum += set.rirAchieved;
      rirCount += 1;
      if (set.painScale > 0) pain = true;
    }
  }

  volumeKg = Math.round(volumeKg * 10) / 10;
  return {
    plannedSets,
    completedSets,
    volumeKg,
    avgRirWorking: rirCount > 0 ? Math.round((rirSum / rirCount) * 10) / 10 : 0,
    painReported: pain,
    completionShare: plannedSets > 0 ? Math.round((completedSets / plannedSets) * 100) / 100 : 0,
  };
}

// ---------------------------------------------------------------------------
// Progressão sugerida (regras puras §7)
// ---------------------------------------------------------------------------

export type ProgressionAction =
  | 'aumentar_carga'
  | 'manter_buscar_reps'
  | 'manter_completar_volume'
  | 'manter_com_dor'
  | 'deload_manter_carga';

export interface ProgressionInput {
  exerciseName: string;
  /** Faixa alvo do plano (ex.: "8-12"). */
  repsTarget: string;
  /** Carga da última sessão (kg) — 0 sem histórico. */
  lastLoadKg: number;
  /** Melhor desempenho recente: reps na última série efetiva. */
  lastReps: number;
  /** RIR da última série efetiva. */
  lastRir: number;
  /** Dor articular reportada no último registro deste exercício. */
  painReported?: boolean;
  /** Semana de deload ativa no programa. */
  isDeloadWeek?: boolean;
  /** Séries completadas vs. planejadas na última sessão (0–1). */
  completionShare?: number;
}

export interface ProgressionSuggestion {
  action: ProgressionAction;
  /** Carga sugerida (kg) — sempre fechada em steps suportados por anilha. */
  suggestedLoadKg: number;
  repsTargetText: string;
  /** Justificativa curta — o que foi observado e por que a regra disparou. */
  rationale: string;
}

const LOAD_STEP_COMPOUND = 2.5;
const LOAD_STEP_ISOLATION = 1.0;

export function suggestProgression(input: ProgressionInput): ProgressionSuggestion {
  const target = parseRepsTarget(input.repsTarget);
  const lastLoad = requireFiniteNumber(input.lastLoadKg, 'lastLoadKg', 0, 600);
  const lastRir = requireFiniteNumber(input.lastRir, 'lastRir', 0, 6);
  const completionShare = input.completionShare ?? 1;

  // 0) Deload programado: cents de intensidade, nenhuma sobrecarga.
  if (input.isDeloadWeek) {
    return {
      action: 'deload_manter_carga',
      suggestedLoadKg: lastLoad,
      repsTargetText: `${target.min}–${target.max - 1}`,
      rationale: `Semana de deload: carga mantida em ${lastLoad} kg, reps-alvo reduzidas em 1 e RIR +2 — o estímulo fica menor para dissipar fadiga.`,
    };
  }

  // 1) Segurança: dor reportada nunca autoriza carga.
  if (input.painReported) {
    return {
      action: 'manter_com_dor',
      suggestedLoadKg: lastLoad,
      repsTargetText: `${target.min}–${target.max}`,
      rationale: `Dor articular reportada no último registro: carga mantida em ${lastLoad} kg. Objetivo é treinar sem dor (RIR +1 a 2); se persistir, substituir o exercício e avaliar tecnicamente.`,
    };
  }

  // 2) Volume incompleto: completar antes de intensificar.
  if (completionShare < 0.9) {
    return {
      action: 'manter_completar_volume',
      suggestedLoadKg: lastLoad,
      repsTargetText: `${target.min}–${target.max}`,
      rationale: `Última sessão fechou ~${Math.round(completionShare * 100)}% do volume planejado: carga mantida em ${lastLoad} kg até completar as séries — volume antes de intensidade.`,
    };
  }

  // 3) Dupla progressão: topo da faixa com RIR ≤ 1 → sobe carga.
  if (input.lastReps >= target.max && lastRir <= 1) {
    const step = isCompound(input.exerciseName) ? LOAD_STEP_COMPOUND : LOAD_STEP_ISOLATION;
    const next = Math.round((lastLoad + step) * 10) / 10;
    return {
      action: 'aumentar_carga',
      suggestedLoadKg: next,
      repsTargetText: `${target.min} reps`,
      rationale: `Reps alvo (${target.max}) atingidas com RIR ${lastRir}: sobre carga para ${next} kg e reinicia a faixa em ${target.min} reps.`,
    };
  }

  // 4) Fácil demais: mantém carga, persegue repetição.
  if (lastRir >= 3) {
    return {
      action: 'manter_buscar_reps',
      suggestedLoadKg: lastLoad,
      repsTargetText: `${target.min}–${target.max}`,
      rationale: `RIR ${lastRir} indica folga: carga mantida em ${lastLoad} kg com foco em +1 rep por série antes de subir peso.`,
    };
  }

  // 5) Padrão: consolidar.
  return {
    action: 'manter_buscar_reps',
    suggestedLoadKg: lastLoad,
    repsTargetText: `${target.min}–${target.max}`,
    rationale: `Desempenho dentro do plano (RIR ${lastRir}): consolidar ${lastLoad} kg até alcançar ${target.max} reps com RIR ≤ 1.`,
  };
}

/** Última sessão efetiva de um exercício (logs ordenados mais novo→velho). */
export function lastPerformanceFor(
  exerciseId: string,
  repsTarget: string,
  logs: WorkoutSessionLog[],
  isOrderedNewestFirst = true,
): ProgressionInput | null {
  const ordered = isOrderedNewestFirst ? logs : [...logs].reverse();
  for (const session of ordered) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const working = ex.sets.filter((s) => s.completed && !s.isWarmup);
    if (working.length === 0) continue;
    const last = working[working.length - 1];
    return {
      exerciseName: ex.exerciseName,
      repsTarget,
      lastLoadKg: last.weightKg,
      lastReps: last.repsCompleted,
      lastRir: last.rirAchieved,
      painReported: session.jointPainReported || working.some((s) => s.painScale > 0),
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Semana: planejado × realizado (aderência de treino)
// ---------------------------------------------------------------------------

export interface WeeklyCompletion {
  plannedSessions: number;
  realizedSessions: number;
  /** 0–1 */
  adherenceShare: number;
  volumeKg: number;
  sessionsWithPain: number;
}

/**
 * Conta sessões realizadas NA SEMANA de referência (dias ISO 1–7). Sessões
 * duplicadas do mesmo routineId no mesmo dia contam uma vez (registro duplo
 * acidental não deve inflar adesão).
 */
export function weeklyCompletion(
  program: WorkoutProgram,
  logs: WorkoutSessionLog[],
  weekReferenceDate: string,
): WeeklyCompletion {
  const ref = new Date(weekReferenceDate);
  if (Number.isNaN(ref.getTime())) {
    throw new ValidationError('weekReferenceDate', `data inválida: ${weekReferenceDate}`);
  }

  // Janela: a semana do último treino logado é a referência simples e robusta
  // para dados contínuos — mais recente que 7 dias antes do último.
  const newest = logs.reduce((acc, l) => (l.date > acc ? l.date : acc), '');
  const newestDate = newest ? new Date(newest) : ref;
  const windowEnd = newestDate.getTime() + 24 * 60 * 60 * 1000; // fim do dia
  const windowStart = windowEnd - 7 * 24 * 60 * 60 * 1000;

  const seen = new Set<string>();
  let realized = 0;
  let volume = 0;
  let pain = 0;
  for (const log of logs) {
    const t = new Date(log.date).getTime();
    if (Number.isNaN(t) || t < windowStart || t >= windowEnd) continue;
    const key = `${log.date.slice(0, 10)}|${log.routineId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    realized += 1;
    volume += log.totalVolumeLoadKg;
    if (log.jointPainReported) pain += 1;
  }

  const planned = requireFiniteNumber(program.weeklyFrequency, 'program.weeklyFrequency', 1, 14);
  return {
    plannedSessions: planned,
    realizedSessions: realized,
    adherenceShare: Math.min(1, realized / planned),
    volumeKg: Math.round(volume * 10) / 10,
    sessionsWithPain: pain,
  };
}

// ---------------------------------------------------------------------------
// Treino PRÓPRIO do usuário (§7: o atleta no comando — o app audita, não prescreve)
// ---------------------------------------------------------------------------

export interface CustomRoutineInput {
  name: string;
  dayOfWeek?: string;
  focus?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    targetMuscle: string;
    equipment: string;
    workingSets: number;
    repsTarget: string;
    targetRir: number;
    restSeconds: number;
  }>;
}

/**
 * Monta um WorkoutProgram a partir do treino que o usuário JÁ FAZ.
 * Nada de prescrição: os dados são do usuário — validados (números plausíveis,
 * faixa de reps reconhecível) para o motor de progressão funcionar honestamente.
 */
export function buildCustomProgram(input: {
  name: string;
  routines: CustomRoutineInput[];
}): WorkoutProgram {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    throw new ValidationError('name', 'Nome do treino deve ter 2 a 60 caracteres');
  }
  if (!Array.isArray(input.routines) || input.routines.length < 1 || input.routines.length > 7) {
    throw new ValidationError('routines', 'Informe de 1 a 7 sessões de treino');
  }

  const routines: WorkoutRoutine[] = input.routines.map((routine, rIdx) => {
    const rName = routine.name.trim() || `Sessão ${rIdx + 1}`;
    if (rName.length > 60) throw new ValidationError('routine.name', `Nome da sessão ${rIdx + 1} muito longo`);
    if (!Array.isArray(routine.exercises) || routine.exercises.length < 1 || routine.exercises.length > 15) {
      throw new ValidationError('exercises', `${rName}: informe de 1 a 15 exercícios`);
    }

    const exercises: ExerciseDefinition[] = routine.exercises.map((ex, eIdx) => {
      if (!ex.exerciseId || !ex.exerciseName || !ex.exerciseName.trim()) {
        throw new ValidationError('exercises', `${rName} · exercício ${eIdx + 1}: nome vazio`);
      }
      // parseRepsTarget valida a faixa (ex.: "8-12") — critica "até a falha", 0, etc.
      parseRepsTarget(ex.repsTarget);
      const sets = Math.round(ex.workingSets);
      if (!Number.isFinite(ex.workingSets) || sets < 1 || sets > 10) {
        throw new ValidationError('workingSets', `${rName} · ${ex.exerciseName}: séries de trabalho deve ser 1 a 10`);
      }
      if (!Number.isFinite(ex.targetRir) || ex.targetRir < 0 || ex.targetRir > 5) {
        throw new ValidationError('targetRir', `${rName} · ${ex.exerciseName}: RIR alvo deve ser 0 a 5`);
      }
      if (!Number.isFinite(ex.restSeconds) || ex.restSeconds < 30 || ex.restSeconds > 360) {
        throw new ValidationError('restSeconds', `${rName} · ${ex.exerciseName}: descanso deve ser 30 a 360 s`);
      }
      return {
        id: ex.exerciseId,
        name: ex.exerciseName.trim(),
        targetMuscle: ex.targetMuscle || '—',
        equipment: ex.equipment || '—',
        warmupSets: 1,
        workingSets: sets,
        repsTarget: ex.repsTarget.trim(),
        targetRir: ex.targetRir,
        restSeconds: Math.round(ex.restSeconds),
        notes: '',
      };
    });

    const estimatedDurationMin = Math.max(
      20,
      exercises.reduce((acc, ex) => acc + ex.workingSets * (ex.restSeconds + 45) + 90, 0) / 60
    );
    return {
      id: `custom_r_${rIdx + 1}`,
      name: rName,
      dayOfWeek: routine.dayOfWeek,
      focus: routine.focus || rName,
      exercises,
      estimatedDurationMin: Math.round(estimatedDurationMin),
    };
  });

  return {
    id: 'custom',
    name,
    splitType: 'personalizado',
    weeklyFrequency: routines.length,
    currentWeek: 1,
    totalWeeks: 8,
    isDeloadWeek: false,
    routines,
    scienceNotes:
      'Programa definido pelo usuário. O motor determinístico apenas AUDITA: progressão sugerida por histórico (RIR/reps/agendado vs realizado), sinalizando quando o volume ou a dor pedem cautela.',
  };
}
