import React from 'react';
import {
  Play,
  Flame,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  History,
  BookOpen,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Activity,
  Scale,
  Target,
} from 'lucide-react';
import { UserProfile, WorkoutProgram, NutritionPlan, Anthropometry, DailyNutritionLog, RecoveryLog, AdaptiveAdjustment, WorkoutSessionLog } from '../types';
import { DisclaimerBanner } from './DisclaimerBanner';
import { MuscleMap } from './ui/MuscleMap';

interface DashboardViewProps {
  profile: UserProfile;
  program: WorkoutProgram;
  nutrition: NutritionPlan;
  anthropometry: Anthropometry[];
  todayNutrition: DailyNutritionLog;
  recovery: RecoveryLog;
  latestAdjustment: AdaptiveAdjustment;
  workoutLogs: WorkoutSessionLog[];
  onStartWorkout: (routineIndex: number) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAi: () => void;
  onOpenAdaptive: () => void;
  onOpenCheckin: () => void;
  onQuickAddWater: (amountMl: number) => void;
  onOpenExerciseLibrary: () => void;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const shortDate = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  program,
  nutrition,
  anthropometry,
  todayNutrition,
  recovery,
  latestAdjustment,
  workoutLogs,
  onStartWorkout,
  onNavigateTab,
  onOpenAi,
  onOpenAdaptive,
  onOpenCheckin,
  onQuickAddWater,
  onOpenExerciseLibrary,
}) => {
  const currentAnth = anthropometry[0] || {
    weightKg: profile.weightKg,
    waistCm: 82,
    estimatedBodyFatPct: 15.8,
    estimatedLeanMassKg: 66.9,
  };
  const oldestAnth = anthropometry[anthropometry.length - 1] || currentAnth;
  const weightDelta = Math.round((currentAnth.weightKg - oldestAnth.weightKg) * 10) / 10;
  const waistDelta = Math.round((currentAnth.waistCm - oldestAnth.waistCm) * 10) / 10;

  const todayRoutine = program.routines[0] || null;
  const lastLog = workoutLogs[0];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = workoutLogs.filter((l) => new Date(`${l.date}T12:00:00`) >= weekAgo);
  const weekVolume = weekLogs.reduce((sum, l) => sum + l.totalVolumeLoadKg, 0);
  const weekSets = weekLogs.reduce(
    (sum, l) => sum + l.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0),
    0
  );
  const plannedSets = todayRoutine ? todayRoutine.exercises.reduce((s, ex) => s + ex.workingSets, 0) : 0;

  const calPercent = Math.min(100, Math.round((todayNutrition.consumedCalories / nutrition.targetMacros.calories) * 100));
  const protPercent = Math.min(100, Math.round((todayNutrition.consumedProtein / nutrition.targetMacros.proteinGrams) * 100));
  const carbPercent = Math.min(100, Math.round((todayNutrition.consumedCarbs / nutrition.targetMacros.carbsGrams) * 100));
  const fatPercent = Math.min(100, Math.round((todayNutrition.consumedFat / nutrition.targetMacros.fatGrams) * 100));
  const waterPercent = Math.min(100, Math.round((todayNutrition.consumedWaterMl / nutrition.hydrationTargetMl) * 100));

  const lastLogMuscles = lastLog
    ? Array.from(new Set(lastLog.exercises.map((ex) => ex.targetMuscle))).slice(0, 6)
    : todayRoutine
      ? Array.from(new Set(todayRoutine.exercises.map((ex) => ex.targetMuscle))).slice(0, 6)
      : [];

  const lastLogSets = lastLog
    ? lastLog.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0)
    : 0;

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <p className="text-[13.5px] capitalize text-muted">
          {today} · semana {program.currentWeek} de {program.totalWeeks}
        </p>
        <h1 className="mt-1.5 text-[24px] font-semibold leading-[1.05] sm:text-[34px]">
          Olá, {profile.name.split(' ')[0]}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          {program.isDeloadWeek ? 'Semana de deload: volume reduzido para consolidar.' : 'Plano calibrado para hipertrofia.'}{' '}
          {todayRoutine ? `Hoje é ${todayRoutine.name.replace('Treino ', 'treino ').split(':')[0]}.` : ''}
        </p>
      </header>

      {/* Três números que respondem "como estou esta semana" */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3" aria-label="Resumo da semana">
        <div className="panel p-4">
          <div className="text-[13.5px] font-medium text-muted">Volume 7 dias</div>
          <div className="metric mt-2 text-[28px] font-semibold text-ink sm:text-[30px]">
            {brl(weekVolume)}
            <span className="ml-1.5 text-[13px] font-normal text-faint">kg</span>
          </div>
          <div className="mt-2 text-[13.5px] leading-snug text-faint">
            {weekLogs.length === 0
              ? 'Registre seu primeiro treino'
              : `${weekLogs.length} ${weekLogs.length === 1 ? 'sessão' : 'sessões'} na semana`}
          </div>
        </div>

        <div className="panel p-4">
          <div className="text-[13.5px] font-medium text-muted">Séries feitas</div>
          <div className="metric mt-2 text-[28px] font-semibold text-ink sm:text-[30px]">
            {weekSets}
            <span className="ml-1.5 text-[13px] font-normal text-faint">de {plannedSets} hoje</span>
          </div>
          <div className="mt-2 text-[13.5px] leading-snug text-faint">{workoutLogs.length} sessões no ciclo</div>
        </div>

        <div className="panel col-span-2 p-4 lg:col-span-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[13.5px] font-medium text-muted">Meta de hoje</div>
            <div className="text-[13.5px] font-medium text-lime">{calPercent}%</div>
          </div>
          <div className="metric mt-2 flex flex-wrap items-baseline gap-x-2 text-[28px] font-semibold text-ink sm:text-[30px]">
            {brl(nutrition.targetMacros.calories)}
            <span className="text-[13px] font-normal text-faint">kcal</span>
            <span className="text-[13px] font-normal text-faint">{brl(todayNutrition.consumedCalories)} consumidas</span>
          </div>
          <div className="track mt-3">
            <span style={{ width: `${calPercent}%` }} />
          </div>
        </div>
      </section>

      {/* Atalhos largos, como no app */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          onClick={() => onNavigateTab('evolucao')}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-line-strong"
        >
          <History className="h-[18px] w-[18px] text-lime" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-medium text-ink">Histórico</span>
            <span className="block text-[13px] text-muted">{workoutLogs.length} treinos registrados</span>
          </span>
          <ChevronRight className="h-4 w-4 text-faint" />
        </button>

        <button
          onClick={onOpenExerciseLibrary}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-line-strong"
        >
          <BookOpen className="h-[18px] w-[18px] text-lime" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-medium text-ink">Biblioteca</span>
            <span className="block text-[13px] text-muted">Exercícios e execução</span>
          </span>
          <ChevronRight className="h-4 w-4 text-faint" />
        </button>
      </section>

      {/* Último treino, o bloco de marca */}
      <section className="panel relative overflow-hidden p-5 sm:p-6">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13.5px] font-medium text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              {lastLog ? 'Último treino' : 'Próximo treino'}
              <span className="text-faint">{lastLog ? shortDate(lastLog.date) : 'hoje'}</span>
            </div>
            <h2 className="mt-2.5 max-w-[19ch] text-[26px] font-semibold leading-[1.05] text-ink sm:text-[30px]">
              {(lastLog?.routineName || todayRoutine?.name || 'Treino do dia').split(':').slice(-1)[0].trim()}
            </h2>
            <p className="mt-2 text-[13.5px] text-muted">
              {lastLog
                ? `${lastLogSets} ${lastLogSets === 1 ? 'série' : 'séries'} · ${brl(lastLog.totalVolumeLoadKg)} kg de volume · ${lastLog.durationMinutes} min`
                : `${todayRoutine?.exercises.length || 0} exercícios · ${plannedSets} séries · ${todayRoutine?.estimatedDurationMin || 60} min`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => onStartWorkout(0)} className="btn btn-lime h-10 px-4 text-[13.5px]">
                <Play className="h-3.5 w-3.5 fill-current" />
                {lastLog ? 'Repetir treino' : 'Iniciar treino'}
              </button>
              <button onClick={() => onNavigateTab('treino')} className="btn btn-outline h-10 px-4 text-[13.5px]">
                Ver ficha
              </button>
            </div>
          </div>

          <div className="flex shrink-0 justify-center sm:justify-end">
            <MuscleMap muscles={lastLogMuscles} className="[&_svg]:h-[150px]" showLegend={false} />
          </div>
        </div>
      </section>

      {/* Seus treinos */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <h2 className="text-[15px] font-semibold">Seus treinos</h2>
          <button onClick={() => onNavigateTab('treino')} className="text-[13px] font-medium text-muted transition hover:text-lime">
            Ver programa
          </button>
        </div>
        <div className="px-2 pb-2">
          {program.routines.map((routine, idx) => {
            const sets = routine.exercises.reduce((s, ex) => s + ex.workingSets, 0);
            return (
              <div key={routine.id} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-elevated">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink">{routine.name.split(':').slice(-1)[0].trim()}</div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    {routine.exercises.length} exercícios · {sets} séries · {routine.estimatedDurationMin} min
                  </div>
                </div>
                <span className="hidden text-[13px] text-faint sm:block">{routine.dayOfWeek || 'Flexível'}</span>
                <button onClick={() => onStartWorkout(idx)} className="btn btn-outline h-8 px-3.5 text-[13px]">
                  Iniciar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Nutrição */}
        <section className="panel p-5 lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">Nutrição de hoje</h2>
              <p className="mt-0.5 text-[13px] text-muted">
                {nutrition.dietStrategy === 'deficit' ? 'Déficit calórico' : nutrition.dietStrategy === 'superavit' ? 'Superávit calórico' : 'Manutenção'} ·{' '}
                {nutrition.calorieDelta > 0 ? '+' : ''}
                {nutrition.calorieDelta} kcal
              </p>
            </div>
            <button onClick={() => onNavigateTab('dieta')} className="text-[13px] font-medium text-lime">
              Abrir
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="metric text-[30px] font-semibold text-ink">
              {brl(todayNutrition.consumedCalories)}
              <span className="ml-1.5 text-[13px] font-normal text-faint">/ {brl(nutrition.targetMacros.calories)} kcal</span>
            </div>
            <span className="text-[13px] font-medium text-lime">{calPercent}%</span>
          </div>
          <div className="track mt-2">
            <span style={{ width: `${calPercent}%` }} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { label: 'Proteína', value: todayNutrition.consumedProtein, target: nutrition.targetMacros.proteinGrams, pct: protPercent },
              { label: 'Carboidrato', value: todayNutrition.consumedCarbs, target: nutrition.targetMacros.carbsGrams, pct: carbPercent },
              { label: 'Gordura', value: todayNutrition.consumedFat, target: nutrition.targetMacros.fatGrams, pct: fatPercent },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-muted">{m.label}</span>
                  <span className="text-[12.5px] text-faint">{m.pct}%</span>
                </div>
                <div className="metric mt-1 text-[16px] font-medium text-ink">
                  {m.value}
                  <span className="text-[12.5px] font-normal text-faint"> / {m.target} g</span>
                </div>
                <div className="track mt-1.5 h-1">
                  <span style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <Droplets className="h-4 w-4 text-lime" />
              <span className="text-[13.5px] text-strong">
                {brl(todayNutrition.consumedWaterMl)} ml <span className="text-faint">de {brl(nutrition.hydrationTargetMl)} ml</span>
              </span>
            </div>
            <button onClick={() => onQuickAddWater(250)} className="btn h-8 border border-line px-3 text-[13px] text-strong hover:border-lime/50 hover:text-lime">
              + 250 ml
            </button>
          </div>
          <div className="mt-2 text-[12.5px] text-faint">Hidratação em {waterPercent}% da meta.</div>
        </section>

        {/* Ajuste adaptativo */}
        <section className="panel p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Ajuste da semana</h2>
              <span className="flex items-center gap-1.5 text-[13px] text-lime">
                <Activity className="h-3.5 w-3.5" />
                {latestAdjustment.status === 'optimal' ? 'Manter' : latestAdjustment.status === 'deload_recommended' ? 'Deload' : 'Ajustar'}
              </span>
            </div>
            <p className="mt-2 text-[13.5px] font-medium leading-snug text-ink">{latestAdjustment.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{latestAdjustment.whatChanged}</p>

            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
              <div>
                <dt className="text-[12.5px] text-faint">Sono</dt>
                <dd className="metric mt-1 text-[17px] font-medium text-ink">
                  {recovery.sleepHours} <span className="text-[12.5px] font-normal text-faint">h</span>
                </dd>
                <dd className="mt-0.5 text-[12.5px] capitalize text-muted">{recovery.sleepQuality}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-faint">Fadiga</dt>
                <dd className="metric mt-1 text-[17px] font-medium text-ink">
                  {recovery.fatigueScore} <span className="text-[12.5px] font-normal text-faint">/ 5</span>
                </dd>
                <dd className="mt-0.5 text-[12.5px] text-muted">
                  {recovery.fatigueScore >= 4 ? 'Alta' : recovery.fatigueScore >= 3 ? 'Média' : 'Baixa'}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-faint">Dores</dt>
                <dd className="mt-1 text-[15px] font-medium capitalize text-ink">{recovery.muscleSoreness}</dd>
                <dd className="mt-0.5 text-[12.5px] text-muted">Muscular</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onOpenAdaptive} className="btn btn-outline h-9 px-3.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Auditoria
            </button>
            <button onClick={onOpenCheckin} className="btn btn-ghost h-9 px-3">
              Check-in semanal
            </button>
            <button onClick={onOpenAi} className="btn btn-ghost ml-auto h-9 px-2 text-lime">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Peso e medidas */}
      <section className="panel px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Peso e medidas</h2>
          <button onClick={() => onNavigateTab('evolucao')} className="text-[13px] font-medium text-muted transition hover:text-lime">
            Registrar
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          <div className="pb-4 sm:pb-0 sm:pr-5">
            <div className="flex items-center gap-1.5 text-[12.5px] text-faint">
              <Scale className="h-3 w-3" /> Peso
            </div>
            <div className="metric mt-1.5 text-[20px] font-medium text-ink">
              {currentAnth.weightKg} <span className="text-[12.5px] font-normal text-faint">kg</span>
            </div>
            <div className={`mt-1 flex items-center gap-0.5 text-[12.5px] ${weightDelta < 0 ? 'text-lime' : 'text-muted'}`}>
              {weightDelta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {Math.abs(weightDelta)} kg no ciclo
            </div>
          </div>

          <div className="pb-4 sm:px-5 sm:pb-0">
            <div className="text-[12.5px] text-faint">Cintura</div>
            <div className="metric mt-1.5 text-[20px] font-medium text-ink">
              {currentAnth.waistCm} <span className="text-[12.5px] font-normal text-faint">cm</span>
            </div>
            <div className="mt-1 text-[12.5px] text-muted">{waistDelta === 0 ? 'Sem oscilação' : `${Math.abs(waistDelta)} cm no ciclo`}</div>
          </div>

          <div className="pb-4 sm:px-5 sm:pb-0">
            <div className="flex items-center gap-1.5 text-[12.5px] text-faint">
              <Target className="h-3 w-3" /> Gordura
            </div>
            <div className="metric mt-1.5 text-[20px] font-medium text-lime">
              {currentAnth.estimatedBodyFatPct}
              <span className="text-[12.5px] font-normal text-faint"> %</span>
            </div>
            <div className="mt-1 text-[12.5px] text-muted">Fórmula Navy</div>
          </div>

          <div className="sm:pl-5">
            <div className="text-[12.5px] text-faint">Massa magra</div>
            <div className="metric mt-1.5 text-[20px] font-medium text-ink">
              {currentAnth.estimatedLeanMassKg} <span className="text-[12.5px] font-normal text-faint">kg</span>
            </div>
            <div className="mt-1 text-[12.5px] text-muted">Preservada</div>
          </div>
        </div>
      </section>

      <div className="pt-1">
        <button onClick={onOpenAi} className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-line-strong">
          <span className="flex items-center gap-2.5">
            <Flame className="h-4 w-4 text-lime" />
            <span className="text-[13.5px] text-strong">Perguntar ao KINETIC IA sobre o treino de hoje</span>
          </span>
          <ChevronRight className="h-4 w-4 text-faint" />
        </button>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
