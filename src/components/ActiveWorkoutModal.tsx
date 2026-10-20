import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Check,
  Plus,
  AlertCircle,
  Trash2,
  ChevronDown,
  Clock,
  Timer,
  ChevronLeft,
} from 'lucide-react';
import { WorkoutRoutine, WorkoutSessionLog, LoggedExercise, LoggedSet } from '../types';

interface ActiveWorkoutModalProps {
  routine: WorkoutRoutine;
  lastLogs?: WorkoutSessionLog[];
  onClose: () => void;
  onFinishWorkout: (log: WorkoutSessionLog) => void;
}

const formatTime = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
};

const formatLoad = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  routine,
  lastLogs = [],
  onClose,
  onFinishWorkout,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(true);

  useLockBodyScroll(true);

  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(90);
  const [restActive, setRestActive] = useState(false);

  const [perceivedRPE, setPerceivedRPE] = useState(8);
  const [jointPainReported, setJointPainReported] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [exercisesState, setExercisesState] = useState<LoggedExercise[]>(() =>
    routine.exercises.map((ex) => {
      const previousLog = lastLogs.find((log) => log.exercises.some((e) => e.exerciseId === ex.id));
      const previousExercise = previousLog?.exercises.find((e) => e.exerciseId === ex.id);
      const previousSet = previousExercise?.sets.filter((s) => s.completed).slice(-1)[0];
      const defaultWeight = previousSet?.weightKg || ex.personalRecord?.weightKg || 40;
      const defaultReps = previousSet?.repsCompleted || parseInt(ex.repsTarget.split('-')[0], 10) || 8;
      const sets: LoggedSet[] = [];
      for (let s = 1; s <= ex.workingSets; s++) {
        sets.push({
          setNumber: s,
          isWarmup: false,
          weightKg: defaultWeight,
          repsCompleted: defaultReps,
          rirAchieved: ex.targetRir,
          painScale: 0,
          completed: false,
        });
      }
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetMuscle: ex.targetMuscle,
        sets,
      };
    })
  );

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);

    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (!restActive || restRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restActive, restRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestTotal(seconds);
    setRestRemaining(seconds);
    setRestActive(true);
  };

  const handleToggleSetComplete = (exIdx: number, setIdx: number, restSeconds: number) => {
    setExercisesState((prev) => {
      const updated = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      const targetSet = updated[exIdx].sets[setIdx];
      const wasCompleted = targetSet.completed;
      targetSet.completed = !wasCompleted;
      if (!wasCompleted) startRestTimer(restSeconds);
      return updated;
    });
  };

  const handleUpdateSetValue = (exIdx: number, setIdx: number, field: keyof LoggedSet, value: any) => {
    setExercisesState((prev) => {
      const updated = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      (updated[exIdx].sets[setIdx] as any)[field] = value;
      return updated;
    });
  };

  const handleAddSet = (exIdx: number, warmup = false) => {
    setExercisesState((prev) => {
      const updated = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      const ex = updated[exIdx];
      const lastSet = ex.sets[ex.sets.length - 1];
      const definition = routine.exercises.find((d) => d.id === ex.exerciseId);
      ex.sets.push({
        setNumber: ex.sets.length + 1,
        isWarmup: warmup,
        weightKg: warmup ? Math.round((lastSet?.weightKg || 40) * 0.5 * 2) / 2 : lastSet?.weightKg || 40,
        repsCompleted: warmup ? 12 : lastSet?.repsCompleted || parseInt(definition?.repsTarget.split('-')[0] || '8', 10),
        rirAchieved: warmup ? 4 : 1,
        painScale: 0,
        completed: false,
      });
      return updated;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercisesState((prev) => {
      const updated = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      if (updated[exIdx].sets.length <= 1) return updated;
      updated[exIdx].sets.splice(setIdx, 1);
      updated[exIdx].sets = updated[exIdx].sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      return updated;
    });
    setOpenMenu(null);
  };

  let totalVolumeLoad = 0;
  let totalCompletedSets = 0;
  let totalSets = 0;
  exercisesState.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalSets++;
      if (s.completed) {
        totalVolumeLoad += s.weightKg * s.repsCompleted;
        totalCompletedSets++;
      }
    });
  });
  const progress = totalSets === 0 ? 0 : Math.round((totalCompletedSets / totalSets) * 100);

  const handleFinish = () => {
    const log: WorkoutSessionLog = {
      id: `log_${Date.now()}`,
      routineId: routine.id,
      routineName: routine.name,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      exercises: exercisesState,
      perceivedEffortRPE: perceivedRPE,
      jointPainReported,
      notes: sessionNotes || 'Treino concluÃ­do conforme prescriÃ§Ã£o.',
      totalVolumeLoadKg: totalVolumeLoad,
    };
    onFinishWorkout(log);
  };

  const restProgress = restTotal > 0 ? restRemaining / restTotal : 0;
  const ring = 2 * Math.PI * 16;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base">
      {/* Barra superior da sessÃ£o */}
      <div className="sticky top-0 z-20 border-b border-line bg-base/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={onClose} className="icon-btn -ml-2" aria-label="Fechar treino">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-ink">{routine.name.split(':').slice(-1)[0].trim()}</div>
                <div className="text-[12.5px] text-muted">
                  {totalCompletedSets} de {totalSets} sÃ©ries Â· {progress}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="mr-1 flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                <span className="metric text-[13.5px] font-semibold text-ink">{formatTime(elapsedSeconds)}</span>
              </div>
              <button
                onClick={() => setSessionActive((v) => !v)}
                className="icon-btn"
                title={sessionActive ? 'Pausar sessÃ£o' : 'Retomar sessÃ£o'}
                aria-label={sessionActive ? 'Pausar sessÃ£o' : 'Retomar sessÃ£o'}
              >
                {sessionActive ? <Timer className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
              </button>
              <button
                onClick={handleFinish}
                className="icon-btn text-lime"
                title="Concluir treino"
                aria-label="Concluir treino"
              >
                <Check className="h-[20px] w-[20px]" strokeWidth={2.4} />
              </button>
            </div>
          </div>
          <div className="track mb-0 h-[3px] rounded-none bg-line">
            <span style={{ width: `${progress}%` }} className="rounded-none" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-40 pt-4 sm:px-6">
        <div className="space-y-3.5">
          {exercisesState.map((ex, exIdx) => {
            const definition = routine.exercises.find((d) => d.id === ex.exerciseId) || routine.exercises[exIdx];
            const previousLog = lastLogs.find((log) => log.exercises.some((e) => e.exerciseId === ex.exerciseId));
            const previousExercise = previousLog?.exercises.find((e) => e.exerciseId === ex.exerciseId);
            const previousSet = previousExercise?.sets.filter((s) => s.completed).slice(-1)[0];
            const doneSets = ex.sets.filter((s) => s.completed).length;

            return (
              <section key={ex.exerciseId} className="panel overflow-hidden">
                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold leading-snug text-ink">{ex.exerciseName}</h2>
                    <p className="mt-1 text-[13px] text-muted">
                      {ex.sets.length} sÃ©ries Â· {definition?.repsTarget || '8-10'} reps Â· {definition?.restSeconds || 90}s de descanso
                    </p>
                  </div>
                  <span className={`metric shrink-0 rounded-full px-2 py-1 text-[12.5px] font-medium ${doneSets === ex.sets.length ? 'bg-lime/12 text-lime' : 'bg-elevated text-muted'}`}>
                    {doneSets}/{ex.sets.length}
                  </span>
                </div>

                <div className="flex items-center justify-between border-y border-line bg-surface/60 px-4 py-1.5">
                  <button
                    onClick={() => handleAddSet(exIdx, true)}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-lime"
                  >
                    <Plus className="h-3.5 w-3.5" /> Aquecimento
                  </button>
                  <span className="text-[11.5px] text-faint">
                    {previousSet
                      ? `Ãšltima vez: ${formatLoad(previousSet.weightKg)} kg Ã— ${previousSet.repsCompleted}`
                      : definition?.personalRecord
                        ? `Melhor: ${formatLoad(definition.personalRecord.weightKg)} kg Ã— ${definition.personalRecord.reps}`
                        : 'Primeira vez neste exercÃ­cio'}
                  </span>
                </div>

                <div className="px-2 py-2">
                  <div className="grid grid-cols-[1.9rem_1rem_minmax(0,1fr)_4rem_3.25rem_2.75rem_1.5rem] items-center gap-2.5 px-2 pb-1 text-[11px] text-faint max-[480px]:grid-cols-[1.75rem_1rem_minmax(0,1fr)_3.75rem_3rem_2.5rem_1.5rem] max-[480px]:gap-1.5">
                    <span />
                    <span>#</span>
                    <span>Anterior</span>
                    <span className="text-center">kg</span>
                    <span className="text-center">reps</span>
                    <span className="text-center">RIR</span>
                    <span />
                  </div>

                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} className="set-row" data-done={set.completed}>
                      <button
                        onClick={() => handleToggleSetComplete(exIdx, setIdx, definition?.restSeconds || 90)}
                        aria-label={set.completed ? `Desmarcar sÃ©rie ${setIdx + 1}` : `Concluir sÃ©rie ${setIdx + 1}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                          set.completed
                            ? 'border-lime bg-lime text-lime-ink'
                            : 'border-line-strong text-faint hover:border-lime/60 hover:text-lime'
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={2.8} />
                      </button>

                      <span className={`text-[13px] font-semibold ${set.completed ? 'text-lime' : 'text-muted'}`}>
                        {set.isWarmup ? 'A' : setIdx + 1}
                      </span>

                      <span className="min-w-0 text-[12.5px] text-faint">
                        {previousSet ? (
                          <>
                            <span className="metric text-strong">{formatLoad(previousSet.weightKg)}</span> kg Â· {previousSet.repsCompleted} reps
                          </>
                        ) : (
                          <span className="text-faint">â€”</span>
                        )}
                      </span>

                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        aria-label={`Carga da sÃ©rie ${setIdx + 1}`}
                        value={set.weightKg}
                        onChange={(e) => handleUpdateSetValue(exIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                        className="metric h-9 w-full rounded-lg border border-line bg-base px-1 text-center text-[13.5px] font-semibold text-ink focus:border-lime focus:outline-none"
                      />

                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`RepetiÃ§Ãµes da sÃ©rie ${setIdx + 1}`}
                        value={set.repsCompleted}
                        onChange={(e) => handleUpdateSetValue(exIdx, setIdx, 'repsCompleted', parseInt(e.target.value, 10) || 0)}
                        className="metric h-9 w-full rounded-lg border border-line bg-base px-1 text-center text-[13.5px] font-semibold text-ink focus:border-lime focus:outline-none"
                      />

                      <select
                        aria-label={`RIR da sÃ©rie ${setIdx + 1}`}
                        value={set.rirAchieved}
                        onChange={(e) => handleUpdateSetValue(exIdx, setIdx, 'rirAchieved', parseInt(e.target.value, 10))}
                        className="metric h-9 w-full appearance-none rounded-lg border border-line bg-base text-center text-[13px] font-medium text-muted focus:border-lime focus:outline-none"
                      >
                        {[0, 1, 2, 3, 4].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === `${exIdx}-${setIdx}` ? null : `${exIdx}-${setIdx}`)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-elevated hover:text-ink"
                          aria-label={`OpÃ§Ãµes da sÃ©rie ${setIdx + 1}`}
                        >
                          <span className="leading-none">â‹¯</span>
                        </button>
                        {openMenu === `${exIdx}-${setIdx}` && (
                          <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-line-strong bg-elevated p-1 shadow-xl">
                            <button
                              onClick={() => {
                                handleUpdateSetValue(exIdx, setIdx, 'isWarmup', !set.isWarmup);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-strong hover:bg-panel"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {set.isWarmup ? 'Marcar como trabalho' : 'Marcar como aquecimento'}
                            </button>
                            <button
                              onClick={() => handleRemoveSet(exIdx, setIdx)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-danger hover:bg-panel"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover sÃ©rie
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-[13px] font-medium text-muted transition hover:border-lime/50 hover:text-lime"
                  >
                    <Plus className="h-3.5 w-3.5" /> SÃ©rie
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        {/* Fechar a sessÃ£o */}
        <section className="panel mt-4 overflow-hidden">
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5"
            aria-expanded={showSummary}
          >
            <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
              <Clock className="h-4 w-4 text-lime" />
              Como foi a sessÃ£o?
            </span>
            <ChevronDown className={`h-4 w-4 text-muted transition ${showSummary ? 'rotate-180' : ''}`} />
          </button>

          {showSummary && (
            <div className="space-y-4 border-t border-line px-4 py-4">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="rpe" className="label">
                    EsforÃ§o percebido (RPE)
                  </label>
                  <span className="metric text-[13.5px] font-semibold text-lime">{perceivedRPE}</span>
                </div>
                <input
                  id="rpe"
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={perceivedRPE}
                  onChange={(e) => setPerceivedRPE(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-lime"
                />
              </div>

              <button
                type="button"
                onClick={() => setJointPainReported(!jointPainReported)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-[13px] transition ${
                  jointPainReported ? 'border-danger/50 bg-danger/10 text-danger' : 'border-line text-muted hover:text-strong'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Desconforto articular
                </span>
                <span>{jointPainReported ? 'Registrado' : 'Nenhum'}</span>
              </button>

              <div>
                <label htmlFor="notes" className="label">
                  ObservaÃ§Ãµes
                </label>
                <input
                  id="notes"
                  type="text"
                  placeholder="Carga subiu com folga, tÃ©cnica estÃ¡velâ€¦"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="field mt-1.5"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* CronÃ´metro de descanso flutuante */}
      {restRemaining > 0 && (
        <div className="fixed bottom-28 right-4 z-20 w-[168px] rounded-2xl border border-line-strong bg-elevated p-3 shadow-xl sm:right-6">
          <div className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0">
              <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#2c3426" strokeWidth="3" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#b8f63f"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ring * (1 - restProgress)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <Timer className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-lime" />
            </div>
            <div>
              <div className="metric text-[15px] font-semibold text-ink">{formatTime(restRemaining)}</div>
              <div className="text-[11.5px] text-muted">descanso</div>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <button onClick={() => setRestRemaining((p) => p + 30)} className="btn h-7 flex-1 border border-line px-0 text-[11.5px] text-strong hover:border-lime/50">
              +30s
            </button>
            <button
              onClick={() => {
                setRestRemaining(0);
                setRestActive(false);
              }}
              className="btn h-7 flex-1 px-0 text-[11.5px] text-muted hover:text-ink"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* RodapÃ© da sessÃ£o */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-base/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[11.5px] text-faint">Volume</div>
              <div className="metric text-[15px] font-semibold text-ink">
                {totalVolumeLoad.toLocaleString('pt-BR')} <span className="text-[11.5px] font-normal text-faint">kg</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[11.5px] text-faint">SÃ©ries</div>
              <div className="metric text-[15px] font-semibold text-lime">
                {totalCompletedSets}<span className="text-[11.5px] font-normal text-faint"> / {totalSets}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn btn-ghost h-9 px-3 text-[13px]">
              Sair
            </button>
            <button onClick={handleFinish} className="btn btn-lime h-10 px-4">
              <Check className="h-4 w-4" strokeWidth={2.6} />
              Concluir treino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
