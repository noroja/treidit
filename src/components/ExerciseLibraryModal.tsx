import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useState, useMemo } from 'react';
import { X, Search, Dumbbell, Filter, AlertCircle, CheckCircle2, ChevronRight, Info, Eye, Layers, Flame, BookOpen } from 'lucide-react';
import { EXERCISE_LIBRARY, AVAILABLE_MUSCLE_GROUPS } from '../data/exerciseLibraryData';
import { ExerciseLibraryItem } from '../types';

interface ExerciseLibraryModalProps {
  onClose: () => void;
  onSelectExerciseToSwap?: (exercise: ExerciseLibraryItem) => void;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  onClose,
  onSelectExerciseToSwap,
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);

  const equipmentOptions = [
    'todos',
    'Barra OlÃ­mpica',
    'Halteres',
    'Polia / Crossover',
    'MÃ¡quina',
    'Peso Corporal',
    'Kettlebell',
    'Barra W / EZ',
    'ElÃ¡sticos / Faixas',
  ];

  // Filtered exercises with high performance memoization
  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((item) => {
      const matchesMuscle =
        selectedMuscle === 'todos' ||
        item.muscleGroup.toLowerCase().includes(selectedMuscle.toLowerCase()) ||
        item.primaryMuscles?.some((m) => m.toLowerCase().includes(selectedMuscle.toLowerCase()));

      const matchesEquipment =
        selectedEquipment === 'todos' ||
        item.equipment.toLowerCase().includes(selectedEquipment.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.equipment.toLowerCase().includes(query) ||
        item.muscleGroup.toLowerCase().includes(query) ||
        item.primaryMuscles?.some((m) => m.toLowerCase().includes(query));

      return matchesMuscle && matchesEquipment && matchesSearch;
    });
  }, [selectedMuscle, selectedEquipment, searchQuery]);

  const visibleExercises = filtered.slice(0, visibleCount);

  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-4xl max-h-modal-lg flex flex-col  overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-base p-4 border-b border-elevated flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl    text-lime border border-lime/30 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-white">Banco de ExercÃ­cios FÃ­sicos (PT-BR)</h2>
                <span className="text-[11px]  font-extrabold px-2 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30">
                  {EXERCISE_LIBRARY.length} ExercÃ­cios
                </span>
              </div>
              <p className="text-xs text-muted">
                Guia anatÃ´mico, padrÃµes biomecÃ¢nicos e instruÃ§Ãµes de execuÃ§Ã£o traduzidas para o portuguÃªs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-elevated hover:bg-line-strong text-muted hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 bg-base/70 border-b border-elevated/80 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
            <input
              type="text"
              placeholder="Buscar entre 870+ exercÃ­cios (ex: Supino, Agachamento, Remada, TrÃ­ceps, ElevaÃ§Ã£o)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(30);
              }}
              className="w-full bg-panel border border-line-strong rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-faint focus:outline-none focus:border-lime transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-muted hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Muscle Groups Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {AVAILABLE_MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedMuscle(m);
                  setVisibleCount(30);
                }}
                className={`px-3 py-1.5 rounded-xl capitalize transition cursor-pointer whitespace-nowrap text-xs font-semibold ${
                  selectedMuscle === m
                    ? 'bg-lime text-base  '
                    : 'bg-panel text-muted hover:text-white border border-elevated'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Equipment Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[12.5px] text-muted">
            <span className="text-[11px]  font-bold text-faint shrink-0">Equipamento:</span>
            {equipmentOptions.map((eq) => (
              <button
                key={eq}
                onClick={() => {
                  setSelectedEquipment(eq);
                  setVisibleCount(30);
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  selectedEquipment === eq
                    ? 'bg-lime-dim/20 text-lime-dim font-bold border border-lime-dim/40'
                    : 'bg-panel/60 hover:text-strong border border-elevated'
                }`}
              >
                {eq === 'todos' ? 'Todos' : eq}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="px-4 py-2 bg-base/40 border-b border-elevated/60 flex items-center justify-between text-[12.5px] text-muted">
          <span>
            Mostrando <strong>{Math.min(visibleCount, filtered.length)}</strong> de <strong>{filtered.length}</strong> exercÃ­cios encontrados
          </span>
          <span className="text-lime font-medium">
            Classificados por biomecÃ¢nica e RIR
          </span>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-faint space-y-2">
              <AlertCircle className="w-8 h-8 text-line-strong mx-auto" />
              <p className="text-sm font-semibold text-muted">Nenhum exercÃ­cio encontrado</p>
              <p className="text-xs">Tente buscar por termos mais genÃ©ricos ou mudar os filtros de mÃºsculo e equipamento.</p>
            </div>
          ) : (
            visibleExercises.map((ex) => {
              const isExpanded = expandedId === ex.id;
              return (
                <div
                  key={ex.id}
                  className="bg-base/80 border border-elevated hover:border-line-strong/80 rounded-xl p-4 transition"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Image Thumbnail Preview */}
                      {ex.images && ex.images.length > 0 ? (
                        <div 
                          className="w-14 h-14 rounded-lg bg-panel border border-elevated overflow-hidden shrink-0 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowImagePreview(ex.images![0]);
                          }}
                        >
                          <img
                            src={ex.images[0]}
                            alt={ex.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-panel border border-elevated flex items-center justify-center shrink-0 text-line-strong">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded bg-lime/15 text-lime text-[11px] font-bold border border-lime/30">
                            {ex.muscleGroup}
                          </span>
                          <span className="text-[11px] text-muted bg-panel px-2 py-0.5 rounded border border-elevated">
                            {ex.equipment}
                          </span>
                          <span className="text-[11px] text-muted bg-panel px-2 py-0.5 rounded border border-elevated">
                            {ex.mechanics}
                          </span>
                          <span className="text-[11px] text-muted">
                            NÃ­vel: <strong className="text-strong">{ex.difficulty}</strong>
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{ex.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-[11px] text-lime-dim font-semibold bg-lime-dim/10 px-2.5 py-1 rounded-lg border border-lime-dim/20">
                        {ex.mechanics.includes('Composto') ? 'Multiarticular (Foco Carga)' : 'Isolador (Foco MetabÃ³lico)'}
                      </span>
                      <button className="p-1 rounded-lg bg-panel text-muted hover:text-white">
                        {isExpanded ? 'â–²' : 'â–¼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detailed View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-elevated space-y-3 text-xs text-strong animate-in fade-in duration-150">
                      
                      {/* Photo demonstrations if available */}
                      {ex.images && ex.images.length > 0 && (
                        <div>
                          <span className="text-[12.5px] font-bold text-muted block mb-2">DemonstraÃ§Ã£o Visual da ExecuÃ§Ã£o:</span>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {ex.images.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setShowImagePreview(img)}
                                className="w-32 h-32 rounded-xl bg-panel border border-elevated overflow-hidden shrink-0 cursor-pointer hover:border-lime transition relative"
                              >
                                <img
                                  src={img}
                                  alt={`${ex.name} fase ${idx + 1}`}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[12.5px] text-strong">
                                  Fase {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step-by-step instructions */}
                      {ex.instructions && ex.instructions.length > 0 && (
                        <div className="bg-panel/70 p-3.5 rounded-xl border border-elevated/80 space-y-1.5">
                          <strong className="text-lime text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Passo a Passo da ExecuÃ§Ã£o Correta (PT-BR):
                          </strong>
                          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-strong leading-relaxed">
                            {ex.instructions.map((step, idx) => (
                              <li key={idx} className="pl-1">
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Biomechanics & RIR Recommendation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="bg-panel/50 p-3 rounded-xl border border-elevated">
                          <strong className="text-lime-dim block mb-1 text-[12.5px]">
                            PrescriÃ§Ã£o & RIR (Belmiro de Salles):
                          </strong>
                          <p className="text-strong leading-relaxed text-[12.5px]">
                            {ex.targetRirRecommendation}
                          </p>
                        </div>

                        <div className="bg-panel/50 p-3 rounded-xl border border-elevated">
                          <strong className="text-lime-dim block mb-1 text-[12.5px]">
                            MÃºsculos SecundÃ¡rios / Sinergistas:
                          </strong>
                          <p className="text-strong text-[12.5px]">
                            {ex.secondaryMuscles && ex.secondaryMuscles.length > 0
                              ? ex.secondaryMuscles.join(', ')
                              : 'Estabilizadores do core e sinergistas especÃ­ficos.'}
                          </p>
                        </div>
                      </div>

                      {/* Swap button if passed */}
                      {onSelectExerciseToSwap && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onSelectExerciseToSwap(ex)}
                            className="px-4 py-2 rounded-xl bg-lime hover:bg-lime text-base font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 "
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>Substituir na Minha Ficha</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Load More Button if remaining */}
          {visibleCount < filtered.length && (
            <div className="pt-3 pb-6 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="px-6 py-2.5 rounded-xl bg-elevated hover:bg-line-strong text-strong text-xs font-bold transition cursor-pointer border border-line-strong "
              >
                Carregar mais exercÃ­cios (+30) â€¢ {filtered.length - visibleCount} restantes
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Full Image Preview Modal */}
      {showImagePreview && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(null)}
        >
          <div className="relative max-w-2xl max-h-photo bg-base p-2 rounded-2xl border border-elevated ">
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-elevated text-white hover:bg-line-strong cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={showImagePreview}
              alt="VisualizaÃ§Ã£o do exercÃ­cio"
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
