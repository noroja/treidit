import React, { useState } from 'react';
import { 
  BookOpen, ShieldAlert, HeartPulse, AlertTriangle, CheckCircle, 
  FlaskConical, Pill, Activity, ChevronDown, ChevronUp, FileText, Info
} from 'lucide-react';
import { ERGOGENICS_DATABASE } from '../data/ergogenicsData';
import { ErgogenicArticle } from '../types';

export const ErgogenicsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>('supl_creatina');

  const categories = [
    { id: 'todos', label: 'Todos os Recursos' },
    { id: 'suplementos', label: 'Suplementos (Evidência A)' },
    { id: 'anabolizantes', label: 'Esteroides Anabolizantes' },
    { id: 'sarms', label: 'SARMs' },
    { id: 'hormonios', label: 'Hormônios Peptídicos' },
    { id: 'monitoramento', label: 'Monitorização Laboratorial' },
  ];

  const filteredArticles = selectedCategory === 'todos'
    ? ERGOGENICS_DATABASE
    : ERGOGENICS_DATABASE.filter((art) => art.category === selectedCategory);

  return (
    <div className="space-y-6 pb-24">
      {/* Educational & Harm Reduction Disclaimer Banner */}
      <div className="rounded-2xl border border-danger/30 bg-danger/8 p-5 space-y-2">
        <div className="flex items-center gap-2.5 text-danger font-extrabold text-sm sm:text-base">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Módulo Educacional & Diretrizes de Redução de Danos</span>
        </div>
        <p className="text-xs text-strong leading-relaxed">
          Este módulo tem finalidade <strong>exclusivamente informativa, científica e de saúde pública</strong>. O aplicativo <strong>não prescreve ciclos, dosagens ou combinações de substâncias controladas</strong>. O uso não médico de esteroides anabolizantes, SARMs ou hormônios sem indicação clínica acarreta graves riscos cardiovasculares, hepáticos e reprodutivos. Qualquer conduta terapêutica deve ser discutida diretamente com seu médico especialista.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'bg-lime text-base border-lime  '
                  : 'bg-panel hover:bg-elevated text-strong border-elevated'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Articles Accordion */}
      <div className="space-y-4">
        {filteredArticles.map((art) => {
          const isExpanded = expandedArticleId === art.id;
          const isHighRisk = art.evidenceGrade === 'Alto Risco';

          return (
            <div
              key={art.id}
              className="bg-panel border border-elevated rounded-2xl overflow-hidden  transition hover:border-line-strong"
            >
              {/* Accordion Header */}
              <button
                onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[11px] font-extrabold   px-2 py-0.5 rounded-full border ${
                        isHighRisk
                          ? 'bg-danger/15 text-danger border-danger/30'
                          : 'bg-lime/15 text-lime border-lime/30'
                      }`}
                    >
                      Grau de Evidência: {art.evidenceGrade}
                    </span>
                    <span className="text-[11px] text-muted capitalize">
                      Categoria: {art.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {art.title}
                  </h3>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {art.summary}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-elevated text-strong shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-elevated/80 space-y-4 text-xs">
                  {/* Mechanism */}
                  <div className="bg-base/70 p-3.5 rounded-xl border border-elevated">
                    <span className="text-lime font-bold block mb-1 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5" /> Mecanismo Fisiológico de Ação
                    </span>
                    <p className="text-strong leading-relaxed">{art.mechanism}</p>
                  </div>

                  {/* Adverse effects */}
                  {art.adverseEffects.length > 0 && (
                    <div className="bg-base/70 p-3.5 rounded-xl border border-elevated">
                      <span className="text-danger font-bold block mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Efeitos Adversos Descritos
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-strong">
                        {art.adverseEffects.map((ae, i) => (
                          <li key={i}>{ae}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3 Risk Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-base/70 p-3 rounded-xl border border-elevated">
                      <span className="text-danger font-semibold block mb-1">Impacto Cardiovascular</span>
                      <p className="text-strong text-[12.5px] leading-relaxed">{art.risksCardiovascular}</p>
                    </div>

                    <div className="bg-base/70 p-3 rounded-xl border border-elevated">
                      <span className="text-lime-dim font-semibold block mb-1">Impacto Hepático</span>
                      <p className="text-strong text-[12.5px] leading-relaxed">{art.risksHepatic}</p>
                    </div>

                    <div className="bg-base/70 p-3 rounded-xl border border-elevated">
                      <span className="text-lime-dim font-semibold block mb-1">Endócrino & Fertilidade</span>
                      <p className="text-strong text-[12.5px] leading-relaxed">{art.risksEndocrineFertility}</p>
                    </div>
                  </div>

                  {/* Monitoring Protocol */}
                  <div className="bg-base/70 p-3.5 rounded-xl border border-elevated">
                    <span className="text-lime-dim font-bold block mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Protocolo de Monitorização Laboratorial
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-strong">
                      {art.monitoringProtocol.map((proto, i) => (
                        <li key={i}>{proto}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Harm Reduction Note */}
                  <div className="bg-base/90 p-3 rounded-xl border border-elevated text-muted text-[12.5px] flex items-start gap-2">
                    <Info className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                    <span>{art.harmReductionNotes}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
