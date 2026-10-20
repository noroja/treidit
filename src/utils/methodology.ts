import { EvidenceHierarchyLevel, MethodologicalAuthor, WeeklyCheckinData, WeeklyCheckinReport, UserProfile, WorkoutProgram, NutritionPlan } from '../types';

export const EVIDENCE_HIERARCHY: EvidenceHierarchyLevel[] = [
  {
    level: 1,
    name: 'Evidência Científica Atual',
    description: 'Bases de dados indexadas recentes (PubMed, Scopus) com rigor metodológico e controle de variáveis confundidoras.',
    example: 'Ensaios clínicos randomizados duplo-cegos com biópsia e ultrassom muscular.'
  },
  {
    level: 2,
    name: 'Diretrizes & Consensos Internacionais',
    description: 'Posicionamentos oficiais de entidades líderes (ISSN, ACSM, NSCA, ESPEN).',
    example: 'Posicionamento do ISSN sobre ingestão proteica de 1.6 a 2.2 g/kg/dia para atletas de força.'
  },
  {
    level: 3,
    name: 'Revisões Sistemáticas & Meta-análises',
    description: 'Compilação estatística de dezenas de estudos avaliando tamanho de efeito agregado.',
    example: 'Meta-análises de Brad Schoenfeld sobre volume semanal e proximidade da falha (RIR 1-3).'
  },
  {
    level: 4,
    name: 'Estudos Individuais Controlados',
    description: 'Investigações de intervenção direta com amostras específicas de atletas treinados.',
    example: 'Estudos comparando sobrecarga progressiva com carga constante em exercícios multiarticulares.'
  },
  {
    level: 5,
    name: 'Experiência Prática Consolidada (Haluch, Aceto, Belmiro)',
    description: 'Heurísticas empíricas testadas no mundo real do fisiculturismo e preparação atlética de elite.',
    example: 'Manipulação de carboidratos com base no aspecto visual do músculo (Chris Aceto) e titulação gradual de calorias (Dudu Haluch).'
  },
  {
    level: 6,
    name: 'Preferência & Resposta Individual do Usuário',
    description: 'Individualidade biológica, aderência psicológica, tolerância articular e rotina de vida.',
    example: 'Substituição de agachamento com barra por leg press em indivíduos com histórico de dor lombar.'
  }
];

