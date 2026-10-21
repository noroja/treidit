/**
 * ANAMNESE & TRIAGEM (§19 — individualização antes de prescrever)
 * ----------------------------------------------------------------
 * Regra do sistema: NADA de treino/dieta genéricos. O fluxo é
 *
 *   1. triagem completa (identificação, saúde, lesões, treino, nutrição, rotina,
 *      medidas) → 2. classificação de risco e limites → 3. derivação do perfil →
 *   4. geração determinística de treino/dieta → 5. acompanhamento (ofensiva,
 *      progresso semanal, check-in).
 *
 * Este módulo NÃO chama IA e NÃO inventa dado clínico: só classifica o que o
 * usuário respondeu, aplica regras conservadoras explícitas e registra o porquê
 * na auditoria. Sinais de alerta (red flags) BLOQUEIAM a prescrição normal e
 * exigem liberação médica — o app nunca "contorna" isso.
 */

import type {
  Anthropometry,
  EquipmentType,
  ExerciseDefinition,
  ExperienceLevel,
  GoalType,
  UserProfile,
  WorkoutProgram,
  WorkoutRoutine,
} from '../types';
import type { DietConstraints } from './dietBuilder';
import { isCompound } from './training';
import { toLocalISODate } from './dates';

// ---------------------------------------------------------------------------
// Tipos da anamnese
// ---------------------------------------------------------------------------

export type BiologicalSex = 'masculino' | 'feminino';

export type HealthCondition =
  | 'nenhuma'
  | 'cardiopatia'
  | 'hipertensao'
  | 'diabetes'
  | 'obesidade_grave'
  | 'cirurgia_recente'
  | 'gestacao'
  | 'medicacao_continua'
  | 'doenca_renal'
  | 'doenca_hepatica';

export type PainRegion =
  | 'joelho'
  | 'lombar'
  | 'ombro'
  | 'cotovelo'
  | 'punho'
  | 'quadril'
  | 'tornozelo'
  | 'cervical';

export type DietPattern = 'onivoro' | 'vegetariano' | 'vegano' | 'pescetariano';

export type FoodRestriction =
  | 'lactose'
  | 'gluten'
  | 'ovos'
  | 'amendoim'
  | 'castanhas'
  | 'peixe'
  | 'carne_vermelha'
  | 'soja';

export type WorkContext = 'sentado' | 'em_pe' | 'misto' | 'turnos';
export type SleepQuality = 'ruim' | 'regular' | 'boa' | 'otima';
export type EatingOutFrequency = 'nunca' | '1-2x' | '3+';
export type Budget = 'baixo' | 'medio' | 'alto';
export type GoalPace = 'lento' | 'moderado' | 'rapido';
export type GoalPriority = 'saude' | 'estetica' | 'performance';

export interface Anamnesis {
  version: 1;
  createdAt: string;
  updatedAt: string;
  identification: {
    name: string;
    age: number;
    sex: BiologicalSex;
    heightCm: number;
    weightKg: number;
  };
  health: {
    conditions: HealthCondition[];
    medicalClearance: 'sim' | 'nao' | 'nao_sei';
    medications: string;
    surgeries: string;
    smoker: boolean;
    alcohol: 'nunca' | 'social' | 'frequente';
  };
  injuries: {
    painRegions: PainRegion[];
    /** Dor atual 0–10 (0 = sem dor). */
    painLevel: number;
    notes: string;
  };
  training: {
    experience: ExperienceLevel;
    currentlyTrains: boolean;
    /** Rotina que o usuário já faz hoje (livre). */
    currentRoutineText: string;
    daysPerWeek: number;
    sessionMinutes: number;
    equipment: EquipmentType;
    preferredExercises: string[];
    dislikedExercises: string[];
    cardio: 'nenhum' | '1-2x' | '3+';
  };
  nutrition: {
    pattern: DietPattern;
    restrictions: FoodRestriction[];
    allergiesNotes: string;
    mealsPerDay: number;
    cooksAtHome: 'sim' | 'nao' | 'as_vezes';
    eatingOut: EatingOutFrequency;
    budget: Budget;
    supplements: string[];
  };
  lifestyle: {
    sleepHours: number;
    sleepQuality: SleepQuality;
    stress: number; // 1–5
    workContext: WorkContext;
    stepsPerDay?: number;
  };
  measurements: {
    waistCm: number;
    neckCm?: number;
    hipCm?: number;
    armCm?: number;
    thighCm?: number;
    calfCm?: number;
  };
  goal: {
    primary: GoalType;
    targetWeightKg?: number;
    pace: GoalPace;
    priority: GoalPriority;
  };
}

// ---------------------------------------------------------------------------
// Rótulos (UI e textos de auditoria)
// ---------------------------------------------------------------------------

export const HEALTH_LABEL: Record<HealthCondition, string> = {
  nenhuma: 'Nenhuma condição declarada',
  cardiopatia: 'Cardiopatia',
  hipertensao: 'Hipertensão',
  diabetes: 'Diabetes',
  obesidade_grave: 'Obesidade grau II/III',
  cirurgia_recente: 'Cirurgia recente (< 6 meses)',
  gestacao: 'Gestação / puerpério',
  medicacao_continua: 'Medicação contínua',
  doenca_renal: 'Doença renal',
  doenca_hepatica: 'Doença hepática',
};

