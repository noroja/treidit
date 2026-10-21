import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useState } from 'react';
import { 
  X, Calendar, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  BrainCircuit, Scale, Dumbbell, Utensils, HeartPulse, ShieldCheck, ChevronRight, Check
} from 'lucide-react';
import { 
  WeeklyCheckinData, 
  WeeklyCheckinReport, 
  UserProfile, 
  WorkoutProgram, 
  NutritionPlan, 
  Anthropometry, 
  WorkoutSessionLog, 
  DailyNutritionLog, 
  RecoveryLog 
} from '../types';
import { generateLocalWeeklyCheckin } from '../utils/methodology';
import { toLocalISODate } from '../engine/dates';

interface WeeklyCheckinModalProps {
  profile: UserProfile;
  program: WorkoutProgram;
  nutrition: NutritionPlan;
  anthropometry: Anthropometry[];
  workoutLogs: WorkoutSessionLog[];
  todayNutrition: DailyNutritionLog;
  recovery: RecoveryLog;
  onClose: () => void;
  onApplyCheckinReport: (report: WeeklyCheckinReport) => void;
}

export const WeeklyCheckinModal: React.FC<WeeklyCheckinModalProps> = ({
  profile,
  program,
  nutrition,
  anthropometry,
  workoutLogs,
  todayNutrition,
  recovery,
  onClose,
  onApplyCheckinReport,
}) => {
  const latestAnth = anthropometry[0] || {
    weightKg: profile.weightKg,
    waistCm: 82,
  };

  // Check-in input state pre-filled from user's current tracking data
  const [weightKg, setWeightKg] = useState(latestAnth.weightKg);
  const [waistCm, setWaistCm] = useState(latestAnth.waistCm);
  const [strengthProgression, setStrengthProgression] = useState<'aumentou' | 'manteve' | 'caiu'>('aumentou');
  const [avgRir, setAvgRir] = useState<number>(1.8);
  const [avgDailyCalories, setAvgDailyCalories] = useState<number>(nutrition.targetMacros.calories);
  const [adherenceScore, setAdherenceScore] = useState<number>(todayNutrition.adherenceScore || 5);
  const [hungerLevel, setHungerLevel] = useState<'baixa' | 'moderada' | 'alta'>(todayNutrition.hungerLevel || 'moderada');
  const [satietyLevel, setSatietyLevel] = useState<'ruim' | 'boa' | 'excelente'>(todayNutrition.satietyLevel || 'boa');
  const [sleepAvgHours, setSleepAvgHours] = useState<number>(recovery.sleepHours || 7.5);
  const [fatigueScore, setFatigueScore] = useState<number>(recovery.fatigueScore || 2);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [jointDiscomfort, setJointDiscomfort] = useState<boolean>(false);
  const [visualDensityNotes, setVisualDensityNotes] = useState<string>('Músculo denso, boa definição abdominal pela manhã, vascularização aparente no treino.');

  // Generated Report state
  const [report, setReport] = useState<WeeklyCheckinReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setAppliedNotice(false);

    const checkinData: WeeklyCheckinData = {
      date: toLocalISODate(),
      weightKg: Number(weightKg),
      waistCm: Number(waistCm),
      avgRir: Number(avgRir),
      strengthProgression,
      avgDailyCalories: Number(avgDailyCalories),
      avgProteinGrams: nutrition.targetMacros.proteinGrams,
      adherenceScore: Number(adherenceScore),
      hungerLevel,
      satietyLevel,
      sleepAvgHours: Number(sleepAvgHours),
      fatigueScore: Number(fatigueScore),
      stressLevel: Number(stressLevel),
      visualDensityNotes,
      jointDiscomfort,
    };

    try {
      // Call server AI endpoint
      const response = await fetch('/api/gemini/weekly-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinData,
          userContext: {
            profile,
            program: { name: program.name, week: program.currentWeek, split: program.splitType },
            nutrition: { calories: nutrition.targetMacros.calories, strategy: nutrition.dietStrategy },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullReport: WeeklyCheckinReport = {
          id: `checkin_${Date.now()}`,
          date: checkinData.date,
          title: data.title || 'Check-in Semanal Processado',
          status: data.status || 'manter',
          resposta: data.resposta || 'Dados registrados com sucesso.',
          interpretacao: data.interpretacao || 'Progressão sustentada conforme parâmetros fisiológicos.',
          decisao: data.decisao || 'Manutenção do microciclo.',
          perguntasChave: data.perguntasChave || {
            paraQuem: `Praticante nível ${profile.experience}`,
            paraQue: 'Manter sobrecarga progressiva',
            emQualMomento: 'Microciclo de consolidação',
          },
          methodologicalInsights: {
            duduHaluch: 'Titulação gradual e foco estrito na adesão antes de qualquer ajuste calórico.',
            chrisAceto: 'Resposta visual e sustentação de força no espelho e nos aparelhos.',
            belmiroDeSalles: 'Para quem? Para quê? Em qual momento? Volume ajustado à capacidade de recuperação.',
          },
          ajustesRecomendados: data.ajustesRecomendados || { caloriasDelta: 0, volumeDeltaSets: 0, focoCarboidrato: 'Estável' },
          applied: false,
        };
        setReport(fullReport);
      } else {
        // Fallback to local rule engine
        const local = generateLocalWeeklyCheckin(checkinData, profile, program, nutrition);
        setReport(local);
      }
    } catch {
      const local = generateLocalWeeklyCheckin(checkinData, profile, program, nutrition);
      setReport(local);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyReport = () => {
    if (!report) return;
    onApplyCheckinReport(report);
    setAppliedNotice(true);
  };

  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-3xl max-h-modal flex flex-col  overflow-hidden">
        
        {/* Header */}
        <div className="bg-base p-4 border-b border-elevated flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl    flex items-center justify-center text-base font-semibold ">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-white">Check-in Semanal & Auditoria</h2>
                <span className="text-[11px]  font-bold px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20">
                  Haluch â€¢ Aceto â€¢ Belmiro
                </span>
              </div>
              <p className="text-xs text-muted">
                Avaliação integrada: Composição corporal + Performance + Nutrição + Recuperação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-elevated hover:bg-line-strong text-muted hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          
          {/* If report is already generated, show the synthesized Triad: RESPOSTA -> INTERPRETAÇÃO -> DECISÃO */}
          {report ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-lime/10 border border-lime/25 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-lime/25 pb-3">
                  <div>
                    <span className="text-[11px] font-mono   text-lime font-bold block">
                      Resultado do Check-in â€¢ {report.date}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                      {report.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold  bg-lime/20 text-lime border border-lime/30">
                    Status: {report.status.replace('_', ' ')}
                  </span>
                </div>

                {/* The Core Methodological Triad */}
                <div className="space-y-3 pt-1">
                  {/* 1. RESPOSTA */}
                  <div className="bg-panel/90 border border-elevated p-3.5 rounded-xl">
                    <span className="text-lime font-bold  text-[12.5px] block mb-1">
                      1. RESPOSTA DO INDIVÍDUO (Dados Observados)
                    </span>
                    <p className="text-strong leading-relaxed">{report.resposta}</p>
                  </div>

                  {/* 2. INTERPRETAÇÃO */}
                  <div className="bg-panel/90 border border-elevated p-3.5 rounded-xl">
                    <span className="text-lime-dim font-bold  text-[12.5px] block mb-1">
                      2. INTERPRETAÇÃO FISIOLÓGICA (Conceito Haluch / Aceto / Belmiro)
                    </span>
                    <p className="text-strong leading-relaxed">{report.interpretacao}</p>
                  </div>

                  {/* 3. DECISÃO */}
                  <div className="bg-panel/90 border border-elevated p-3.5 rounded-xl">
                    <span className="text-lime-dim font-bold  text-[12.5px] block mb-1">
                      3. DECISÃO PRÃTICA & CONDUTA
                    </span>
                    <p className="text-strong leading-relaxed">{report.decisao}</p>
                  </div>
                </div>

                {/* The 3 Belmiro Questions Box */}
                <div className="bg-base p-4 rounded-xl border border-elevated/80 space-y-2">
                  <div className="text-[12.5px] font-bold text-strong   flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-lime" />
                    Tríade de Decisão Belmiro de Salles
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12.5px]">
                    <div className="bg-panel p-2.5 rounded-lg border border-elevated">
                      <strong className="text-lime block mb-0.5">«Para quem?»</strong>
                      <span className="text-strong">{report.perguntasChave.paraQuem}</span>
                    </div>
                    <div className="bg-panel p-2.5 rounded-lg border border-elevated">
                      <strong className="text-lime-dim block mb-0.5">«Para quê?»</strong>
                      <span className="text-strong">{report.perguntasChave.paraQue}</span>
                    </div>
                    <div className="bg-panel p-2.5 rounded-lg border border-elevated">
                      <strong className="text-lime-dim block mb-0.5">«Em qual momento?»</strong>
                      <span className="text-strong">{report.perguntasChave.emQualMomento}</span>
                    </div>
                  </div>
                </div>

                {/* Methodological Insights Accordion */}
                <div className="bg-base p-4 rounded-xl border border-elevated space-y-2">
                  <span className="text-[12.5px] font-bold text-strong   block">
                    Fundamentação dos Especialistas
                  </span>
                  <div className="space-y-1.5 text-[12.5px] text-strong">
                    <div>
                      <strong className="text-lime">Dudu Haluch: </strong>
                      {report.methodologicalInsights.duduHaluch}
                    </div>
                    <div>
                      <strong className="text-lime-dim">Chris Aceto: </strong>
                      {report.methodologicalInsights.chrisAceto}
                    </div>
                    <div>
                      <strong className="text-lime-dim">Belmiro de Salles: </strong>
                      {report.methodologicalInsights.belmiroDeSalles}
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {appliedNotice ? (
                    <span className="text-xs text-lime font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Decisão aplicada e sincronizada no plano com sucesso!
                    </span>
                  ) : (
                    <span className="text-[12.5px] text-muted">
                      Aplique esta decisão para atualizar as metas de treino e dieta do próximo microciclo.
                    </span>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setReport(null)}
                      className="px-3 py-2 bg-elevated hover:bg-line-strong text-strong rounded-xl text-xs transition cursor-pointer"
                    >
                      Editar Dados
                    </button>
                    <button
                      onClick={handleApplyReport}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-lime hover:bg-lime text-base font-bold text-xs rounded-xl transition   active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Aplicar Decisão ao Plano</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Check-in Input Form */
            <form onSubmit={handleSubmitCheckin} className="space-y-5">
              
              {/* Pillar 1: Composição Corporal */}
              <div className="bg-base/70 p-4 rounded-xl border border-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs ">
                    <Scale className="w-4 h-4 text-lime" />
                    1. Composição Corporal (Peso, Medidas & Espelho)
                  </h3>
                  <span className="text-[11px] text-muted">Referência: Haluch & Aceto</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted block mb-1">Peso da Semana (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Cintura Abdômen (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={waistCm}
                      onChange={(e) => setWaistCm(parseFloat(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-muted block mb-1">Densidade & Espelho</label>
                    <input
                      type="text"
                      value={visualDensityNotes}
                      onChange={(e) => setVisualDensityNotes(e.target.value)}
                      placeholder="Ex: Físico cheio, vascularização boa"
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white focus:border-lime focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pillar 2: Performance */}
              <div className="bg-base/70 p-4 rounded-xl border border-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs ">
                    <Dumbbell className="w-4 h-4 text-lime-dim" />
                    2. Performance de Treino (Carga, Reps & RIR)
                  </h3>
                  <span className="text-[11px] text-muted">Referência: Belmiro de Salles</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted block mb-1">Progressão de Força</label>
                    <select
                      value={strengthProgression}
                      onChange={(e) => setStrengthProgression(e.target.value as any)}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white focus:border-lime focus:outline-none"
                    >
                      <option value="aumentou">Subiu carga / repetições</option>
                      <option value="manteve">Manteve estável</option>
                      <option value="caiu">Queda de rendimento / força</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted block mb-1">RIR Médio (Falha: 0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={avgRir}
                      onChange={(e) => setAvgRir(parseFloat(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-muted block mb-1">Desconforto Articular?</label>
                    <button
                      type="button"
                      onClick={() => setJointDiscomfort(!jointDiscomfort)}
                      className={`w-full p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        jointDiscomfort
                          ? 'bg-danger/20 border-danger text-danger'
                          : 'bg-panel border-line-strong text-strong'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{jointDiscomfort ? 'Sim, dor relatada' : 'Sem dor nas articulações'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Nutrição & Adesão */}
              <div className="bg-base/70 p-4 rounded-xl border border-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs ">
                    <Utensils className="w-4 h-4 text-lime-dim" />
                    3. Nutrição & Adesão Dietética
                  </h3>
                  <span className="text-[11px] text-muted">Referência: Dudu Haluch & Chris Aceto</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-muted block mb-1">Calorias Médias / Dia</label>
                    <input
                      type="number"
                      value={avgDailyCalories}
                      onChange={(e) => setAvgDailyCalories(parseInt(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Adesão (1 a 5)</label>
                    <select
                      value={adherenceScore}
                      onChange={(e) => setAdherenceScore(parseInt(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white focus:border-lime focus:outline-none"
                    >
                      <option value={5}>5 (100% no plano)</option>
                      <option value={4}>4 (Adesão muito boa)</option>
                      <option value={3}>3 (Moderada)</option>
                      <option value={2}>2 (Vários deslizes)</option>
                      <option value={1}>1 (Desconectou do plano)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Nível de Fome</label>
                    <select
                      value={hungerLevel}
                      onChange={(e) => setHungerLevel(e.target.value as any)}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white focus:border-lime focus:outline-none"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="moderada">Moderada</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Saciedade</label>
                    <select
                      value={satietyLevel}
                      onChange={(e) => setSatietyLevel(e.target.value as any)}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white focus:border-lime focus:outline-none"
                    >
                      <option value="excelente">Excelente</option>
                      <option value="boa">Boa</option>
                      <option value="ruim">Ruim</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pillar 4: Recuperação */}
              <div className="bg-base/70 p-4 rounded-xl border border-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs ">
                    <HeartPulse className="w-4 h-4 text-lime-dim" />
                    4. Recuperação (Sono, Fadiga & Estresse)
                  </h3>
                  <span className="text-[11px] text-muted">Referência: Belmiro de Salles</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted block mb-1">Sono Médio (Horas)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sleepAvgHours}
                      onChange={(e) => setSleepAvgHours(parseFloat(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Fadiga Central (1 a 5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={fatigueScore}
                      onChange={(e) => setFatigueScore(parseInt(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted block mb-1">Estresse (1 a 5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(parseInt(e.target.value))}
                      className="w-full bg-panel border border-line-strong rounded-lg p-2 text-white font-bold focus:border-lime focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-elevated hover:bg-line-strong text-strong font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-lime hover:bg-lime text-base font-bold transition   active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-base" />
                  <span>{isProcessing ? 'Sintetizando Dados com IA...' : 'Processar Check-in Semanal'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
