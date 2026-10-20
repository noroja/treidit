import { Anthropometry, DailyNutritionLog, RecoveryLog, UserProfile, WorkoutSessionLog, AdaptiveAdjustment, AppNotification } from '../types';
import { generateNutritionPlan, generateWorkoutProgram, calculateNavyBodyFat } from '../utils/calculations';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Alex Lima',
  age: 28,
  gender: 'masculino',
  heightCm: 178,
  weightKg: 79.5,
  goal: 'hipertrofia',
  experience: 'intermediario',
  frequencyDays: 4,
  sessionDurationMin: 65,
  preferredExercises: ['Supino Reto', 'Agachamento Livre', 'Remada Curvada', 'Elevação Lateral'],
  dislikedExercises: ['Crucifixo Invertido com Halteres'],
  availableEquipment: 'academia_completa',
  limitations: 'Nenhuma limitação articular atual. Desconforto leve prévio no ombro esquerdo prevenido com aquecimento de manguito.',
  activityLevel: 'ativo',
};

const initialBf = calculateNavyBodyFat('masculino', 178, 82, 38.5);
const initialLeanMass = Math.round((79.5 * (1 - initialBf / 100)) * 10) / 10;
const initialFatMass = Math.round((79.5 - initialLeanMass) * 10) / 10;

export const INITIAL_ANTHROPOMETRY: Anthropometry[] = [
  {
    date: '2026-10-02',
    weightKg: 79.5,
    heightCm: 178,
    waistCm: 82.0,
    neckCm: 38.5,
    armCm: 38.2,
    thighCm: 59.5,
    calfCm: 38.0,
    chestCm: 104.0,
    estimatedBodyFatPct: initialBf,
    estimatedLeanMassKg: initialLeanMass,
    estimatedFatMassKg: initialFatMass,
    notes: 'Avaliação da 4ª semana: cintura reduziu 1cm mantendo medidas de braço e tórax.'
  },
  {
    date: '2026-09-25',
    weightKg: 79.9,
    heightCm: 178,
    waistCm: 82.8,
    neckCm: 38.5,
    armCm: 38.0,
    thighCm: 59.2,
    calfCm: 38.0,
    chestCm: 103.5,
    estimatedBodyFatPct: 16.3,
    estimatedLeanMassKg: 66.8,
    estimatedFatMassKg: 13.1,
    notes: 'Ótima resposta de recomposição.'
  },
  {
    date: '2026-09-18',
    weightKg: 80.5,
    heightCm: 178,
    waistCm: 83.5,
    neckCm: 38.5,
    armCm: 37.8,
    thighCm: 59.0,
    calfCm: 37.8,
    chestCm: 103.0,
    estimatedBodyFatPct: 16.9,
    estimatedLeanMassKg: 66.8,
    estimatedFatMassKg: 13.7,
  },
  {
    date: '2026-09-11',
    weightKg: 81.2,
    heightCm: 178,
    waistCm: 84.5,
    neckCm: 38.5,
    armCm: 37.5,
    thighCm: 58.8,
    calfCm: 37.5,
    chestCm: 102.5,
    estimatedBodyFatPct: 17.6,
    estimatedLeanMassKg: 66.9,
    estimatedFatMassKg: 14.3,
    notes: 'Ponto de partida do mesociclo atual.'
  }
];

export const INITIAL_WORKOUT_PROGRAM = generateWorkoutProgram(INITIAL_USER_PROFILE);
export const INITIAL_NUTRITION_PLAN = generateNutritionPlan(INITIAL_USER_PROFILE);

export const INITIAL_WORKOUT_LOGS: WorkoutSessionLog[] = [
  {
    id: 'log_prev_1',
    routineId: 'ul_1',
    routineName: 'Treino A: Upper 1 (Força & Tensão Mecânica)',
    date: '2026-10-01',
    durationMinutes: 62,
    perceivedEffortRPE: 8.5,
    jointPainReported: false,
    notes: 'Consegui subir a carga no supino mantendo RIR 2 na última série.',
    totalVolumeLoadKg: 8450,
    exercises: [
      {
        exerciseId: 'u1',
        exerciseName: 'Supino Reto com Barra Olímpica',
        targetMuscle: 'Peitoral',
        sets: [
          { setNumber: 1, isWarmup: false, weightKg: 80, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: true },
          { setNumber: 2, isWarmup: false, weightKg: 82.5, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: true },
          { setNumber: 3, isWarmup: false, weightKg: 82.5, repsCompleted: 7, rirAchieved: 1, painScale: 0, completed: true }
        ]
      },
      {
        exerciseId: 'u2',
        exerciseName: 'Remada Baixa Triângulo na Polia',
        targetMuscle: 'Dorsais',
        sets: [
          { setNumber: 1, isWarmup: false, weightKg: 70, repsCompleted: 10, rirAchieved: 2, painScale: 0, completed: true },
          { setNumber: 2, isWarmup: false, weightKg: 75, repsCompleted: 10, rirAchieved: 1, painScale: 0, completed: true },
          { setNumber: 3, isWarmup: false, weightKg: 75, repsCompleted: 9, rirAchieved: 1, painScale: 0, completed: true }
        ]
      }
    ]
  },
  {
    id: 'log_prev_2',
    routineId: 'ul_2',
    routineName: 'Treino B: Lower 1 (Quadríceps & Panturrilhas)',
    date: '2026-09-29',
    durationMinutes: 58,
    perceivedEffortRPE: 9,
    jointPainReported: false,
    notes: 'Agachamento muito sólido, técnica estável.',
    totalVolumeLoadKg: 10200,
    exercises: [
      {
        exerciseId: 'l1',
        exerciseName: 'Agachamento Livre',
        targetMuscle: 'Quadríceps',
        sets: [
          { setNumber: 1, isWarmup: false, weightKg: 95, repsCompleted: 8, rirAchieved: 2, painScale: 0, completed: true },
          { setNumber: 2, isWarmup: false, weightKg: 100, repsCompleted: 8, rirAchieved: 1, painScale: 0, completed: true },
          { setNumber: 3, isWarmup: false, weightKg: 100, repsCompleted: 7, rirAchieved: 1, painScale: 0, completed: true }
        ]
      }
    ]
  }
];

