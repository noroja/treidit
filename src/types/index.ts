export type GoalType = 
  | 'hipertrofia'
  | 'perda_gordura'
  | 'recomposicao'
  | 'manutencao'
  | 'ganho_peso'
  | 'performance';

export type GenderType = 'masculino' | 'feminino';

export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';

export type EquipmentType = 'academia_completa' | 'halteres_banco' | 'peso_corporal_homegym';

export interface UserProfile {
  name: string;
  age: number;
  gender: GenderType;
  heightCm: number;
  weightKg: number;
  goal: GoalType;
  experience: ExperienceLevel;
  frequencyDays: number; // e.g. 3, 4, 5, 6
  sessionDurationMin: number; // e.g. 60
  preferredExercises: string[];
  dislikedExercises: string[];
  availableEquipment: EquipmentType;
  limitations: string;
  activityLevel: 'sedentario' | 'moderado' | 'ativo' | 'muito_ativo';
}

export interface Anthropometry {
  date: string;
  weightKg: number;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number; // for women
  armCm: number;
  thighCm: number;
  calfCm: number;
  chestCm?: number;
  estimatedBodyFatPct: number;
  estimatedLeanMassKg: number;
  estimatedFatMassKg: number;
  notes?: string;
  photoUrl?: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  targetMuscle: string;
  equipment: string;
  warmupSets: number;
  workingSets: number;
  repsTarget: string; // e.g. "8-12"
  targetRir: number; // e.g. 1-2
  restSeconds: number; // e.g. 120
  notes: string;
  personalRecord?: {
    weightKg: number;
    reps: number;
    date: string;
  };
}

export interface WorkoutRoutine {
  id: string;
  name: string; // e.g. "Treino A: Push (Peito, Ombros e Tríceps)"
  dayOfWeek?: string; // e.g. "Segunda-feira"
  exercises: ExerciseDefinition[];
  focus: string;
  estimatedDurationMin: number;
}

export interface WorkoutProgram {
  id: string;
  name: string; // e.g. "Hipertrofia Adaptativa PPLUL"
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'pplul' | 'abcde' | 'personalizado';
  weeklyFrequency: number;
  currentWeek: number;
  totalWeeks: number;
  isDeloadWeek: boolean;
  routines: WorkoutRoutine[];
  scienceNotes: string;
}

export interface LoggedSet {
  setNumber: number;
  isWarmup: boolean;
  weightKg: number;
  repsCompleted: number;
  rirAchieved: number;
  painScale: number; // 0 = sem dor, 10 = dor intensa
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  sets: LoggedSet[];
  notes?: string;
}

export interface WorkoutSessionLog {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  durationMinutes: number;
  exercises: LoggedExercise[];
  perceivedEffortRPE: number; // 1 to 10
  jointPainReported: boolean;
  notes: string;
  totalVolumeLoadKg: number; // sum of (reps * weight)
}

export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
}

export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completed?: boolean;
  /** Fibras (g) quando o alimento tem registro — §6. */
  fiber?: number;
  /** Referência ao banco de alimentos (src/engine/foods) para substituição/cálculo. */
  foodId?: string;
  /** Porção exata em g/ml — habilita edição de quantidade com recálculo vivo. */
  grams?: number;
}

export interface PlannedMeal {
  id: string;
  name: string; // e.g. "Café da Manhã"
  time: string; // e.g. "08:00"
  targetCalories: number;
  items: MealItem[];
  completed: boolean;
}

export interface NutritionPlan {
  bmr: number; // Taxa Metabólica Basal
  tdee: number; // Gasto Energético Total
  targetMacros: MacroTarget;
  dietStrategy: 'deficit' | 'superavit' | 'manutencao';
  calorieDelta: number; // e.g. -400 or +300
  meals: PlannedMeal[];
  hydrationTargetMl: number;
  /**
   * Auditoria do motor determinístico (FASE 2): método de BMR, clamps de
   * segurança disparados, fórmulas e folga de arredondamento. Opcional para
   * manter compatibilidade com planos antigos persistidos no localStorage.
   */
  audit?: Omit<import('../engine/types').MacroAudit, 'strategy' | 'energyMethod'> & {
    strategy: string;
    energyMethod: string;
    formula: string;
    limitations: string;
  };
}