export const METHODOLOGICAL_AUTHORS: MethodologicalAuthor[] = [
  {
    id: 'dudu_haluch',
    name: 'Dudu Haluch',
    specialty: 'Nutrição Aplicada ao Fisiculturismo & Metabolismo',
    keyContributions: [
      'Titulação progressiva e controlada de déficits e superávits calóricos.',
      'Prioridade absoluta da ingestão proteica individualizada (2.0 a 2.4 g/kg em déficit).',
      'Adesão dietética como filtro primordial: não alterar calorias antes de garantir consistência.',
      'Monitoramento longitudinal da resposta individual em vez de depender de fórmulas estáticas.'
    ],
    decisionHeuristics: [
      'Se o usuário estiver perdendo medidas com alta saciedade e boa energia, não aumentar o déficit.',
      'Em caso de estagnação, verificar adesão e NEAT antes de subtrair carboidratos ou calorias.',
      'Evitar quedas calóricas agressivas que induzam perda de massa livre de gordura.'
    ],
    quote: 'A melhor dieta não é a mais restritiva no papel, mas a que o indivíduo consegue sustentar com resposta metabólica e muscular positiva ao longo do tempo.'
  },
  {
    id: 'chris_aceto',
    name: 'Chris Aceto',
    specialty: 'Preparação Física, Nutrição & Composição Corporal no Bodybuilding',
    keyContributions: [
      'Manipulação dinâmica de carboidratos conforme a densidade muscular e o rendimento nos treinos.',
      'A estratégia deve mudar segundo: objetivo + estágio do processo + resposta do indivíduo + adesão + performance.',
      'Uso da resposta visual no espelho combinada à retenção de força como termômetro metabólico.',
      'Equilíbrio fino entre esvaziamento de glicogênio e plenitude muscular.'
    ],
    decisionHeuristics: [
      'Se os treinos perderem rendimento (pump deficiente e fraqueza), priorizar recarga de carboidratos peri-treino.',
      'Se o indivíduo estiver "embaçando" o físico sem ganho correspondente de força, atenuar o excedente calórico.',
      'A recuperação entre as sessões define a capacidade de assimilação de nutrientes.'
    ],
    quote: 'A balança mente com frequência, mas a combinação de espelho, plenitude muscular e cargas nos treinos revela exatamente onde o metabolismo está.'
  },
  {
    id: 'belmiro_de_salles',
    name: 'Belmiro de Salles',
    specialty: 'Fisiologia do Treinamento de Força, Métodos & Hipertrofia',
    keyContributions: [
      'A tríade fundamental de decisão: «Para quem?» «Para quê?» «Em qual momento?».',
      'Manipulação científica das variáveis: Volume (séries efetivas), Intensidade de esforço (RIR/RPE), Intervalo de recuperação e Frequência.',
      'Descanso adequado entre séries (2-3 minutos em multiarticulares) para sustentar volume de carga.',
      'Eliminação do "junk volume" (volume lixo) e foco em proximidade real da falha (RIR 1-2).'
    ],
    decisionHeuristics: [
      'Antes de prescrever qualquer método avançado (drop-set, rest-pause), perguntar se o praticante tem tolerância e necessidade real.',
      'Volumes semanais devem ser titulados de 10 a 20 séries por grupo muscular conforme o nível de treinamento.',
      'Se a recuperação neuromuscular for insuficiente, reduzir séries antes de sacrificar a sobrecarga de peso.'
    ],
    quote: 'Não existe método mágico. Qualquer manipulação de séries, repetições ou descanso precisa responder coerentemente: Para quem? Para quê? Em qual momento?'
  }
];

/**
 * Knowledge Base & Conflict Resolution Engine
 * Handles cases where empirical practice conflicts with scientific literature.
 */
export function resolveSciencePracticeConflict(topic: string): {
  conflict: string;
  evidenceAssessment: string;
  uncertaintyExplanation: string;
  kineticResolution: string;
} {
  const topics: Record<string, any> = {
    janela_anabolica: {
      conflict: 'Prática empírica prega consumo imediato de proteína nos primeiros 30 min pós-treino vs. literatura demonstrando janela estendida de 3-5h.',
      evidenceAssessment: 'Meta-análises (Aragon & Schoenfeld, 2013) apontam que a ingestão total diária de proteína e distribuição a cada 3-5h são determinantes superiores.',
      uncertaintyExplanation: 'Para atletas em jejum pré-treino, a refeição pós-treino imediata torna-se mais relevante do que para quem comeu 1-2h antes.',
      kineticResolution: 'Priorizar a meta total diária dividida em 3 a 5 refeições com 20-40g de proteína de alto valor biológico, sem paranoia temporal aguda.'
    },
    falha_concentrica: {
      conflict: 'Crença de que toda série deve ir até a falha absoluta vs. evidência de hipertrofia equivalente com RIR 1-2 e menor fadiga residual.',
      evidenceAssessment: 'Meta-análises recentes (Vieira et al., 2021; Refalo et al., 2023) mostram hipertrofia idêntica treinando a 1-2 repetições da falha com menor estresse articular.',
      uncertaintyExplanation: 'Em exercícios isoladores e máquinas o risco da falha é menor, enquanto em compostos pesados (Agachamento/Stiff) a falha induz alto risco e fadiga sistêmica excessiva.',
      kineticResolution: 'Adotar RIR 1-2 nos exercícios multiarticulares pesados e RIR 0-1 nas últimas séries dos exercícios isoladores, respeitando o princípio de Belmiro de Salles.'
    },
    frequencia_treino: {
      conflict: 'Treinar o músculo 1x na semana (rotina clássica ABCDE) vs. distribuir em 2x na semana com volume equalizado.',
      evidenceAssessment: 'Schoenfeld et al. (2016) demonstraram ligeira superioridade para frequência 2x/sem quando o volume semanal é alto (>12 séries/músculo).',
      uncertaintyExplanation: 'Se o volume total por sessão for tolerado sem queda vertiginosa de performance nas últimas séries, a divisão 1x/semana pode ser viável por preferência.',
      kineticResolution: 'Fracionar o volume em 2x semanais para grupos musculares prioritários para manter a qualidade mecânica das séries.'
    }
  };

  return topics[topic] || {
    conflict: 'Divergência entre costume empírico de academia e achados controlados.',
    evidenceAssessment: 'Avaliação da qualidade metodológica e risco de viés.',
    uncertaintyExplanation: 'A resposta individual pode modular a aplicabilidade da média populacional dos estudos.',
    kineticResolution: 'Adotar a conduta com maior suporte biológico e monitorar os dados do usuário longitudinalmente.'
  };
}