export const PAIN_LABEL: Record<PainRegion, string> = {
  joelho: 'joelho',
  lombar: 'lombar/coluna',
  ombro: 'ombro',
  cotovelo: 'cotovelo',
  punho: 'punho',
  quadril: 'quadril',
  tornozelo: 'tornozelo',
  cervical: 'cervical',
};

export const DIET_PATTERN_LABEL: Record<DietPattern, string> = {
  onivoro: 'Onívoro',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  pescetariano: 'Pescetariano',
};

export const RESTRICTION_LABEL: Record<FoodRestriction, string> = {
  lactose: 'Sem lactose',
  gluten: 'Sem glúten',
  ovos: 'Sem ovos',
  amendoim: 'Sem amendoim',
  castanhas: 'Sem castanhas',
  peixe: 'Sem peixe',
  carne_vermelha: 'Sem carne vermelha',
  soja: 'Sem soja',
};

export const GOAL_LABEL: Record<GoalType, string> = {
  hipertrofia: 'Hipertrofia',
  perda_gordura: 'Perda de gordura',
  recomposicao: 'Recomposição',
  manutencao: 'Manutenção',
  ganho_peso: 'Ganho de peso',
  performance: 'Performance',
};

const SPLIT_LABEL: Record<WorkoutProgram['splitType'], string> = {
  full_body: 'Full Body',
  upper_lower: 'Upper/Lower',
  push_pull_legs: 'Push/Pull/Legs',
  pplul: 'PPL + Upper/Lower',
  abcde: 'ABCDE',
  personalizado: 'Personalizado',
};

export type AnamnesisDomainId =
  | 'identificacao'
  | 'saude'
  | 'lesoes'
  | 'treino'
  | 'nutricao'
  | 'rotina'
  | 'medidas';

export const ANAMNESIS_DOMAINS: Array<{ id: AnamnesisDomainId; label: string; description: string }> = [
  { id: 'identificacao', label: 'Identificação', description: 'Quem é você e qual o objetivo' },
  { id: 'saude', label: 'Saúde', description: 'Condições, medicação e liberação' },
  { id: 'lesoes', label: 'Lesões & dor', description: 'Regiões sensíveis e intensidade' },
  { id: 'treino', label: 'Treino', description: 'Experiência, rotina e equipamentos' },
  { id: 'nutricao', label: 'Nutrição', description: 'Padrão, restrições e refeições' },
  { id: 'rotina', label: 'Rotina', description: 'Sono, estresse e trabalho' },
  { id: 'medidas', label: 'Medidas', description: 'Antropometria para composição' },
];

// ---------------------------------------------------------------------------
// Completude por domínio (checks explícitos, sem "campo vazio = ok")
// ---------------------------------------------------------------------------

interface FieldCheck {
  domain: AnamnesisDomainId;
  label: string;
  ok: (a: Anamnesis) => boolean;
}

const hasText = (s: string | undefined | null): boolean => !!s && s.trim().length > 0;

const FIELD_CHECKS: FieldCheck[] = [
  { domain: 'identificacao', label: 'nome', ok: (a) => hasText(a.identification.name) },
  { domain: 'identificacao', label: 'idade entre 14 e 100', ok: (a) => a.identification.age >= 14 && a.identification.age <= 100 },
  { domain: 'identificacao', label: 'altura entre 120 e 230 cm', ok: (a) => a.identification.heightCm >= 120 && a.identification.heightCm <= 230 },
  { domain: 'identificacao', label: 'peso entre 35 e 250 kg', ok: (a) => a.identification.weightKg >= 35 && a.identification.weightKg <= 250 },
  { domain: 'saude', label: 'condições de saúde', ok: (a) => a.health.conditions.length > 0 },
  { domain: 'saude', label: 'liberação médica', ok: (a) => a.health.medicalClearance !== undefined },
  { domain: 'saude', label: 'medicamentos', ok: (a) => a.health.medications !== undefined },
  { domain: 'lesoes', label: 'intensidade da dor', ok: (a) => Number.isFinite(a.injuries.painLevel) && a.injuries.painLevel >= 0 && a.injuries.painLevel <= 10 },
  { domain: 'lesoes', label: 'região da dor', ok: (a) => a.injuries.painLevel === 0 || a.injuries.painRegions.length > 0 },
  { domain: 'treino', label: 'experiência', ok: (a) => !!a.training.experience },
  { domain: 'treino', label: 'dias por semana (2–6)', ok: (a) => a.training.daysPerWeek >= 2 && a.training.daysPerWeek <= 6 },
  { domain: 'treino', label: 'duração da sessão (15–240 min)', ok: (a) => a.training.sessionMinutes >= 15 && a.training.sessionMinutes <= 240 },
  { domain: 'treino', label: 'equipamentos', ok: (a) => !!a.training.equipment },
  { domain: 'treino', label: 'rotina atual', ok: (a) => (a.training.currentlyTrains ? hasText(a.training.currentRoutineText) : true) },
  { domain: 'nutricao', label: 'padrão alimentar', ok: (a) => !!a.nutrition.pattern },
  { domain: 'nutricao', label: 'refeições por dia (3–6)', ok: (a) => a.nutrition.mealsPerDay >= 3 && a.nutrition.mealsPerDay <= 6 },
  { domain: 'nutricao', label: 'restrições alimentares', ok: (a) => Array.isArray(a.nutrition.restrictions) },
  { domain: 'nutricao', label: 'frequência de refeições fora', ok: (a) => !!a.nutrition.eatingOut },
  { domain: 'rotina', label: 'horas de sono (3–14)', ok: (a) => a.lifestyle.sleepHours >= 3 && a.lifestyle.sleepHours <= 14 },
  { domain: 'rotina', label: 'qualidade do sono', ok: (a) => !!a.lifestyle.sleepQuality },
  { domain: 'rotina', label: 'estresse (1–5)', ok: (a) => a.lifestyle.stress >= 1 && a.lifestyle.stress <= 5 },
  { domain: 'rotina', label: 'contexto de trabalho', ok: (a) => !!a.lifestyle.workContext },
  { domain: 'medidas', label: 'cintura (cm)', ok: (a) => a.measurements.waistCm >= 30 && a.measurements.waistCm <= 250 },
  { domain: 'medidas', label: 'pescoço (cm)', ok: (a) => typeof a.measurements.neckCm === 'number' && a.measurements.neckCm >= 20 && a.measurements.neckCm <= 80 },
];