export interface DailyNutritionLog {
  date: string;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  consumedWaterMl: number;
  adherenceScore: number; // 1 to 5
  hungerLevel: 'baixa' | 'moderada' | 'alta';
  satietyLevel: 'ruim' | 'boa' | 'excelente';
  energyLevel: 'baixa' | 'normal' | 'alta';
}

export interface WorkoutFeedback {
  id: string;
  date: string;
  /** Percepção geral do treino em uso: 1 (péssimo) a 5 (excelente). */
  rating: 1 | 2 | 3 | 4 | 5;
  painReported: boolean;
  /** Consegue cumprir o split na rotina de vida? */
  fitsSchedule: boolean;
  note: string;
}

export interface RecoveryLog {
  date: string;
  sleepHours: number;
  sleepQuality: 'ruim' | 'regular' | 'boa' | 'otima';
  fatigueScore: number; // 1 to 5
  muscleSoreness: 'nenhuma' | 'leve' | 'moderada' | 'intensa';
  restingHeartRate?: number;
}

export interface AdaptiveAdjustment {
  id: string;
  date: string;
  status: 'optimal' | 'adjustment_needed' | 'deload_recommended' | 'adherence_issue';
  title: string;
  whatChanged: string;
  whyChanged: string;
  dataTrigger: string;
  evaluationMetrics: string;
  applied: boolean;
}

export interface ErgogenicArticle {
  id: string;
  title: string;
  category: 'anabolizantes' | 'sarms' | 'hormonios' | 'suplementos' | 'monitoramento';
  summary: string;
  mechanism: string;
  evidenceGrade: 'A (Robusta)' | 'B (Moderada)' | 'C (Limitada/Inconclusiva)' | 'Alto Risco';
  adverseEffects: string[];
  risksCardiovascular: string;
  risksHepatic: string;
  risksEndocrineFertility: string;
  monitoringProtocol: string[];
  harmReductionNotes: string;
}

export interface WeeklyCheckinData {
  date: string;
  weightKg: number;
  waistCm: number;
  avgRir: number;
  strengthProgression: 'aumentou' | 'manteve' | 'caiu';
  avgDailyCalories: number;
  avgProteinGrams: number;
  adherenceScore: number; // 1 to 5
  hungerLevel: 'baixa' | 'moderada' | 'alta';
  satietyLevel: 'ruim' | 'boa' | 'excelente';
  sleepAvgHours: number;
  fatigueScore: number; // 1 to 5
  stressLevel: number; // 1 to 5
  visualDensityNotes?: string;
  jointDiscomfort: boolean;
}

export interface WeeklyCheckinReport {
  id: string;
  date: string;
  title: string;
  status: 'manter' | 'ajustar_calorias' | 'ajustar_volume' | 'deload' | 'melhorar_adesao';
  resposta: string; // Resposta observada dos dados
  interpretacao: string; // Interpretação fisiológica
  decisao: string; // Conduta prática adotada
  perguntasChave: {
    paraQuem: string; // «Para quem?» (Belmiro de Salles)
    paraQue: string;  // «Para quê?» (Belmiro de Salles)
    emQualMomento: string; // «Em qual momento?» (Belmiro de Salles)
  };
  methodologicalInsights: {
    duduHaluch: string; // Titulação progressiva, adesão, proteína
    chrisAceto: string; // Carboidratos, visual, recuperação
    belmiroDeSalles: string; // Manipulação de volume, RIR, descanso
  };
  ajustesRecomendados: {
    caloriasDelta: number;
    volumeDeltaSets: number;
    focoCarboidrato: string;
  };
  applied: boolean;
}

export interface EvidenceHierarchyLevel {
  level: number;
  name: string;
  description: string;
  example: string;
}

export interface MethodologicalAuthor {
  id: string;
  name: string;
  specialty: string;
  keyContributions: string[];
  decisionHeuristics: string[];
  quote: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  type: 'checkin' | 'treino' | 'dieta' | 'ajuste';
  actionTab?: string;
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  mechanics: string;
  executionTips: string;
  commonMistakes: string;
  targetRirRecommendation: string;
  instructions?: string[];
  images?: string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  force?: string | null;
  category?: string;
}


