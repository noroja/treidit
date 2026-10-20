import React, { useMemo, useState } from 'react';
import { Dumbbell, Plus, Trash2, X, Check, Search } from 'lucide-react';
import { ExerciseLibraryItem, WorkoutProgram } from '../types';
import { buildCustomProgram } from '../engine/training';
import { EXERCISE_LIBRARY, AVAILABLE_MUSCLE_GROUPS } from '../data/exerciseLibraryData';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface DraftExercise {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  equipment: string;
  workingSets: number;
  repsTarget: string;
  targetRir: number;
  restSeconds: number;
}

interface DraftRoutine {
  name: string;
  focus: string;
  exercises: DraftExercise[];
}

interface CustomWorkoutModalProps {
  onClose: () => void;
  onApplyProgram: (program: WorkoutProgram) => void;
}

const defaultDraft = (): DraftRoutine[] => [
  { name: 'Treino A', focus: '', exercises: [] },
];

export const CustomWorkoutModal: React.FC<CustomWorkoutModalProps> = ({ onClose, onApplyProgram }) => {
  useLockBodyScroll(true);

  const [programName, setProgramName] = useState('Meu treino atual');
  const [routines, setRoutines] = useState<DraftRoutine[]>(defaultDraft);
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [pickerRoutineIdx, setPickerRoutineIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter(
      (e: ExerciseLibraryItem) =>
        (muscleFilter === 'Todos' || e.muscleGroup === muscleFilter) &&
        (q === '' || e.name.toLowerCase().includes(q)),
    ).slice(0, 60);
  }, [muscleFilter, search]);

  const updateRoutine = (idx: number, patch: Partial<DraftRoutine>) => {
    setRoutines((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addExercise = (idx: number, exerciseLibraryItem: ExerciseLibraryItem) => {
    setRoutines((prev) =>
      prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              exercises: [
                ...r.exercises,
                {
                  exerciseId: exerciseLibraryItem.id,
                  exerciseName: exerciseLibraryItem.name,
                  targetMuscle: exerciseLibraryItem.muscleGroup,
                  equipment: exerciseLibraryItem.equipment,
                  workingSets: 3,
                  repsTarget: '8-12',
                  targetRir: 2,
                  restSeconds: 120,
                },
              ],
            }
          : r,
      ),
    );
  };

  const updateExercise = (rIdx: number, exIdx: number, patch: Partial<DraftExercise>) => {
    setRoutines((prev) =>
      prev.map((r, i) =>
        i === rIdx
          ? { ...r, exercises: r.exercises.map((ex, j) => (j === exIdx ? { ...ex, ...patch } : ex)) }
          : r,
      ),
    );
  };

  const removeExercise = (rIdx: number, exIdx: number) => {
    setRoutines((prev) =>
      prev.map((r, i) => (i === rIdx ? { ...r, exercises: r.exercises.filter((_, j) => j !== exIdx) } : r)),
    );
  };

  const handleSave = () => {
    try {
      const program = buildCustomProgram({
        name: programName,
        // engine valida e normaliza (repsTarget, séries, RIR, descanso)
        routines: routines as never,
      });
      onApplyProgram(program);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dados inválidos — revise séries, reps e descanso.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto safe-bottom">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-2xl max-h-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-base p-4 border-b border-elevated flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/25 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-lime" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Usar o meu treino</h2>
              <p className="text-[12.5px] text-muted">
                Registre o treino que você já faz — o app audita (progressão, volume, dor) sem prescrever por cima.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-muted hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Nome do programa</label>
            <input
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="mt-1 w-full bg-base border border-line rounded-xl px-3 py-2 text-[13.5px] text-white focus:outline-none focus:border-lime/50"
              placeholder="Ex.: ABC na academia"
            />
          </div>

          {routines.map((routine, rIdx) => (
            <div key={rIdx} className="bg-base/60 border border-line rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Sessão {rIdx + 1}</label>
                  <input
                    value={routine.name}
                    onChange={(e) => updateRoutine(rIdx, { name: e.target.value })}
                    className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2 text-[13.5px] text-white focus:outline-none focus:border-lime/50"
                    placeholder="Ex.: A — Peito/Tríceps"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Foco (opcional)</label>
                  <input
                    value={routine.focus}
                    onChange={(e) => updateRoutine(rIdx, { focus: e.target.value })}
                    className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2 text-[13.5px] text-white focus:outline-none focus:border-lime/50"
                    placeholder="Ex.: força, pump..."
                  />
                </div>
              </div>

              {routine.exercises.length > 0 && (
                <div className="space-y-2">
                  {routine.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="bg-panel border border-line rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-white">{ex.exerciseName}</span>
                        <button
                          onClick={() => removeExercise(rIdx, exIdx)}
                          className="text-muted hover:text-danger cursor-pointer"
                          aria-label="Remover exercício"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        <label className="col-span-1">
                          <span className="block text-[10px] text-muted font-bold uppercase">Séries</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={ex.workingSets}
                            onChange={(e) => updateExercise(rIdx, exIdx, { workingSets: Number(e.target.value) })}
                            className="w-full bg-base border border-line rounded-lg px-2 py-1.5 text-[14px] text-white focus:outline-none focus:border-lime/50"
                          />
                        </label>
                        <label className="col-span-1">
                          <span className="block text-[10px] text-muted font-bold uppercase">Reps</span>
                          <input
                            value={ex.repsTarget}
                            onChange={(e) => updateExercise(rIdx, exIdx, { repsTarget: e.target.value })}
                            className="w-full bg-base border border-line rounded-lg px-2 py-1.5 text-[14px] text-white focus:outline-none focus:border-lime/50"
                            placeholder="8-12"
                          />
                        </label>
                        <label className="col-span-1">
                          <span className="block text-[10px] text-muted font-bold uppercase">RIR</span>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={ex.targetRir}
                            onChange={(e) => updateExercise(rIdx, exIdx, { targetRir: Number(e.target.value) })}
                            className="w-full bg-base border border-line rounded-lg px-2 py-1.5 text-[14px] text-white focus:outline-none focus:border-lime/50"
                          />
                        </label>
                        <label className="col-span-1">
                          <span className="block text-[10px] text-muted font-bold uppercase">Descanso</span>
                          <input
                            type="number"
                            min={30}
                            max={360}
                            step={15}
                            value={ex.restSeconds}
                            onChange={(e) => updateExercise(rIdx, exIdx, { restSeconds: Number(e.target.value) })}
                            className="w-full bg-base border border-line rounded-lg px-2 py-1.5 text-[14px] text-white focus:outline-none focus:border-lime/50"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seletor de exercícios (biblioteca de 873+, agrupada por grupo muscular) */}
              {pickerRoutineIdx === rIdx ? (
                <div className="bg-panel border border-line-strong rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 bg-base border border-line rounded-lg px-2.5 py-1.5 text-[14px] text-white focus:outline-none focus:border-lime/50"
                      placeholder="Buscar exercício por nome..."
                    />
                    <select
                      value={muscleFilter}
                      onChange={(e) => setMuscleFilter(e.target.value)}
                      className="bg-base border border-line rounded-lg px-2 py-1.5 text-[13px] text-white focus:outline-none"
                    >
                      <option>Todos</option>
                      {AVAILABLE_MUSCLE_GROUPS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                    {filtered.map((exerciseLibraryItem: ExerciseLibraryItem) => (
                      <button
                        key={exerciseLibraryItem.id}
                        onClick={() => {
                          addExercise(rIdx, exerciseLibraryItem);
                          setSearch('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-lime/10 text-[12.5px] text-strong hover:text-lime cursor-pointer flex items-center justify-between"
                      >
                        <span>{exerciseLibraryItem.name}</span>
                        <span className="text-[10.5px] text-muted">{exerciseLibraryItem.muscleGroup}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && <p className="text-[12px] text-muted px-2">Nada encontrado.</p>}
                  </div>
                  <button
                    onClick={() => setPickerRoutineIdx(-1)}
                    className="text-[12px] text-muted hover:text-white cursor-pointer"
                  >
                    fechar busca
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPickerRoutineIdx(rIdx)}
                  className="w-full border border-dashed border-line-strong rounded-lg py-2 text-[12.5px] text-lime font-bold hover:bg-lime/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar exercício
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setRoutines((prev) => [...prev, { name: `Treino ${String.fromCharCode(65 + prev.length)}`, focus: '', exercises: [] }])}
            className="w-full border border-dashed border-lime/40 rounded-xl py-2.5 text-[13px] text-lime font-bold hover:bg-lime/5 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nova sessão de treino
          </button>
        </div>

        {/* Rodapé */}
        <div className="bg-base border-t border-elevated p-4 safe-bottom">
          {error && (
            <p className="mb-2 text-[12.5px] text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted hidden sm:block">
              Séries: 1–10 · Reps: faixa numérica (ex. 8-12) · Descanso: 30–360s
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-white bg-panel border border-line cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-lime hover:bg-lime text-base font-bold text-xs rounded-xl active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Usar este treino
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