// ---------------------------------------------------------------------------
// Triagem
// ---------------------------------------------------------------------------

export type RiskLevel = 'baixo' | 'moderado' | 'alto';

export interface TriageResult {
  complete: boolean;
  completenessPct: number;
  missing: string[];
  domains: Array<{ id: AnamnesisDomainId; label: string; filled: number; total: number }>;
  risk: RiskLevel;
  requiresMedicalClearance: boolean;
  redFlags: string[];
  notes: string[];
  /** Teto conservador de séries semanais por grupo. */
  weeklySetCap: number;
  recommendedFrequency: number;
  recommendedMealCount: number;
}

const HIGH_RISK_CONDITIONS: HealthCondition[] = ['cardiopatia', 'cirurgia_recente', 'gestacao', 'doenca_renal', 'doenca_hepatica'];
const MODERATE_RISK_CONDITIONS: HealthCondition[] = ['hipertensao', 'diabetes', 'obesidade_grave', 'medicacao_continua'];

const bmiOf = (a: Anamnesis): number => {
  const h = a.identification.heightCm / 100;
  return h > 0 ? a.identification.weightKg / (h * h) : 0;
};

export function triageAnamnesis(a: Anamnesis): TriageResult {
  const missing = FIELD_CHECKS.filter((f) => !f.ok(a)).map((f) => f.label);
  const domains = ANAMNESIS_DOMAINS.map((d) => {
    const checks = FIELD_CHECKS.filter((f) => f.domain === d.id);
    return {
      id: d.id,
      label: d.label,
      filled: checks.filter((f) => f.ok(a)).length,
      total: checks.length,
    };
  });
  const totalFields = FIELD_CHECKS.length;
  const filledFields = totalFields - missing.length;
  const completenessPct = Math.round((filledFields / totalFields) * 100);

  const conditions = a.health.conditions.filter((c) => c !== 'nenhuma');
  const redFlags: string[] = [];
  const notes: string[] = [];
  let risk: RiskLevel = 'baixo';

  if (conditions.some((c) => HIGH_RISK_CONDITIONS.includes(c))) {
    risk = 'alto';
    redFlags.push(
      `Condição de alto risco declarada (${conditions
        .filter((c) => HIGH_RISK_CONDITIONS.includes(c))
        .map((c) => HEALTH_LABEL[c])
        .join(', ')}): liberação médica obrigatória antes de iniciar o programa.`,
    );
  } else if (conditions.some((c) => MODERATE_RISK_CONDITIONS.includes(c))) {
    risk = 'moderado';
    notes.push(
      `Acompanhamento clínico recomendado (${conditions
        .filter((c) => MODERATE_RISK_CONDITIONS.includes(c))
        .map((c) => HEALTH_LABEL[c])
        .join(', ')}). O plano é conservador, mas não substitui avaliação médica.`,
    );
  }

  if (a.health.medicalClearance === 'nao') {
    redFlags.push('O usuário declarou NÃO ter liberação médica para atividade física.');
    if (risk === 'baixo') risk = 'moderado';
  }
  if (a.health.medicalClearance === 'nao_sei') {
    notes.push('Liberação médica não confirmada: procure avaliação antes de treinos de alta intensidade.');
  }
  if (a.injuries.painLevel >= 7) {
    risk = 'alto';
    redFlags.push(`Dor atual ${a.injuries.painLevel}/10 (${a.injuries.painRegions.map((r) => PAIN_LABEL[r]).join(', ') || 'região não informada'}): não prescrever carga até avaliação.`);
  } else if (a.injuries.painLevel >= 4) {
    if (risk === 'baixo') risk = 'moderado';
    notes.push(`Dor atual ${a.injuries.painLevel}/10: volume reduzido e exercícios de risco substituídos.`);
  } else if (a.injuries.painRegions.length > 0) {
    notes.push(`Histórico de dor em ${a.injuries.painRegions.map((r) => PAIN_LABEL[r]).join(', ')}: movimentos de risco serão substituídos.`);
  }

  const bmi = bmiOf(a);
  if (bmi >= 35) {
    if (risk === 'baixo') risk = 'moderado';
    notes.push(`IMC ${bmi.toFixed(1)}: progressão conservadora de impacto e volume; avaliação clínica recomendada.`);
  }
  if (a.identification.age >= 60) {
    notes.push('Idade ≥ 60 anos: prioridade em técnica, amplitude controlada e progressão lenta.');
  }
  if (a.health.smoker) {
    notes.push('Tabagismo: capacidade cardiorrespiratória pode estar reduzida — monitorar esforço percebido.');
  }
  if (a.health.alcohol === 'frequente') {
    notes.push('Consumo frequente de álcool: piora recuperação e síntese proteica; considerar redução.');
  }

  const sleepDebt = a.lifestyle.sleepHours > 0 && a.lifestyle.sleepHours < 6;
  if (sleepDebt) notes.push(`Sono ${a.lifestyle.sleepHours}h/noite: volume semanal reduzido para preservar recuperação.`);
  if (a.lifestyle.stress >= 4) notes.push('Estresse alto (≥4/5): progressão conservadora e deload antecipado se necessário.');

  const baseCap =
    a.training.experience === 'iniciante' ? 12 : a.training.experience === 'intermediario' ? 16 : 18;
  let weeklySetCap = baseCap;
  if (sleepDebt) weeklySetCap -= 2;
  if (a.lifestyle.stress >= 4) weeklySetCap -= 2;
  if (a.injuries.painLevel >= 4) weeklySetCap -= 2;
  if (risk === 'alto') weeklySetCap -= 2;
  weeklySetCap = Math.max(8, weeklySetCap);

  const declaredFrequency = Math.max(2, Math.min(6, Math.round(a.training.daysPerWeek || 3)));
  const highPain = a.injuries.painLevel >= 7;
  const recommendedFrequency = risk === 'alto' || highPain ? Math.min(declaredFrequency, 3) : declaredFrequency;

  if (recommendedFrequency < declaredFrequency) {
    notes.push(`Frequência reduzida de ${declaredFrequency} para ${recommendedFrequency} dias/semana pela triagem de segurança.`);
  }

  return {
    complete: missing.length === 0,
    completenessPct,
    missing,
    domains,
    risk,
    requiresMedicalClearance: redFlags.length > 0 && (risk === 'alto' || a.health.medicalClearance === 'nao'),
    redFlags,
    notes,
    weeklySetCap,
    recommendedFrequency,
    recommendedMealCount: Math.max(3, Math.min(6, Math.round(a.nutrition.mealsPerDay || 4))),
  };
}

