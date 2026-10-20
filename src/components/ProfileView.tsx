import React from 'react';
import { 
  User, ShieldCheck, Dumbbell, Utensils, RotateCcw, Sparkles, 
  BrainCircuit, HeartPulse, Scale, CheckCircle2, ChevronRight, Info 
} from 'lucide-react';
import { UserProfile, Anthropometry, WorkoutProgram, NutritionPlan } from '../types';
import { DisclaimerBanner } from './DisclaimerBanner';

interface ProfileViewProps {
  profile: UserProfile;
  latestAnthropometry?: Anthropometry;
  program: WorkoutProgram;
  nutrition: NutritionPlan;
  onOpenEvaluation: () => void;
  onOpenAdaptive: () => void;
  onOpenAi: () => void;
  onResetDemoData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  latestAnthropometry,
  program,
  nutrition,
  onOpenEvaluation,
  onOpenAdaptive,
  onOpenAi,
  onResetDemoData,
}) => {
  const goalNames: Record<string, string> = {
    hipertrofia: 'Hipertrofia Muscular',
    perda_gordura: 'Perda de Gordura / Definição',
    recomposicao: 'Recomposição Corporal',
    manutencao: 'Manutenção',
    ganho_peso: 'Ganho de Peso',
    performance: 'Performance & Força',
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header Card */}
      <div className="bg-panel border border-elevated rounded-2xl p-5 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-lime flex items-center justify-center text-base font-semibold text-2xl ">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-white">{profile.name}</h1>
                <span className="text-[11px] font-bold   px-2 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30">
                  Atleta KINETIC
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {profile.age} anos • {profile.gender === 'masculino' ? 'Masculino' : 'Feminino'} • {profile.heightCm} cm • {profile.weightKg} kg
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEvaluation}
            className="px-4 py-2.5 rounded-xl bg-lime hover:bg-lime text-base font-bold text-xs transition   active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            Refazer Avaliação Inicial
          </button>
        </div>

        {/* Quick parameters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-elevated text-xs">
          <div>
            <span className="text-faint block text-[12.5px]">Objetivo Atual</span>
            <strong className="text-white font-semibold">{goalNames[profile.goal] || profile.goal}</strong>
          </div>
          <div>
            <span className="text-faint block text-[12.5px]">Experiência</span>
            <strong className="text-lime font-semibold capitalize">{profile.experience}</strong>
          </div>
          <div>
            <span className="text-faint block text-[12.5px]">Divisão de Treino</span>
            <strong className="text-white font-semibold capitalize">{program.splitType.replace('_', ' ')}</strong>
          </div>
          <div>
            <span className="text-faint block text-[12.5px]">Meta Calórica</span>
            <strong className="text-lime-dim font-semibold">{nutrition.targetMacros.calories} kcal/dia</strong>
          </div>
        </div>
      </div>

      {/* Training and Diet Prescriptions Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Training Parameters */}
        <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-lime" />
              Parâmetros de Treinamento
            </h2>
          </div>

          <div className="space-y-2 text-xs divide-y divide-elevated/60">
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Frequência Semanal:</span>
              <strong className="text-white">{profile.frequencyDays} dias por semana</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Duração por Sessão:</span>
              <strong className="text-white">~{profile.sessionDurationMin || 60} minutos</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Equipamentos:</span>
              <strong className="text-strong capitalize">{profile.availableEquipment.replace('_', ' ')}</strong>
            </div>
            <div className="py-1.5">
              <span className="text-muted block mb-0.5">Limitações / Dores Declaradas:</span>
              <span className="text-strong italic">{profile.limitations || 'Nenhuma restrição articular.'}</span>
            </div>
          </div>
        </div>

        {/* Nutrition Parameters */}
        <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-lime-dim" />
              Parâmetros Nutricionais
            </h2>
          </div>

          <div className="space-y-2 text-xs divide-y divide-elevated/60">
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Metabolismo Basal (TMB):</span>
              <strong className="text-white">{nutrition.bmr} kcal</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Gasto Diário Total (GET):</span>
              <strong className="text-lime-dim">{nutrition.tdee} kcal</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Estratégia Calórica:</span>
              <strong className="text-lime-dim capitalize">{nutrition.dietStrategy} ({nutrition.calorieDelta > 0 ? `+${nutrition.calorieDelta}` : nutrition.calorieDelta} kcal)</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Hidratação Recomendada:</span>
              <strong className="text-lime-dim">{nutrition.hydrationTargetMl} ml/dia</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tools & Diagnostics */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-3">
        <h2 className="text-sm font-bold text-white mb-2">Diagnóstico & Ferramentas do Sistema</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={onOpenAdaptive}
            className="p-3.5 rounded-xl bg-base border border-elevated hover:border-lime/25 flex items-center justify-between text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-lime/10 text-lime">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-bold">Motor Adaptativo KINETIC</strong>
                <span className="text-[12.5px] text-muted">Auditar resposta e ver o ciclo de dados</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-faint" />
          </button>

          <button
            onClick={onOpenAi}
            className="p-3.5 rounded-xl bg-base border border-elevated hover:border-lime/25 flex items-center justify-between text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-lime-dim/10 text-lime-dim">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-bold">Assistente de IA Integrado</strong>
                <span className="text-[12.5px] text-muted">Tirar dúvidas fundamentadas nos seus dados</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-faint" />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onResetDemoData}
            className="text-[12.5px] text-faint hover:text-strong flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar Dados de Demonstração
          </button>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
