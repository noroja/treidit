import { ErgogenicArticle } from '../types';

export const ERGOGENICS_DATABASE: ErgogenicArticle[] = [
  {
    id: 'supl_creatina',
    title: 'Creatina Monohidratada: O Ergogênico Padrão-Ouro',
    category: 'suplementos',
    summary: 'O suplemento com maior suporte empírico na história da fisiologia esportiva para ganho de força, potência e hipertrofia.',
    mechanism: 'Aumenta os estoques intramusculares de fosfocreatina (PCr), acelerando a ressíntese de trifosfato de adenosina (ATP) pela via anaeróbia alática durante contrações musculares intensas.',
    evidenceGrade: 'A (Robusta)',
    adverseEffects: [
      'Retenção hídrica intracelular (benéfica para sinalização anabólica e hidratação celular)',
      'Possível desconforto gastrointestinal leve se ingerida sem água suficiente ou em doses únicas excessivas (>10g)'
    ],
    risksCardiovascular: 'Nenhum risco detectado em dezenas de ensaios clínicos randomizados em indivíduos saudáveis.',
    risksHepatic: 'Ausência de toxicidade hepática. Não altera transaminases.',
    risksEndocrineFertility: 'Não suprime o eixo hipotálamo-hipófise-gonadal nem altera a produção endógena de testosterona.',
    monitoringProtocol: [
      'Exame de creatinina sérica: notar que pode haver elevação assintomática decorrente do aumento da massa/conversão de creatina, sem lesão renal. Se necessário, avaliar cistatina C.'
    ],
    harmReductionNotes: 'Dose contínua recomendada de 3 a 5g por dia (ou 0.07g/kg), todos os dias, independentemente de treinar ou não. Saturação (20g/dia por 5-7 dias) é opcional.'
  },
  {
    id: 'supl_cafeina',
    title: 'Cafeína Anidra: Potência Neuromuscular e Fadiga Central',
    category: 'suplementos',
    summary: 'Antagonista dos receptores de adenosina no sistema nervoso central, reduzindo a percepção subjetiva de esforço (RPE).',
    mechanism: 'Bloqueia competitivamente receptores A1 e A2A de adenosina, estimula a liberação de catecolaminas (dopamina e noradrenalina) e melhora a mobilização de cálcio no retículo sarcoplasmático.',
    evidenceGrade: 'A (Robusta)',
    adverseEffects: [
      'Insônia e comprometimento da arquitetura do sono (sono REM e de ondas lentas)',
      'Taquicardia reflexa, tremores finos e ansiedade aguda em indivíduos sensíveis',
      'Tolerância neuromuscular com uso crônico diário'
    ],
    risksCardiovascular: 'Elevação transitória da pressão arterial sistólica. Contraindicado em indivíduos com arritmias não investigadas.',
    risksHepatic: 'Metabolismo dependente do citocromo P450 (CYP1A2). Seguro em doses habituais.',
    risksEndocrineFertility: 'Sem impacto negativo em eixos reprodutivos.',
    monitoringProtocol: [
      'Aferição periódica de pressão arterial de repouso.',
      'Monitoramento de latência e qualidade do sono.'
    ],
    harmReductionNotes: 'Evitar consumo até 6 a 8 horas antes do sono. Doses ergogênicas eficazes variam entre 3 e 6 mg/kg tomadas 45-60 min antes do treino. Ciclizar o uso previne tolerância adaptativa.'
  },
  {
    id: 'eas_testosterona',
    title: 'Testosterona e Derivados (Esteroides Anabolizantes Androgênicos - EAA)',
    category: 'anabolizantes',
    summary: 'Compostos sintéticos ou bioidênticos derivados da testosterona. Promovem hipertrofia muscular profunda por ligação direta aos receptores androgênicos (AR).',
    mechanism: 'Ligam-se aos receptores androgênicos citoplasmáticos, translocam para o núcleo celular e ativam a transcrição gênica de proteínas contráteis (actina e miosina), além de promover hiperplasia/ativação de células satélite.',
    evidenceGrade: 'Alto Risco',
    adverseEffects: [
      'Supressão total e imediata do eixo HPT (Hipotálamo-Hipófise-Testículo), levando a hipogonadismo induzido por substância',
      'Atrofia testicular e azoospermia temporária ou permanente',
      'Ginecomastia decorrente da aromatização em estradiol',
      'Acne cística severa, alopecia androgenética acelerada em suscetíveis',
      'Retenção hidrossalina e sobrecarga renal'
    ],
    risksCardiovascular: 'Redução drástica do HDL-c (frequentemente < 20 mg/dL), elevação do LDL-c, hipertrofia ventricular esquerda concêntrica, rigidez arterial acelerada, aumento do hematócrito (>52%) com risco de trombose e hipertensão arterial.',
    risksHepatic: 'Especialmente grave em compostos 17-alfa-alquilados (orais), induzindo colestase, peliosis hepatis e adenomas.',
    risksEndocrineFertility: 'Inibição de LH e FSH a níveis indetectáveis. Risco concreto de infertilidade prolongada e dependência psicológica pós-uso (depressão grave associada ao "crash" hormonal).',
    monitoringProtocol: [
      'Hemograma completo (vigilância de hematócrito e hemoglobina)',
      'Lipidograma completo (colesterol total, HDL, LDL, VLDL, triglicerídeos)',
      'Função hepática (AST/TGO, ALT/TGP, GGT, Fosfatase Alcalina, Bilirrubinas)',
      'Função renal (Ureia e Creatinina com estimativa de TFG)',
      'Painel hormonal (Testosterona Total e Livre, Estradiol sensível, Prolactina, LH, FSH, SHBG, TSH)',
      'Ecocardiograma transtorácico com Doppler e MAPA anual'
    ],
    harmReductionNotes: 'AVISO DE REDUÇÃO DE DANOS: O aplicativo não prescreve nem incentiva o uso de substâncias controladas. Usuários que já realizam terapia médica devem fazê-lo estritamente sob supervisão médica endocrinológica com check-ups laboratoriais regulares.'
  },
  {
    id: 'sarms_moduladores',
    title: 'SARMs (Moduladores Seletivos de Receptores Androgênicos)',
    category: 'sarms',
    summary: 'Moléculas não esteroidais desenvolvidas para ter afinidade seletiva por tecido muscular e ósseo com menor impacto na próstata.',
    mechanism: 'Atuam como agonistas parciais ou totais nos receptores androgênicos. Embora promovidos comercialmente como "isentos de efeitos colaterais", dados clínicos demonstram supressão hormonal substancial.',
    evidenceGrade: 'Alto Risco',
    adverseEffects: [
      'Supressão expressiva do eixo HPT com queda acentuada de LH, FSH e testosterona total',
      'Redução severa do HDL colesterol mesmo em curtos períodos',
      'Falta de dados longitudinais de segurança humana a longo prazo',
      'Alta prevalência de adulteração em produtos do mercado paralelo'
    ],
    risksCardiovascular: 'Dislipidemia aterogênica acentuada e disfunção endotelial transitória.',
    risksHepatic: 'Relatos na literatura médica de hepatotoxicidade medicamentosa (DILI - Drug Induced Liver Injury) e icterícia colestática aguda.',
    risksEndocrineFertility: 'Derruba a produção endógena de testosterona. Não há "seletividade perfeita" que dispense acompanhamento médico.',
    monitoringProtocol: [
      'Avaliação prévia e posterior de transaminases hepáticas e perfil lipídico completo.',
      'Dosagem hormonal de testosterona e gonadotrofinas antes e 8 semanas após qualquer exposição.'
    ],
    harmReductionNotes: 'Substâncias experimentais não aprovadas para consumo humano pela Anvisa, FDA ou EMA fora de ensaios oncológicos restritos. O consumo recreativo acarreta riscos imprevisíveis.'
  },
  {
    id: 'hormonio_gh_tireoide',
    title: 'Hormônios Peptídicos e Tireoidianos (GH, T3 e T4)',
    category: 'hormonios',
    summary: 'Substâncias endócrinas que modulam lipólise, síntese proteica e taxa metabólica de repouso.',
    mechanism: 'GH (Somatotropina) estimula o IGF-1 hepático e lipólise. Hormônios tireoidianos (T3/T4) aumentam o consumo de oxigênio celular, desacoplando fosforilação oxidativa.',
    evidenceGrade: 'Alto Risco',
    adverseEffects: [
      'Resistência grave à insulina e risco aumentado de diabetes mellitus tipo 2 (com GH)',
      'Síndrome do túnel do carpo, edema periférico e dores articulares',
      'Tireotoxicose exógena com arritmias, taquicardia severa e catabolismo muscular (com T3/T4)',
      'Supressão do eixo hipotálamo-hipófise-tireoide (TSH)'
    ],
    risksCardiovascular: 'Cardiomiopatia, arritmias ventriculares, fibrilação atrial e hipertensão.',
    risksHepatic: 'Baixa toxicidade direta, mas desregula homeostase de glicogênio hepático.',
    risksEndocrineFertility: 'Perturbação do metabolismo da glicose e eixos neuroendócrinos.',
    monitoringProtocol: [
      'Glicemia de jejum, Hemoglobina Glicada (HbA1c) e Insulina basal.',
      'TSH, T4 Livre e T3 Total/Livre.',
      'IGF-1 sérico e eletrocardiograma de repouso.'
    ],
    harmReductionNotes: 'Medicamentos tarjados de alto risco. O desmame incorreto de hormônios tireoidianos pode gerar hipotireoidismo iatrogênico e efeito rebote com ganho acelerado de gordura.'
  },
  {
    id: 'monit_painel_exames',
    title: 'Protocolo de Monitorização Laboratorial e Redução de Danos',
    category: 'monitoramento',
    summary: 'Guia de parâmetros bioquímicos essenciais para atletas de força e praticantes de musculação de alta intensidade.',
    mechanism: 'A vigilância biomédica seriada permite interceptar anomalias precoces antes do desenvolvimento de aterosclerose sintomática, fibrose hepática ou insuficiência renal.',
    evidenceGrade: 'A (Robusta)',
    adverseEffects: [],
    risksCardiovascular: 'Não se aplica (protocolo preventivo de diagnóstico).',
    risksHepatic: 'Não se aplica.',
    risksEndocrineFertility: 'Permite identificar precocemente hipogonadismo ou infertilidade.',
    monitoringProtocol: [
      'Check-up Básico (a cada 6 meses): Hemograma com plaquetas, Glicemia, HbA1c, Perfil lipídico fracionado (CT, HDL, LDL, VLDL, Triglicerídeos), Creatinina, TGO, TGP, Gama GT, Ácido úrico.',
      'Painel Hormonal Estratégico: Testosterona Total, Testosterona Livre calculada, SHBG, Estradiol (E2), Prolactina, TSH, Cortisol matinal.',
      'Check-up Cardiovascular: Eletrocardiograma, Ecocardiograma com avaliação de septo interventricular e fração de ejeção, MAPA 24h.'
    ],
    harmReductionNotes: 'Marcadores musculares como CPK (Creatina Quinase) e TGO podem elevar-se fisiologicamente após treinos de alta intensidade sem indicar lesão patológica hepática ou cardíaca. O médico do esporte deve sempre interpretar os exames com o histórico de esforço recente.'
  }
];
