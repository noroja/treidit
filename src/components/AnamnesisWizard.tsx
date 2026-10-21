import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Utensils,
  X,
} from 'lucide-react';

import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { calculateNavyBodyFat } from '../utils/calculations';
import {
  ANAMNESIS_DOMAINS,
  DIET_PATTERN_LABEL,
  GOAL_LABEL,
  HEALTH_LABEL,
  PAIN_LABEL,
  RESTRICTION_LABEL,
  triageAnamnesis,
  type Anamnesis,
  type DietPattern,
  type FoodRestriction,
  type HealthCondition,
  type PainRegion,
} from '../engine/anamnesis';
import type { GoalType } from '../types';

interface AnamnesisWizardProps {
  /** Anamnese anterior (edição). Ausente = primeira triagem (obrigatória). */
  initial?: Anamnesis | null;
  onComplete: (anamnesis: Anamnesis) => void;
  /** Só permitido quando é edição; no primeiro uso a triagem é obrigatória. */
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Identificação', hint: 'Quem é você e o objetivo', icon: User },
  { id: 2, title: 'Saúde', hint: 'Condições e liberação', icon: HeartPulse },
  { id: 3, title: 'Lesões & dor', hint: 'O que dói hoje', icon: ShieldAlert },
  { id: 4, title: 'Treino', hint: 'Experiência e rotina', icon: Dumbbell },
  { id: 5, title: 'Nutrição', hint: 'Padrão e restrições', icon: Utensils },
  { id: 6, title: 'Rotina', hint: 'Sono e estresse', icon: Activity },
  { id: 7, title: 'Medidas', hint: 'Antropometria e revisão', icon: Ruler },
];

const GOALS: GoalType[] = ['hipertrofia', 'perda_gordura', 'recomposicao', 'manutencao', 'ganho_peso', 'performance'];
const HEALTH_OPTIONS: HealthCondition[] = [
  'nenhuma',
  'cardiopatia',
  'hipertensao',
  'diabetes',
  'obesidade_grave',
  'cirurgia_recente',
  'gestacao',
  'medicacao_continua',
  'doenca_renal',
  'doenca_hepatica',
];
const PAIN_OPTIONS: PainRegion[] = ['joelho', 'lombar', 'ombro', 'cotovelo', 'punho', 'quadril', 'tornozelo', 'cervical'];
const RESTRICTION_OPTIONS: FoodRestriction[] = [
  'lactose',
  'gluten',
  'ovos',
  'amendoim',
  'castanhas',
  'peixe',
  'carne_vermelha',
  'soja',
];
const PATTERNS: DietPattern[] = ['onivoro', 'vegetariano', 'vegano', 'pescetariano'];

function defaultAnamnesis(): Anamnesis {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    identification: { name: '', age: 0, sex: 'masculino', heightCm: 0, weightKg: 0 },
    health: {
      conditions: ['nenhuma'],
      medicalClearance: 'nao_sei',
      medications: '',
      surgeries: '',
      smoker: false,
      alcohol: 'social',
    },
    injuries: { painRegions: [], painLevel: 0, notes: '' },
    training: {
      experience: 'iniciante',
      currentlyTrains: false,
      currentRoutineText: '',
      daysPerWeek: 3,
      sessionMinutes: 60,
      equipment: 'academia_completa',
      preferredExercises: [],
      dislikedExercises: [],
      cardio: 'nenhum',
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
    lifestyle: { sleepHours: 7, sleepQuality: 'boa', stress: 2, workContext: 'sentado' },
    measurements: { waistCm: 0, neckCm: undefined, hipCm: undefined, armCm: undefined, thighCm: undefined, calfCm: undefined },
    goal: { primary: 'hipertrofia', pace: 'moderado', priority: 'saude' },
  };
}

const clone = (a: Anamnesis): Anamnesis => JSON.parse(JSON.stringify(a)) as Anamnesis;

const inputClass =
  'w-full rounded-xl border border-line-strong bg-base px-3 py-2.5 text-[16px] text-ink outline-none transition placeholder:text-faint focus:border-lime';

const labelClass = 'mb-1 block text-[13px] font-medium text-muted';

