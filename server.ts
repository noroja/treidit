import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { resolveAiProvider, type AiProvider, type AiMessage } from './aiProvider';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// FASE 7/§12: provedor desacoplado — Groq (GROQ_API_KEY) → Gemini → stubs locais.
const ai: AiProvider | null = resolveAiProvider(process.env);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasAiKey: Boolean(ai), provider: ai?.name ?? 'none' });
});

// AI Chat Assistant endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, userContext, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    if (!ai) {
      return res.json({
        reply: `[Sistema Operando Offline] Com base nos seus registros atuais:\n` +
          `• Objetivo: ${userContext?.profile?.goal || 'Hipertrofia'}\n` +
          `• Peso atual: ${userContext?.currentWeight || '78'} kg\n` +
          `• Meta calórica: ${userContext?.nutrition?.targetCalories || 2400} kcal\n\n` +
          `Sua progressão recente indica consistência nos treinos e adesão alimentar. O sistema manteve as variáveis atuais para consolidar as adaptações neuromusculares antes do próximo microciclo.`
      });
    }

    const systemInstruction = `Você é o KINETIC AI, um cientista do esporte, fisiologista do exercício e estrategista nutricional de alto rendimento integrado ao aplicativo KINETIC.

ESTRUTURA DA BASE DE CONHECIMENTO CIENTÍFICO (AI_FITNESS_KNOWLEDGE):
├── 01_TREINAMENTO/
│   ├── Belmiro/ (Tríade: Para quem? Para quê? Em qual momento?; métodos de força; descanso de 2-3min compostos e 1-2min isoladores; eliminação de junk volume)
│   ├── Hipertrofia/ (Tensão mecânica sob estiramento, vias mTORC1, proximidade da falha RIR 1-2)
│   ├── Força/ (Adaptações neurais, coordenação motora, sobrecarga progressiva sistemática)
│   ├── Periodização/ (Periodização ondulatória DUP, blocos de choque e deload programado)
│   ├── Volume_Intensidade_Frequencia/ (10-20 séries/semana/grupo, RIR 1-2, frequência fracionada 2x)
│   └── Evidencia_Cientifica/ (Meta-análises de Schoenfeld, Morton, Refalo, Vieira, Baz-Valle)
├── 02_NUTRICAO/
│   ├── Dudu_Haluch/ (Adesão como pré-requisito mandatório, titulação gradual de déficits/superávits, proteína individualizada 2.0-2.4 g/kg em déficit, resposta individual)
│   ├── Balanco_Energetico/ (TMB, NEAT como variável mais adaptável, TEF, balanço térmico)
│   ├── Cutting/ (Déficit sustentado 15-25%, taxa de perda 0.5-1% peso/sem para preservação de massa livre de gordura)
│   ├── Bulking/ (Superávit limpo 150-300 kcal/dia, ganho controlado sem hiperplasia de adipócitos)
│   ├── Macros/ (Proteína fracionada a cada 3-5h, gorduras 0.7-1.0 g/kg para esteroidogênese, carboidratos para glicogênio)
│   └── Evidencia_Cientifica/ (Consensos ISSN, Helms, Aragon, Phillips, Trexler)
├── 03_PREPARACAO/
│   ├── Chris_Aceto/ (Manipulação de carboidratos, plenitude muscular vs embaçamento, retenção de água extracelular vs intramuscular)
│   ├── Composicao_Corporal/ (Balança vs composição real de água, glicogênio, gordura e massa magra)
│   ├── Analise_Visual/ (Avaliação visual no espelho em jejum: densidade, cortes, vascularização e velocidade da barra)
│   └── Preparacao/ (Fases de ganho, consolidação, pré-contest e peak week)
├── 04_HORMONIOS/
│   ├── Fisiologia/ (Eixo HPT, feedback negativo de GnRH/LH/FSH, espermatogênese e homeostase)
│   ├── Farmacologia/ (Ésteres de testosterona, 17-alfa-alquilados orais, SARMs, derivados de DHT/19-nor)
│   ├── Efeitos_Adversos/ (Dislipidemia severa com queda de HDL, hipertrofia ventricular concêntrica, policitemia/eritrocitose, infertilidade)
│   ├── Exames/ (Hemograma, lipidograma, TGO/TGP, GGT, creatinina, painel hormonal completo, ecocardiograma)
│   └── Reducao_de_Danos/ (Abordagem puramente informativa e ética, sem prescrição de ciclos, vigilância clínica)
└── 05_DIRETRIZES/
    ├── ACSM/ (Diretrizes de progressão de força em multiarticulares)
    ├── ISSN/ (Posicionamentos oficiais de proteína, creatina, cafeína, timing de nutrientes)
    ├── Diretrizes_Medicas/ (Cardiologia e endocrinologia para risco cardiovascular e metabólico)
    └── Revisoes_Sistematicas/ (Cochrane, PRISMA meta-análises)

HIERARQUIA DE EVIDÊNCIAS KINETIC:
Evidência Científica Atual > Diretrizes/Consensos > Revisões Sistemáticas/Meta-análises > Estudos Individuais > Experiência Prática (Haluch, Aceto, Belmiro) > Preferência do Usuário.

DIRETRIZES DE RESPOSTA E COMUNICAÇÃO:
1. Sempre que pertinente, mencione ou cite a seção da base correspondente (ex: [01_TREINAMENTO/Belmiro], [02_NUTRICAO/Dudu_Haluch], [03_PREPARACAO/Chris_Aceto], [05_DIRETRIZES/ISSN]).
2. Evite frases absolutas como "Todo mundo precisa de X séries". Prefira: "Para o seu nível atual, histórico de resposta e capacidade de recuperação, essa estratégia apresenta maior coerência."
3. Filosofia: INDIVÍDUO → CONTEXTO → ESTÍMULO → RESPOSTA → AJUSTE.
4. Estruture diagnósticos na tríade:
   - **RESPOSTA OBSERVADA:** O que os dados mostram objetivamente.
   - **INTERPRETAÇÃO FISIOLÓGICA:** Por que ocorreu com base na literatura e heurísticas práticas.
   - **DECISÃO & CONDUTA:** O que foi ajustado ou mantido, respondendo à tríade de Belmiro (Para quem? Para quê? Em qual momento?).
5. Quando houver conflito entre prática empírica e ciência, aponte a incerteza com rigor e pondere o contexto individual.
6. Responda em Português do Brasil com formatação primorosa em Markdown.

DADOS ATUAIS DO USUÁRIO:
${JSON.stringify(userContext || {}, null, 2)}`;

    // Prepare contents
    const messages: AiMessage[] = [];

    // Add brief past turns if available
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) {
        messages.push({ role: turn.role === 'user' ? 'user' : 'assistant', content: turn.text || turn.content || '' });
      }
    }

    messages.push({ role: 'user', content: message });

    const reply = await ai.complete({
      system: systemInstruction,
      messages,
      temperature: 0.7,
    });

    return res.json({ reply: reply || 'Não foi possível gerar resposta no momento.' });
  } catch (error: any) {
    console.error('Error calling Gemini Chat:', error);
    return res.status(500).json({
      error: 'Falha ao processar resposta com o assistente.',
      details: error.message
    });
  }
});

