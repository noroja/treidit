import React, { useState } from 'react';
import { 
  BookOpen, BrainCircuit, ShieldCheck, CheckCircle2, AlertTriangle, 
  Layers, ChevronRight, HelpCircle, ArrowRight, Quote, Flame, Dumbbell,
  FolderTree, Search, Tag, ExternalLink, ChevronDown, ChevronUp, FileCode
} from 'lucide-react';
import { EVIDENCE_HIERARCHY, METHODOLOGICAL_AUTHORS, resolveSciencePracticeConflict } from '../utils/methodology';
import { KNOWLEDGE_PILLARS, AI_FITNESS_KNOWLEDGE_BASE, KnowledgeItem } from '../knowledge';

export const MethodologyView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<'janela_anabolica' | 'falha_concentrica' | 'frequencia_treino'>('falha_concentrica');

  // Knowledge Base Explorer State
  const [selectedPillar, setSelectedPillar] = useState<string>('01_TREINAMENTO');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedKbId, setExpandedKbId] = useState<string | null>('kb_belmiro_triade');

  const conflictResolution = resolveSciencePracticeConflict(selectedTopic);

  // Filtered knowledge articles
  const currentPillarData = KNOWLEDGE_PILLARS.find((p) => p.id === selectedPillar) || KNOWLEDGE_PILLARS[0];

  const filteredKnowledge = AI_FITNESS_KNOWLEDGE_BASE.filter((item) => {
    const matchesPillar = selectedPillar === 'todos' || item.pillarId === selectedPillar;
    const matchesSub = selectedSubcategory === 'todos' || item.category.toLowerCase() === selectedSubcategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPillar && matchesSub && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="border border-elevated rounded-2xl p-5  space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px]  font-semibold  px-2.5 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30">
            Arquitetura Conceitual
          </span>
          <span className="text-xs text-muted">•</span>
          <span className="text-xs text-strong font-medium">Filosofia KINETIC</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Referências Metodológicas & Motor de Decisão
        </h1>
        <p className="text-xs sm:text-sm text-strong max-w-3xl leading-relaxed">
          O KINETIC não é um mero "gerador estático de fichas e dietas". Ele é um sistema inteligente de tomada de decisão fundamentado na literatura científica contemporânea, na experiência prática de treinadores e no acompanhamento longitudinal da resposta do indivíduo.
        </p>

        {/* Core Philosophy Chain */}
        <div className="mt-4 pt-3 border-t border-elevated/80 flex items-center justify-between text-xs text-muted overflow-x-auto gap-2 py-1 scrollbar-none">
          <span className="text-lime font-bold bg-base px-2 py-1 rounded border border-elevated shrink-0">INDIVÍDUO</span>
          <ArrowRight className="w-3.5 h-3.5 text-line-strong shrink-0" />
          <span className="text-strong font-bold bg-base px-2 py-1 rounded border border-elevated shrink-0">CONTEXTO</span>
          <ArrowRight className="w-3.5 h-3.5 text-line-strong shrink-0" />
          <span className="text-strong font-bold bg-base px-2 py-1 rounded border border-elevated shrink-0">ESTÍMULO</span>
          <ArrowRight className="w-3.5 h-3.5 text-line-strong shrink-0" />
          <span className="text-strong font-bold bg-base px-2 py-1 rounded border border-elevated shrink-0">RESPOSTA</span>
          <ArrowRight className="w-3.5 h-3.5 text-line-strong shrink-0" />
          <span className="text-lime font-bold bg-lime/20 px-2.5 py-1 rounded border border-lime/25 shrink-0">AJUSTE</span>
        </div>
      </div>

      {/* EXPLORADOR DA BASE DE CONHECIMENTO CIENTÍFICO (AI_FITNESS_KNOWLEDGE) */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px]  font-bold text-lime bg-lime/10 px-2 py-0.5 rounded border border-lime/20">
                AI_FITNESS_KNOWLEDGE/
              </span>
              <span className="text-xs text-muted">Base Ativa da IA</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-lime" />
              Explorador da Base de Conhecimento Estruturada
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
            <input
              type="text"
              placeholder="Buscar evidência ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base border border-line-strong rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-faint focus:outline-none focus:border-lime"
            />
          </div>
        </div>

        {/* 5 Main Pillars Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {KNOWLEDGE_PILLARS.map((p) => {
            const isSelected = selectedPillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPillar(p.id);
                  setSelectedSubcategory('todos');
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-lime/15 border-lime text-white '
                    : 'bg-base/70 border-elevated text-muted hover:border-line-strong hover:text-strong'
                }`}
              >
                <div className="font-mono text-[11px] text-lime font-bold">{p.number}</div>
                <div className="font-bold text-xs truncate mt-0.5">{p.name}</div>
              </button>
            );
          })}
        </div>

        {/* Subcategories Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[12.5px] text-muted shrink-0 mr-1 font-mono">Subpasta:</span>
          <button
            onClick={() => setSelectedSubcategory('todos')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap cursor-pointer font-semibold ${
              selectedSubcategory === 'todos'
                ? 'bg-elevated text-lime border border-lime/30'
                : 'text-muted hover:text-white'
            }`}
          >
            Todas as subpastas
          </button>
          {currentPillarData.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap cursor-pointer font-semibold ${
                selectedSubcategory.toLowerCase() === sub.toLowerCase()
                  ? 'bg-elevated text-lime border border-lime/30'
                  : 'text-muted hover:text-white'
              }`}
            >
              {sub.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Knowledge Articles Accordion */}
        <div className="space-y-3 pt-2">
          {filteredKnowledge.length === 0 ? (
            <div className="text-center py-8 text-faint text-xs bg-base rounded-xl border border-elevated">
              Nenhum artigo encontrado para o filtro selecionado.
            </div>
          ) : (
            filteredKnowledge.map((item) => {
              const isExpanded = expandedKbId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-base/80 border border-elevated rounded-xl overflow-hidden transition hover:border-line-strong"
                >
                  <button
                    onClick={() => setExpandedKbId(isExpanded ? null : item.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-lime font-bold bg-panel px-2 py-0.5 rounded border border-elevated">
                          {item.pillarId}/{item.category}
                        </span>
                        {item.authorReference && (
                          <span className="text-[11px] text-muted">
                            Ref: <strong className="text-strong">{item.authorReference}</strong>
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">
                        {item.summary}
                      </p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-panel text-muted shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-elevated/80 space-y-3.5 text-xs">
                      {/* Core Concepts */}
                      <div className="bg-panel/60 p-3 rounded-xl border border-elevated/80">
                        <span className="text-lime font-bold block mb-1.5  text-[11px] ">
                          Conceitos Fundamentais
                        </span>
                        <ul className="space-y-1 list-disc list-inside text-strong text-xs">
                          {item.coreConcepts.map((cc, i) => (
                            <li key={i}>{cc}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Practical Application in the App */}
                      <div className="bg-panel/60 p-3 rounded-xl border border-elevated/80">
                        <span className="text-lime-dim font-bold block mb-1  text-[11px] ">
                          Aplicação Prática no KINETIC
                        </span>
                        <p className="text-strong leading-relaxed">{item.practicalApplication}</p>
                      </div>

                      {/* Scientific Support */}
                      <div className="bg-panel/60 p-3 rounded-xl border border-elevated/80 flex items-start gap-2">
                        <ExternalLink className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                        <div>
                          <span className="text-muted font-semibold block text-[11px] ">
                            Suporte da Literatura Científica
                          </span>
                          <span className="text-strong font-mono text-[12.5px]">{item.scientificSupport}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-panel text-muted border border-elevated"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* The 3 Core Methodological Authors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Quote className="w-4 h-4 text-lime" />
            As 3 Referências Principais
          </h2>
          <span className="text-xs text-muted">Síntese teórica e heurísticas aplicadas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {METHODOLOGICAL_AUTHORS.map((author) => (
            <div
              key={author.id}
              className="bg-panel border border-elevated rounded-2xl p-5 flex flex-col justify-between  space-y-4 hover:border-line-strong transition"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-lime/10 text-lime border border-lime/20 flex items-center justify-center font-bold text-sm mb-3">
                  {author.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-white">{author.name}</h3>
                <span className="text-[12.5px] text-lime font-semibold block mb-2">{author.specialty}</span>

                <div className="space-y-1.5 text-xs text-strong">
                  <span className="text-[11px]  font-bold text-muted block  mt-3">
                    Contribuições Chave no Sistema:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-[12.5px] text-strong">
                    {author.keyContributions.map((kc, i) => (
                      <li key={i}>{kc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-elevated/80">
                <blockquote className="text-[12.5px] text-muted italic bg-base/60 p-2.5 rounded-xl border border-elevated"> "{author.quote}"
                </blockquote>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Belmiro's Triad & Haluch/Aceto Logic Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Belmiro: Treino */}
        <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Dumbbell className="w-4 h-4 text-lime" />
            <span>Motor de Treino: Belmiro de Salles</span>
          </div>
          <p className="text-xs text-strong leading-relaxed">
            O algoritmo não se pergunta simplesmente <em>«Qual é o melhor treino?»</em>, mas sim: <strong>«Qual estratégia é mais adequada para este indivíduo neste momento?»</strong>
          </p>

          <div className="space-y-2 text-xs pt-1">
            <div className="bg-base p-2.5 rounded-xl border border-elevated">
              <strong className="text-lime block mb-0.5">«Para quem?»</strong>
              <span className="text-strong">Nível de experiência, tolerância articular, volume pregresso e capacidade de recuperação.</span>
            </div>
            <div className="bg-base p-2.5 rounded-xl border border-elevated">
              <strong className="text-lime-dim block mb-0.5">«Para quê?»</strong>
              <span className="text-strong">Hipertrofia miofibrilar, retenção em déficit, força submáxima ou recuperação ativa.</span>
            </div>
            <div className="bg-base p-2.5 rounded-xl border border-elevated">
              <strong className="text-lime-dim block mb-0.5">«Em qual momento?»</strong>
              <span className="text-strong">Início do mesociclo, semana de choque ou deload profilático para dissipação de fadiga.</span>
            </div>
          </div>
        </div>

        {/* Haluch & Aceto: Dieta */}
        <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Flame className="w-4 h-4 text-lime-dim" />
            <span>Motor de Dieta: Dudu Haluch & Chris Aceto</span>
          </div>
          <p className="text-xs text-strong leading-relaxed">
            Não utilizamos simplesmente <em>Peso × Fator = Calorias</em> como decisão final. A fórmula fornece apenas o ponto de partida termodinâmico.
          </p>

          <div className="bg-base p-3 rounded-xl border border-elevated text-[12.5px] text-strong space-y-1.5">
            <div className="flex items-center justify-between text-muted font-mono text-[11px]">
              <span>ETAPA 1</span>
              <span>ETAPA 2</span>
              <span>ETAPA 3</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Estimativa Inicial</span>
              <span>→</span>
              <span>Aplicação e Adesão</span>
              <span>→</span>
              <span className="text-lime">Resposta Real (Ajuste)</span>
            </div>
            <p className="text-muted text-[12.5px] pt-1">
              A estratégia é titulada conforme o estágio do processo, plenitude no espelho, cargas no treino e saciedade informada pelo atleta.
            </p>
          </div>
        </div>
      </div>

      {/* The Evidence Hierarchy Pyramid */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-lime" />
            Hierarquia de Evidências KINETIC
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Critério rigoroso utilizado pela IA para ponderar decisões e evitar opiniões dogmáticas.
          </p>
        </div>

        <div className="space-y-2.5">
          {EVIDENCE_HIERARCHY.map((eh) => (
            <div
              key={eh.level}
              className="bg-base/80 border border-elevated rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-elevated text-lime font-semibold text-xs flex items-center justify-center shrink-0">
                  {eh.level}
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{eh.name}</h3>
                  <p className="text-muted text-[12.5px] mt-0.5">{eh.description}</p>
                </div>
              </div>
              <div className="text-[12.5px] text-strong bg-panel px-3 py-1.5 rounded-lg border border-elevated self-start sm:self-auto max-w-xs">
                Exemplo: {eh.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Science vs. Practice Conflict Resolution */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-lime" />
            Protocolo de Resolução de Conflitos: Ciência vs. Prática Empírica
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Quando há divergência entre a tradição de academia e os dados científicos mais recentes, o sistema analisa a incerteza metodológica sem impor dogmas.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedTopic('falha_concentrica')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTopic === 'falha_concentrica'
                ? 'bg-lime text-base'
                : 'bg-base text-strong border border-elevated'
            }`}
          >
            Treinar Até a Falha vs RIR 1-2
          </button>
          <button
            onClick={() => setSelectedTopic('janela_anabolica')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTopic === 'janela_anabolica'
                ? 'bg-lime text-base'
                : 'bg-base text-strong border border-elevated'
            }`}
          >
            Janela Anabólica Imediata
          </button>
          <button
            onClick={() => setSelectedTopic('frequencia_treino')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTopic === 'frequencia_treino'
                ? 'bg-lime text-base'
                : 'bg-base text-strong border border-elevated'
            }`}
          >
            Frequência 1x vs 2x Semanal
          </button>
        </div>

        {/* Conflict Report Card */}
        <div className="bg-base p-4 rounded-xl border border-elevated space-y-3 text-xs">
          <div>
            <span className="text-danger font-bold block mb-0.5">1. O Conflito Detectado:</span>
            <p className="text-strong">{conflictResolution.conflict}</p>
          </div>
          <div>
            <span className="text-lime-dim font-bold block mb-0.5">2. Avaliação da Qualidade da Evidência:</span>
            <p className="text-strong">{conflictResolution.evidenceAssessment}</p>
          </div>
          <div>
            <span className="text-lime-dim font-bold block mb-0.5">3. Explicação da Incerteza e Contexto:</span>
            <p className="text-strong">{conflictResolution.uncertaintyExplanation}</p>
          </div>
          <div className="pt-2 border-t border-elevated">
            <span className="text-lime font-bold block mb-0.5">4. Conduta Adotada pelo KINETIC:</span>
            <p className="text-white font-medium">{conflictResolution.kineticResolution}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
