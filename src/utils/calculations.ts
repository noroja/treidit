import { Anthropometry, GenderType, GoalType, UserProfile, WorkoutProgram, WorkoutRoutine, MacroTarget, NutritionPlan, AdaptiveAdjustment, WorkoutSessionLog } from '../types';
import { computeNutritionTargets, distributeMeals, validateUserTargets } from '../engine/macros';
import { estimateBmr } from '../engine/energy';

/**
 * Calculates BMR using Mifflin-St Jeor formula
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: GenderType
): number {
  if (gender === 'masculino') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

/**
 * Activity multipliers based on training frequency & lifestyle
 */
export function getActivityMultiplier(activityLevel: string, frequencyDays: number): number {
  if (frequencyDays >= 5 || activityLevel === 'muito_ativo') return 1.65;
  if (frequencyDays >= 4 || activityLevel === 'ativo') return 1.50;
  if (frequencyDays >= 3 || activityLevel === 'moderado') return 1.375;
  return 1.25;
}

/**
 * Estimated US Navy Body Fat Percentage Formula
 */
export function calculateNavyBodyFat(
  gender: GenderType,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
): number {
  try {
    if (gender === 'masculino') {
      const diff = waistCm - neckCm;
      if (diff <= 0) return 15.0;
      const logDiff = Math.log10(diff);
      const logHeight = Math.log10(heightCm);
      const density = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight;
      const bf = (495 / density) - 450;
      return Math.min(Math.max(Math.round(bf * 10) / 10, 5), 45);
    } else {
      const hip = hipCm || waistCm * 1.15;
      const sum = waistCm + hip - neckCm;
      if (sum <= 0) return 22.0;
      const logSum = Math.log10(sum);
      const logHeight = Math.log10(heightCm);
      const density = 1.29579 - 0.35004 * logSum + 0.22100 * logHeight;
      const bf = (495 / density) - 450;
      return Math.min(Math.max(Math.round(bf * 10) / 10, 10), 50);
    }
  } catch {
    return gender === 'masculino' ? 15.0 : 23.0;
  }
}

/**
 * Calculates customized Nutrition Plan with scientific macro ratios
 */
