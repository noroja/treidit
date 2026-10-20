import React, { useMemo, useState } from 'react';
import { Dumbbell, Play, Trophy, Sparkles, Clock, AlertTriangle, CheckCircle, Info, ChevronRight, BarChart3, Plus, TrendingUp, ShieldAlert, Target } from 'lucide-react';
import { WorkoutProgram, WorkoutRoutine, WorkoutSessionLog } from '../types';
import {
  lastPerformanceFor,
  suggestProgression,
  weeklyCompletion,
  type ProgressionAction,
} from '../engine/training';

const ACTION_LABEL: Record<ProgressionAction, string> = {
  aumentar_carga: 'Subir carga',
  manter_buscar_reps: 'Consolidar',
  manter_completar_volume: 'Completar volume',
  manter_com_dor: 'Cautela: dor',
  deload_manter_carga: 'Deload ativo',
};

interface WorkoutViewProps {
  program: WorkoutProgram;
  workoutLogs: WorkoutSessionLog[];
  onStartRoutine: (routineIndex: number) => void;
  onOpenAi: () => void;
  onOpenAdaptive: () => void;
  onOpenExerciseLibrary?: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  program,
  workoutLogs,
  onStartRoutine,
  onOpenAi,
  onOpenAdaptive,
  onOpenExerciseLibrary,
}) => {
  const [selectedRoutineIndex, setSelectedRoutineIndex] = useState(0);
  const activeRoutine = program.routines[selectedRoutineIndex] || program.routines[0];

  // FASE 4: progressão SUGERIDA pelo motor determinístico (nunca inventada pela IA).
  // Histórico: última sessão efetiva do exercício + regra de sobrecarga segura.
  const progressionMap = useMemo(() => {
    const map = new Map<
      string,
      { action: ProgressionAction; label: string; suggestedLoadKg: number; rationale: string }
    >();
    if (!activeRoutine) return map;
    for (const exercise of activeRoutine.exercises) {
      const perf = lastPerformanceFor(exercise.id, exercise.repsTarget, workoutLogs, true);
      if (!perf) continue;
      const s = suggestProgression({ ...perf, isDeloadWeek: program.isDeloadWeek });
      map.set(exercise.id, { action: s.action, label: ACTION_LABEL[s.action], suggestedLoadKg: s.suggestedLoadKg, rationale: s.rationale });
    }
    return map;
  }, [activeRoutine, workoutLogs, program.isDeloadWeek]);

  // Adesão real da semana (planejado × realizado, dedupe por dia/rotina).
  const weekly = useMemo(
    () => weeklyCompletion(program, workoutLogs, new Date().toISOString()),
    [program, workoutLogs]
  );

  const totalExercises = activeRoutine ? activeRoutine.exercises.length : 0;
  const totalWeeklySets = program.routines.reduce(
    (acc, r) => acc + r.exercises.reduce((exAcc, ex) => exAcc + ex.workingSets, 0),
    0
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Program Summary */}
      <div className="bg-panel border border-elevated rounded-2xl p-5 ">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs  font-extrabold  px-2.5 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30">
                Divisão {program.splitType.toUpperCase().replace('_', ' ')}
              </span>
              <span className="text-xs text-muted">
                Semana {program.currentWeek} de {program.totalWeeks}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{program.name}</h1>
            <p className="text-xs text-muted mt-1 max-w-2xl">
              {program.scienceNotes}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenExerciseLibrary && (
              <button
                onClick={onOpenExerciseLibrary}
                className="px-3.5 py-2 rounded-xl bg-elevated hover:bg-line-strong border border-line-strong text-xs font-semibold text-lime transition cursor-pointer flex items-center gap-1.5  active:scale-95"
              >
                <Dumbbell className="w-4 h-4 text-lime" />
                <span>Base 870+ Exercícios (PT-BR)</span>
              </button>
            )}

            <button
              onClick={onOpenAdaptive}
              className="px-3.5 py-2 rounded-xl bg-elevated hover:bg-line-strong border border-line-strong text-xs font-semibold text-strong transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-lime" />
              <span>Ajustar Volume</span>
            </button>
          </div>
        </div>

        {/* Weekly Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-elevated/80 text-xs">
          <div>
            <span className="text-muted block text-[12.5px]">Frequência Semanal</span>
            <strong className="text-white text-base font-bold">{program.weeklyFrequency} dias / semana</strong>
          </div>
          <div>
            <span className="text-muted block text-[12.5px]">Volume Total</span>
            <strong className="text-lime text-base font-bold">~{totalWeeklySets} séries de trabalho</strong>
          </div>
          <div>
            <span className="text-muted block text-[12.5px]">RIR Prescrito</span>
            <strong className="text-white text-base font-bold">1 a 2 (1-2 da falha)</strong>
          </div>
          <div>
            <span className="text-muted block text-[12.5px]">Status Deload</span>
            <strong className={`text-base font-bold ${program.isDeloadWeek ? 'text-lime-dim' : 'text-lime-dim'}`}>
              {program.isDeloadWeek ? 'Semana de Deload' : 'Sobrecarga Ativa'}
            </strong>
          </div>
        </div>
      </div>

      {/* Routine Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {program.routines.map((routine, idx) => {
          const isSelected = selectedRoutineIndex === idx;
          return (
            <button
              key={routine.id}
              onClick={() => setSelectedRoutineIndex(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-lime text-base border-lime  '
                  : 'bg-panel hover:bg-elevated text-strong border-elevated'
              }`}
            >
              <span>{routine.name.split(':')[0]}</span>
              {routine.dayOfWeek && (
                <span className={`text-[11px] font-normal ${isSelected ? 'text-panel' : 'text-muted'}`}>
                  ({routine.dayOfWeek.slice(0, 3)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Routine Detail Card */}
      {activeRoutine && (
        <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-lime font-semibold mb-0.5">
                {activeRoutine.dayOfWeek || 'Rotina de Treino'} • ~{activeRoutine.estimatedDurationMin} minutos
              </div>
              <h2 className="text-xl font-semibold text-white">{activeRoutine.name}</h2>
              <div className="text-xs text-muted mt-0.5">
                Foco muscular: <span className="text-strong">{activeRoutine.focus}</span>
              </div>
            </div>

            <button
              onClick={() => onStartRoutine(selectedRoutineIndex)}
              className="flex items-center justify-center gap-2 bg-lime hover:bg-lime text-base font-bold px-6 py-3 rounded-xl text-sm transition   active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Play className="w-4 h-4 fill-base" />
              <span>Iniciar Sessão Agora</span>
            </button>
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            {activeRoutine.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-base/70 border border-elevated/80 rounded-xl p-4 transition hover:border-line-strong"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-elevated text-strong font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {exercise.name}
                      </h3>
                      <div className="text-xs text-muted mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-lime font-medium">{exercise.targetMuscle}</span>
                        <span>•</span>
                        <span>{exercise.equipment}</span>
                        <span>•</span>
                        <span>Descanso: {exercise.restSeconds}s</span>
                      </div>
                    </div>
                  </div>

                  {exercise.personalRecord && (
                    <div className="bg-lime-dim/10 border border-lime-dim/20 text-lime-dim px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 self-start">
                      <Trophy className="w-3.5 h-3.5 text-lime-dim shrink-0" />
                      <span>PR: <strong>{exercise.personalRecord.weightKg} kg</strong> x {exercise.personalRecord.reps} reps</span>
                    </div>
                  )}
                </div>

                {/* Sets & Reps Specification */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-elevated/60 text-xs">
                  <div className="bg-panel/80 p-2 rounded-lg">
                    <span className="text-muted text-[11px] block">Séries de Trabalho</span>
                    <strong className="text-white font-mono text-sm">{exercise.workingSets} séries</strong>
                  </div>
                  <div className="bg-panel/80 p-2 rounded-lg">
                    <span className="text-muted text-[11px] block">Faixa de Repetições</span>
                    <strong className="text-lime font-mono text-sm">{exercise.repsTarget} reps</strong>
                  </div>
                  <div className="bg-panel/80 p-2 rounded-lg">
                    <span className="text-muted text-[11px] block">RIR Alvo (Proximidade Falha)</span>
                    <strong className="text-lime-dim font-mono text-sm">{exercise.targetRir} RIR</strong>
                  </div>
                  <div className="bg-panel/80 p-2 rounded-lg">
                    <span className="text-muted text-[11px] block">Séries Aquecimento</span>
                    <strong className="text-strong font-mono text-sm">{exercise.warmupSets} específica(s)</strong>
                  </div>
                </div>

                {exercise.notes && (
                  <div className="mt-2 text-[12.5px] text-muted flex items-start gap-1.5 bg-panel/40 p-2 rounded-lg">
                    <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                    <span>{exercise.notes}</span>
                  </div>
                )}

                {/* Progressão sugerida pelo motor (a partir do histórico real) */}
                {progressionMap.get(exercise.id) && (() => {
                  const s = progressionMap.get(exercise.id)!;
                  const tone =
                    s.action === 'aumentar_carga'
                      ? 'bg-lime/10 border border-lime/30'
                      : s.action === 'manter_com_dor'
                        ? 'bg-danger/10 border border-danger/30'
                        : 'bg-panel/40 border border-elevated/60';
                  const iconTone =
                    s.action === 'aumentar_carga' ? 'text-lime' : s.action === 'manter_com_dor' ? 'text-danger' : 'text-muted';
                  return (
                    <div className={`mt-2 p-2 rounded-lg text-[12.5px] ${tone}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {s.action === 'manter_com_dor' ? (
                          <ShieldAlert className={`w-3.5 h-3.5 ${iconTone} shrink-0`} />
                        ) : (
                          <TrendingUp className={`w-3.5 h-3.5 ${iconTone} shrink-0`} />
                        )}
                        <span className={`font-bold ${s.action === 'aumentar_carga' ? 'text-lime' : s.action === 'manter_com_dor' ? 'text-danger' : 'text-strong'}`}>
                          {s.label}: {s.suggestedLoadKg} kg
                        </span>
                      </div>
                      <span className="text-muted">{s.rationale}</span>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico Recente de Treinos */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-lime" />
            Histórico de Treinos Registrados
          </h2>
          <span className="text-xs text-muted flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-lime-dim" />
            Planejado × realizado (última semana): {weekly.realizedSessions}/{weekly.plannedSessions} sessões · Σ volume {weekly.volumeKg.toLocaleString('pt-BR')} kg
          </span>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="text-center py-8 text-muted text-xs">
            Nenhuma sessão registrada ainda. Clique em "Iniciar Sessão Agora" para registrar seu primeiro treino.
          </div>
        ) : (
          <div className="space-y-3">
            {workoutLogs.map((log) => (
              <div
                key={log.id}
                className="bg-base/70 border border-elevated/80 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{log.routineName}</span>
                    <span className="text-muted">•</span>
                    <span className="text-muted font-mono">{log.date}</span>
                  </div>
                  <div className="text-[12.5px] text-muted mt-1 flex flex-wrap items-center gap-3">
                    <span>Duração: <strong>{log.durationMinutes} min</strong></span>
                    <span>Volume Load: <strong className="text-lime">{log.totalVolumeLoadKg.toLocaleString('pt-BR')} kg</strong></span>
                    <span>RPE: <strong className="text-white">{log.perceivedEffortRPE}/10</strong></span>
                    {log.jointPainReported ? (
                      <span className="text-danger font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Dor articular relatada
                      </span>
                    ) : (
                      <span className="text-lime flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Articulações sem dor
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <div className="text-[12.5px] text-muted mt-1.5 italic"> "{log.notes}"
                    </div>
                  )}
                </div>

                <div className="self-end sm:self-center">
                  <span className="px-2.5 py-1 rounded-lg bg-elevated text-strong font-semibold text-[12.5px]">
                    {log.exercises.length} exercícios
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