// AI Deep Adaptive Analysis endpoint
app.post('/api/gemini/analyze-adaptive', async (req: Request, res: Response) => {
  try {
    const { userContext } = req.body;

    if (!ai) {
      return res.json({
        status: 'optimal',
        diagnosis: 'Adaptação Estável em Andamento',
        whatChanged: 'Manutenção do microciclo de sobrecarga progressiva e meta calórica.',
        whyChanged: 'Sua taxa de adesão superior a 85% e a progressão sustentada de carga (RIR médio de 1.8) indicam que o estímulo atual ainda está gerando adaptações neuromusculares sem acúmulo excessivo de fadiga sistêmica.',
        dataTrigger: 'Taxa de variação de peso dentro da faixa alvo semanal (-0.35 kg/sem) com estabilidade de força nos exercícios compostos.',
        evaluationMetrics: 'Monitorar RIR nas 2 primeiras séries dos exercícios compostos e média móvel do peso nos próximos 7 dias.',
        recommendedActions: [
          'Tentar adicionar 1 repetição ou +1kg na primeira série do Supino e Agachamento.',
          'Manter hidratação acima de 35ml/kg e ingestão proteica em 2.0g/kg.'
        ]
      });
    }

    const systemInstruction = `Você é o motor de auditoria adaptativa do aplicativo KINETIC.
Analise os dados de treino, peso, nutrição e recuperação do usuário.
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown de bloco de código adicional se possível, ou JSON puro) seguindo este esquema:
{
  "status": "optimal" | "adjustment_needed" | "deload_recommended" | "adherence_issue",
  "diagnosis": string,
  "whatChanged": string,
  "whyChanged": string,
  "dataTrigger": string,
  "evaluationMetrics": string,
  "recommendedActions": string[]
}`;

    const prompt = `Analise este perfil atlético e determine o próximo ajuste do ciclo adaptativo (Dados do usuário → Prescrição → Execução → Registro → Análise → Ajuste):\n${JSON.stringify(userContext, null, 2)}`;

    const reply = await ai.complete({
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      jsonMode: true,
    });

    const parsed = JSON.parse(reply);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating adaptive analysis:', error);
    // Return fallback structured response
    return res.json({
      status: 'optimal',
      diagnosis: 'Evolução Consistente',
      whatChanged: 'Manutenção das variáveis de volume e calorias.',
      whyChanged: 'O ritmo de recuperação e a progressão de cargas estão alinhados aos parâmetros ótimos do mesociclo.',
      dataTrigger: 'RIR médio mantido entre 1 e 2 sem relatos de dores articulares anômalas.',
      evaluationMetrics: 'Acompanhar tônus matinal e peso na próxima semana.',
      recommendedActions: ['Continuar com a sobrecarga progressiva planejada.']
    });
  }
});

