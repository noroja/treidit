/**
 * MOTOR DE ENERGIA — gasto energético de repouso e total
 * -------------------------------------------------------
 * Equações e limitações documentadas (ver §14 do plano):
 *
 * - Mifflin-St Jeor (1990): padrão quando não há avaliação de composição
 *   corporal de qualidade. Erro típico ±10% em relação à calorimetria
 *   indireta; pior que calorimetria/dobras em população com obesidade.
 *
 * - Katch-McArdle (1996): 370 + 21.6 × LBM(kg). Somente quando a massa
 *   livre de gordura vem de avaliação EXTERNA com qualidade suficiente
 *   (DXA > dobras de um mesmo avaliador > bioimpedância). Nunca com LBM
 *   recalculado internamente de outra fórmula de %GC — isso amarraria o
 *   resultado ao erro do método preditivo sem ganho de precisão.
 *
 * O fator de atividade PAL segue Schofield/FAO range ampliado, com o treino
 * contado DIÁLIO porque a frequência semanal Spreads NEAT/EAT pela semana.
 * O TEE resultante é ESTIMADO, não medido — todo ajuste calórico parte do
 * acompanhamento real, não deste número.
 */

import {
  ActivityLevel,
  EnergyEstimate,
  PhysiologicalSex,
  TEEEstimate,
  optionalLeanMass,
  requireEnum,
  requireFiniteNumber,
} from './types';

const MIFFLIN = 'Mifflin-St Jeor: 10×peso(kg) + 6.25×altura(cm) − 5×idade(anos) + 5 (M) | −161 (F)';
const KATCH = 'Katch-McArdle: 370 + 21.6×LBM(kg)';

const MIFFLIN_LIMITS =
  'Erro típico ±10% vs. calorimetria indireta; superestima pouco o repouso em obesidade; semanas com retenção hídrica, ciclo menstrual e treinamento intervalado alto aumentam a variância do gasto real.';
const KATCH_LIMITS =
  'Melhor que equações antropométricas na faixa de 18-40% de gordura SE o LBM vier de DXA ou dobras do mesmo avaliador; bioimpedância casa mal hidratação/horário. Condições comparáveis: jejum coerente, horário fixo, mesma balança.';

export function estimateBmr(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: PhysiologicalSex;
  /** LBM de avaliador externo; presença ativa Katch-McArdle. */
  evaluatorLeanMassKg?: number;
}): EnergyEstimate {
  const weightKg = requireFiniteNumber(input.weightKg, 'weightKg', 35, 300);
  const heightCm = requireFiniteNumber(input.heightCm, 'heightCm', 120, 230);
  const ageYears = requireFiniteNumber(input.ageYears, 'ageYears', 14, 90);
  const sex = requireEnum(input.sex, 'sex', ['masculino', 'feminino'] as const);
  const leanMassKg = optionalLeanMass(input.evaluatorLeanMassKg, 'evaluatorLeanMassKg');

  if (leanMassKg !== undefined) {
    if (leanMassKg > weightKg) {
      // LBM não pode exceder o peso — seria avaliação inconsistente, não corrigimos silenciosamente.
      throw new Error('EvaluatorLeanMass é maior que o peso corporal — avaliação inconsistente');
    }
    const bmrKcalPerDay = Math.round(370 + 21.6 * leanMassKg);
    return {
      bmrKcalPerDay,
      method: 'katch_mcardle',
      uncertainty: 'estimado',
      formula: KATCH,
      leanMassKg,
      limitations: KATCH_LIMITS,
    };
  }

  const base =
    10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === 'masculino' ? 5 : -161);
  return {
    bmrKcalPerDay: Math.round(base),
    method: 'mifflin_st_jeor',
    uncertainty: 'estimado',
    formula: MIFFLIN,
    limitations: MIFFLIN_LIMITS,
  };
}

const FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.25,
  moderado: 1.375,
  ativo: 1.5,
  muito_ativo: 1.65,
};

/**
 * Fator de atividade. Mantém a mesma faixa do app (1.25–1.65) para não mexer
 * em números exibidos, porém agora a escalada por dias de treino é explícita:
 * semanal 1-2 dias redonda para baixo, 3+ usa o fator de vida + treino.
 */
export function activityFactor(
  activityLevel: ActivityLevel,
  frequencyDaysPerWeek: number,
): number {
  requireFiniteNumber(frequencyDaysPerWeek, 'frequencyDaysPerWeek', 0, 7);
  const life = requireEnum(activityLevel, 'activityLevel', Object.keys(FACTORS) as ActivityLevel[]);

  // Parcela do treino: mapeia a frequência semanal na faixa PAL usada pelo
  // app (compatível com getActivityMultiplier anterior — os números exibidos
  // não mudam). O estilo de vida e o treino competem; vale o maior.
  const byTraining =
    frequencyDaysPerWeek >= 5
      ? 1.65
      : frequencyDaysPerWeek >= 4
        ? 1.5
        : frequencyDaysPerWeek >= 3
          ? 1.375
          : 1.25;
  return Math.max(FACTORS[life], byTraining);
}

export function estimateTee(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: PhysiologicalSex;
  activityLevel: ActivityLevel;
  frequencyDaysPerWeek: number;
  evaluatorLeanMassKg?: number;
}): TEEEstimate {
  const factor = activityFactor(input.activityLevel, input.frequencyDaysPerWeek);
  const bmr = estimateBmr(input);
  return {
    bmrKcalPerDay: bmr.bmrKcalPerDay,
    teeKcalPerDay: Math.round(bmr.bmrKcalPerDay * factor),
    activityFactor: factor,
    uncertainty: 'estimado',
    limitations: `Fator de atividade ${factor} não é um número de precisão: o %E se aproxima de ±10–15% do gasto real. A calibração fina vem da média de peso dos check-ins, não desta fórmula. Limitação da equação de repouso: ${bmr.limitations}`,
  };
}
