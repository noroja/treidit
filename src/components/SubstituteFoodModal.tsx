import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useMemo, useState } from 'react';
import { X, Search, Repeat, Plus, ScanLine } from 'lucide-react';
import type { MealItem } from '../types';
import {
  FOODS,
  getFood,
  foodKcalPer100g,
  foodRole,
  scaleMacros,
  findSubstitutes,
  type FoodGroup,
} from '../engine/foods';

type PickerMode = 'substituir' | 'adicionar' | 'porcao';

interface SubstituteFoodModalProps {
  mode: PickerMode;
  mealName: string;
  /** Item original (substituir / porÃ§Ã£o). Opcional: base para equivalÃªncias. */
  targetItem?: MealItem;
  onClose: () => void;
  /** Item pronto para o chamador aplicar (substituir/substituir por/adicionar). */
  onCommit: (item: MealItem) => void;
}

const ROLE_CHIP_LABEL: Record<'proteina' | 'carboidrato' | 'vegetal' | 'gordura', string> = {
  proteina: 'ProteÃ­na',
  carboidrato: 'Carbo',
  vegetal: 'Vegetal',
  gordura: 'Gordura',
};

const GROUP_ROLE_MAP: Record<FoodGroup, 'proteina' | 'carboidrato' | 'vegetal' | 'gordura'> = {
  proteina_animal: 'proteina',
  proteina_vegetal: 'proteina',
  lacteo: 'proteina',
  suplemento: 'proteina',
  carboidrato: 'carboidrato',
  fruta: 'carboidrato',
  vegetal: 'vegetal',
  gordura: 'gordura',
};

const GROUP_ORDER: FoodGroup[] = [
  'proteina_animal',
  'proteina_vegetal',
  'lacteo',
  'suplemento',
  'carboidrato',
  'fruta',
  'vegetal',
  'gordura',
];