export function generateNutritionPlan(profile: UserProfile): NutritionPlan {
  // FASE 2: o cálculo agora é 100% delegado ao motor determinístico
  // (src/engine) — validação de entradas, clamps de segurança (piso calórico
  // por sexo, |Δ| ≤ 25%/20% do TEE, proteína em [1.4, 2.7] g/kg, gordura
  // mínima 0.6 g/kg) e consistência energética 4/4/9. Esta função permanece
  // como adapter para não quebrar os chamadores existentes.
  const result = computeNutritionTargets({
    goal: profile.goal,
    sex: profile.gender,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.age,
    activityLevel: profile.activityLevel,
    frequencyDaysPerWeek: profile.frequencyDays,
  });

  const { targets, audit, teeKcalPerDay } = result;
  const targetCalories = targets.caloriesKcalPerDay;

  // Distribuição das metas por refeição (mesmos pesos 25/35/20/20), com a
  // sobra de arredondamento lançada na maior refeição para somar 100%.
  const mealShares = [0.25, 0.35, 0.2, 0.2];
  const mealTargets = distributeMeals(
    {
      caloriesKcalPerDay: targets.caloriesKcalPerDay,
      proteinGramsPerDay: targets.proteinGramsPerDay,
      carbsGramsPerDay: targets.carbsGramsPerDay,
      fatGramsPerDay: targets.fatGramsPerDay,
    },
    mealShares,
  );

  const bmrResult = estimateBmr({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.age,
    sex: profile.gender,
  });

  const targetMacros: MacroTarget = {
    calories: targetCalories,
    proteinGrams: targets.proteinGramsPerDay,
    carbsGrams: targets.carbsGramsPerDay,
    fatGrams: targets.fatGramsPerDay,
    fiberGrams: targets.fiberGramsPerDay,
    waterMl: targets.waterMillilitersPerDay,
  };

  // Generate structured meals
  const meals = [
    {
      id: 'meal_1',
      name: 'Café da Manhã Energético',
      time: '07:30',
      targetCalories: mealTargets[0].caloriesKcal,
      completed: true,
      items: [
        { id: 'i1', name: 'Ovos mexidos inteiros (3 un)', portion: '150g', calories: 217, protein: 20, carbs: 2, fat: 14.3, completed: true, foodId: 'ovo_cozido', grams: 150 },
        { id: 'i2', name: 'Aveia em flocos finos', portion: '50g', calories: 178, protein: 7, carbs: 29.5, fat: 3.5, fiber: 4.6, completed: true, foodId: 'aveia_flocos', grams: 50 },
        { id: 'i3', name: 'Banana prata fatiada com canela', portion: '90g', calories: 107, protein: 1.2, carbs: 25.2, fat: 0.1, fiber: 1.8, completed: true, foodId: 'banana_prata', grams: 90 },
        { id: 'i4', name: 'Café preto s/ açúcar', portion: '150ml', calories: 4, protein: 0, carbs: 1, fat: 0, completed: true }
      ]
    },
    {
      id: 'meal_2',
      name: 'Almoço Anabólico & Equilibrado',
      time: '12:30',
      targetCalories: mealTargets[1].caloriesKcal,
      completed: true,
      items: [
        { id: 'i5', name: 'Peito de frango grelhado', portion: '180g', calories: 282, protein: 55.8, carbs: 0, fat: 6.5, completed: true, foodId: 'frango_peito_grelhado', grams: 180 },
        { id: 'i6', name: 'Arroz branco cozido', portion: '160g', calories: 198, protein: 4, carbs: 44.8, fat: 0.3, fiber: 2.6, completed: true, foodId: 'arroz_branco_cozido', grams: 160 },
        { id: 'i7', name: 'Feijão preto cozido temperado', portion: '100g', calories: 122, protein: 8.9, carbs: 20.4, fat: 0.5, fiber: 8.5, completed: true, foodId: 'feijao_preto_cozido', grams: 100 },
        { id: 'i8', name: 'Salada verde variada com azeite de oliva extra virgem', portion: '1 prato + 8ml', calories: 85, protein: 1, carbs: 4, fat: 8, completed: true }
      ]
    },
    {
      id: 'meal_3',
      name: 'Lanche Pré/Pós-Treino',
      time: '16:30',
      targetCalories: mealTargets[2].caloriesKcal,
      completed: false,
      items: [
        { id: 'i9', name: 'Iogurte natural desnatado ou grego', portion: '170g', calories: 90, protein: 7, carbs: 8.3, fat: 3.2, completed: false, foodId: 'iogurte_desnatado', grams: 170 },
        { id: 'i10', name: 'Whey Protein 80%', portion: '30g', calories: 117, protein: 23.4, carbs: 2.4, fat: 1.5, completed: false, foodId: 'whey_concentrado', grams: 30 },
        { id: 'i11', name: 'Maçã fresca', portion: '130g', calories: 73, protein: 0.4, carbs: 17.6, fat: 0.1, fiber: 3.1, completed: false, foodId: 'maca', grams: 130 }
      ]
    },
    {
      id: 'meal_4',
      name: 'Jantar Reparador',
      time: '20:30',
      targetCalories: mealTargets[3].caloriesKcal,
      completed: false,
      items: [
        { id: 'i12', name: 'Patinho moído ou filé de tilápia grelhada', portion: '160g', calories: 270, protein: 44, carbs: 0, fat: 10.4, completed: false, foodId: 'patinho_grelhado', grams: 160 },
        { id: 'i13', name: 'Batata doce ou inglesa cozida', portion: '180g', calories: 186, protein: 2.5, carbs: 43.2, fat: 0.4, fiber: 4, completed: false, foodId: 'batata_doce_cozida', grams: 180 },
        { id: 'i14', name: 'Brócolis e cenoura no vapor', portion: '120g', calories: 46, protein: 4.1, carbs: 6.2, fat: 0.5, fiber: 3.1, completed: false, foodId: 'brocolis_cenoura', grams: 120 }
      ]
    }
  ];

  return {
    bmr: bmrResult.bmrKcalPerDay,
    tdee: teeKcalPerDay,
    targetMacros,
    dietStrategy: result.strategy,
    calorieDelta: result.calorieDeltaKcalPerDay,
    meals,
    hydrationTargetMl: targetMacros.waterMl,
    audit: {
      ...audit,
      energyMethod: bmrResult.method,
      formula: bmrResult.formula,
      limitations: `${bmrResult.limitations} ${estimateTeeLimitation(profile)}`,
    },
  };
}

/** Nota de limitação do TEE para a auditoria — mantida aqui por ser adapter. */
function estimateTeeLimitation(profile: UserProfile): string {
  return 'O TEE é estimado (fator de atividade, erro ±10–15%); a calibração real vem da tendência de peso nos check-ins semanais.';
}

/**
 * Generates an individualized Hypertrophy & Strength Program based on science:
 * - Schoenfeld & Helms volume landmarks (10-18 weekly sets per muscle)
 * - Proximity to failure (RIR 1-2 on compounds, RIR 0-1 on isolations)
 * - Intelligent split matching user's frequency (3, 4, 5, 6 days)
 */
