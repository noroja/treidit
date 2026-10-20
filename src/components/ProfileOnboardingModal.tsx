import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useState } from 'react';
import { X, User, Target, Dumbbell, Activity, Check, Sparkles, Scale, AlertCircle } from 'lucide-react';
import { UserProfile, GoalType, GenderType, ExperienceLevel, EquipmentType, Anthropometry } from '../types';
import { calculateNavyBodyFat } from '../utils/calculations';

interface ProfileOnboardingModalProps {
  initialProfile: UserProfile;
  latestAnthropometry?: Anthropometry;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile, anthropometryUpdate?: Partial<Anthropometry>) => void;
}

export const ProfileOnboardingModal: React.FC<ProfileOnboardingModalProps> = ({
  initialProfile,
  latestAnthropometry,
  onClose,
  onSaveProfile,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal & Goal
  const [name, setName] = useState(initialProfile.name);
  const [age, setAge] = useState(initialProfile.age);
  const [gender, setGender] = useState<GenderType>(initialProfile.gender);
  const [heightCm, setHeightCm] = useState(initialProfile.heightCm);
  const [weightKg, setWeightKg] = useState(initialProfile.weightKg);
  const [goal, setGoal] = useState<GoalType>(initialProfile.goal);
  const [activityLevel, setActivityLevel] = useState(initialProfile.activityLevel);

  // Step 2: Anthropometry
  const [waistCm, setWaistCm] = useState(latestAnthropometry?.waistCm || 82);
  const [neckCm, setNeckCm] = useState(latestAnthropometry?.neckCm || 38.5);
  const [armCm, setArmCm] = useState(latestAnthropometry?.armCm || 38);
  const [thighCm, setThighCm] = useState(latestAnthropometry?.thighCm || 59);
  const [calfCm, setCalfCm] = useState(latestAnthropometry?.calfCm || 38);

  // Step 3: Training info & preferences
  const [experience, setExperience] = useState<ExperienceLevel>(initialProfile.experience);
  const [frequencyDays, setFrequencyDays] = useState(initialProfile.frequencyDays);
  const [sessionDurationMin, setSessionDurationMin] = useState(initialProfile.sessionDurationMin || 60);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentType>(initialProfile.availableEquipment);
  const [preferredExercises, setPreferredExercises] = useState(initialProfile.preferredExercises.join(', '));
  const [dislikedExercises, setDislikedExercises] = useState(initialProfile.dislikedExercises.join(', '));
  const [limitations, setLimitations] = useState(initialProfile.limitations);

  const previewBf = calculateNavyBodyFat(gender, heightCm, waistCm, neckCm);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: UserProfile = {
      name,
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      goal,
      experience,
      frequencyDays: Number(frequencyDays),
      sessionDurationMin: Number(sessionDurationMin),
      preferredExercises: preferredExercises.split(',').map((s) => s.trim()).filter(Boolean),
      dislikedExercises: dislikedExercises.split(',').map((s) => s.trim()).filter(Boolean),
      availableEquipment,
      limitations: limitations || 'Nenhuma limitaÃ§Ã£o relatada.',
      activityLevel,
    };

    const anthropometryUpdate: Partial<Anthropometry> = {
      weightKg: Number(weightKg),
      waistCm: Number(waistCm),
      neckCm: Number(neckCm),
      armCm: Number(armCm),
      thighCm: Number(thighCm),
      calfCm: Number(calfCm),
      estimatedBodyFatPct: previewBf,
    };

    onSaveProfile(updatedProfile, anthropometryUpdate);
    onClose();
  };

  const goalsList: { id: GoalType; label: string; desc: string }[] = [
    { id: 'hipertrofia', label: 'Hipertrofia Muscular', desc: 'Foco em ganho de massa magra com superÃ¡vit leve' },
    { id: 'perda_gordura', label: 'Perda de Gordura', desc: 'DÃ©ficit calÃ³rico com alta preservaÃ§Ã£o muscular' },
    { id: 'recomposicao', label: 'RecomposiÃ§Ã£o Corporal', desc: 'Perder gordura e ganhar massa simultaneamente' },
    { id: 'manutencao', label: 'ManutenÃ§Ã£o', desc: 'ConsolidaÃ§Ã£o de peso e tÃ´nus muscular' },
    { id: 'ganho_peso', label: 'Ganho de Peso', desc: 'Bulking estruturado para biotipos ectomorfos' },
    { id: 'performance', label: 'Performance & ForÃ§a', desc: 'PotÃªncia mÃ¡xima e otimizaÃ§Ã£o neural' },
  ];

  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-2xl max-h-modal flex flex-col  overflow-hidden">
        
        {/* Header */}
        <div className="bg-base p-4 border-b border-elevated flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime/15 text-lime border border-lime/30 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AvaliaÃ§Ã£o Inicial & Perfil do UsuÃ¡rio</h2>
              <span className="text-xs text-muted">Etapa {activeStep} de 3</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-elevated hover:bg-line-strong text-muted hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="bg-base/60 p-2 border-b border-elevated flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              activeStep === 1 ? 'bg-lime/15 text-lime' : 'text-muted hover:text-strong'
            }`}
          >
            <span>1. Pessoal & Objetivo</span>
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              activeStep === 2 ? 'bg-lime/15 text-lime' : 'text-muted hover:text-strong'
            }`}
          >
            <span>2. Antropometria</span>
          </button>
          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              activeStep === 3 ? 'bg-lime/15 text-lime' : 'text-muted hover:text-strong'
            }`}
          >
            <span>3. Treinamento</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFinish} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* STEP 1: Personal & Goal */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-strong font-semibold block mb-1">Idade</label>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-strong font-semibold block mb-1">Sexo BiolÃ³gico</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as GenderType)}
                      className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-strong font-semibold block mb-1">Peso Atual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-strong font-semibold block mb-1">NÃ­vel de Atividade</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  >
                    <option value="sedentario">SedentÃ¡rio (trabalho sentado)</option>
                    <option value="moderado">Moderado</option>
                    <option value="ativo">Ativo</option>
                    <option value="muito_ativo">Muito Ativo</option>
                  </select>
                </div>
              </div>

              {/* Goal Selector */}
              <div>
                <label className="text-strong font-semibold block mb-2">Objetivo Principal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {goalsList.map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        goal === g.id
                          ? 'bg-lime/15 border-lime text-white '
                          : 'bg-base/70 border-elevated text-muted hover:border-line-strong'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{g.label}</div>
                      <div className="text-[12.5px] text-muted mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Anthropometry */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">CircunferÃªncia Abdominal (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={waistCm}
                    onChange={(e) => setWaistCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                  <span className="text-[11px] text-faint mt-0.5 block">Medido na altura da cicatriz umbilical</span>
                </div>
                <div>
                  <label className="text-strong font-semibold block mb-1">CircunferÃªncia do PescoÃ§o (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={neckCm}
                    onChange={(e) => setNeckCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                  <span className="text-[11px] text-faint mt-0.5 block">Logo abaixo do pomo de adÃ£o</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">BraÃ§o ContraÃ­do (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={armCm}
                    onChange={(e) => setArmCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-strong font-semibold block mb-1">Coxa Medial (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thighCm}
                    onChange={(e) => setThighCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-strong font-semibold block mb-1">Panturrilha (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calfCm}
                    onChange={(e) => setCalfCm(parseFloat(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
              </div>

              {/* Instant Navy Preview */}
              <div className="bg-lime/10 border border-lime/25 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-lime font-bold block">ComposiÃ§Ã£o Corporal Estimada</span>
                  <span className="text-[12.5px] text-muted">Algoritmo US Navy Body Fat</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-lime">{previewBf}% Gordura</div>
                  <div className="text-[12.5px] text-strong font-medium">
                    ~{Math.round(weightKg * (1 - previewBf / 100))} kg de massa magra
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Training info & preferences */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">ExperiÃªncia</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  >
                    <option value="iniciante">Iniciante (&lt; 1 ano)</option>
                    <option value="intermediario">IntermediÃ¡rio (1 a 3 anos)</option>
                    <option value="avancado">AvanÃ§ado (3+ anos)</option>
                  </select>
                </div>

                <div>
                  <label className="text-strong font-semibold block mb-1">FrequÃªncia Semanal</label>
                  <select
                    value={frequencyDays}
                    onChange={(e) => setFrequencyDays(parseInt(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  >
                    <option value={3}>3 dias (Full Body)</option>
                    <option value={4}>4 dias (Upper / Lower)</option>
                    <option value={5}>5 dias (PPL + Upper/Lower)</option>
                    <option value={6}>6 dias (Push / Pull / Legs x 2)</option>
                  </select>
                </div>

                <div>
                  <label className="text-strong font-semibold block mb-1">Tempo por SessÃ£o</label>
                  <input
                    type="number"
                    value={sessionDurationMin}
                    onChange={(e) => setSessionDurationMin(parseInt(e.target.value))}
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                    placeholder="Minutos (ex: 60)"
                  />
                </div>
              </div>

              <div>
                <label className="text-strong font-semibold block mb-1">Equipamentos DisponÃ­veis</label>
                <select
                  value={availableEquipment}
                  onChange={(e) => setAvailableEquipment(e.target.value as EquipmentType)}
                  className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                >
                  <option value="academia_completa">Academia Completa (Barras, Halteres, Polias e MÃ¡quinas)</option>
                  <option value="halteres_banco">Halteres e Banco RegulÃ¡vel</option>
                  <option value="peso_corporal_homegym">Home Gym / Calistenia / ElÃ¡sticos</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-strong font-semibold block mb-1">ExercÃ­cios Favoritos (Opcional)</label>
                  <input
                    type="text"
                    value={preferredExercises}
                    onChange={(e) => setPreferredExercises(e.target.value)}
                    placeholder="Ex: Supino Reto, Agachamento, ElevaÃ§Ã£o Lateral"
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-strong font-semibold block mb-1">ExercÃ­cios que NÃ£o Gosta / Evita</label>
                  <input
                    type="text"
                    value={dislikedExercises}
                    onChange={(e) => setDislikedExercises(e.target.value)}
                    placeholder="Ex: Agachamento Frontal, TrÃ­ceps FrancÃªs"
                    className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-strong font-semibold block mb-1">LesÃµes, Dores ou LimitaÃ§Ãµes Articulares</label>
                <input
                  type="text"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Ex: CondromalÃ¡cia patelar no joelho direito; evitar sobrecarga axial excessiva na lombar"
                  className="w-full bg-base border border-line-strong rounded-lg p-2.5 text-white focus:border-lime focus:outline-none"
                />
                <span className="text-[11px] text-faint mt-1 block">
                  O algoritmo de treino substitui exercÃ­cios de risco por alternativas biomecanicamente favorÃ¡veis.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-elevated">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl bg-elevated hover:bg-line-strong text-strong font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
            ) : <div />}

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="px-5 py-2.5 rounded-xl bg-lime hover:bg-lime text-base font-bold transition   cursor-pointer"
              >
                PrÃ³xima Etapa â†’
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-lime hover:bg-lime text-base font-bold transition   active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-base" />
                <span>Gerar Treino & NutriÃ§Ã£o Adaptada</span>
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