/**
 * Core Algorithm: Generates the Weekly Check-in Synthesis
 * Structure: RESPOSTA DO INDIVÍDUO -> INTERPRETAÇÃO FISIOLÓGICA -> DECISÃO & AJUSTE
 * Answers: «Para quem?» «Para quê?» «Em qual momento?»
 */
export function generateLocalWeeklyCheckin(
  checkinData: WeeklyCheckinData,
  profile: UserProfile,
  program: WorkoutProgram,
  nutrition: NutritionPlan
): WeeklyCheckinReport {
  const { weightKg, waistCm, avgRir, strengthProgression, adherenceScore, fatigueScore, jointDiscomfort } = checkinData;

  // Decision Heuristics
  let status: WeeklyCheckinReport['status'] = 'manter';
  let title = 'Check-in Semanal Validado: Estratégia Sustentada';
  let caloriasDelta = 0;
  let volumeDeltaSets = 0;
  let focoCarboidrato = 'Manter aporte energético estável peri-treino.';

  // High joint pain or extreme fatigue -> Deload (Belmiro de Salles)
  if (jointDiscomfort || fatigueScore >= 4.5 || avgRir < 0.5) {
    status = 'deload';
    title = 'Semana de Deload Ativo Sugerida (Gestão de Fadiga Neuromuscular)';
    volumeDeltaSets = -4; // reduce sets
    focoCarboidrato = 'Manter calorias de manutenção para acelerar a recuperação tecidual e síntese proteica.';
  } else if (adherenceScore < 3.5) {
    // Low adherence -> Do not change diet (Dudu Haluch)
    status = 'melhorar_adesao';
    title = 'Adesão Insuficiente: Manutenção Obrigatória de Variáveis';
    caloriasDelta = 0;
    focoCarboidrato = 'Focar em simplificar a rotina de refeições antes de considerar qualquer alteração calórica.';
  } else if (nutrition.dietStrategy === 'deficit' && strengthProgression === 'caiu' && fatigueScore >= 4) {
    // Excessive fatigue and dropping strength in deficit -> Refeed / calorie attenuation (Chris Aceto)
    status = 'ajustar_calorias';
    title = 'Atenuação de Déficit: Recarga de Carboidratos Recomendada';
    caloriasDelta = +150;
    focoCarboidrato = 'Aumentar 35-40g de carboidratos nas refeições pré e pós-treino para restaurar a pressão de glicogênio.';
  } else if (strengthProgression === 'aumentou' && avgRir >= 1.5 && fatigueScore <= 2.5) {
    // Great response, progressing smoothly
    status = 'manter';
    title = 'Sobrecarga Progressiva Efetiva: Manter Plano Atual';
    caloriasDelta = 0;
    focoCarboidrato = 'Manter distribuição atual.';
  }

  // Tri-part Framework: RESPOSTA -> INTERPRETAÇÃO -> DECISÃO
  const resposta = `Composição corporal: Peso registrado em ${weightKg}kg e circunferência abdominal em ${waistCm}cm. Performance: progressão de força classificada como '${strengthProgression}' com RIR médio de ${avgRir}. Recuperação: sono médio de ${checkinData.sleepAvgHours}h, escore de fadiga de ${fatigueScore}/5 e adesão alimentar avaliada em ${adherenceScore}/5.`;

  const interpretacao = status === 'deload'
    ? 'Identificamos acúmulo excessivo de estresse nas estruturas passivas e sistema nervoso central. Conforme Belmiro de Salles salienta, insistir em volume alto com fadiga residual elevada gera estagnação por incapacidade de recrutamento das unidades motoras de alto limiar.'
    : status === 'melhorar_adesao'
    ? 'Conforme preconizado por Dudu Haluch, alterar variáveis calóricas ou rotinas quando a adesão está instável adiciona ruído e mascara a real taxa metabólica. A conduta correta é estabilizar a execução.'
    : status === 'ajustar_calorias'
    ? 'A queda de rendimento mecânico combinada ao déficit prolongado indica depleção profunda de glicogênio intramuscular. Conforme Chris Aceto observa em atletas, um ajuste fino de carboidratos protege a densidade muscular sem comprometer a queima de gordura.'
    : 'A resposta biológica está no padrão-ouro: as adaptações morfológicas ocorrem no ritmo previsto, a fadiga central está controlada e as cargas estão progredindo.';

  const decisao = status === 'deload'
    ? 'Reduzir o volume de séries em 30-40% no próximo microciclo, mantendo a carga nos exercícios e afastando o esforço em 2-3 repetições da falha. Calorias mantidas em nível de suporte.'
    : status === 'melhorar_adesao'
    ? 'Manter rigorosamente a mesma meta calórica e divisão de treino pelos próximos 7 dias, buscando atingir pelo menos 85% de consistência alimentar.'
    : status === 'ajustar_calorias'
    ? `Ajustar a meta diária em ${caloriasDelta > 0 ? `+${caloriasDelta}` : caloriasDelta} kcal concentradas em fontes limpas de amido (arroz, batata, aveia) nos horários circundantes ao treino.`
    : 'Manter a prescrição vigente de treino e dieta. A continuidade do estímulo sem alterações precipitadas é o fator que consolida a hipertrofia.';

  // The 3 Fundamental Questions (Belmiro de Salles)
  const perguntasChave = {
    paraQuem: `Praticante nível ${profile.experience}, com objetivo de ${profile.goal.replace('_', ' ')} e frequência semanal de ${profile.frequencyDays} dias.`,
    paraQue: status === 'deload'
      ? 'Dissipar a fadiga neuromuscular acumulada e regenerar tecidos conjuntivos.'
      : 'Estimular tensão mecânica ótima e síntese proteica fracionada sem gerar sobrecarga articular.',
    emQualMomento: `Semana ${program.currentWeek} do mesociclo, após registro de ${program.weeklyFrequency} sessões no ciclo atual.`
  };

  const methodologicalInsights = {
    duduHaluch: 'Adesão como pré-requisito: nunca cortar calorias de forma reativa sem garantir que o plano foi de fato cumprido por tempo suficiente.',
    chrisAceto: 'O aspecto de plenitude muscular e a velocidade da barra nos treinos são os melhores indicadores para titular a cota de carboidratos.',
    belmiroDeSalles: 'Variáveis de treino não são números aleatórios: volume, descanso e proximidade da falha devem ser modulados para maximizar repetições de alta qualidade.'
  };

  return {
    id: `checkin_${Date.now()}`,
    date: checkinData.date,
    title,
    status,
    resposta,
    interpretacao,
    decisao,
    perguntasChave,
    methodologicalInsights,
    ajustesRecomendados: {
      caloriasDelta,
      volumeDeltaSets,
      focoCarboidrato
    },
    applied: false
  };
}