// ---------------------------------------------------------------------------
// Derivação do perfil / antropometria
// ---------------------------------------------------------------------------

function deriveActivityLevel(a: Anamnesis): UserProfile['activityLevel'] {
  let score = 0;
  if (a.lifestyle.workContext === 'em_pe') score += 2;
  else if (a.lifestyle.workContext === 'misto' || a.lifestyle.workContext === 'turnos') score += 1;

  if (a.training.daysPerWeek >= 4) score += 2;
  else if (a.training.daysPerWeek >= 3) score += 1;

  if (a.training.cardio === '3+') score += 2;
  else if (a.training.cardio === '1-2x') score += 1;

  if ((a.lifestyle.stepsPerDay ?? 0) >= 8000) score += 1;

  if (score >= 4) return 'muito_ativo';
  if (score >= 3) return 'ativo';
  if (score >= 2) return 'moderado';
  return 'sedentario';
}

export function anamnesisLimitationsText(a: Anamnesis): string {
  const parts: string[] = [];
  if (a.injuries.painRegions.length > 0 || a.injuries.painLevel > 0) {
    const regions = a.injuries.painRegions.map((r) => PAIN_LABEL[r]).join(', ');
    parts.push(`${regions || 'dor não localizada'} (dor ${a.injuries.painLevel}/10)`);
  }
  if (hasText(a.injuries.notes)) parts.push(a.injuries.notes.trim());

  const conditions = a.health.conditions.filter((c) => c !== 'nenhuma').map((c) => HEALTH_LABEL[c]);
  if (conditions.length > 0) parts.push(`Condições: ${conditions.join(', ')}`);
  if (hasText(a.health.surgeries)) parts.push(`Cirurgias: ${a.health.surgeries.trim()}`);

  if (parts.length === 0) return 'Nenhuma limitação relatada.';
  return `${parts.join('; ')}.`;
}