export const SubstituteFoodModal: React.FC<SubstituteFoodModalProps> = ({
  mode,
  mealName,
  targetItem,
  onClose,
  onCommit,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'proteina' | 'carboidrato' | 'vegetal' | 'gordura'>('todos');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [grams, setGrams] = useState<number>(() => {
    if (targetItem?.grams) return targetItem.grams;
    if (mode === 'adicionar') return 100;
    return 100;
  });

  // Modo porÃ§Ã£o: item jÃ¡ vem prÃ©-selecionado do banco (chamador garante foodId).
  React.useEffect(() => {
    if (mode === 'porcao' && targetItem?.foodId) {
      setSelectedFoodId(targetItem.foodId);
      setGrams(targetItem.grams ?? 100);
    }
  }, [mode, targetItem]);

  // EquivalÃªncias diretas (substituir com foodId): opÃ§Ãµes do motor primeiro.
  const sugeridas = useMemo(() => {
    if (mode === 'substituir' && targetItem?.foodId) {
      try {
        const food = getFood(targetItem.foodId);
        return findSubstitutes(food, targetItem.grams ?? 100);
      } catch {
        return [];
      }
    }
    return null;
  }, [mode, targetItem]);

  const visibleFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = FOODS.filter((f) => {
      if (sugeridas && sugeridas.some((s) => s.food.id === f.id)) return false;
      if (roleFilter !== 'todos' && GROUP_ROLE_MAP[f.group] !== roleFilter) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  }, [search, roleFilter, sugeridas]);

  const selectedFood = selectedFoodId ? getFood(selectedFoodId) : null;
  const preview = useMemo(() => {
    if (!selectedFood) return null;
    try {
      return scaleMacros(selectedFood, grams);
    } catch {
      return null;
    }
  }, [selectedFood, grams]);

  const commitItem = (): void => {
    if (!selectedFood || !preview) return;
    onCommit({
      id:
        mode === 'porcao' && targetItem
          ? targetItem.id
          : `fd_${selectedFood.id}_${Math.round(grams)}_${Date.now()}`,
      name: selectedFood.name,
      portion: `${grams}g`,
      calories: preview.caloriesKcal,
      protein: preview.proteinG,
      carbs: preview.carbsG,
      fat: preview.fatG,
      fiber: preview.fiberG > 0 ? preview.fiberG : undefined,
      foodId: selectedFood.id,
      grams,
    });
  };

  const title = mode === 'substituir' ? 'Substituir alimento' : mode === 'adicionar' ? 'Adicionar alimento' : 'Ajustar porÃ§Ã£o';

  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-panel border border-line-strong rounded-2xl w-full max-w-lg flex flex-col max-h-modal">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {mode === 'adicionar' ? <Plus className="w-4 h-4 text-lime" /> : mode === 'porcao' ? <ScanLine className="w-4 h-4 text-lime" /> : <Repeat className="w-4 h-4 text-lime" />}
              {title}
            </h2>
            <p className="text-[12.5px] text-muted mt-0.5">
              {mode === 'substituir' && targetItem ? (
                <>Trocar <span className="text-strong font-semibold">{targetItem.name}</span> ({targetItem.portion}) em {mealName}</>
              ) : (
                <>em {mealName}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-elevated flex items-center justify-center text-muted hover:text-white transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* EquivalÃªncias sugeridas pelo motor */}
        {sugeridas && sugeridas.length > 0 && (
          <div className="px-5 pb-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-faint">EquivalÃªncias (mesma funÃ§Ã£o, kcal aproximada)</span>
            {sugeridas.map((s) => (
              <button
                key={s.food.id}
                onClick={() => {
                  setSelectedFoodId(s.food.id);
                  setGrams(s.suggestedGrams);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedFoodId === s.food.id
                    ? 'bg-lime/10 border-lime/40'
                    : 'bg-base/60 border-elevated hover:border-line-strong'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-strong block">{s.food.name}</span>
                  <span className="text-[12.5px] text-muted font-mono">
                    {s.suggestedGrams}g Â· {s.portion.caloriesKcal} kcal Â· {s.portion.proteinG}g P
                    <span className={s.proteinDeltaG >= 0 ? 'text-lime-dim' : 'text-danger'}>
                      {' '}({s.proteinDeltaG >= 0 ? '+' : ''}{s.proteinDeltaG}g P)
                    </span>
                  </span>
                </div>
                <span className="text-[11px] text-faint">{s.food.source}</span>
              </button>
            ))}
          </div>
        )}

        {/* Busca + filtro por papel */}
        {mode !== 'porcao' && (
          <div className="px-5 space-y-2 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alimentoâ€¦"
                className="field w-full pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['todos', 'proteina', 'carboidrato', 'vegetal', 'gordura'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    roleFilter === r
                      ? 'bg-lime text-base font-bold'
                      : 'bg-elevated text-muted hover:bg-line-strong'
                  }`}
                >
                  {r === 'todos' ? 'Todos' : ROLE_CHIP_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de alimentos (rolÃ¡vel) */}
        {mode !== 'porcao' && (
          <div className="flex-1 overflow-y-auto px-5 space-y-1.5 py-2">
            {visibleFoods.length === 0 && (
              <p className="text-xs text-muted text-center py-6">Nenhum alimento na base curada. A tabela cobre os alimentos comuns do plano (TACO/USDA/rÃ³tulo).</p>
            )}
            {visibleFoods.map((f) => {
              const kcal100 = foodKcalPer100g(f);
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFoodId(f.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedFoodId === f.id
                      ? 'bg-lime/10 border-lime/40'
                      : 'bg-base/60 border-elevated hover:border-line-strong'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-strong block">{f.name}</span>
                    <span className="text-[12.5px] text-muted font-mono">
                      por 100g: {kcal100} kcal Â· {f.proteinPer100g}g P Â· {f.carbsPer100g}g C Â· {f.fatPer100g}g F
                    </span>
                  </div>
                  <span className="text-[11px] text-faint shrink-0 ml-2">{f.source}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* PorÃ§Ã£o + preview + confirmar */}
        <div className="p-5 pt-3 border-t border-elevated/60 space-y-3">
          {selectedFood && (            <div className="bg-base/70 border border-elevated rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-lime-dim">{selectedFood.name}</span>
                <span className="text-[12.5px] text-faint font-mono">
                  {foodRole(selectedFood.group)} Â· {selectedFood.source}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGrams((g) => Math.max(5, g - 10))}
                  className="w-8 h-8 rounded-lg bg-elevated text-strong hover:bg-line-strong transition cursor-pointer font-bold"
                  aria-label="Reduzir porÃ§Ã£o"
                >
                  âˆ’
                </button>
                <input
                  type="number"
                  value={grams}
                  min={5}
                  max={2000}
                  onChange={(e) => {
                    const v = e.target.value === '' ? NaN : Number(e.target.value);
                    if (!Number.isNaN(v)) setGrams(Math.min(2000, Math.max(5, v)));
                  }}
                  className="field flex-1 text-center font-mono"
                />
                <button
                  onClick={() => setGrams((g) => Math.min(2000, g + 10))}
                  className="w-8 h-8 rounded-lg bg-elevated text-strong hover:bg-line-strong transition cursor-pointer font-bold"
                  aria-label="Aumentar porÃ§Ã£o"
                >
                  +
                </button>
              </div>
              {preview && (
                <p className="text-[12.5px] text-muted font-mono mt-2 text-center">
                  <span className="text-lime font-bold">{preview.caloriesKcal} kcal</span>
                  {' Â· '}{preview.proteinG}g P Â· {preview.carbsG}g C Â· {preview.fatG}g F
                  {preview.fiberG > 0 && ` Â· ${preview.fiberG}g fibra`}
                </p>
              )}
            </div>
          )}

          <button
            onClick={commitItem}
            disabled={!selectedFood || !preview}
            className={`btn-lime w-full py-2.5 ${!selectedFood || !preview ? 'opacity-40 pointer-events-none' : ''}`}
          >
            {mode === 'adicionar' ? 'Adicionar Ã  refeiÃ§Ã£o' : mode === 'porcao' ? 'Salvar porÃ§Ã£o' : 'Substituir alimento'}
          </button>
        </div>
      </div>
    </div>
  );
};