export const INITIAL_NUTRITION_LOGS: DailyNutritionLog[] = [
  {
    date: '2026-10-02',
    // Derivado de sumMealItems das refeições 1-2 completadas (motor de refeições) —
    // NÃO é valor decorativo: o app re-deriva o consumo a cada alteração de item.
    consumedCalories: 1193,
    consumedProtein: 98,
    consumedCarbs: 127,
    consumedFat: 33,
    consumedWaterMl: 3200,
    adherenceScore: 5,
    hungerLevel: 'moderada',
    satietyLevel: 'boa',
    energyLevel: 'alta',
  },
  {
    date: '2026-10-01',
    consumedCalories: 2380,
    consumedProtein: 162,
    consumedCarbs: 270,
    consumedFat: 68,
    consumedWaterMl: 3000,
    adherenceScore: 5,
    hungerLevel: 'moderada',
    satietyLevel: 'boa',
    energyLevel: 'alta',
  },
  {
    date: '2026-09-30',
    consumedCalories: 2450,
    consumedProtein: 160,
    consumedCarbs: 285,
    consumedFat: 72,
    consumedWaterMl: 2900,
    adherenceScore: 4,
    hungerLevel: 'baixa',
    satietyLevel: 'excelente',
    energyLevel: 'normal',
  },
  {
    date: '2026-09-29',
    consumedCalories: 2350,
    consumedProtein: 158,
    consumedCarbs: 260,
    consumedFat: 71,
    consumedWaterMl: 3100,
    adherenceScore: 5,
    hungerLevel: 'moderada',
    satietyLevel: 'boa',
    energyLevel: 'alta',
  }
];

export const INITIAL_RECOVERY: RecoveryLog = {
  date: '2026-10-02',
  sleepHours: 7.8,
  sleepQuality: 'boa',
  fatigueScore: 2,
  muscleSoreness: 'leve',
  restingHeartRate: 58,
};

export const INITIAL_ADAPTIVE_ADJUSTMENTS: AdaptiveAdjustment[] = [
  {
    id: 'adj_history_1',
    date: '2026-09-28',
    status: 'optimal',
    title: 'Progressão de Sobrecarga Validada no Supino e Agachamento',
    whatChanged: 'Aumento programado de 2.5kg nas séries principais de membros superiores e inferiores.',
    whyChanged: 'O usuário completou todas as séries alvo com RIR 2 durante duas semanas seguidas, indicando supercompensação muscular efetiva sem fadiga residual excessiva.',
    dataTrigger: 'Taxa de acerto de 100% nas repetições prescritas com RIR médio de 2.0 e sono estável em 7.5h.',
    evaluationMetrics: 'Acompanhar se o RIR na primeira série permanece entre 1 e 2 com a nova carga de 82.5kg.',
    applied: true,
  },
  {
    id: 'adj_history_0',
    date: '2026-09-15',
    status: 'adjustment_needed',
    title: 'Ajuste Fino de Macronutrientes: +15g de Proteína Diária',
    whatChanged: 'Meta proteica elevada de 145g para 160g/dia distribuída entre o café da manhã e a ceia.',
    whyChanged: 'Otimizar a síntese proteica fracionada (MPS) e favorecer a recomposição corporal (perda de gordura com preservação de massa magra).',
    dataTrigger: 'Dados de ingestão mostraram aporte concentrado apenas no almoço/jantar.',
    evaluationMetrics: 'Redução na fome noturna e melhora na recuperação de dores musculares tardias (DOMS).',
    applied: true,
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Check-in Semanal Disponível',
    description: 'Sua semana de treinos encerrou. Registre seu peso e notas de densidade para a auditoria Haluch/Aceto/Belmiro.',
    date: 'Hoje, 09:15',
    read: false,
    type: 'checkin',
    actionTab: 'inicio'
  },
  {
    id: 'notif_2',
    title: 'Ajuste Adaptativo Validado',
    description: 'Sobrecarga de +2.5kg confirmada no Supino Reto com RIR estável.',
    date: 'Ontem, 20:45',
    read: false,
    type: 'ajuste',
    actionTab: 'treino'
  },
  {
    id: 'notif_3',
    title: 'Meta de Proteína Atingida',
    description: 'Parabéns! Você bateu a meta de 160g de proteína hoje com alta fidelidade.',
    date: 'Hoje, 21:00',
    read: true,
    type: 'dieta',
    actionTab: 'dieta'
  }
];