const stepIssues = (step: number, d: Anamnesis): string[] => {
  const issues: string[] = [];
  if (step === 1) {
    if (d.identification.name.trim().length < 2) issues.push('nome');
    if (!(d.identification.age >= 14 && d.identification.age <= 100)) issues.push('idade (14–100)');
    if (!(d.identification.heightCm >= 120 && d.identification.heightCm <= 230)) issues.push('altura (120–230 cm)');
    if (!(d.identification.weightKg >= 35 && d.identification.weightKg <= 250)) issues.push('peso (35–250 kg)');
  }
  if (step === 2) {
    if (d.health.conditions.length === 0) issues.push('condições de saúde');
  }
  if (step === 3) {
    if (d.injuries.painLevel > 0 && d.injuries.painRegions.length === 0) issues.push('região da dor');
  }
  if (step === 4) {
    if (d.training.currentlyTrains && d.training.currentRoutineText.trim().length < 3) issues.push('rotina atual');
    if (!(d.training.daysPerWeek >= 2 && d.training.daysPerWeek <= 6)) issues.push('dias por semana (2–6)');
    if (!(d.training.sessionMinutes >= 15 && d.training.sessionMinutes <= 240)) issues.push('duração da sessão (15–240 min)');
  }
  if (step === 5) {
    if (!(d.nutrition.mealsPerDay >= 3 && d.nutrition.mealsPerDay <= 6)) issues.push('refeições por dia (3–6)');
  }
  if (step === 6) {
    if (!(d.lifestyle.sleepHours >= 3 && d.lifestyle.sleepHours <= 14)) issues.push('horas de sono (3–14)');
    if (!(d.lifestyle.stress >= 1 && d.lifestyle.stress <= 5)) issues.push('estresse (1–5)');
  }
  if (step === 7) {
    if (!(d.measurements.waistCm >= 30 && d.measurements.waistCm <= 250)) issues.push('cintura (cm)');
    if (!(typeof d.measurements.neckCm === 'number' && d.measurements.neckCm >= 20 && d.measurements.neckCm <= 80)) {
      issues.push('pescoço (cm)');
    }
  }
  return issues;
};

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-2 text-[13.5px] font-medium transition active:scale-[0.98] ${
      active ? 'border-lime bg-lime/15 text-lime' : 'border-line-strong bg-base text-strong hover:border-lime/40'
    }`}
  >
    {children}
  </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>
);

export const AnamnesisWizard: React.FC<AnamnesisWizardProps> = ({ initial, onComplete, onCancel }) => {
  useLockBodyScroll(true);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Anamnesis>(() => (initial ? clone(initial) : defaultAnamnesis()));
  const [issues, setIssues] = useState<string[]>([]);

  const patch = (mutate: (d: Anamnesis) => void) => {
    setDraft((prev) => {
      const next = clone(prev);
      mutate(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setIssues([]);
  };

  const triage = useMemo(() => triageAnamnesis(draft), [draft]);
  const navTriage = useMemo(() => {
    try {
      return triageAnamnesis(draft);
    } catch {
      return triage;
    }
  }, [draft, triage]);

  const progress = Math.round((step / STEPS.length) * 100);

  const goNext = () => {
    const found = stepIssues(step, draft);
    if (found.length > 0) {
      setIssues(found);
      return;
    }
    setIssues([]);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => {
    setIssues([]);
    setStep((s) => Math.max(1, s - 1));
  };

  const finish = () => {
    for (let s = 1; s <= STEPS.length; s += 1) {
      const found = stepIssues(s, draft);
      if (found.length > 0) {
        setStep(s);
        setIssues(found);
        return;
      }
    }
    onComplete({ ...draft, updatedAt: new Date().toISOString() });
  };

  const toggleCondition = (c: HealthCondition) => {
    patch((d) => {
      if (c === 'nenhuma') {
        d.health.conditions = ['nenhuma'];
        return;
      }
      const withoutNone = d.health.conditions.filter((x) => x !== 'nenhuma');
      d.health.conditions = withoutNone.includes(c) ? withoutNone.filter((x) => x !== c) : [...withoutNone, c];
      if (d.health.conditions.length === 0) d.health.conditions = ['nenhuma'];
    });
  };

  const toggleRegion = (r: PainRegion) => {
    patch((d) => {
      d.injuries.painRegions = d.injuries.painRegions.includes(r)
        ? d.injuries.painRegions.filter((x) => x !== r)
        : [...d.injuries.painRegions, r];
    });
  };

  const toggleRestriction = (r: FoodRestriction) => {
    patch((d) => {
      d.nutrition.restrictions = d.nutrition.restrictions.includes(r)
        ? d.nutrition.restrictions.filter((x) => x !== r)
        : [...d.nutrition.restrictions, r];
    });
  };

  const bfPreview =
    draft.identification.sex === 'feminino'
      ? calculateNavyBodyFat('feminino', draft.identification.heightCm || 165, draft.measurements.waistCm || 70, draft.measurements.neckCm || 32)
      : calculateNavyBodyFat('masculino', draft.identification.heightCm || 175, draft.measurements.waistCm || 80, draft.measurements.neckCm || 38);

  const currentStep = STEPS[step - 1];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-base text-strong">
      {/* Cabeçalho fixo com progresso */}
      <header className="shrink-0 border-b border-line bg-base/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-lime">
                <Sparkles className="h-3.5 w-3.5" />
                KINETIC · Triagem inicial
              </div>
              <h1 className="mt-1 text-[20px] font-semibold leading-tight text-ink sm:text-[24px]">
                {currentStep.title}
                <span className="ml-2 text-[13px] font-normal text-faint">
                  {step}/{STEPS.length}
                </span>
              </h1>
              <p className="mt-0.5 text-[13px] text-muted">{currentStep.hint}</p>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                aria-label="Fechar triagem"
                className="rounded-xl border border-line p-2 text-muted transition hover:border-line-strong hover:text-strong"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-elevated">
            <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${Math.max(4, progress)}%` }} />
          </div>

          {/* Trilha de etapas (rola no mobile) */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STEPS.map((s) => {
              const done = s.id < step;
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition ${
                    active
                      ? 'border-lime bg-lime/15 text-lime'
                      : done
                        ? 'border-lime/30 bg-lime/5 text-lime/80'
                        : 'border-line text-faint'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  <span className="whitespace-nowrap">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Corpo rolável */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {step === 1 && (
            <>
              <Card>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-name">
                      Nome
                    </label>
                    <input
                      id="anamnesis-name"
                      className={inputClass}
                      value={draft.identification.name}
                      onChange={(e) => patch((d) => (d.identification.name = e.target.value))}
                      placeholder="Como quer ser chamado(a)"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-age">
                        Idade (anos)
                      </label>
                      <input
                        id="anamnesis-age"
                        className={inputClass}
                        inputMode="numeric"
                        value={draft.identification.age || ''}
                        onChange={(e) => patch((d) => (d.identification.age = Number(e.target.value) || 0))}
                        placeholder="ex.: 32"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-sex">
                        Sexo biológico
                      </label>
                      <select
                        id="anamnesis-sex"
                        className={inputClass}
                        value={draft.identification.sex}
                        onChange={(e) => patch((d) => (d.identification.sex = e.target.value as 'masculino' | 'feminino'))}
                      >
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-height">
                        Altura (cm)
                      </label>
                      <input
                        id="anamnesis-height"
                        className={inputClass}
                        inputMode="decimal"
                        value={draft.identification.heightCm || ''}
                        onChange={(e) => patch((d) => (d.identification.heightCm = Number(e.target.value) || 0))}
                        placeholder="ex.: 175"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-weight">
                        Peso (kg)
                      </label>
                      <input
                        id="anamnesis-weight"
                        className={inputClass}
                        inputMode="decimal"
                        value={draft.identification.weightKg || ''}
                        onChange={(e) => patch((d) => (d.identification.weightKg = Number(e.target.value) || 0))}
                        placeholder="ex.: 78.5"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <span className={labelClass}>Objetivo principal</span>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => patch((d) => (d.goal.primary = g))}
                      className={`rounded-xl border px-3 py-2.5 text-left text-[13.5px] font-medium transition ${
                        draft.goal.primary === g
                          ? 'border-lime bg-lime/15 text-ink'
                          : 'border-line bg-base text-strong hover:border-lime/40'
                      }`}
                    >
                      {GOAL_LABEL[g]}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-pace">
                      Ritmo desejado
                    </label>
                    <select
                      id="anamnesis-pace"
                      className={inputClass}
                      value={draft.goal.pace}
                      onChange={(e) => patch((d) => (d.goal.pace = e.target.value as Anamnesis['goal']['pace']))}
                    >
                      <option value="lento">Lento e sustentável</option>
                      <option value="moderado">Moderado</option>
                      <option value="rapido">Rápido</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-priority">
                      Prioridade
                    </label>
                    <select
                      id="anamnesis-priority"
                      className={inputClass}
                      value={draft.goal.priority}
                      onChange={(e) => patch((d) => (d.goal.priority = e.target.value as Anamnesis['goal']['priority']))}
                    >
                      <option value="saude">Saúde</option>
                      <option value="estetica">Estética</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>
                </div>
              </Card>
            </>
          )}

          {step === 2 && (
            <>
              <Card>
                <span className={labelClass}>Condições de saúde declaradas</span>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_OPTIONS.map((c) => (
                    <Chip key={c} active={draft.health.conditions.includes(c)} onClick={() => toggleCondition(c)}>
                      {HEALTH_LABEL[c]}
                    </Chip>
                  ))}
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-faint">
                  Se houver qualquer condição, o KINETIC reduz o volume e pode exigir liberação médica antes de prescrever.
                </p>
              </Card>

              <Card>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-clearance">
                      Você tem liberação médica para atividade física?
                    </label>
                    <select
                      id="anamnesis-clearance"
                      className={inputClass}
                      value={draft.health.medicalClearance}
                      onChange={(e) =>
                        patch((d) => (d.health.medicalClearance = e.target.value as Anamnesis['health']['medicalClearance']))
                      }
                    >
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                      <option value="nao_sei">Não sei / nunca avaliei</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-medications">
                      Medicações contínuas
                    </label>
                    <input
                      id="anamnesis-medications"
                      className={inputClass}
                      value={draft.health.medications}
                      onChange={(e) => patch((d) => (d.health.medications = e.target.value))}
                      placeholder="Ex.: losartana 50 mg — ou 'nenhuma'"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-surgeries">
                      Cirurgias / internações relevantes
                    </label>
                    <input
                      id="anamnesis-surgeries"
                      className={inputClass}
                      value={draft.health.surgeries}
                      onChange={(e) => patch((d) => (d.health.surgeries = e.target.value))}
                      placeholder="Ex.: reconstrução de LCA em 2022"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Tabagismo</label>
                      <div className="flex gap-2">
                        <Chip active={!draft.health.smoker} onClick={() => patch((d) => (d.health.smoker = false))}>
                          Não
                        </Chip>
                        <Chip active={draft.health.smoker} onClick={() => patch((d) => (d.health.smoker = true))}>
                          Sim
                        </Chip>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-alcohol">
                        Álcool
                      </label>
                      <select
                        id="anamnesis-alcohol"
                        className={inputClass}
                        value={draft.health.alcohol}
                        onChange={(e) => patch((d) => (d.health.alcohol = e.target.value as Anamnesis['health']['alcohol']))}
                      >
                        <option value="nunca">Nunca</option>
                        <option value="social">Social</option>
                        <option value="frequente">Frequente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {draft.health.conditions.some((c) => c !== 'nenhuma') && (
                <div className="flex gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-[13px] leading-relaxed text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Condição declarada: o plano sai em modo conservador. Se a triagem indicar risco alto, procure liberação
                    médica antes de iniciar cargas.
                  </span>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Card>
                <span className={labelClass}>Sente dor hoje? Em quais regiões?</span>
                <div className="flex flex-wrap gap-2">
                  {PAIN_OPTIONS.map((r) => (
                    <Chip key={r} active={draft.injuries.painRegions.includes(r)} onClick={() => toggleRegion(r)}>
                      {PAIN_LABEL[r]}
                    </Chip>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <label className={labelClass} htmlFor="anamnesis-pain">
                      Intensidade da dor
                    </label>
                    <span className={`text-[13px] font-semibold ${draft.injuries.painLevel >= 7 ? 'text-red-400' : 'text-lime'}`}>
                      {draft.injuries.painLevel}/10
                    </span>
                  </div>
                  <input
                    id="anamnesis-pain"
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={draft.injuries.painLevel}
                    onChange={(e) => patch((d) => (d.injuries.painLevel = Number(e.target.value)))}
                    className="w-full accent-lime"
                  />
                  <div className="flex justify-between text-[11.5px] text-faint">
                    <span>Sem dor</span>
                    <span>Moderada</span>
                    <span>Insuportável</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className={labelClass} htmlFor="anamnesis-pain-notes">
                    Quando a dor aparece / limitações
                  </label>
                  <textarea
                    id="anamnesis-pain-notes"
                    className={`${inputClass} min-h-[88px] resize-y`}
                    value={draft.injuries.notes}
                    onChange={(e) => patch((d) => (d.injuries.notes = e.target.value))}
                    placeholder="Ex.: dor no joelho direito ao descer escadas; evitava agachamento profundo."
                  />
                </div>
              </Card>

              <div className="flex gap-2.5 rounded-2xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <span>O motor troca exercícios de risco por variações seguras — mas dor intensa exige avaliação profissional.</span>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Card>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-exp">
                      Experiência com musculação
                    </label>
                    <select
                      id="anamnesis-exp"
                      className={inputClass}
                      value={draft.training.experience}
                      onChange={(e) => patch((d) => (d.training.experience = e.target.value as Anamnesis['training']['experience']))}
                    >
                      <option value="iniciante">Iniciante (até 1 ano)</option>
                      <option value="intermediario">Intermediário (1–3 anos)</option>
                      <option value="avancado">Avançado (3+ anos)</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Treina atualmente?</label>
                    <div className="flex gap-2">
                      <Chip active={draft.training.currentlyTrains} onClick={() => patch((d) => (d.training.currentlyTrains = true))}>
                        Sim
                      </Chip>
                      <Chip active={!draft.training.currentlyTrains} onClick={() => patch((d) => (d.training.currentlyTrains = false))}>
                        Não
                      </Chip>
                    </div>
                  </div>

                  {draft.training.currentlyTrains && (
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-routine">
                        Como é a sua rotina atual?
                      </label>
                      <textarea
                        id="anamnesis-routine"
                        className={`${inputClass} min-h-[88px] resize-y`}
                        value={draft.training.currentRoutineText}
                        onChange={(e) => patch((d) => (d.training.currentRoutineText = e.target.value))}
                        placeholder="Ex.: ABC 3x, supino/remada/agachamento, sem controlar RIR."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-days">
                        Dias por semana
                      </label>
                      <select
                        id="anamnesis-days"
                        className={inputClass}
                        value={draft.training.daysPerWeek}
                        onChange={(e) => patch((d) => (d.training.daysPerWeek = Number(e.target.value)))}
                      >
                        {[2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} dias
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-duration">
                        Minutos por sessão
                      </label>
                      <input
                        id="anamnesis-duration"
                        className={inputClass}
                        inputMode="numeric"
                        value={draft.training.sessionMinutes || ''}
                        onChange={(e) => patch((d) => (d.training.sessionMinutes = Number(e.target.value) || 0))}
                        placeholder="ex.: 60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="anamnesis-equipment">
                      Equipamentos disponíveis
                    </label>
                    <select
                      id="anamnesis-equipment"
                      className={inputClass}
                      value={draft.training.equipment}
                      onChange={(e) => patch((d) => (d.training.equipment = e.target.value as Anamnesis['training']['equipment']))}
                    >
                      <option value="academia_completa">Academia completa</option>
                      <option value="halteres_banco">Halteres + banco</option>
                      <option value="peso_corporal_homegym">Peso corporal / elásticos</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="anamnesis-cardio">
                      Cardio por semana
                    </label>
                    <select
                      id="anamnesis-cardio"
                      className={inputClass}
                      value={draft.training.cardio}
                      onChange={(e) => patch((d) => (d.training.cardio = e.target.value as Anamnesis['training']['cardio']))}
                    >
                      <option value="nenhum">Nenhum</option>
                      <option value="1-2x">1–2x</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-preferred">
                        Exercícios favoritos
                      </label>
                      <input
                        id="anamnesis-preferred"
                        className={inputClass}
                        value={draft.training.preferredExercises.join(', ')}
                        onChange={(e) =>
                          patch((d) => (d.training.preferredExercises = e.target.value.split(',').map((x) => x.trim()).filter(Boolean)))
                        }
                        placeholder="Ex.: supino, remada"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="anamnesis-disliked">
                        Exercícios que evita
                      </label>
                      <input
                        id="anamnesis-disliked"
                        className={inputClass}
                        value={draft.training.dislikedExercises.join(', ')}
                        onChange={(e) =>
                          patch((d) => (d.training.dislikedExercises = e.target.value.split(',').map((x) => x.trim()).filter(Boolean)))
                        }
                        placeholder="Ex.: agachamento frontal"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {step === 5 && (
            <>
              <Card>
                <span className={labelClass}>Padrão alimentar</span>
                <div className="grid grid-cols-2 gap-2">
                  {PATTERNS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => patch((d) => (d.nutrition.pattern = p))}
                      className={`rounded-xl border px-3 py-2.5 text-left text-[13.5px] font-medium transition ${
                        draft.nutrition.pattern === p
                          ? 'border-lime bg-lime/15 text-ink'
                          : 'border-line bg-base text-strong hover:border-lime/40'
                      }`}
                    >
                      {DIET_PATTERN_LABEL[p]}
                    </button>
                  ))}
                </div>

                <span className={`${labelClass} mt-4`}>Restrições / intolerâncias</span>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTION_OPTIONS.map((r) => (
                    <Chip key={r} active={draft.nutrition.restrictions.includes(r)} onClick={() => toggleRestriction(r)}>
                      {RESTRICTION_LABEL[r]}
                    </Chip>
                  ))}
                </div>

                <div className="mt-4">
                  <label className={labelClass} htmlFor="anamnesis-allergies">
                    Alergias e observações
                  </label>
                  <input
                    id="anamnesis-allergies"
                    className={inputClass}
                    value={draft.nutrition.allergiesNotes}
                    onChange={(e) => patch((d) => (d.nutrition.allergiesNotes = e.target.value))}
                    placeholder="Ex.: alergia a frutos do mar; não como fígado."
                  />
                </div>
              </Card>

              <Card>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-meals">
                      Refeições por dia
                    </label>
                    <select
                      id="anamnesis-meals"
                      className={inputClass}
                      value={draft.nutrition.mealsPerDay}
                      onChange={(e) => patch((d) => (d.nutrition.mealsPerDay = Number(e.target.value)))}
                    >
                      {[3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} refeições
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-eatingout">
                      Come fora por semana
                    </label>
                    <select
                      id="anamnesis-eatingout"
                      className={inputClass}
                      value={draft.nutrition.eatingOut}
                      onChange={(e) => patch((d) => (d.nutrition.eatingOut = e.target.value as Anamnesis['nutrition']['eatingOut']))}
                    >
                      <option value="nunca">Quase nunca</option>
                      <option value="1-2x">1–2x</option>
                      <option value="3+">3+ vezes</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-cooking">
                      Cozinha em casa?
                    </label>
                    <select
                      id="anamnesis-cooking"
                      className={inputClass}
                      value={draft.nutrition.cooksAtHome}
                      onChange={(e) =>
                        patch((d) => (d.nutrition.cooksAtHome = e.target.value as Anamnesis['nutrition']['cooksAtHome']))
                      }
                    >
                      <option value="sim">Sim</option>
                      <option value="as_vezes">Às vezes</option>
                      <option value="nao">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-budget">
                      Orçamento alimentar
                    </label>
                    <select
                      id="anamnesis-budget"
                      className={inputClass}
                      value={draft.nutrition.budget}
                      onChange={(e) => patch((d) => (d.nutrition.budget = e.target.value as Anamnesis['nutrition']['budget']))}
                    >
                      <option value="baixo">Apertado</option>
                      <option value="medio">Médio</option>
                      <option value="alto">Confortável</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClass} htmlFor="anamnesis-supplements">
                    Suplementos em uso
                  </label>
                  <input
                    id="anamnesis-supplements"
                    className={inputClass}
                    value={draft.nutrition.supplements.join(', ')}
                    onChange={(e) =>
                      patch((d) => (d.nutrition.supplements = e.target.value.split(',').map((x) => x.trim()).filter(Boolean)))
                    }
                    placeholder="Ex.: creatina, whey — ou deixe vazio"
                  />
                </div>
              </Card>
            </>
          )}

          {step === 6 && (
            <Card>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="anamnesis-sleep">
                    Horas de sono/noite
                  </label>
                  <input
                    id="anamnesis-sleep"
                    className={inputClass}
                    inputMode="decimal"
                    value={draft.lifestyle.sleepHours || ''}
                    onChange={(e) => patch((d) => (d.lifestyle.sleepHours = Number(e.target.value) || 0))}
                    placeholder="ex.: 7.5"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="anamnesis-sleep-quality">
                    Qualidade do sono
                  </label>
                  <select
                    id="anamnesis-sleep-quality"
                    className={inputClass}
                    value={draft.lifestyle.sleepQuality}
                    onChange={(e) =>
                      patch((d) => (d.lifestyle.sleepQuality = e.target.value as Anamnesis['lifestyle']['sleepQuality']))
                    }
                  >
                    <option value="ruim">Ruim</option>
                    <option value="regular">Regular</option>
                    <option value="boa">Boa</option>
                    <option value="otima">Ótima</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="anamnesis-stress">
                    Nível de estresse
                  </label>
                  <span className="text-[13px] font-semibold text-lime">{draft.lifestyle.stress}/5</span>
                </div>
                <input
                  id="anamnesis-stress"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={draft.lifestyle.stress}
                  onChange={(e) => patch((d) => (d.lifestyle.stress = Number(e.target.value)))}
                  className="w-full accent-lime"
                />
                <div className="flex justify-between text-[11.5px] text-faint">
                  <span>Baixo</span>
                  <span>Alto</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="anamnesis-work">
                    Trabalho
                  </label>
                  <select
                    id="anamnesis-work"
                    className={inputClass}
                    value={draft.lifestyle.workContext}
                    onChange={(e) => patch((d) => (d.lifestyle.workContext = e.target.value as Anamnesis['lifestyle']['workContext']))}
                  >
                    <option value="sentado">Sentado a maior parte</option>
                    <option value="em_pe">Em pé a maior parte</option>
                    <option value="misto">Misto</option>
                    <option value="turnos">Turnos / noturno</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="anamnesis-steps">
                    Passos por dia (opcional)
                  </label>
                  <input
                    id="anamnesis-steps"
                    className={inputClass}
                    inputMode="numeric"
                    value={draft.lifestyle.stepsPerDay ?? ''}
                    onChange={(e) => patch((d) => (d.lifestyle.stepsPerDay = Number(e.target.value) || undefined))}
                    placeholder="ex.: 6000"
                  />
                </div>
              </div>
            </Card>
          )}

          {step === 7 && (
            <>
              <Card>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-waist">
                      Cintura (cm) *
                    </label>
                    <input
                      id="anamnesis-waist"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.waistCm || ''}
                      onChange={(e) => patch((d) => (d.measurements.waistCm = Number(e.target.value) || 0))}
                      placeholder="na altura do umbigo"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-neck">
                      Pescoço (cm) *
                    </label>
                    <input
                      id="anamnesis-neck"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.neckCm ?? ''}
                      onChange={(e) => patch((d) => (d.measurements.neckCm = Number(e.target.value) || undefined))}
                      placeholder="abaixo do pomo"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-hip">
                      Quadril (cm)
                    </label>
                    <input
                      id="anamnesis-hip"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.hipCm ?? ''}
                      onChange={(e) => patch((d) => (d.measurements.hipCm = Number(e.target.value) || undefined))}
                      placeholder="opcional"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-arm">
                      Braço (cm)
                    </label>
                    <input
                      id="anamnesis-arm"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.armCm ?? ''}
                      onChange={(e) => patch((d) => (d.measurements.armCm = Number(e.target.value) || undefined))}
                      placeholder="contraído"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-thigh">
                      Coxa (cm)
                    </label>
                    <input
                      id="anamnesis-thigh"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.thighCm ?? ''}
                      onChange={(e) => patch((d) => (d.measurements.thighCm = Number(e.target.value) || undefined))}
                      placeholder="linha média"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="anamnesis-calf">
                      Panturrilha (cm)
                    </label>
                    <input
                      id="anamnesis-calf"
                      className={inputClass}
                      inputMode="decimal"
                      value={draft.measurements.calfCm ?? ''}
                      onChange={(e) => patch((d) => (d.measurements.calfCm = Number(e.target.value) || undefined))}
                      placeholder="maior circunferência"
                    />
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-lime/25 bg-lime/10 p-3 text-[13px] text-strong">
                  Composição estimada (Navy): <strong className="text-lime">{bfPreview}% de gordura</strong> ·{' '}
                  <strong className="text-ink">
                    {Math.round((draft.identification.weightKg || 0) * (1 - bfPreview / 100) * 10) / 10} kg
                  </strong>{' '}
                  de massa magra
                </div>
              </Card>

              {/* Revisão + triagem */}
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <ShieldCheck className="h-4 w-4 text-lime" /> Revisão da triagem
                  </h2>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
                      navTriage.risk === 'alto'
                        ? 'border-red-400/40 bg-red-400/10 text-red-300'
                        : navTriage.risk === 'moderado'
                          ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                          : 'border-lime/40 bg-lime/10 text-lime'
                    }`}
                  >
                    Risco {navTriage.risk}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${navTriage.completenessPct}%` }} />
                </div>
                <p className="mt-1.5 text-[12.5px] text-muted">
                  {navTriage.completenessPct}% da triagem preenchida
                  {navTriage.missing.length > 0 ? ` · falta: ${navTriage.missing.slice(0, 4).join(', ')}` : ' · completa'}
                </p>

                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12.5px]">
                  <div>
                    <dt className="text-faint">Frequência recomendada</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{navTriage.recommendedFrequency}x / semana</dd>
                  </div>
                  <div>
                    <dt className="text-faint">Teto de volume</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{navTriage.weeklySetCap} séries/grupo</dd>
                  </div>
                  <div>
                    <dt className="text-faint">Refeições</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{navTriage.recommendedMealCount} / dia</dd>
                  </div>
                  <div>
                    <dt className="text-faint">Padrão alimentar</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{DIET_PATTERN_LABEL[draft.nutrition.pattern]}</dd>
                  </div>
                </dl>

                {navTriage.redFlags.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {navTriage.redFlags.map((flag) => (
                      <li key={flag} className="flex gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-2.5 text-[12.5px] leading-relaxed text-red-200">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                )}

                {navTriage.notes.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {navTriage.notes.slice(0, 5).map((note) => (
                      <li key={note} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime" />
                        {note}
                      </li>
                    ))}
                  </ul>
                )}

                {ANAMNESIS_DOMAINS.filter((d) => {
                  const found = navTriage.domains.find((x) => x.id === d.id);
                  return !!found && found.filled < found.total;
                }).map((d) => (
                  <p key={d.id} className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-200">
                    <AlertTriangle className="h-3 w-3" /> {d.label}: preencha os campos obrigatórios
                  </p>
                ))}
              </Card>

              <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-lime" /> O que acontece ao concluir
                </p>
                <ul className="mt-2 space-y-1.5">
                  <li>• Treino e dieta são gerados a partir das SUAS respostas (nada de plano genérico).</li>
                  <li>• Volume, exercícios e alimentos respeitam risco, dores e restrições declaradas.</li>
                  <li>• Metas calóricas continuam validadas pelos clamps de segurança do motor.</li>
                  <li>• A partir daí, cada treino/refeição conta para a ofensiva e o progresso semanal.</li>
                </ul>
              </div>
            </>
          )}

          {issues.length > 0 && (
            <div className="flex gap-2 rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-[13px] text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Preencha: {issues.join(', ')}.</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé fixo */}
      <footer
        className="shrink-0 border-t border-line bg-base px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-[13.5px] font-semibold text-strong transition disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          <span className="hidden text-[12.5px] text-faint sm:block">
            {step < STEPS.length ? `${STEPS.length - step} etapas restantes` : 'Tudo pronto para gerar'}
          </span>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-lime-ink transition active:scale-[0.98]"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="flex items-center gap-1.5 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-lime-ink transition active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> Gerar meu plano
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
