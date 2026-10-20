import React, { useState } from 'react';
import {
  Flame, Utensils, Droplets, Plus, Check, CheckCircle2, Circle,
  Sparkles, Info, ShieldCheck, HeartPulse, BatteryCharging, Smile,
  Repeat, Pencil, Trash2
} from 'lucide-react';
import { NutritionPlan, DailyNutritionLog, UserProfile, MealItem } from '../types';
import { sumMealItems, mealVsTarget } from '../engine/meals';
import { SubstituteFoodModal } from './SubstituteFoodModal';

type PickerState = {
  mealId: string;
  mealCompleted: boolean;
  mode: 'substituir' | 'adicionar' | 'porcao';
  item?: MealItem;
} | null;

interface NutritionViewProps {
  nutrition: NutritionPlan;
  todayNutrition: DailyNutritionLog;
  profile: UserProfile;
  onUpdateNutritionLog: (log: DailyNutritionLog) => void;
  onToggleMealCompleted: (mealId: string) => void;
  onAddWater: (amountMl: number) => void;
  onUpdateMealItems: (mealId: string, items: MealItem[]) => void;
  onOpenAi: () => void;
  onOpenAdaptive: () => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  nutrition,
  todayNutrition,
  profile,
  onUpdateNutritionLog,
  onToggleMealCompleted,
  onAddWater,
  onUpdateMealItems,
  onOpenAi,
  onOpenAdaptive,
}) => {
  const [adherenceScore, setAdherenceScore] = useState<number>(todayNutrition.adherenceScore || 5);
  const [hungerLevel, setHungerLevel] = useState<'baixa' | 'moderada' | 'alta'>(todayNutrition.hungerLevel || 'moderada');
  const [satietyLevel, setSatietyLevel] = useState<'ruim' | 'boa' | 'excelente'>(todayNutrition.satietyLevel || 'boa');
  const [energyLevel, setEnergyLevel] = useState<'baixa' | 'normal' | 'alta'>(todayNutrition.energyLevel || 'alta');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);

  const calPercent = Math.min(100, Math.round((todayNutrition.consumedCalories / nutrition.targetMacros.calories) * 100));
  const protPercent = Math.min(100, Math.round((todayNutrition.consumedProtein / nutrition.targetMacros.proteinGrams) * 100));
  const carbPercent = Math.min(100, Math.round((todayNutrition.consumedCarbs / nutrition.targetMacros.carbsGrams) * 100));
  const fatPercent = Math.min(100, Math.round((todayNutrition.consumedFat / nutrition.targetMacros.fatGrams) * 100));
  const waterPercent = Math.min(100, Math.round((todayNutrition.consumedWaterMl / nutrition.hydrationTargetMl) * 100));

  const proteinPerKg = (nutrition.targetMacros.proteinGrams / profile.weightKg).toFixed(1);

  const handleSaveFeedback = () => {
    onUpdateNutritionLog({
      ...todayNutrition,
      adherenceScore,
      hungerLevel,
      satietyLevel,
      energyLevel,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Energetic Prescription Banner */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs  font-extrabold  px-2.5 py-0.5 rounded-full bg-lime-dim/15 text-lime-dim border border-lime-dim/30">
                Estratégia: {nutrition.dietStrategy === 'deficit' ? 'Déficit Calórico' : nutrition.dietStrategy === 'superavit' ? 'Superávit Calórico' : 'Manutenção'}
              </span>
              <span className="text-xs text-muted">
                Delta: <strong className="text-white">{nutrition.calorieDelta > 0 ? `+${nutrition.calorieDelta}` : nutrition.calorieDelta} kcal</strong>
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Plano Nutricional Individualizado</h1>
            <p className="text-xs text-muted mt-1 max-w-2xl">
              Cálculos termodinâmicos ajustados à sua taxa metabólica, intensidade de treinamento e meta de composição corporal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAdaptive}
              className="px-3.5 py-2 rounded-xl bg-elevated hover:bg-line-strong border border-line-strong text-xs font-semibold text-strong transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-lime" />
              <span>Auditar Calorias</span>
            </button>
          </div>
        </div>

        {/* Metabolic Diagnostics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-elevated/80 text-xs">
          <div className="bg-base/60 p-3 rounded-xl border border-elevated/60">
            <span className="text-muted text-[12.5px] block">TMB (Metabolismo Basal)</span>
            <strong className="text-white text-base font-bold">{nutrition.bmr} kcal</strong>
            <span className="text-[11px] text-faint block">Fórmula Mifflin-St Jeor</span>
          </div>

          <div className="bg-base/60 p-3 rounded-xl border border-elevated/60">
            <span className="text-muted text-[12.5px] block">GET (Gasto Total Diário)</span>
            <strong className="text-lime-dim text-base font-bold">{nutrition.tdee} kcal</strong>
            <span className="text-[11px] text-faint block">Com treino {profile.frequencyDays}x/sem</span>
          </div>

          <div className="bg-base/60 p-3 rounded-xl border border-elevated/60">
            <span className="text-muted text-[12.5px] block">Meta Calórica Prescrita</span>
            <strong className="text-lime-dim text-base font-bold">{nutrition.targetMacros.calories} kcal</strong>
            <span className="text-[11px] text-faint block">Alvo diário balanceado</span>
          </div>

          <div className="bg-base/60 p-3 rounded-xl border border-elevated/60">
            <span className="text-muted text-[12.5px] block">Aporte Proteico</span>
            <strong className="text-danger text-base font-bold">{proteinPerKg} g/kg</strong>
            <span className="text-[11px] text-faint block">Total: {nutrition.targetMacros.proteinGrams}g/dia</span>
          </div>
        </div>
      </div>

      {/* Daily Macros Tracking Progress Cards */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-lime" />
            Progresso de Ingestão de Hoje
          </h2>
          <span className="text-xs text-muted">{todayNutrition.consumedCalories} / {nutrition.targetMacros.calories} kcal ({calPercent}%)</span>
        </div>

        {/* Main Calorie Bar */}
        <div className="w-full h-3 bg-base rounded-full overflow-hidden p-0.5 border border-elevated">
          <div
            className="h-full bg-lime rounded-full transition-all duration-500"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* 4 Macros Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Protein */}
          <div className="bg-base/80 p-3 rounded-xl border border-elevated/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-danger font-bold">Proteína</span>
              <span className="text-[12.5px] text-muted">{protPercent}%</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {todayNutrition.consumedProtein} <span className="text-xs font-normal text-muted">/ {nutrition.targetMacros.proteinGrams}g</span>
            </div>
            <div className="w-full h-1.5 bg-elevated rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: `${protPercent}%` }} />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-base/80 p-3 rounded-xl border border-elevated/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-lime-dim font-bold">Carboidratos</span>
              <span className="text-[12.5px] text-muted">{carbPercent}%</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {todayNutrition.consumedCarbs} <span className="text-xs font-normal text-muted">/ {nutrition.targetMacros.carbsGrams}g</span>
            </div>
            <div className="w-full h-1.5 bg-elevated rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-lime-dim rounded-full" style={{ width: `${carbPercent}%` }} />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-base/80 p-3 rounded-xl border border-elevated/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-lime-dim font-bold">Gorduras</span>
              <span className="text-[12.5px] text-muted">{fatPercent}%</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {todayNutrition.consumedFat} <span className="text-xs font-normal text-muted">/ {nutrition.targetMacros.fatGrams}g</span>
            </div>
            <div className="w-full h-1.5 bg-elevated rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-lime-dim rounded-full" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>

          {/* Water */}
          <div className="bg-base/80 p-3 rounded-xl border border-elevated/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-lime-dim font-bold flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Água
              </span>
              <span className="text-[12.5px] text-muted">{waterPercent}%</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {todayNutrition.consumedWaterMl} <span className="text-xs font-normal text-muted">/ {nutrition.hydrationTargetMl}ml</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => onAddWater(250)}
                className="flex-1 py-0.5 rounded bg-lime-dim/15 hover:bg-lime-dim/25 text-lime-dim text-[11px] font-bold transition cursor-pointer"
              >
                +250ml
              </button>
              <button
                onClick={() => onAddWater(500)}
                className="flex-1 py-0.5 rounded bg-lime-dim/15 hover:bg-lime-dim/25 text-lime-dim text-[11px] font-bold transition cursor-pointer"
              >
                +500ml
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Refeições Estruturadas do Dia */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-lime" />
              Distribuição de Refeições Prescritas
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Alimentos nutritivos distribuídos para maximizar a síntese proteica (MPS) e níveis de energia estáveis.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {nutrition.meals.map((meal, idx) => (
            <div
              key={meal.id}
              className={`border rounded-xl p-4 transition ${
                meal.completed
                  ? 'bg-base/40 border-elevated/60 opacity-90'
                  : 'bg-base/80 border-elevated'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onToggleMealCompleted(meal.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      meal.completed
                        ? 'bg-lime text-base  '
                        : 'border border-line-strong hover:border-faint text-faint'
                    }`}
                  >
                    {meal.completed ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <h3 className={`text-sm font-bold ${meal.completed ? 'text-strong line-through' : 'text-white'}`}>
                      {meal.name}
                    </h3>
                    <span className="text-[12.5px] text-muted font-mono">Horário sugerido: {meal.time}</span>
                  </div>
                </div>

                <div className="text-xs text-muted">
                  Meta: <strong className="text-lime-dim font-mono">~{meal.targetCalories} kcal</strong>
                </div>
              </div>

              {/* Items in meal — com ações e totais derivados dos itens (motor de refeições) */}
              <div className="space-y-1.5 pl-8 text-xs">
                {meal.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-panel/60 border border-elevated/40 gap-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-strong truncate">{item.name}</span>
                      <span className="text-muted text-[12.5px] shrink-0">({item.portion})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-muted font-mono text-[12.5px] flex items-center gap-2">
                        <span>{item.calories} kcal</span>
                        <span>•</span>
                        <span className="text-danger">{item.protein}g P</span>
                        <span>•</span>
                        <span className="text-lime-dim">{item.carbs}g C</span>
                        <span>•</span>
                        <span className="text-lime-dim">{item.fat}g G</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPicker({ mealId: meal.id, mealCompleted: meal.completed, mode: 'substituir', item })}
                          title="Substituir por equivalente"
                          className="w-6 h-6 rounded-md bg-elevated/80 flex items-center justify-center text-muted hover:text-lime hover:bg-line-strong transition cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>
                        {item.foodId && (
                          <button
                            onClick={() => setPicker({ mealId: meal.id, mealCompleted: meal.completed, mode: 'porcao', item })}
                            title="Ajustar porção"
                            className="w-6 h-6 rounded-md bg-elevated/80 flex items-center justify-center text-muted hover:text-lime hover:bg-line-strong transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onUpdateMealItems(
                              meal.id,
                              meal.items.filter((i) => i.id !== item.id)
                            )
                          }
                          title="Remover"
                          className="w-6 h-6 rounded-md bg-elevated/80 flex items-center justify-center text-muted hover:text-danger hover:bg-line-strong transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totais da refeição vs. meta — SOMA dos itens, nunca digitada */}
                {(() => {
                  const totals = sumMealItems(meal.items);
                  const delta = mealVsTarget(meal);
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 px-2">
                      <button
                        onClick={() => setPicker({ mealId: meal.id, mealCompleted: meal.completed, mode: 'adicionar' })}
                        className="px-2.5 py-1 rounded-lg bg-elevated/70 border border-dashed border-line-strong text-muted hover:text-lime hover:border-lime/40 text-[12.5px] font-semibold transition cursor-pointer flex items-center gap-1.5 self-start"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar alimento
                      </button>
                      <div className="text-[12.5px] font-mono text-muted">
                        Σ {totals.caloriesKcal} kcal · {totals.proteinG}g P · {totals.carbsG}g C · {totals.fatG}g G
                        <span className={delta.overKcal > 40 ? 'text-danger' : delta.overKcal < -40 ? 'text-lime-dim' : 'text-faint'}>
                          {' '}(~{delta.percentOfTarget}% da meta de ~{meal.targetCalories} kcal)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acompanhamento Nutricional & Feedback Subjetivo (Fome, Saciedade, Energia, Adesão) */}
      <div className="bg-panel border border-elevated rounded-2xl p-5  space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-lime" />
            Check-in de Resposta Nutricional do Dia
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Esses dados são diretamente processados pelo Motor Adaptativo para evitar cortes calóricos arbitrários.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Adherence */}
          <div className="bg-base p-3 rounded-xl border border-elevated">
            <label className="text-strong font-semibold block mb-2">Adesão ao Plano (1 a 5)</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setAdherenceScore(star)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs cursor-pointer transition ${
                    adherenceScore >= star
                      ? 'bg-lime text-base'
                      : 'bg-elevated text-faint hover:bg-line-strong'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-faint mt-1 block">
              {adherenceScore === 5 ? '100% no plano' : adherenceScore >= 3 ? 'Adesão moderada' : 'Fuga da dieta'}
            </span>
          </div>

          {/* Hunger */}
          <div className="bg-base p-3 rounded-xl border border-elevated">
            <label className="text-strong font-semibold block mb-2">Nível de Fome</label>
            <div className="grid grid-cols-3 gap-1">
              {(['baixa', 'moderada', 'alta'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setHungerLevel(level)}
                  className={`py-1.5 rounded-lg text-xs capitalize transition cursor-pointer font-medium ${
                    hungerLevel === level
                      ? 'bg-lime-dim text-base font-bold'
                      : 'bg-elevated text-strong hover:bg-line-strong'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-faint mt-1 block">Sinal de adaptação grelina</span>
          </div>

          {/* Satiety */}
          <div className="bg-base p-3 rounded-xl border border-elevated">
            <label className="text-strong font-semibold block mb-2">Saciedade Pós-Refeição</label>
            <div className="grid grid-cols-3 gap-1">
              {(['ruim', 'boa', 'excelente'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSatietyLevel(level)}
                  className={`py-1.5 rounded-lg text-xs capitalize transition cursor-pointer font-medium ${
                    satietyLevel === level
                      ? 'bg-lime-dim text-base font-bold'
                      : 'bg-elevated text-strong hover:bg-line-strong'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-faint mt-1 block">Volume e fibras adequadas</span>
          </div>

          {/* Energy */}
          <div className="bg-base p-3 rounded-xl border border-elevated">
            <label className="text-strong font-semibold block mb-2">Nível de Disposição</label>
            <div className="grid grid-cols-3 gap-1">
              {(['baixa', 'normal', 'alta'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={`py-1.5 rounded-lg text-xs capitalize transition cursor-pointer font-medium ${
                    energyLevel === level
                      ? 'bg-lime text-base font-bold'
                      : 'bg-elevated text-strong hover:bg-line-strong'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-faint mt-1 block">Rendimento muscular</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedFeedback && (
            <span className="text-xs text-lime font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Check-in registrado com sucesso!
            </span>
          )}
          <button
            onClick={handleSaveFeedback}
            className="ml-auto px-4 py-2 bg-lime hover:bg-lime text-base text-xs font-bold rounded-xl transition   active:scale-95 cursor-pointer"
          >
            Salvar Resposta do Dia
          </button>
        </div>
      </div>

      {/* Modal de alimento: substituir / adicionar / porção — motor nutricional */}
      {picker && (() => {
        const meal = nutrition.meals.find((m) => m.id === picker.mealId);
        if (!meal) return null;
        const commit = (item: MealItem) => {
          const synced: MealItem = {
            ...item,
            completed: picker.mealCompleted,
          };
          if (picker.mode === 'adicionar') {
            onUpdateMealItems(picker.mealId, [...meal.items, synced]);
          } else if (picker.mode === 'porcao') {
            onUpdateMealItems(picker.mealId, meal.items.map((i) => (i.id === synced.id ? synced : i)));
          } else {
            const withoutOriginal = meal.items.filter(
              (i) => !picker.item || i.id !== picker.item.id
            );
            onUpdateMealItems(picker.mealId, [...withoutOriginal, synced]);
          }
          setPicker(null);
        };
        return (
          <SubstituteFoodModal
            mode={picker.mode}
            mealName={meal.name}
            targetItem={picker.item}
            onClose={() => setPicker(null)}
            onCommit={commit}
          />
        );
      })()}
    </div>
  );
};