export function generateWorkoutProgram(profile: UserProfile): WorkoutProgram {
  const { frequencyDays, experience, limitations, goal } = profile;

  let splitType: WorkoutProgram['splitType'] = 'upper_lower';
  let routines: WorkoutRoutine[] = [];

  const hasKneeIssue = limitations.toLowerCase().includes('joelho');
  const hasShoulderIssue = limitations.toLowerCase().includes('ombro');
  const hasBackIssue = limitations.toLowerCase().includes('coluna') || limitations.toLowerCase().includes('lombar');

  if (frequencyDays <= 3) {
    splitType = 'full_body';
    routines = [
      {
        id: 'fb_a',
        name: 'Treino A: Full Body (Foco Cadeia Anterior)',
        dayOfWeek: 'Segunda-feira',
        focus: 'Quadríceps, Peitoral, Dorsal e Core',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          {
            id: 'ex_1',
            name: hasKneeIssue ? 'Leg Press 45° (Amplitude Controlada)' : 'Agachamento Livre com Barra',
            targetMuscle: 'Quadríceps e Glúteos',
            equipment: hasKneeIssue ? 'Aparelho Leg Press' : 'Barra Olímpica e Gaiola',
            warmupSets: 2,
            workingSets: 3,
            repsTarget: '6-8',
            targetRir: 2,
            restSeconds: 150,
            notes: 'Pausa de 1s no ponto de maior estiramento muscular. Não travar os joelhos.',
            personalRecord: { weightKg: 95, reps: 8, date: '2026-09-22' }
          },
          {
            id: 'ex_2',
            name: hasShoulderIssue ? 'Supino Reto com Halteres (Pegada Neutra)' : 'Supino Reto com Barra',
            targetMuscle: 'Peitoral Maior',
            equipment: 'Banco Reto e Halteres/Barra',
            warmupSets: 1,
            workingSets: 3,
            repsTarget: '8-10',
            targetRir: 1,
            restSeconds: 120,
            notes: 'Depressão e retração escapular ativas durante todo o arco.',
            personalRecord: { weightKg: 80, reps: 8, date: '2026-09-25' }
          },
          {
            id: 'ex_3',
            name: hasBackIssue ? 'Puxada Alta Frontal na Polia' : 'Remada Curvada com Barra',
            targetMuscle: 'Dorsal e Romboides',
            equipment: 'Polia ou Barra',
            warmupSets: 1,
            workingSets: 3,
            repsTarget: '8-12',
            targetRir: 1,
            restSeconds: 120,
            notes: 'Puxar com os cotovelos, focando na contração das escápulas.',
            personalRecord: { weightKg: 70, reps: 10, date: '2026-09-27' }
          },
          {
            id: 'ex_4',
            name: 'Elevação Pélvica com Barra ou Máquina',
            targetMuscle: 'Glúteos e Posterior',
            equipment: 'Banco e Barra',
            warmupSets: 1,
            workingSets: 3,
            repsTarget: '10-12',
            targetRir: 1,
            restSeconds: 90,
            notes: 'Contração de pico de 2 segundos no topo.',
            personalRecord: { weightKg: 100, reps: 10, date: '2026-09-18' }
          },
          {
            id: 'ex_5',
            name: 'Elevação Lateral com Halteres',
            targetMuscle: 'Deltoide Lateral',
            equipment: 'Halteres',
            warmupSets: 0,
            workingSets: 4,
            repsTarget: '12-15',
            targetRir: 0,
            restSeconds: 60,
            notes: 'Plano escapular (~30° à frente). Amplitude completa.',
            personalRecord: { weightKg: 14, reps: 14, date: '2026-09-28' }
          },
          {
            id: 'ex_6',
            name: 'Prancha Abdominal Isométrica ou Abdominal na Polia',
            targetMuscle: 'Core & Abdominal',
            equipment: 'Colchonete / Polia',
            warmupSets: 0,
            workingSets: 3,
            repsTarget: '12-15 / 45s',
            targetRir: 1,
            restSeconds: 60,
            notes: 'Ativação do transverso do abdômen.',
          }
        ]
      },
      {
        id: 'fb_b',
        name: 'Treino B: Full Body (Foco Cadeia Posterior)',
        dayOfWeek: 'Quarta-feira',
        focus: 'Posteriores de Coxa, Ombros, Costas e Bíceps',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          {
            id: 'ex_7',
            name: hasBackIssue ? 'Mesa Flexora Deitada' : 'Stiff com Halteres ou Barra',
            targetMuscle: 'Posterior de Coxa e Glúteos',
            equipment: 'Halteres ou Máquina Flexora',
            warmupSets: 1,
            workingSets: 3,
            repsTarget: '8-12',
            targetRir: 2,
            restSeconds: 120,
            notes: 'Manter a curvatura neutra da coluna. Sentir estiramento dos ísquios.',
            personalRecord: { weightKg: 75, reps: 10, date: '2026-09-20' }
          },
          {
            id: 'ex_8',
            name: 'Desenvolvimento Militar com Halteres Sentado',
            targetMuscle: 'Deltoide Anterior e Tríceps',
            equipment: 'Banco 75° e Halteres',
            warmupSets: 1,
            workingSets: 3,
            repsTarget: '8-10',
            targetRir: 1,
            restSeconds: 120,
            notes: 'Cotovelos levemente à frente do corpo.',
            personalRecord: { weightKg: 24, reps: 8, date: '2026-09-21' }
          },
          {
            id: 'ex_9',
            name: 'Puxada Fechada Triângulo na Polia Alta',
            targetMuscle: 'Latíssimo do Dorso',
            equipment: 'Polia Alta',
            warmupSets: 0,
            workingSets: 3,
            repsTarget: '10-12',
            targetRir: 1,
            restSeconds: 90,
            notes: 'Alongamento profundo no topo sem soltar os ombros bruscamente.',
            personalRecord: { weightKg: 65, reps: 11, date: '2026-09-23' }
          },
          {
            id: 'ex_10',
            name: 'Rosca Biceps Direta na Barra W ou Halteres',
            targetMuscle: 'Bíceps Braquial',
            equipment: 'Barra W',
            warmupSets: 0,
            workingSets: 3,
            repsTarget: '10-12',
            targetRir: 1,
            restSeconds: 75,
            notes: 'Cotovelos alinhados ao tronco.',
            personalRecord: { weightKg: 30, reps: 10, date: '2026-09-25' }
          },
          {
            id: 'ex_11',
            name: 'Tríceps Corda na Polia',
            targetMuscle: 'Tríceps (Cabeça Lateral e Medial)',
            equipment: 'Cabo / Polia',
            warmupSets: 0,
            workingSets: 3,
            repsTarget: '12-15',
            targetRir: 0,
            restSeconds: 60,
            notes: 'Abrir a corda no final da extensão.',
            personalRecord: { weightKg: 35, reps: 13, date: '2026-09-27' }
          }
        ]
      }
    ];
  } else if (frequencyDays === 4) {
    splitType = 'upper_lower';
    routines = [
      {
        id: 'ul_1',
        name: 'Treino A: Upper 1 (Força & Tensão Mecânica)',
        dayOfWeek: 'Segunda-feira',
        focus: 'Peitoral, Costas, Deltoides e Braços',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'u1', name: 'Supino Reto com Barra Olímpica', targetMuscle: 'Peitoral', equipment: 'Barra e Banco', warmupSets: 2, workingSets: 3, repsTarget: '6-8', targetRir: 2, restSeconds: 150, notes: 'Foco em sobrecarga progressiva.' },
          { id: 'u2', name: 'Remada Baixa Triângulo na Polia', targetMuscle: 'Dorsais', equipment: 'Polia Baixa', warmupSets: 1, workingSets: 3, repsTarget: '8-10', targetRir: 1, restSeconds: 120, notes: 'Retração escapular firme.' },
          { id: 'u3', name: 'Desenvolvimento com Halteres', targetMuscle: 'Ombros', equipment: 'Halteres', warmupSets: 1, workingSets: 3, repsTarget: '8-10', targetRir: 1, restSeconds: 90, notes: 'Execução estrita.' },
          { id: 'u4', name: 'Puxada Alta Pronada', targetMuscle: 'Latíssimo', equipment: 'Polia Alta', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 90, notes: 'Estiramento máximo.' },
          { id: 'u5', name: 'Rosca Martelo com Halteres', targetMuscle: 'Braquial e Bíceps', equipment: 'Halteres', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 0, restSeconds: 60, notes: 'Controle excêntrico.' },
          { id: 'u6', name: 'Tríceps Testa com Barra W', targetMuscle: 'Tríceps', equipment: 'Barra W', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 60, notes: 'Alongamento da cabeça longa.' }
        ]
      },
      {
        id: 'ul_2',
        name: 'Treino B: Lower 1 (Quadríceps & Panturrilhas)',
        dayOfWeek: 'Terça-feira',
        focus: 'Quadríceps, Isquiotibiais e Panturrilhas',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'l1', name: 'Agachamento Livre ou Hack Machine', targetMuscle: 'Quadríceps', equipment: 'Gaiola ou Hack', warmupSets: 2, workingSets: 3, repsTarget: '6-8', targetRir: 2, restSeconds: 150, notes: 'Descida em 3 segundos.' },
          { id: 'l2', name: 'Leg Press 45°', targetMuscle: 'Quadríceps', equipment: 'Leg Press', warmupSets: 1, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 120, notes: 'Pés na largura dos ombros.' },
          { id: 'l3', name: 'Cadeira Flexora Unilateral', targetMuscle: 'Posterior de Coxa', equipment: 'Cadeira Flexora', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 75, notes: 'Pausa na contração.' },
          { id: 'l4', name: 'Cadeira Extensora', targetMuscle: 'Reto Femoral', equipment: 'Cadeira Extensora', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Arco total de movimento.' },
          { id: 'l5', name: 'Panturrilha em Pé na Máquina', targetMuscle: 'Gastrocnêmio', equipment: 'Máquina Panturrilha', warmupSets: 1, workingSets: 4, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Pausa de 2s no fundo (elimina reflexo miotático).' }
        ]
      },
      {
        id: 'ul_3',
        name: 'Treino C: Upper 2 (Hipertrofia & Pump)',
        dayOfWeek: 'Quinta-feira',
        focus: 'Peito, Costas e Ombros isolados',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'u7', name: 'Supino Inclinado com Halteres (30°)', targetMuscle: 'Peitoral Superior', equipment: 'Banco Inclinado e Halteres', warmupSets: 1, workingSets: 3, repsTarget: '8-12', targetRir: 1, restSeconds: 120, notes: 'Alvo nas fibras claviculares.' },
          { id: 'u8', name: 'Remada Cavalinho ou Apoiada no Banco', targetMuscle: 'Espessura de Costas', equipment: 'Máquina T-Bar', warmupSets: 1, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 90, notes: 'Apoio no esterno protege a lombar.' },
          { id: 'u9', name: 'Crucifixo Inclinado na Polia', targetMuscle: 'Peitoral', equipment: 'Crossover', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Tensão constante em todo o raio.' },
          { id: 'u10', name: 'Elevação Lateral na Polia', targetMuscle: 'Deltoide Lateral', equipment: 'Polia Baixa', warmupSets: 0, workingSets: 4, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Polia ajustada na altura do punho.' },
          { id: 'u11', name: 'Crucifixo Invertido na Máquina (Peck Deck)', targetMuscle: 'Deltoide Posterior', equipment: 'Peck Deck', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Sem encolher os trapézios.' }
        ]
      },
      {
        id: 'ul_4',
        name: 'Treino D: Lower 2 (Posteriores & Glúteos)',
        dayOfWeek: 'Sexta-feira',
        focus: 'Cadeia Posterior e Core',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'l6', name: 'Stiff com Barra ou Halteres', targetMuscle: 'Posterior e Glúteos', equipment: 'Barra', warmupSets: 2, workingSets: 3, repsTarget: '8-10', targetRir: 2, restSeconds: 120, notes: 'Empurrar o quadril para trás.' },
          { id: 'l7', name: 'Elevação Pélvica com Barra', targetMuscle: 'Glúteo Máximo', equipment: 'Banco e Barra', warmupSets: 1, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 90, notes: 'Apoio nas escápulas.' },
          { id: 'l8', name: 'Mesa Flexora', targetMuscle: 'Isquiotibiais', equipment: 'Mesa Flexora', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 0, restSeconds: 75, notes: 'Quadril colado no banco.' },
          { id: 'l9', name: 'Passada / Afundo com Halteres', targetMuscle: 'Pernas Completo', equipment: 'Halteres', warmupSets: 0, workingSets: 3, repsTarget: '10-12 cada perna', targetRir: 1, restSeconds: 90, notes: 'Passo largo para foco em glúteo.' },
          { id: 'l10', name: 'Panturrilha Sentado (Solear)', targetMuscle: 'Sóleo', equipment: 'Máquina Sóleo', warmupSets: 0, workingSets: 3, repsTarget: '15-20', targetRir: 0, restSeconds: 60, notes: 'Cadência controlada.' }
        ]
      }
    ];
  } else {
    // 5 or 6 days: Push / Pull / Legs
    splitType = frequencyDays === 5 ? 'pplul' : 'push_pull_legs';
    routines = [
      {
        id: 'ppl_push',
        name: 'Push (Peito, Ombros e Tríceps)',
        dayOfWeek: 'Segunda-feira',
        focus: 'Empurrar horizontal e vertical',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'p1', name: 'Supino Reto com Barra', targetMuscle: 'Peitoral Maior', equipment: 'Barra', warmupSets: 2, workingSets: 3, repsTarget: '6-8', targetRir: 2, restSeconds: 150, notes: 'Base firme com os pés.' },
          { id: 'p2', name: 'Supino Inclinado com Halteres', targetMuscle: 'Peitoral Superior', equipment: 'Halteres', warmupSets: 1, workingSets: 3, repsTarget: '8-10', targetRir: 1, restSeconds: 120, notes: 'Inclinação de 30°.' },
          { id: 'p3', name: 'Desenvolvimento com Halteres', targetMuscle: 'Deltoide Anterior', equipment: 'Halteres', warmupSets: 0, workingSets: 3, repsTarget: '8-10', targetRir: 1, restSeconds: 90, notes: 'Evitar hiperextensão lombar.' },
          { id: 'p4', name: 'Elevação Lateral na Polia', targetMuscle: 'Deltoide Lateral', equipment: 'Polia', warmupSets: 0, workingSets: 4, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Isolamento estrito.' },
          { id: 'p5', name: 'Tríceps na Polia Barra V', targetMuscle: 'Tríceps', equipment: 'Polia', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 0, restSeconds: 60, notes: 'Cotovelos imóveis.' }
        ]
      },
      {
        id: 'ppl_pull',
        name: 'Pull (Costas, Deltoide Posterior e Bíceps)',
        dayOfWeek: 'Terça-feira',
        focus: 'Puxada vertical e remada horizontal',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'pl1', name: 'Puxada Alta Pronada', targetMuscle: 'Latíssimo do Dorso', equipment: 'Polia Alta', warmupSets: 2, workingSets: 3, repsTarget: '8-10', targetRir: 1, restSeconds: 120, notes: 'Peito estufado em direção à barra.' },
          { id: 'pl2', name: 'Remada Curvada com Barra', targetMuscle: 'Dorsais e Trapézio', equipment: 'Barra', warmupSets: 1, workingSets: 3, repsTarget: '8-10', targetRir: 2, restSeconds: 120, notes: 'Tronco a 45°.' },
          { id: 'pl3', name: 'Face Pull na Polia com Corda', targetMuscle: 'Deltoide Posterior e Manguito', equipment: 'Polia', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 1, restSeconds: 60, notes: 'Puxar em direção à testa girando os punhos.' },
          { id: 'pl4', name: 'Rosca Biceps Inclinada com Halteres', targetMuscle: 'Bíceps (Cabeça Longa)', equipment: 'Banco 45°', warmupSets: 0, workingSets: 3, repsTarget: '10-12', targetRir: 0, restSeconds: 60, notes: 'Alongamento acentuado no fundo.' },
          { id: 'pl5', name: 'Rosca Martelo na Polia com Corda', targetMuscle: 'Braquial e Braquiorradial', equipment: 'Polia', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Pegada neutra.' }
        ]
      },
      {
        id: 'ppl_legs',
        name: 'Legs (Quadríceps, Isquiotibiais e Panturrilhas)',
        dayOfWeek: 'Quarta-feira',
        focus: 'Membros inferiores completo',
        estimatedDurationMin: profile.sessionDurationMin || 60,
        exercises: [
          { id: 'lg1', name: 'Agachamento Livre', targetMuscle: 'Quadríceps e Glúteos', equipment: 'Barra e Gaiola', warmupSets: 2, workingSets: 3, repsTarget: '6-8', targetRir: 2, restSeconds: 180, notes: 'Quebrar a paralela mantendo estabilidade.' },
          { id: 'lg2', name: 'Leg Press 45°', targetMuscle: 'Quadríceps', equipment: 'Leg Press', warmupSets: 1, workingSets: 3, repsTarget: '10-12', targetRir: 1, restSeconds: 120, notes: 'Pés médios.' },
          { id: 'lg3', name: 'Mesa Flexora', targetMuscle: 'Posterior de Coxa', equipment: 'Mesa Flexora', warmupSets: 0, workingSets: 4, repsTarget: '10-12', targetRir: 0, restSeconds: 75, notes: 'Controle excêntrico.' },
          { id: 'lg4', name: 'Cadeira Extensora', targetMuscle: 'Reto Femoral', equipment: 'Cadeira Extensora', warmupSets: 0, workingSets: 3, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Pico de contração de 1s.' },
          { id: 'lg5', name: 'Panturrilha em Pé', targetMuscle: 'Panturrilha', equipment: 'Máquina', warmupSets: 1, workingSets: 4, repsTarget: '12-15', targetRir: 0, restSeconds: 60, notes: 'Eliminar o salto/impulso.' }
        ]
      }
    ];
  }

  return {
    id: `prog_${Date.now()}`,
    name: `Periodização Hipertrofia Adaptativa - ${profile.goal.toUpperCase()}`,
    splitType,
    weeklyFrequency: frequencyDays,
    currentWeek: 3,
    totalWeeks: 8,
    isDeloadWeek: false,
    routines,
    scienceNotes: 'Baseado na literatura contemporânea (Schoenfeld, 2021; Helms, 2019): volume entre 12 e 18 séries efetivas semanais por grupo com RIR médio de 1-2.'
  };
}

