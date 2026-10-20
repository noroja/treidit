export interface KnowledgeItem {
  id: string;
  pillarId: '01_TREINAMENTO' | '02_NUTRICAO' | '03_PREPARACAO' | '04_HORMONIOS' | '05_DIRETRIZES';
  category: string;
  title: string;
  authorReference?: string;
  summary: string;
  coreConcepts: string[];
  practicalApplication: string;
  scientificSupport: string;
  tags: string[];
}

export interface KnowledgePillar {
  id: '01_TREINAMENTO' | '02_NUTRICAO' | '03_PREPARACAO' | '04_HORMONIOS' | '05_DIRETRIZES';
  number: string;
  name: string;
  description: string;
  subcategories: string[];
}

export const KNOWLEDGE_PILLARS: KnowledgePillar[] = [
  {
    id: '01_TREINAMENTO',
    number: '01',
    name: 'Treinamento & Biomecânica',
    description: 'Ciência da hipertrofia muscular, manipulação de variáveis e métodos de força.',
    subcategories: ['Belmiro', 'Hipertrofia', 'Força', 'Periodização', 'Volume_Intensidade_Frequencia', 'Evidencia_Cientifica']
  },
  {
    id: '02_NUTRICAO',
    number: '02',
    name: 'Nutrição & Metabolismo',
    description: 'Balanço energético, macronutrientes, fases de cutting/bulking e titulação progressiva.',
    subcategories: ['Dudu_Haluch', 'Balanco_Energetico', 'Cutting', 'Bulking', 'Macros', 'Evidencia_Cientifica']
  },
  {
    id: '03_PREPARACAO',
    number: '03',
    name: 'Preparação & Análise Visual',
    description: 'Estratégias de palco, manipulação de carboidratos, densidade e composição corporal.',
    subcategories: ['Chris_Aceto', 'Composicao_Corporal', 'Analise_Visual', 'Preparacao']
  },
  {
    id: '04_HORMONIOS',
    number: '04',
    name: 'Hormônios & Redução de Danos',
    description: 'Fisiologia endócrina, farmacologia, riscos à saúde, exames e ética médica.',
    subcategories: ['Fisiologia', 'Farmacologia', 'Efeitos_Adversos', 'Exames', 'Reducao_de_Danos']
  },
  {
    id: '05_DIRETRIZES',
    number: '05',
    name: 'Diretrizes & Consensos',
    description: 'Diretrizes oficiais ACSM, ISSN, Sociedades Médicas e Revisões Sistemáticas.',
    subcategories: ['ACSM', 'ISSN', 'Diretrizes_Medicas', 'Revisoes_Sistematicas']
  }
];