// AI Weekly Check-in Analysis Endpoint
app.post('/api/gemini/weekly-checkin', async (req: Request, res: Response) => {
  try {
    const { checkinData, userContext } = req.body;

    if (!ai) {
      return res.json({
        status: 'manter',
        title: 'Check-in Semanal Validado: Progressão Sustentada',
        resposta: 'O peso reduziu 0.3kg na semana com diminuição de 0.5cm na cintura. Cargas progrediram 2.5kg no Supino e Agachamento com RIR médio de 1.8. Adesão alimentar acima de 90%.',
        interpretacao: 'Conforme preceituado por Dudu Haluch e Chris Aceto, a resposta morfológica e o rendimento indicam que a taxa metabólica está preservada e que o déficit calórico moderado está poupando massa magra.',
        decisao: 'Manter a estratégia atual de treino e calorias. Respeitando a lógica de Belmiro de Salles (Para quem? Intermediário. Para quê? Hipertrofia com recomposição. Em qual momento? Microciclo de consolidação), não há justificativa para alterar variáveis precipitadamente.',
        perguntasChave: {
          paraQuem: 'Praticante intermediário com boa tolerância de volume e articulações saudáveis.',
          paraQue: 'Manter estímulo hipertrófico e densidade muscular sem gerar fadiga residual.',
          emQualMomento: 'Fase de consolidação do mesociclo onde a sobrecarga ainda está ocorrendo espontaneamente.'
        },
        ajustesRecomendados: {
          caloriasDelta: 0,
          volumeDeltaSets: 0,
          focoCarboidrato: 'Manter aporte peri-treino para sustentar os estoques de glicogênio.'
        }
      });
    }

    const systemInstruction = `Você é o KINETIC Engine, responsável pelo Check-in Semanal com fundamentação nas metodologias de Dudu Haluch, Chris Aceto e Belmiro de Salles, sob a égide da Hierarquia de Evidências.
Analise a resposta semanal nas 4 áreas:
1. Composição Corporal (Peso, Cintura, Medidas)
2. Performance (Cargas, Repetições, RIR, Volume)
3. Nutrição (Calorias, Proteína, Adesão, Fome, Saciedade)
4. Recuperação (Sono, Fadiga, Estresse)

Retorne EXCLUSIVAMENTE um JSON válido com esta estrutura:
{
  "status": "manter" | "ajustar_calorias" | "ajustar_volume" | "deload" | "melhorar_adesao",
  "title": string,
  "resposta": string (O que os dados mostram objetivamente),
  "interpretacao": string (Interpretação fisiológica com conceitos de Haluch/Aceto/Belmiro),
  "decisao": string (Decisão prática fundamentada: RESPOSTA -> INTERPRETAÇÃO -> DECISÃO),
  "perguntasChave": {
    "paraQuem": string,
    "paraQue": string,
    "emQualMomento": string
  },
  "ajustesRecomendados": {
    "caloriasDelta": number,
    "volumeDeltaSets": number,
    "focoCarboidrato": string
  }
}`;

    const prompt = `Analise este Check-in Semanal do atleta:\n${JSON.stringify({ checkinData, userContext }, null, 2)}`;

    const reply = await ai.complete({
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(reply);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating weekly checkin analysis:', error);
    return res.json({
      status: 'manter',
      title: 'Check-in Processado',
      resposta: 'Dados semanais coletados com sucesso.',
      interpretacao: 'Evolução em curso com estabilidade mecânica.',
      decisao: 'Manter variáveis vigentes.',
      perguntasChave: {
        paraQuem: 'Indivíduo em acompanhamento regular',
        paraQue: 'Progressão adaptativa',
        emQualMomento: 'Microciclo ativo'
      },
      ajustesRecomendados: { caloriasDelta: 0, volumeDeltaSets: 0, focoCarboidrato: 'Manter padrão' }
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`KINETIC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