export function deriveProfile(a: Anamnesis): UserProfile {
  const triage = triageAnamnesis(a);
  return {
    name: a.identification.name.trim() || 'Atleta',
    age: Math.round(a.identification.age),
    gender: a.identification.sex,
    heightCm: a.identification.heightCm,
    weightKg: a.identification.weightKg,
    goal: a.goal.primary,
    experience: a.training.experience,
    frequencyDays: triage.recommendedFrequency,
    sessionDurationMin: Math.round(a.training.sessionMinutes),
    preferredExercises: a.training.preferredExercises.filter(hasText),
    dislikedExercises: a.training.dislikedExercises.filter(hasText),
    availableEquipment: a.training.equipment,
    limitations: anamnesisLimitationsText(a),
    activityLevel: deriveActivityLevel(a),
  };
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Antropometria inicial derivada da anamnese. O % de gordura é CALCULADO pelo
 * chamador (Navy, em utils/calculations) e só entra aqui já pronto — o motor não
 * duplica fórmula clínica. Medidas não informadas ficam 0 (não inventadas).
 */
export function deriveAnthropometry(a: Anamnesis, bodyFatPct: number, date: string = toLocalISODate()): Anthropometry {
  const weight = a.identification.weightKg;
  const bf = Math.max(3, Math.min(60, bodyFatPct));
  const fatMass = round1(weight * (bf / 100));
  return {
    date,
    weightKg: weight,
    heightCm: a.identification.heightCm,
    waistCm: a.measurements.waistCm,
    neckCm: a.measurements.neckCm ?? 0,
    hipCm: a.measurements.hipCm,
    armCm: a.measurements.armCm ?? 0,
    thighCm: a.measurements.thighCm ?? 0,
    calfCm: a.measurements.calfCm ?? 0,
    estimatedBodyFatPct: round1(bf),
    estimatedLeanMassKg: round1(weight - fatMass),
    estimatedFatMassKg: fatMass,
    notes: 'Medidas e composição derivadas da anamnese inicial (Navy).',
  };
}

// ---------------------------------------------------------------------------
// Restrições alimentares → DietConstraints (motor de dieta)
// ---------------------------------------------------------------------------

const ANIMAL_MEAT_IDS = ['patinho_grelhado'];
const POULTRY_IDS = ['frango_peito_grelhado'];
const FISH_IDS = ['tilapia_grelhada', 'atum_agua'];
const EGG_IDS = ['ovo_cozido'];
const DAIRY_IDS = ['iogurte_desnatado', 'queijo_minas', 'leite_desnatado', 'ricota', 'whey_concentrado'];
const PEANUT_IDS = ['pasta_amendoim'];
const NUT_IDS = ['castanha_para'];
const GLUTEN_IDS = ['pao_integral', 'macarrao_integral'];
const SOY_IDS = ['tofu_firmo', 'proteina_soja_isolada'];

export function deriveDietConstraints(a: Anamnesis): DietConstraints {
  const blocked = new Set<string>();

  const notes: string[] = [];
  const restrictions = new Set<FoodRestriction>(a.nutrition.restrictions);
  const pattern = a.nutrition.pattern;

  const block = (ids: string[]) => ids.forEach((id) => blocked.add(id));

  if (pattern === 'vegano') {
    block(ANIMAL_MEAT_IDS);
    block(POULTRY_IDS);
    block(FISH_IDS);
    block(EGG_IDS);
    block(DAIRY_IDS);
    notes.push('Padrão vegano: sem carne, peixe, ovos e laticínios; proteína de leguminosas e tofu.');
    if (!restrictions.has('soja')) {
      notes.push('Proteína isolada de soja pode ser usada para fechar a meta proteica — ajuste conforme preferência.');
    }
  } else if (pattern === 'vegetariano') {
    block(ANIMAL_MEAT_IDS);
    block(POULTRY_IDS);
    block(FISH_IDS);
    notes.push('Padrão vegetariano: ovos e laticínios liberados; carnes e peixes fora.');
    if (!restrictions.has('soja')) {
      notes.push('Proteína isolada de soja pode ser usada para fechar a meta proteica — ajuste conforme preferência.');
    }
  } else if (pattern === 'pescetariano') {
    block(ANIMAL_MEAT_IDS);
    block(POULTRY_IDS);
  }

  if (restrictions.has('lactose')) {
    block(DAIRY_IDS);
    notes.push('Sem lactose: laticínios e whey substituídos.');
  }
  if (restrictions.has('gluten')) {
    block(GLUTEN_IDS);
    notes.push('Sem glúten: pão e macarrão tradicional substituídos.');
  }
  if (restrictions.has('ovos')) {
    block(EGG_IDS);
    notes.push('Sem ovos.');
  }
  if (restrictions.has('amendoim')) {
    block(PEANUT_IDS);
    notes.push('Sem amendoim.');
  }
  if (restrictions.has('castanhas')) {
    block(NUT_IDS);
    notes.push('Sem castanhas.');
  }
  if (restrictions.has('peixe')) {
    block(FISH_IDS);
    notes.push('Sem peixe.');
  }
  if (restrictions.has('carne_vermelha')) {
    block(ANIMAL_MEAT_IDS);
    notes.push('Sem carne vermelha.');
  }
  if (restrictions.has('soja')) {
    block(SOY_IDS);
    notes.push('Sem soja.');
  }

  if (hasText(a.nutrition.allergiesNotes)) {
    notes.push(`Alergias/intolerâncias relatadas: ${a.nutrition.allergiesNotes.trim()} — conferir rótulos.`);
  }
  if (a.nutrition.eatingOut === '3+') {
    notes.push('Refeições fora de casa 3+ vezes/semana: o plano usa porções simples de replicar.');
  }

  return {
    pattern,
    restrictions: Array.from(restrictions),
    blockedFoodIds: Array.from(blocked),
    blockedGroups: [],
    mealsPerDay: Math.max(3, Math.min(6, Math.round(a.nutrition.mealsPerDay || 4))),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Personalização determinística do programa
// ---------------------------------------------------------------------------

const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

type MuscleGroupKey =
  | 'peitoral'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'abdomen'
  | 'dorsais'
  | 'trapezio'
  | 'lombar'
  | 'gluteos'
  | 'quadriceps'
  | 'posterior'
  | 'panturrilha'
  | 'antebraco';

function muscleGroupOf(targetMuscle: string): MuscleGroupKey | null {
  const t = normalizeText(targetMuscle);
  if (t.includes('peitor') || t.includes('peito')) return 'peitoral';
  if (t.includes('ombro') || t.includes('delto')) return 'ombros';
  if (t.includes('bicep') || t.includes('braquial')) return 'biceps';
  if (t.includes('tricep')) return 'triceps';
  if (t.includes('abd') || t.includes('core')) return 'abdomen';
  if (t.includes('dorsa') || t.includes('latiss') || t.includes('costas') || t.includes('romboid')) return 'dorsais';
  if (t.includes('trap')) return 'trapezio';
  if (t.includes('lombar')) return 'lombar';
  if (t.includes('glute')) return 'gluteos';
  if (t.includes('quadri') || t.includes('reto femoral')) return 'quadriceps';
  if (t.includes('posterior') || t.includes('isquio')) return 'posterior';
  if (t.includes('pantur') || t.includes('soleo') || t.includes('gastrocnem')) return 'panturrilha';
  if (t.includes('antebra')) return 'antebraco';
  return null;
}

interface ExerciseTemplate {
  name: string;
  equipment: string;
  notes?: string;
}

interface SubstitutionRule {
  test: RegExp;
  to: (ctx: { group: MuscleGroupKey | null; equipment: EquipmentType }) => ExerciseTemplate;
}

const HOME = (name: string, notes?: string): ExerciseTemplate => ({ name, equipment: 'Peso corporal / elástico', notes });
const DUMBBELL = (name: string, notes?: string): ExerciseTemplate => ({ name, equipment: 'Halteres', notes });

/** Regras de lesão têm prioridade sobre as de equipamento. */
const INJURY_RULES: Array<{ regions: PainRegion[]; rules: SubstitutionRule[] }> = [
  {
    regions: ['joelho'],
    rules: [
      {
        test: /agachamento|passada|afundo|bulgar|hack|cadeira extensora/,
        to: () => ({
          name: 'Leg Press 45° (amplitude controlada 0–90°)',
          equipment: 'Leg Press',
          notes: 'Joelho sensível: sem travar o joelho, amplitude parcial e cadência lenta.',
        }),
      },
    ],
  },
  {
    regions: ['ombro'],
    rules: [
      {
        test: /supino reto/,
        to: () => DUMBBELL('Supino Reto com Halteres (pegada neutra)', 'Ombro sensível: pegada neutra e amplitude confortável.'),
      },
      {
        test: /desenvolvimento|militar/,
        to: () => DUMBBELL('Desenvolvimento com Halteres (60–80°, pegada neutra)', 'Ombro sensível: não elevar o úmero acima da linha do ombro.'),
      },
      {
        test: /elevacao lateral|elevação lateral/,
        to: () => DUMBBELL('Elevação Lateral (até a linha do ombro)', 'Ombro sensível: parar na linha do ombro.'),
      },
    ],
  },
  {
    regions: ['lombar'],
    rules: [
      {
        test: /stiff|levantamento terra|good morning/,
        to: () => ({ name: 'Mesa Flexora', equipment: 'Mesa Flexora', notes: 'Lombar sensível: isquiotibiais sem sobrecarga axial.' }),
      },
      {
        test: /remada curvada|remada cavalinho/,
        to: () => DUMBBELL('Remada Apoiada no Banco', 'Lombar apoiada — sem carga axial.'),
      },
      {
        test: /agachamento|hack/,
        to: () => ({ name: 'Leg Press 45°', equipment: 'Leg Press', notes: 'Lombar sensível: tronco apoiado.' }),
      },
    ],
  },
  {
    regions: ['cotovelo', 'punho'],
    rules: [
      {
        test: /rosca direta|rosca biceps direta/,
        to: () => DUMBBELL('Rosca Martelo com Halteres', 'Cotovelo/punho: pegada neutra reduz tensão.'),
      },
      {
        test: /triceps testa|tríceps testa/,
        to: () => ({ name: 'Tríceps Corda na Polia', equipment: 'Polia', notes: 'Cotovelo sensível: corda em vez de barra.' }),
      },
      {
        test: /supino reto/,
        to: () => DUMBBELL('Supino Reto com Halteres (pegada neutra)'),
      },
    ],
  },
];

const EQUIPMENT_RULES: Array<{ when: EquipmentType; rules: SubstitutionRule[] }> = [
  {
    when: 'peso_corporal_homegym',
    rules: [
      { test: /supino|flexao/, to: () => HOME('Flexão de Braço (pés elevados)') },
      { test: /puxada|pulldown|remada/, to: () => HOME('Remada com Elástico') },
      { test: /leg press|cadeira extensora|hack|agachamento/, to: () => HOME('Agachamento Búlgaro com Peso Corporal') },
      { test: /mesa flexora|cadeira flexora|stiff/, to: () => HOME('Stiff com Elástico', 'Elástico sob os pés, quadril para trás.') },
      { test: /panturrilha/, to: () => HOME('Panturrilha em Pé no Degrau') },
      { test: /desenvolvimento|elevacao lateral/, to: () => HOME('Elevação Lateral com Elástico') },
      { test: /rosca/, to: () => HOME('Rosca com Elástico') },
      { test: /triceps/, to: () => HOME('Tríceps Francês com Elástico') },
      { test: /crucifixo|crossover/, to: () => HOME('Crucifixo com Elástico') },
    ],
  },
  {
    when: 'halteres_banco',
    rules: [
      { test: /puxada|pulldown/, to: () => DUMBBELL('Remada Unilateral com Halteres') },
      { test: /leg press|cadeira extensora|hack/, to: () => DUMBBELL('Agachamento Búlgaro com Halteres') },
      { test: /mesa flexora|cadeira flexora/, to: () => DUMBBELL('Stiff com Halteres') },
      { test: /panturrilha/, to: () => DUMBBELL('Panturrilha em Pé com Halteres') },
      { test: /crucifixo.*polia|crossover/, to: () => DUMBBELL('Crucifixo com Halteres') },
      { test: /triceps.*polia/, to: () => DUMBBELL('Tríceps Francês com Halter') },
      { test: /rosca.*polia/, to: () => DUMBBELL('Rosca Alternada com Halteres') },
    ],
  },
];

const GROUP_FALLBACK: Record<MuscleGroupKey, ExerciseTemplate> = {
  peitoral: { name: 'Supino Inclinado com Halteres (30°)', equipment: 'Banco inclinado e halteres' },
  ombros: { name: 'Elevação Lateral com Halteres', equipment: 'Halteres' },
  biceps: { name: 'Rosca Martelo com Halteres', equipment: 'Halteres' },
  triceps: { name: 'Tríceps Corda na Polia', equipment: 'Polia' },
  abdomen: { name: 'Prancha Abdominal Isométrica', equipment: 'Colchonete' },
  dorsais: { name: 'Puxada Alta Pronada', equipment: 'Polia alta' },
  trapezio: { name: 'Encolhimento com Halteres', equipment: 'Halteres' },
  lombar: { name: 'Extensão de Tronco no Solo', equipment: 'Colchonete' },
  gluteos: { name: 'Elevação Pélvica com Barra', equipment: 'Banco e barra' },
  quadriceps: { name: 'Leg Press 45°', equipment: 'Leg Press' },
  posterior: { name: 'Mesa Flexora', equipment: 'Mesa Flexora' },
  panturrilha: { name: 'Panturrilha Sentado', equipment: 'Máquina sóleo' },
  antebraco: { name: 'Rosca de Punho com Halteres', equipment: 'Halteres' },
};

function applySubstitution(
  exercise: ExerciseDefinition,
  ctx: { equipment: EquipmentType; painRegions: PainRegion[] },
): ExerciseDefinition {
  const normalized = normalizeText(exercise.name);

  for (const group of INJURY_RULES) {
    if (!group.regions.some((r) => ctx.painRegions.includes(r))) continue;
    for (const rule of group.rules) {
      if (rule.test.test(normalized)) {
        const to = rule.to({ group: muscleGroupOf(exercise.targetMuscle), equipment: ctx.equipment });
        return {
          ...exercise,
          name: to.name,
          equipment: to.equipment,
          notes: to.notes ? `${to.notes} ${exercise.notes}`.trim() : exercise.notes,
        };
      }
    }
  }

  const equipmentRules = EQUIPMENT_RULES.find((e) => e.when === ctx.equipment);
  if (equipmentRules) {
    for (const rule of equipmentRules.rules) {
      if (rule.test.test(normalized)) {
        const to = rule.to({ group: muscleGroupOf(exercise.targetMuscle), equipment: ctx.equipment });
        return {
          ...exercise,
          name: to.name,
          equipment: to.equipment,
          notes: to.notes ? `${to.notes} ${exercise.notes}`.trim() : exercise.notes,
        };
      }
    }
  }

  return exercise;
}

function capWeeklySetVolume(routines: WorkoutRoutine[], cap: number): void {
  const countByGroup = new Map<MuscleGroupKey, number>();
  const all: ExerciseDefinition[] = [];

  for (const routine of routines) {
    for (const ex of routine.exercises) {
      all.push(ex);
      const g = muscleGroupOf(ex.targetMuscle);
      if (!g) continue;
      countByGroup.set(g, (countByGroup.get(g) ?? 0) + ex.workingSets);
    }
  }

  // 1º passa: reduz isoladores (do último para o primeiro).
  for (const ex of [...all].reverse()) {
    const g = muscleGroupOf(ex.targetMuscle);
    if (!g || isCompound(ex.name)) continue;
    while ((countByGroup.get(g) ?? 0) > cap && ex.workingSets > 2) {
      ex.workingSets -= 1;
      countByGroup.set(g, (countByGroup.get(g) ?? 0) - 1);
    }
  }
  // 2º passa: se ainda exceder, reduz compostos até o piso de 2 séries.
  for (const ex of [...all].reverse()) {
    const g = muscleGroupOf(ex.targetMuscle);
    if (!g) continue;
    while ((countByGroup.get(g) ?? 0) > cap && ex.workingSets > 2) {
      ex.workingSets -= 1;
      countByGroup.set(g, (countByGroup.get(g) ?? 0) - 1);
    }
  }
}

const GOAL_REPS: Partial<Record<GoalType, { compound: string; isolation: string }>> = {
  performance: { compound: '4-6', isolation: '8-12' },
  perda_gordura: { compound: '8-12', isolation: '12-15' },
  manutencao: { compound: '6-10', isolation: '10-15' },
};

function isDisliked(name: string, disliked: string[]): boolean {
  const n = normalizeText(name);
  return disliked.some((d) => {
    const needle = normalizeText(d);
    return needle.length >= 3 && n.includes(needle);
  });
}

/**
 * Aplica a anamnese ao programa base (determinístico):
 * - experiência → séries; teto semanal por grupo (triagem);
 * - objetivo → faixa de reps/RIR/descanso;
 * - duração da sessão → nº de exercícios;
 * - lesões → substituições seguras (prioridade máxima);
 * - equipamento → variações compatíveis;
 * - exercícios evitados → substituição por grupo muscular.
 */
export function applyAnamnesisToProgram(
  program: WorkoutProgram,
  a: Anamnesis,
  triage: TriageResult = triageAnamnesis(a),
): WorkoutProgram {
  const ctx = {
    equipment: a.training.equipment,
    painRegions: a.injuries.painRegions,
  };
  const expFactor = a.training.experience === 'iniciante' ? 0.8 : a.training.experience === 'avancado' ? 1.15 : 1;
  const keepCount =
    a.training.sessionMinutes <= 35 ? 3 : a.training.sessionMinutes <= 45 ? 4 : a.training.sessionMinutes <= 55 ? 5 : 6;

  const routines = program.routines.map((routine) => {
    let exercises = routine.exercises.map((original) => {
      const ex: ExerciseDefinition = { ...original };
      // PRs de demonstração nunca acompanham um programa novo — carga é do usuário.
      delete ex.personalRecord;

      let next = applySubstitution(ex, ctx);

      if (isDisliked(next.name, a.training.dislikedExercises)) {
        const group = muscleGroupOf(next.targetMuscle);
        if (group) {
          const fallback = GROUP_FALLBACK[group];
          next = { ...next, name: fallback.name, equipment: fallback.equipment };
        }
      }

      next.workingSets = Math.max(2, Math.min(5, Math.round(next.workingSets * expFactor)));

      const reps = GOAL_REPS[a.goal.primary];
      if (reps) {
        if (isCompound(next.name)) {
          next.repsTarget = reps.compound;
          next.targetRir = Math.min(4, Math.max(next.targetRir, a.goal.primary === 'performance' ? 2 : next.targetRir));
          if (a.goal.primary === 'performance') next.restSeconds = Math.min(240, next.restSeconds + 30);
        } else {
          next.repsTarget = reps.isolation;
          next.targetRir = Math.max(0, next.targetRir);
          if (a.goal.primary === 'perda_gordura') next.restSeconds = Math.min(90, Math.max(45, next.restSeconds - 15));
        }
      }

      return next;
    });

    // Substituições podem colidir com um exercício já presente (ex.: agachamento
    // livre → leg press quando o leg press já está na ficha). Mantém a primeira
    // ocorrência para não duplicar estímulo.
    const seenNames = new Set<string>();
    exercises = exercises.filter((ex) => {
      const key = normalizeText(ex.name);
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    if (exercises.length > keepCount) exercises = exercises.slice(0, keepCount);

    return { ...routine, exercises };
  });

  capWeeklySetVolume(routines, triage.weeklySetCap);

  const notes = [
    `Triagem: risco ${triage.risk}; teto de ${triage.weeklySetCap} séries/grupo/semana; frequência ${triage.recommendedFrequency}x.`,
    ...triage.notes,
  ];

  return {
    ...program,
    id: `prog_anamnese_${Date.now()}`,
    name: `Periodização ${GOAL_LABEL[a.goal.primary]} · ${SPLIT_LABEL[program.splitType]} (${triage.recommendedFrequency}x/semana)`,
    weeklyFrequency: triage.recommendedFrequency,
    currentWeek: 1,
    isDeloadWeek: false,
    routines,
    scienceNotes: `${program.scienceNotes} ${notes.join(' ')}`.trim(),
  };
}