export const AI_FITNESS_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // 01_TREINAMENTO
  {
    id: 'kb_belmiro_triade',
    pillarId: '01_TREINAMENTO',
    category: 'Belmiro',
    title: 'A Tríade de Decisão: Para Quem? Para Quê? Em Qual Momento?',
    authorReference: 'Belmiro de Salles',
    summary: 'A base filosófica de prescrição que impede a adoção arbitrária de exercícios ou métodos avançados sem justificativa funcional clara.',
    coreConcepts: [
      '«Para quem?»: Analisa o nível de treinamento, histórico motor, integridade articular e capacidade de recuperação.',
      '«Para quê?»: Define o objetivo fisiológico específico daquele estímulo (tensão mecânica, estresse metabólico, restauração).',
      '«Em qual momento?»: Avalia a posição da sessão dentro do microciclo e do mesociclo (acumulação, choque ou deload).'
    ],
    practicalApplication: 'Antes de adicionar qualquer método (drop-set, rest-pause, bi-set), o algoritmo verifica se a tríade é atendida, eliminando volume desnecessário.',
    scientificSupport: 'Salles et al. (2016; 2021) - Rest Interval between Sets in Strength Training; Métodos de Treinamento de Força.',
    tags: ['Belmiro', 'Decisão', 'Métodos', 'Individualização']
  },
  {
    id: 'kb_belmiro_descanso',
    pillarId: '01_TREINAMENTO',
    category: 'Belmiro',
    title: 'Manipulação dos Intervalos de Recuperação entre Séries',
    authorReference: 'Belmiro de Salles',
    summary: 'Demonstração de que descansos curtos (<1 min) em exercícios compostos pesados reduzem o volume de carga sustentado e prejudicam a hipertrofia.',
    coreConcepts: [
      'Descanso de 2 a 3 minutos para exercícios multiarticulares pesados (Agachamento, Supino, Remada, Leg Press).',
      'Descanso de 60 a 90 segundos para exercícios isoladores e monoarticulares com menor estresse sistêmico.',
      'A sustentação da carga nas séries subsequentes é o determinante primário da tensão mecânica total acumulada.'
    ],
    practicalApplication: 'O timer integrado de descanso do KINETIC programa 120-180s para compostos e 60-90s para isoladores.',
    scientificSupport: 'Schoenfeld, Pope, Benik, Hester et al. (2016) / De Salles et al. (2009; 2016) Sports Medicine.',
    tags: ['Descanso', 'Intervalo', 'Tensão Mecânica', 'Belmiro']
  },
  {
    id: 'kb_hipertrofia_tensao',
    pillarId: '01_TREINAMENTO',
    category: 'Hipertrofia',
    title: 'Mecanismos Primários da Hipertrofia: Tensão Mecânica e Proximidade da Falha',
    authorReference: 'Consenso Brad Schoenfeld / Helms / Belmiro',
    summary: 'A mecanotransdução (conversão de estresse mecânico em sinalização celular mTORC1) é o estímulo hegemônico para síntese proteica miofibrilar.',
    coreConcepts: [
      'Tensão mecânica sob amplitude completa de movimento e alongamento sob carga.',
      'Proximidade da falha (RIR 1-2): recruta as unidades motoras de mais alto limiar sem fadiga central exorbitante.',
      'Séries levadas à falha absoluta (RIR 0) geram hipertrofia idêntica ao RIR 1-2, porém com o dobro de dano e estresse articular.'
    ],
    practicalApplication: 'Prescrição baseada em RIR 1-2 como zona de trabalho ótima e segura para longevidade articular.',
    scientificSupport: 'Schoenfeld BJ. (2020) Science and Development of Muscle Hypertrophy; Refalo et al. (2023) Sports Med.',
    tags: ['Hipertrofia', 'RIR', 'mTOR', 'Tensão Mecânica']
  },
  {
    id: 'kb_periodizacao_dup',
    pillarId: '01_TREINAMENTO',
    category: 'Periodização',
    title: 'Periodização Ondulatória Diária (DUP) e Deload Estruturado',
    authorReference: 'Belmiro de Salles / Zourdos',
    summary: 'Alternância de faixas de repetições e intensidades na mesma semana para otimizar força e volume sem saturação neural.',
    coreConcepts: [
      'Dias focados em maior intensidade de carga (6-8 reps, descanso longo) combinados a dias de hipertrofia moderada (10-12 reps).',
      'Deload programado: redução de 40-50% no volume de séries mantendo intensidade de carga a cada 4 a 8 semanas.',
      'O deload não é perda de tempo, mas o período onde ocorrem supercompensação e regeneração dos tendões.'
    ],
    practicalApplication: 'O motor adaptativo monitora dor e fadiga para propor semanas de deload automático.',
    scientificSupport: 'Zourdos et al. (2016); De Salles et al. (2018).',
    tags: ['Periodização', 'Deload', 'DUP', 'Recuperação']
  },
  {
    id: 'kb_volume_efetivo',
    pillarId: '01_TREINAMENTO',
    category: 'Volume_Intensidade_Frequencia',
    title: 'Marco de Séries Semanais: Faixa Efetiva de Volume por Grupamento',
    authorReference: 'Schoenfeld / Israetel / Belmiro',
    summary: 'Faixas ótimas de volume semanal (10 a 20 séries efetivas por músculo) e eliminação do "junk volume" (volume lixo).',
    coreConcepts: [
      'Volume Mínimo Efetivo (MEV): ~8-10 séries semanais por grupo.',
      'Volume de Máxima Adaptação (MAV): ~12-18 séries semanais por grupo.',
      'Mais de 8-10 séries para o mesmo músculo em uma única sessão geram rendimento decrescente (junk volume).'
    ],
    practicalApplication: 'Fracionamento do volume em 2 sessões semanais para grupos prioritários.',
    scientificSupport: 'Baz-Valle et al. (2022); Schoenfeld et al. (2019) J Sports Sci.',
    tags: ['Volume', 'Séries', 'Junk Volume', 'Frequência']
  },

  // 02_NUTRICAO
  {
    id: 'kb_dudu_haluch_titulacao',
    pillarId: '02_NUTRICAO',
    category: 'Dudu_Haluch',
    title: 'Ajustes Progressivos de Calorias e Termogênese Adaptativa',
    authorReference: 'Dudu Haluch',
    summary: 'A nutrição de fisiculturismo deve evitar cortes calóricos agressivos que desaceleram o metabolismo e promovem perda muscular.',
    coreConcepts: [
      'Adesão como pré-requisito: nenhuma caloria deve ser alterada se o atleta não cumpriu o plano anterior.',
      'Titulação gradual: reduções de 100 a 200 kcal por ajuste, preservando a taxa metabólica e o NEAT.',
      'Monitoramento longitudinal da resposta individual: cada organismo tem sensibilidade distinta à leptina e grelina.'
    ],
    practicalApplication: 'O motor adaptativo do KINETIC só sugere cortes calóricos após 14 dias de adesão > 85% e estagnação real.',
    scientificSupport: 'Haluch D. (2021) Nutrição Aplicada ao Fisiculturismo; Trexler et al. (2014) JISSN.',
    tags: ['Dudu Haluch', 'Titulação', 'Adesão', 'Déficit']
  },
  {
    id: 'kb_balanco_energetico',
    pillarId: '02_NUTRICAO',
    category: 'Balanco_Energetico',
    title: 'Componentes do Gasto Energético Total: TMB, NEAT, TEF e EAT',
    authorReference: 'Metabolismo & Termodinâmica',
    summary: 'A dinâmica termodinâmica do corpo humano e como o NEAT é o componente mais maleável e que mais declina em dietas restritivas.',
    coreConcepts: [
      'TMB (Taxa Metabólica Basal): 60-70% do gasto, mantida pela massa livre de gordura.',
      'NEAT (Atividade Espontânea Não Exercício): pode variar até 800 kcal entre indivíduos ativos e sedentários.',
      'TEF (Efeito Térmico dos Alimentos): a proteína tem o maior TEF (20-30% de suas calorias são gastas na digestão).'
    ],
    practicalApplication: 'Cálculo de TMB com Mifflin-St Jeor calibrado com o nível de passos e atividade diária.',
    scientificSupport: 'Hall et al. (2012) Lancet; Levine JA. (2002) Non-exercise activity thermogenesis.',
    tags: ['TMB', 'NEAT', 'TEF', 'Metabolismo']
  },
  {
    id: 'kb_macros_proteina',
    pillarId: '02_NUTRICAO',
    category: 'Macros',
    title: 'Distribuição Ótima de Proteínas, Gorduras e Carboidratos',
    authorReference: 'Dudu Haluch / Morton / ISSN',
    summary: 'Alocação científica de macronutrientes para maximizar síntese proteica fracionada (MPS) e suporte hormonal.',
    coreConcepts: [
      'Proteína: 2.0 a 2.4 g/kg em déficit (poupa massa magra); 1.8 a 2.2 g/kg em superávit.',
      'Gorduras: 0.7 a 1.0 g/kg (essencial para síntese de esteroides endógenos e absorção de vitaminas lipossolúveis).',
      'Carboidratos: preenchem o saldo energético restante, mantendo estoques de glicogênio para contração anaeróbia.'
    ],
    practicalApplication: 'Prescrição de refeições com 25 a 45g de proteína fracionadas a cada 3 a 5 horas.',
    scientificSupport: 'Morton RW et al. (2018) Br J Sports Med; Jäger et al. (2017) ISSN Position Stand on Protein.',
    tags: ['Proteína', 'Macronutrientes', 'MPS', 'Gorduras']
  },
  {
    id: 'kb_cutting_preservacao',
    pillarId: '02_NUTRICAO',
    category: 'Cutting',
    title: 'Estratégia de Cutting com Preservação de Massa Magra',
    authorReference: 'Helms / Dudu Haluch',
    summary: 'Diretrizes para queima sustentada de gordura sem canibalizar tecido muscular contrátil.',
    coreConcepts: [
      'Ritmo de perda ideal: 0.5% a 1.0% do peso corporal por semana.',
      'Perdas superiores a 1.2% por semana aceleram degradação proteica muscular e queda drástica de testosterona.',
      'Manutenção da sobrecarga e intensidade de peso na academia durante toda a fase de cutting.'
    ],
    practicalApplication: 'Alertas adaptativos caso a perda de peso semanal ultrapasse o limiar seguro.',
    scientificSupport: 'Helms ER et al. (2014) J Int Soc Sports Nutr; Garthe et al. (2011).',
    tags: ['Cutting', 'Preservação Muscular', 'Déficit', 'Taxa de Perda']
  },

  // 03_PREPARACAO
  {
    id: 'kb_chris_aceto_carbo',
    pillarId: '03_PREPARACAO',
    category: 'Chris_Aceto',
    title: 'Manipulação Dinâmica de Carboidratos e Densidade Muscular',
    authorReference: 'Chris Aceto',
    summary: 'Como modular carboidratos com base na aparência visual no espelho, retenção de água e velocidade do movimento no treino.',
    coreConcepts: [
      'A estratégia muda conforme: objetivo + estágio do processo + resposta do indivíduo + adesão + performance.',
      'Físico "plano" e sem pump indica depleção excessiva de glicogênio e exige recarga estratégica.',
      'Físico "embaçado" e mole aponta excesso calórico ou acúmulo de água extracelular decorrente de estresse/cortisol.'
    ],
    practicalApplication: 'Ajustes finos nos carboidratos peri-treino baseados na nota de densidade do check-in semanal.',
    scientificSupport: 'Aceto C. (1997) Championship Bodybuilding; Understanding Bodybuilding Nutrition.',
    tags: ['Chris Aceto', 'Carboidratos', 'Pump', 'Densidade']
  },
  {
    id: 'kb_analise_visual',
    pillarId: '03_PREPARACAO',
    category: 'Analise_Visual',
    title: 'Interpretação Visual Cruzada: Balança vs. Espelho',
    authorReference: 'Chris Aceto / Preparação',
    summary: 'A balança é uma métrica unidimensional que não diferencia água, glicogênio, bolo fecal e massa gorda.',
    coreConcepts: [
      'Avaliação padronizada em jejum pela manhã, após esvaziamento vesical e sob a mesma iluminação.',
      'Identificação de cortes em deltoides, cintura escapular e quadrado lombar como indicadores de evolução real.',
      'Quando o peso sobe mas a cintura reduz, ocorreu recomposição corporal efetiva com retenção hídrica intracelular.'
    ],
    practicalApplication: 'Módulo de check-in integrando fotos comparativas e registro de cintura.',
    scientificSupport: 'Trexler ET, Smith-Ryan AE. (2015) Metabolic adaptation to weight loss.',
    tags: ['Espelho', 'Visual', 'Composição', 'Balança']
  },

  // 04_HORMONIOS
  {
    id: 'kb_hormonios_fisiologia_eixo',
    pillarId: '04_HORMONIOS',
    category: 'Fisiologia',
    title: 'O Eixo Hipotálamo-Hipófise-Gonadal (HPT) e o Feedback Negativo',
    authorReference: 'Fisiologia Endócrina & Redução de Danos',
    summary: 'Mecanismo homeostático de controle de gonadotrofinas (GnRH, LH, FSH) e a supressão causada por androgênios exógenos.',
    coreConcepts: [
      'Administração exógena de androgênios induz feedback negativo imediato no hipotálamo e hipófise.',
      'Inibição de LH e FSH a níveis próximos de zero cessa a espermatogênese e a síntese intratesticular de testosterona.',
      'A recuperação do eixo pós-interrupção pode demorar meses ou ser incompleta (hipogonadismo secundário persistente).'
    ],
    practicalApplication: 'Seção educacional com explicação detalhada da biologia reprodutiva e riscos de fertilidade.',
    scientificSupport: 'Guyton & Hall (2020) Medical Physiology; Rahnema et al. (2014) Fertility and Sterility.',
    tags: ['Eixo HPT', 'LH', 'FSH', 'Endócrino', 'Fertilidade']
  },
  {
    id: 'kb_hormonios_risco_cardiovascular',
    pillarId: '04_HORMONIOS',
    category: 'Efeitos_Adversos',
    title: 'Impacto Cardiovascular de Esteroides: Lípides, Remodelamento e Trombose',
    authorReference: 'Cardiologia Esportiva / Redução de Danos',
    summary: 'Fisiopatologia do dano vascular induzido por androgênios: dislipidemia aterogênica severa e hipertrofia de ventrículo esquerdo.',
    coreConcepts: [
      'Queda profunda de HDL-c (geralmente < 20 mg/dL) e elevação de LDL-c via indução da lipase hepática.',
      'Hipertrofia concêntrica do ventrículo esquerdo com rigidez miocárdica e disfunção diastólica precoce.',
      'Policitemia (hematócrito > 52-54%) elevando viscosidade sanguínea e risco de eventos tromboembólicos e AVE.'
    ],
    practicalApplication: 'Alertas expressos sobre monitoramento obrigatório de hemograma e lipidograma com médico.',
    scientificSupport: 'Baggish AL et al. (2017) Cardiovascular Toxicity of Anabolic Steroids - Circulation; AHA Guidelines.',
    tags: ['Cardiovascular', 'HDL', 'Hematócrito', 'Trombose']
  },
  {
    id: 'kb_hormonios_exames_monitoramento',
    pillarId: '04_HORMONIOS',
    category: 'Exames',
    title: 'Protocolo de Monitorização Laboratorial e Marcadores de Vigilância',
    authorReference: 'Redução de Danos & Medicina do Esporte',
    summary: 'Bateria de exames preventivos essenciais para praticantes de força e atletas de alto rendimento.',
    coreConcepts: [
      'Painel Básico: Hemograma completo com plaquetas, Glicemia em jejum, HbA1c, Lipidograma fracionado.',
      'Função Hepática e Renal: AST/TGO, ALT/TGP, GGT, Bilirrubinas, Creatinina sérica e Ureia.',
      'Painel Hormonal: Testosterona Total/Livre, Estradiol sensível, Prolactina, SHBG, TSH, T4 Livre.',
      'Vigilância Hemodinâmica: Aferição periódica de pressão arterial em repouso e ecocardiograma com Doppler.'
    ],
    practicalApplication: 'Guia de consulta com explicação dos valores de referência e potenciais alterações fisiológicas pós-treino.',
    scientificSupport: 'Endocrine Society Guidelines (2018); Sociedade Brasileira de Cardiologia (SBC).',
    tags: ['Exames', 'Monitoramento', 'Hemograma', 'Fígado']
  },

  // 05_DIRETRIZES
  {
    id: 'kb_diretrizes_issn_proteina',
    pillarId: '05_DIRETRIZES',
    category: 'ISSN',
    title: 'Posicionamento Oficial da ISSN: Proteína e Exercício',
    authorReference: 'International Society of Sports Nutrition (ISSN)',
    summary: 'O documento de consenso mais citado na nutrição esportiva sobre dosagem, fontes, distribuição e segurança proteica.',
    coreConcepts: [
      'Ingestão diária recomendada de 1.4 a 2.0 g/kg/dia para manter e construir massa muscular em indivíduos ativos.',
      'Doses de 2.3 a 3.1 g/kg/dia em períodos de déficit calórico para atletas de força e fisiculturismo.',
      'Consumo fracionado de 0.25 a 0.40 g/kg de proteína de alta qualidade a cada 3 a 4 horas maximiza a sinalização mTOR.',
      'Não há evidência de dano renal em indivíduos saudáveis com dietas hiperproteicas supervisionadas.'
    ],
    practicalApplication: 'O módulo nutricional utiliza exatamente as faixas recomendadas pelo ISSN conforme o objetivo.',
    scientificSupport: 'Jäger R, Kerksick CM, Campbell BI et al. (2017) JISSN 14:20.',
    tags: ['ISSN', 'Proteína', 'Consenso', 'Segurança']
  },
  {
    id: 'kb_diretrizes_acsm_forca',
    pillarId: '05_DIRETRIZES',
    category: 'ACSM',
    title: 'Diretrizes do ACSM para Progressão no Treinamento de Força',
    authorReference: 'American College of Sports Medicine (ACSM)',
    summary: 'Parâmetros oficiais para seleção de exercícios multiarticulares, ordem de execução e cadência de sobrecarga.',
    coreConcepts: [
      'Prioridade para exercícios multiarticulares (compostos) no início da sessão quando a fadiga central é menor.',
      'Sobrecarga progressiva como lei primária: aumento sistemático de carga, repetições ou densidade ao longo das semanas.',
      'Frequência mínima de 2 a 3 vezes por semana para grupos musculares em fase de ganho de força.'
    ],
    practicalApplication: 'A estrutura de treino do KINETIC posiciona os compostos prioritários no topo da sessão.',
    scientificSupport: 'American College of Sports Medicine (2009; 2018) Med Sci Sports Exerc.',
    tags: ['ACSM', 'Sobrecarga', 'Compostos', 'Diretrizes']
  },
  {
    id: 'kb_diretrizes_meta_analises',
    pillarId: '05_DIRETRIZES',
    category: 'Revisoes_Sistematicas',
    title: 'Síntese de Meta-Análises: Frequência, Volume e Faixas de Repetições',
    authorReference: 'Schoenfeld, Morton, Grgic (2016-2023)',
    summary: 'Consolidação das evidências de que hipertrofia substancial ocorre em ampla faixa de repetições (6 a 30) desde que próxima da falha.',
    coreConcepts: [
      'Cargas pesadas (6-8 reps) e cargas moderadas/leves (15-25 reps) produzem hipertrofia similar com esforço equiparado.',
      'Cargas mais pesadas conferem ganhos superiores de 1RM (força máxima específica).',
      'A equalização de volume semanal é o moderador primário do crescimento muscular entre diferentes divisões de treino.'
    ],
    practicalApplication: 'Prescrição diversificada mesclando séries de força pesada com séries de repetições moderadas.',
    scientificSupport: 'Schoenfeld et al. (2017) J Strength Cond Res; Grgic et al. (2018).',
    tags: ['Meta-análise', 'Evidência', 'Repetições', 'Schoenfeld']
  }
];