/**
 * Adaptive Diagnostic Engine:
 * Analyzes the user's recent response (weight slope, strength, RIR, soreness, adherence)
 * and generates scientific adjustment prescriptions with full explanation:
 * - O que mudou?
 * - Por que mudou?
 * - Quais dados levaram à mudança?
 * - O que será observado para avaliar a resposta?
 */
export function runAdaptiveAudit(
  profile: UserProfile,
  recentAnthropometry: Anthropometry[],
  recentLogs: WorkoutSessionLog[],
  nutritionPlan: NutritionPlan,
  averageAdherence: number // e.g. 0.85 (85%)
): AdaptiveAdjustment {
  const currentWeight = recentAnthropometry[0]?.weightKg || profile.weightKg;
  const previousWeight = recentAnthropometry[recentAnthropometry.length - 1]?.weightKg || currentWeight;
  const weightDelta = currentWeight - previousWeight; // negative if losing weight
  
  const currentWaist = recentAnthropometry[0]?.waistCm || 82;
  const previousWaist = recentAnthropometry[recentAnthropometry.length - 1]?.waistCm || currentWaist;
  const waistDelta = currentWaist - previousWaist;

  // Average RIR from recent sessions
  let totalRir = 0;
  let rirCount = 0;
  let painReportedCount = 0;
  for (const session of recentLogs) {
    if (session.jointPainReported) painReportedCount++;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (set.completed && !set.isWarmup) {
          totalRir += set.rirAchieved;
          rirCount++;
        }
      }
    }
  }
  const avgRir = rirCount > 0 ? Math.round((totalRir / rirCount) * 10) / 10 : 1.5;

  // Case 1: High Fatigue or Pain -> Deload Week Recommended
  if (painReportedCount >= 2 || avgRir < 0.8) {
    return {
      id: `adj_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'deload_recommended',
      title: 'Semana de Deload Ativo Sugerida (Redução de Fadiga Sistêmica)',
      whatChanged: 'Redução temporária de 40% no volume de séries (de 3-4 séries para 2 séries por exercício) mantendo a carga e a intensidade mecânica.',
      whyChanged: 'Detectamos acúmulo de estresse articular e RIR próximo de zero em várias sessões consecutivas. O deload ativo dissipa a fadiga neural e preserva a hipertrofia sem causar descondicionamento.',
      dataTrigger: `Foram registradas ${painReportedCount} sessões com desconforto articular e RIR médio muito baixo (${avgRir}).`,
      evaluationMetrics: 'Remissão do desconforto nas articulações, queda do cansaço matinal e restauração da velocidade de barra no próximo microciclo.',
      applied: false,
    };
  }

  // Case 2: In Fat Loss / Deficit, but stagnant for weeks with high adherence
  if (nutritionPlan.dietStrategy === 'deficit' && weightDelta >= -0.1 && waistDelta >= 0 && averageAdherence >= 0.85) {
    return {
      id: `adj_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'adjustment_needed',
      title: 'Ajuste Metabólico: Redução de 150 kcal ou Aumento do NEAT',
      whatChanged: `Redução da meta calórica em 150 kcal (ajuste fino em carboidratos/gorduras) ou acréscimo de 2.000 passos diários (NEAT).`,
      whyChanged: 'O peso e a circunferência abdominal estabilizaram por mais de 14 dias mesmo com alta adesão alimentar (>85%). A taxa metabólica sofreu termogênese adaptativa natural.',
      dataTrigger: `Variação de peso nula (${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)}kg) e cintura inalterada nas últimas medições com adesão de ${Math.round(averageAdherence * 100)}%.`,
      evaluationMetrics: 'Acompanhar a média móvel do peso nos próximos 10 dias. Espera-se uma retomada de perda entre 0.3kg e 0.5kg/semana com preservação de força nos exercícios compostos.',
      applied: false,
    };
  }

  // Case 3: Losing weight too fast (> 1% body weight per week)
  if (nutritionPlan.dietStrategy === 'deficit' && weightDelta < -1.5) {
    return {
      id: `adj_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'adjustment_needed',
      title: 'Atenuação de Déficit: Aumento de 200 kcal para Preservar Massa Magra',
      whatChanged: 'Aumento de 200 kcal na meta diária (adicionando ~50g de carboidratos complexos no pré/pós treino).',
      whyChanged: 'A taxa de perda ponderal está excessivamente rápida (>1.2% do peso corporal em curto período), elevando o risco de catabolismo de tecido muscular e queda de rendimento.',
      dataTrigger: `Queda brusca de ${Math.abs(weightDelta).toFixed(1)} kg no período recente.`,
      evaluationMetrics: 'Moderação da perda para a faixa ideal e segura de 0.5% a 0.8% do peso por semana, com estabilidade nas cargas de treino.',
      applied: false,
    };
  }

  // Case 4: Low adherence
  if (averageAdherence < 0.65) {
    return {
      id: `adj_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'adherence_issue',
      title: 'Manutenção da Estratégia & Foco em Consistência',
      whatChanged: 'Nenhuma alteração de treino ou calorias foi aplicada.',
      whyChanged: 'Alterar variáveis como calorias ou fichas quando a adesão está abaixo de 70% geraria ruído nos dados. O sistema aguardará 7 a 10 dias de execução consistente antes de recalibrar.',
      dataTrigger: `Adesão alimentar registrada de apenas ${Math.round(averageAdherence * 100)}% nas últimas refeições.`,
      evaluationMetrics: 'Elevação da adesão para pelo menos 80% antes de propor novos cortes calóricos ou aumentos de volume.',
      applied: false,
    };
  }

  // Case 5: Optimal progression!
  return {
    id: `adj_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    status: 'optimal',
    title: 'Progressão Ótima Confirmada: Manter Estratégia Atual',
    whatChanged: 'Manutenção rigorosa das metas nutricionais e da estrutura de microciclos de treino.',
    whyChanged: 'Seus dados demonstram a resposta ideal: progressão contínua de sobrecarga nos exercícios chave, RIR controlado (1 a 2), boa recuperação e medidas corporais evoluindo na direção do seu objetivo.',
    dataTrigger: `Progressão de cargas sustentada, peso oscilando dentro da faixa prevista e ausência de dor articular crônica.`,
    evaluationMetrics: 'Atingir o topo das repetições na primeira série dos exercícios principais para justificar adição de carga na próxima semana.',
    applied: true,
  };
}

/**
 * FASE: "Manter minha dieta atual" (§7 — usuário no comando).
 * Mantém a dieta que o usuário JÁ faz: as calorias são DERIVADAS dos macros
 * informados por Atwater (nunca digitadas) e os extremos são rejeitados pelo
 * motor (validateUserTargets). O TEE do motor continua gravado como referência
 * de estimativa para o check-in semanal comparar resposta.
 */
export function applyUserDietTargets(
  profile: UserProfile,
  userMacros: { proteinGrams: number; carbsGrams: number; fatGrams: number },
): NutritionPlan {
  const result = computeNutritionTargets({
    goal: profile.goal,
    sex: profile.gender,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.age,
    activityLevel: profile.activityLevel,
    frequencyDaysPerWeek: profile.frequencyDays,
  });

  const validated = validateUserTargets(profile.weightKg, profile.gender, userMacros);

  // Esqueleto de 4 refeições com metas proporcionais e SEM itens inventados:
  // o usuário registra o que realmente comeu (itens livres + avulsas).
  const mealShares = [0.25, 0.35, 0.2, 0.2];
  const mealTargets = distributeMeals(
    {
      caloriesKcalPerDay: validated.caloriesKcal,
      proteinGramsPerDay: validated.proteinGrams,
      carbsGramsPerDay: validated.carbsGrams,
      fatGramsPerDay: validated.fatGrams,
    },
    mealShares,
  );

  const mealNames = ['Café da manhã', 'Almoço', 'Lanche / pré-pós-treino', 'Jantar'];
  const mealTimes = ['07:30', '12:30', '16:30', '20:30'];
  const meals = mealTargets.map((t, i) => ({
    id: `meal_user_${i + 1}`,
    name: mealNames[i],
    time: mealTimes[i],
    targetCalories: t.caloriesKcal,
    items: [],
    completed: false,
  }));

  const delta = validated.caloriesKcal - result.teeKcalPerDay;
  const dietStrategy = delta > 100 ? 'superavit' : delta < -100 ? 'deficit' : 'manutencao';

  const targetMacros: MacroTarget = {
    calories: validated.caloriesKcal,
    proteinGrams: validated.proteinGrams,
    carbsGrams: validated.carbsGrams,
    fatGrams: validated.fatGrams,
    fiberGrams: result.targets.fiberGramsPerDay,
    waterMl: result.targets.waterMillilitersPerDay,
  };

  const bmrResult = estimateBmr({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.age,
    sex: profile.gender,
  });
  const exactAtwaterKcal =
    userMacros.proteinGrams * 4 + userMacros.carbsGrams * 4 + userMacros.fatGrams * 9;

  return {
    bmr: Math.round(bmrResult.bmrKcalPerDay),
    tdee: result.teeKcalPerDay,
    targetMacros,
    dietStrategy,
    calorieDelta: delta,
    meals,
    hydrationTargetMl: targetMacros.waterMl,
    audit: {
      ...result.audit,
      strategy: dietStrategy,
      calorieDeltaKcalPerDay: delta,
      proteinGramsPerKg: Math.round((validated.proteinGrams / profile.weightKg) * 100) / 100,
      fatGramsPerKg: Math.round((validated.fatGrams / profile.weightKg) * 100) / 100,
      roundingSlackKcal: Math.round(exactAtwaterKcal - validated.caloriesKcal),
      warnings: ['Metas definidas pelo USUÁRIO (dieta atual mantida). O motor audita limites de segurança — não prescreve por cima.'],
      energyMethod: 'definido_pelo_usuario',
      formula: 'Atwater 4/4/9 sobre os macros informados pelo usuário',
      limitations: `Calorias derivadas dos macros; energia estimada (TEE ${result.teeKcalPerDay} kcal) serve de referência para o check-in calibrar.`,
    },
  };
}
