import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useMemo, useState } from 'react';
import {
  Plus,
  Scale,
  Ruler,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  X,
  TrendingUp,
} from 'lucide-react';
import { Anthropometry, UserProfile, WorkoutSessionLog } from '../types';
import { calculateNavyBodyFat } from '../utils/calculations';
import { VolumeChart } from './ui/VolumeChart';
import { MuscleMap } from './ui/MuscleMap';
import { muscleLabel } from './ui/MuscleMap';

interface EvolutionViewProps {
  anthropometry: Anthropometry[];
  profile: UserProfile;
  workoutLogs: WorkoutSessionLog[];
  onAddAnthropometry: (newRecord: Anthropometry) => void;
  onOpenAi: () => void;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const dayLabel = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  anthropometry,
  profile,
  workoutLogs,
  onAddAnthropometry,
  onOpenAi,
}) => {
  const [tab, setTab] = useState<'dados' | 'medidas'>('dados');
  const [range, setRange] = useState<'7d' | 'todas'>('7d');
  const [showAddModal, setShowAddModal] = useState(false);

  const latest = anthropometry[0] || {
    weightKg: profile.weightKg,
    waistCm: 82,
    neckCm: 38.5,
    armCm: 38,
    thighCm: 59,
    calfCm: 38,
    chestCm: 104,
    estimatedBodyFatPct: 15.8,
    estimatedLeanMassKg: 66.9,
  };

  const [formWeight, setFormWeight] = useState(latest.weightKg);
  const [formWaist, setFormWaist] = useState(latest.waistCm);
  const [formNeck, setFormNeck] = useState(latest.neckCm);
  const [formArm, setFormArm] = useState(latest.armCm);
  const [formThigh, setFormThigh] = useState(latest.thighCm);
  const [formCalf, setFormCalf] = useState(latest.calfCm);
  const [formChest, setFormChest] = useState(latest.chestCm || 103);
  const [formNotes, setFormNotes] = useState('');

  const previewBf = calculateNavyBodyFat(profile.gender, profile.heightCm, formWaist, formNeck);
  const previewLeanMass = Math.round(formWeight * (1 - previewBf / 100) * 10) / 10;
  const previewFatMass = Math.round((formWeight - previewLeanMass) * 10) / 10;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAnthropometry({
      date: new Date().toISOString().split('T')[0],
      weightKg: Number(formWeight),
      heightCm: profile.heightCm,
      waistCm: Number(formWaist),
      neckCm: Number(formNeck),
      armCm: Number(formArm),
      thighCm: Number(formThigh),
      calfCm: Number(formCalf),
      chestCm: Number(formChest),
      estimatedBodyFatPct: previewBf,
      estimatedLeanMassKg: previewLeanMass,
      estimatedFatMassKg: previewFatMass,
      notes: formNotes || 'Acompanhamento periÃ³dico registrado.',
    });
    setShowAddModal(false);
  };

  const current = anthropometry[0] || latest;
  const oldest = anthropometry[anthropometry.length - 1] || current;
  const weightDelta = Math.round((current.weightKg - oldest.weightKg) * 10) / 10;
  const waistDelta = Math.round((current.waistCm - oldest.waistCm) * 10) / 10;
  const bfDelta = Math.round((current.estimatedBodyFatPct - oldest.estimatedBodyFatPct) * 10) / 10;

  const sortedLogs = useMemo(
    () => [...workoutLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [workoutLogs]
  );

  const { points, periodLogs, previousVolume } = useMemo(() => {
    if (range === 'todas') {
      const all = sortedLogs.slice(-10);
      const half = Math.floor(all.length / 2);
      return {
        points: all.map((l) => ({ label: dayLabel(l.date), value: l.totalVolumeLoadKg })),
        periodLogs: all,
        previousVolume: all.slice(0, half).reduce((s, l) => s + l.totalVolumeLoadKg, 0),
      };
    }
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);
    const recent = sortedLogs.filter((l) => new Date(`${l.date}T12:00:00`) >= limitDate);
    const earlier = sortedLogs.filter((l) => new Date(`${l.date}T12:00:00`) < limitDate).slice(-4);
    return {
      points: recent.map((l) => ({ label: dayLabel(l.date), value: l.totalVolumeLoadKg })),
      periodLogs: recent.length ? recent : sortedLogs.slice(-1),
      previousVolume: earlier.reduce((s, l) => s + l.totalVolumeLoadKg, 0),
    };
  }, [range, sortedLogs]);

  const periodVolume = periodLogs.reduce((s, l) => s + l.totalVolumeLoadKg, 0);
  const volumeDelta = previousVolume > 0 ? periodVolume - previousVolume : null;

  const muscleVolumes = useMemo(() => {
    const map: Record<string, number> = {};
    periodLogs.forEach((log) => {
      log.exercises.forEach((ex) => {
        const done = ex.sets.filter((s) => s.completed).length;
        if (done > 0) map[ex.targetMuscle] = (map[ex.targetMuscle] || 0) + done;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [periodLogs]);

  const exerciseBest = useMemo(() => {
    const map: Record<string, { name: string; best: number; volume: number }> = {};
    periodLogs.forEach((log) => {
      log.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (!set.completed) return;
          const entry = map[ex.exerciseId] || { name: ex.exerciseName, best: 0, volume: 0 };
          entry.best = Math.max(entry.best, set.weightKg);
          entry.volume += set.weightKg * set.repsCompleted;
          map[ex.exerciseId] = entry;
        });
      });
    });
    return Object.values(map).sort((a, b) => b.volume - a.volume).slice(0, 5);
  }, [periodLogs]);

  const maxExerciseVolume = exerciseBest[0]?.volume || 1;

  useLockBodyScroll(showAddModal);

  return (
    <div className="space-y-5 pb-2">
      <header className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-none sm:text-[32px]">EvoluÃ§Ã£o</h1>
          <p className="mt-2 text-[14px] text-muted">
            Cada treino registrado vira um ponto. {workoutLogs.length} sessÃµes no ciclo atual.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-lime h-9 self-start px-4 sm:self-auto">
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Registrar medidas
        </button>
      </header>

      <div className="seg" role="tablist" aria-label="SeÃ§Ãµes de evoluÃ§Ã£o">
        <button role="tab" aria-selected={tab === 'dados'} onClick={() => setTab('dados')} className="seg-item">
          Seus dados
        </button>
        <button role="tab" aria-selected={tab === 'medidas'} onClick={() => setTab('medidas')} className="seg-item">
          Suas medidas
        </button>
      </div>

      {tab === 'dados' ? (
        <>
          <section className="panel px-4 pb-4 pt-5 sm:px-6 sm:pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold">Volume de treino</h2>
                <p className="mt-0.5 text-[13px] text-muted">Carga Ã— repetiÃ§Ãµes de todas as sÃ©ries concluÃ­das</p>
              </div>
              <div className="seg" role="group" aria-label="PerÃ­odo">
                <button aria-selected={range === '7d'} onClick={() => setRange('7d')} className="seg-item">
                  7 dias
                </button>
                <button aria-selected={range === 'todas'} onClick={() => setRange('todas')} className="seg-item">
                  Todas
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <div className="metric text-[32px] font-semibold text-ink sm:text-[38px]">
                  {brl(periodVolume)}
                  <span className="ml-1.5 text-[13.5px] font-normal text-faint">kg</span>
                </div>
                <div className="mt-1.5 text-[13px] text-muted">volume no perÃ­odo</div>
              </div>
              <div className="text-right">
                {volumeDelta === null ? (
                  <span className="text-[13px] text-faint">Sem perÃ­odo anterior</span>
                ) : (
                  <span className={`flex items-center justify-end gap-1 text-[13px] font-medium ${volumeDelta >= 0 ? 'text-lime' : 'text-muted'}`}>
                    {volumeDelta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {brl(Math.abs(volumeDelta))} kg vs. perÃ­odo anterior
                  </span>
                )}
                <div className="mt-1 text-[12.5px] text-faint">
                  {periodLogs.length} {periodLogs.length === 1 ? 'sessÃ£o' : 'sessÃµes'}
                </div>
              </div>
            </div>

            <VolumeChart data={points} className="mt-2" />
          </section>

          <div className="grid gap-4 lg:grid-cols-12">
            <section className="panel p-5 lg:col-span-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">Mapa muscular</h2>
                  <p className="mt-0.5 text-[13px] text-muted">SÃ©ries concluÃ­das por grupo no perÃ­odo</p>
                </div>
                <span className="text-[12.5px] text-faint">
                  {muscleVolumes.length} {muscleVolumes.length === 1 ? 'grupo' : 'grupos'}
                </span>
              </div>

              <MuscleMap muscles={muscleVolumes.map(([m]) => m)} showLegend={false} className="mt-4" />

              <ul className="mt-4 space-y-2">
                {muscleVolumes.map(([muscle, sets]) => (
                  <li key={muscle} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-strong">{muscleLabel(muscle)}</span>
                    <span className="flex items-center gap-2">
                      <span className="h-1 w-14 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full rounded-full bg-lime"
                          style={{ width: `${Math.min(100, (sets / 20) * 100)}%` }}
                        />
                      </span>
                      <span className="metric w-6 text-right text-[13px] text-muted">{sets}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {muscleVolumes.length === 0 && (
                <p className="mt-4 text-[13px] text-muted">Nenhuma sÃ©rie concluÃ­da no perÃ­odo. Inicie um treino para preencher o mapa.</p>
              )}
            </section>

            <section className="panel p-5 lg:col-span-7">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">Carga por exercÃ­cio</h2>
                  <p className="mt-0.5 text-[13px] text-muted">Melhor sÃ©rie e volume acumulado no perÃ­odo</p>
                </div>
                <TrendingUp className="h-4 w-4 text-lime" />
              </div>

              <ul className="mt-4 space-y-3.5">
                {exerciseBest.map((ex) => (
                  <li key={ex.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13.5px] text-strong">{ex.name}</span>
                      <span className="metric shrink-0 text-[13px] text-muted">
                        {ex.best} kg <span className="text-faint">Â· {brl(ex.volume)} kg</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-lime" style={{ width: `${(ex.volume / maxExerciseVolume) * 100}%` }} />
                    </div>
                  </li>
                ))}
                {exerciseBest.length === 0 && (
                  <li className="text-[13px] text-muted">Registre um treino para ver suas cargas aqui.</li>
                )}
              </ul>
            </section>
          </div>

          <section className="panel px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">ComposiÃ§Ã£o corporal</h2>
              <span className="text-[12.5px] text-faint">Ãšltima avaliaÃ§Ã£o {dayLabel(current.date || new Date().toISOString())}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:divide-x sm:divide-line">
              <div className="sm:pr-5">
                <div className="flex items-center gap-1.5 text-[12.5px] text-faint"><Scale className="h-3 w-3" /> Peso</div>
                <div className="metric mt-1.5 text-[20px] font-medium text-ink">{current.weightKg} <span className="text-[12.5px] font-normal text-faint">kg</span></div>
                <div className={`mt-1 flex items-center gap-0.5 text-[12.5px] ${weightDelta < 0 ? 'text-lime' : 'text-muted'}`}>
                  {weightDelta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                  {Math.abs(weightDelta)} kg no ciclo
                </div>
              </div>
              <div className="sm:px-5">
                <div className="flex items-center gap-1.5 text-[12.5px] text-faint"><Ruler className="h-3 w-3" /> Cintura</div>
                <div className="metric mt-1.5 text-[20px] font-medium text-ink">{current.waistCm} <span className="text-[12.5px] font-normal text-faint">cm</span></div>
                <div className="mt-1 text-[12.5px] text-muted">{Math.abs(waistDelta)} cm no ciclo</div>
              </div>
              <div className="sm:px-5">
                <div className="flex items-center gap-1.5 text-[12.5px] text-faint"><Target className="h-3 w-3" /> Gordura</div>
                <div className="metric mt-1.5 text-[20px] font-medium text-lime">{current.estimatedBodyFatPct} <span className="text-[12.5px] font-normal text-faint">%</span></div>
                <div className="mt-1 text-[12.5px] text-muted">{Math.abs(bfDelta)}% no ciclo Â· Navy</div>
              </div>
              <div className="sm:pl-5">
                <div className="text-[12.5px] text-faint">Massa magra</div>
                <div className="metric mt-1.5 text-[20px] font-medium text-ink">{current.estimatedLeanMassKg} <span className="text-[12.5px] font-normal text-faint">kg</span></div>
                <div className="mt-1 text-[12.5px] text-muted">Preservada</div>
              </div>
            </div>
          </section>

          <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[14px] font-semibold">Quer a leitura do KINETIC IA sobre estes nÃºmeros?</h2>
              <p className="mt-1 text-[13px] text-muted">Cruza volume, cargas e composiÃ§Ã£o corporal com a sua resposta semanal.</p>
            </div>
            <button onClick={onOpenAi} className="btn btn-outline h-9 self-start px-4 sm:self-auto">
              Analisar evoluÃ§Ã£o
            </button>
          </section>
        </>
      ) : (
        <>
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[15px] font-semibold">Ãšltimas medidas</h2>
              <button onClick={() => setShowAddModal(true)} className="text-[13px] font-medium text-lime">
                Nova avaliaÃ§Ã£o
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-5 border-t border-line px-5 py-5 sm:grid-cols-3">
              {[
                { label: 'Peso', value: current.weightKg, unit: 'kg' },
                { label: 'Cintura', value: current.waistCm, unit: 'cm' },
                { label: 'PescoÃ§o', value: current.neckCm, unit: 'cm' },
                { label: 'BraÃ§o', value: current.armCm, unit: 'cm' },
                { label: 'Coxa', value: current.thighCm, unit: 'cm' },
                { label: 'Panturrilha', value: current.calfCm, unit: 'cm' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[12.5px] text-faint">{m.label}</div>
                  <div className="metric mt-1 text-[19px] font-medium text-ink">
                    {m.value} <span className="text-[12.5px] font-normal text-faint">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface/50 px-5 py-3">
              <span className="text-[13px] text-muted">
                Estimativa Navy: <strong className="font-semibold text-lime">{current.estimatedBodyFatPct}%</strong> de gordura Â·{' '}
                {current.estimatedLeanMassKg} kg de massa magra
              </span>
              <span className="text-[12.5px] text-faint">{anthropometry.length} registros</span>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                <CalendarDays className="h-4 w-4 text-lime" /> HistÃ³rico
              </h2>
            </div>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead className="text-[12.5px] text-faint">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Data</th>
                    <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                    <th className="px-3 py-2.5 text-right font-medium">Cintura</th>
                    <th className="px-3 py-2.5 text-right font-medium">BraÃ§o</th>
                    <th className="px-3 py-2.5 text-right font-medium">Coxa</th>
                    <th className="px-3 py-2.5 text-right font-medium">Pantur.</th>
                    <th className="px-3 py-2.5 text-right font-medium">% Gordura</th>
                    <th className="px-5 py-2.5 text-right font-medium">Massa magra</th>
                  </tr>
                </thead>
                <tbody>
                  {anthropometry.map((record) => (
                    <tr key={record.date} className="border-t border-line text-strong transition hover:bg-elevated">
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{dayLabel(record.date)}</td>
                      <td className="metric px-3 py-3 text-right font-medium text-ink">{record.weightKg} kg</td>
                      <td className="metric px-3 py-3 text-right">{record.waistCm} cm</td>
                      <td className="metric px-3 py-3 text-right">{record.armCm} cm</td>
                      <td className="metric px-3 py-3 text-right">{record.thighCm} cm</td>
                      <td className="metric px-3 py-3 text-right">{record.calfCm} cm</td>
                      <td className="metric px-3 py-3 text-right text-lime">{record.estimatedBodyFatPct}%</td>
                      <td className="metric px-5 py-3 text-right">{record.estimatedLeanMassKg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:items-center sm:p-4">
          <div className="panel w-full max-w-lg p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[16px] font-semibold">Registrar medidas</h2>
              <button onClick={() => setShowAddModal(false)} className="icon-btn" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label mb-1.5 block">Peso (kg)</span>
                  <input type="number" step="0.1" required value={formWeight} onChange={(e) => setFormWeight(parseFloat(e.target.value))} className="field" />
                </label>
                <label className="block">
                  <span className="label mb-1.5 block">Cintura (cm)</span>
                  <input type="number" step="0.5" required value={formWaist} onChange={(e) => setFormWaist(parseFloat(e.target.value))} className="field" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'PescoÃ§o', value: formNeck, set: setFormNeck },
                  { label: 'BraÃ§o', value: formArm, set: setFormArm },
                  { label: 'Coxa', value: formThigh, set: setFormThigh },
                  { label: 'Panturrilha', value: formCalf, set: setFormCalf },
                ].map((field) => (
                  <label key={field.label} className="block">
                    <span className="label mb-1.5 block">{field.label}</span>
                    <input
                      type="number"
                      step="0.5"
                      value={field.value}
                      onChange={(e) => field.set(parseFloat(e.target.value))}
                      className="field"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-lime/25 bg-lime/8 px-3.5 py-3">
                <div>
                  <div className="text-[13px] font-medium text-lime">Estimativa Navy</div>
                  <div className="text-[12.5px] text-muted">Calculada ao digitar</div>
                </div>
                <div className="text-right">
                  <div className="metric text-[18px] font-semibold text-lime">{previewBf}%</div>
                  <div className="text-[12.5px] text-muted">{previewLeanMass} kg de massa magra</div>
                </div>
              </div>

              <label className="block">
                <span className="label mb-1.5 block">ObservaÃ§Ãµes</span>
                <input
                  type="text"
                  placeholder="Medido em jejum, apÃ³s hidrataÃ§Ã£o regularâ€¦"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="field"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost h-9 px-4">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-lime h-9 px-4">
                  Salvar registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
