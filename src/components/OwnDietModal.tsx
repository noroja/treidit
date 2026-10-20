import React, { useMemo, useState } from 'react';
import { ChefHat, X, Check, Flame } from 'lucide-react';
import { NutritionPlan, UserProfile } from '../types';
import { validateUserTargets } from '../engine/macros';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface OwnDietModalProps {
  nutrition: NutritionPlan;
  profile: UserProfile;
  onClose: () => void;
  onApplyUserDiet: (macros: { proteinGrams: number; carbsGrams: number; fatGrams: number }) => void;
}

/**
 * "Manter a dieta que já uso": o usuário informa proteína/carboidrato/gordura
 * (g). As calorias NUNCA são digitadas — o motor as deriva por Atwater 4/4/9 e
 * rejeita extremos (gordura < 0,6 g/kg, proteína fora de [0,6; 3,5] g/kg,
 * abaixo do piso calórico por sexo). Usuário no comando, auditado pelo motor.
 */
export const OwnDietModal: React.FC<OwnDietModalProps> = ({ nutrition, profile, onClose, onApplyUserDiet }) => {
  useLockBodyScroll(true);

  const [proteinGrams, setProteinGrams] = useState(String(nutrition.targetMacros.proteinGrams));
  const [carbsGrams, setCarbsGrams] = useState(String(nutrition.targetMacros.carbsGrams));
  const [fatGrams, setFatGrams] = useState(String(nutrition.targetMacros.fatGrams));
  const [error, setError] = useState<string | null>(null);

  const derived = useMemo(() => {
    const p = Number(proteinGrams) || 0;
    const c = Number(carbsGrams) || 0;
    const f = Number(fatGrams) || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  }, [proteinGrams, carbsGrams, fatGrams]);

  const floor = profile.gender === 'feminino' ? 1200 : 1500;
  const protPerKg = Number(proteinGrams) / profile.weightKg;
  const fatPerKg = Number(fatGrams) / profile.weightKg;

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (Number(Number(proteinGrams)) >= 0 && (protPerKg < 0.6 || protPerKg > 3.5)) {
      list.push(`Proteína ${protPerKg.toFixed(2)} g/kg fora de [0,6 ; 3,5] g/kg.`);
    }
    if (fatPerKg < 0.6) list.push(`Gordura ${fatPerKg.toFixed(2)} g/kg abaixo do mínimo de 0,6 g/kg.`);
    if (derived > 0 && derived < floor) list.push(`Piso calórico de ${floor} kcal.`);
    return list;
  }, [protPerKg, fatPerKg, derived, floor, proteinGrams]);

  const handleSave = () => {
    try {
      validateUserTargets(profile.weightKg, profile.gender, {
        proteinGrams: Number(proteinGrams),
        carbsGrams: Number(carbsGrams),
        fatGrams: Number(fatGrams),
      });
      onApplyUserDiet({
        proteinGrams: Number(proteinGrams),
        carbsGrams: Number(carbsGrams),
        fatGrams: Number(fatGrams),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Metas inválidas.');
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void, hint: string) => (
    <label className="block">
      <span className="block text-[11px] font-bold text-muted uppercase tracking-wide">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-base border border-line rounded-xl px-3 py-2.5 text-[16px] font-bold text-white focus:outline-none focus:border-lime/50"
      />
      <span className="text-[10.5px] text-muted">{hint}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto safe-bottom">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="bg-base p-4 border-b border-elevated flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/25 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-lime" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manter minha dieta atual</h2>
              <p className="text-[12.5px] text-muted">Diga os macros que você já usa e mantenha — o app só audita.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-muted hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          <p className="text-[12px] text-muted">
            Informe macronutrientes em <span className="text-strong font-semibold">gramas/dia</span>. As calorias são
            derivadas por Atwater 4/4/9 — nunca digitadas — para consistência energética.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {field('Proteína (g)', proteinGrams, setProteinGrams, `${isNaN(protPerKg) ? '0' : protPerKg.toFixed(2)} g/kg`)}
            {field('Carbo (g)', carbsGrams, setCarbsGrams, `${((Number(carbsGrams) || 0) / profile.weightKg).toFixed(2)} g/kg`)}
            {field('Gordura (g)', fatGrams, setFatGrams, `${isNaN(fatPerKg) ? '0' : fatPerKg.toFixed(2)} g/kg`)}
          </div>

          <div className="bg-base/60 border border-line rounded-xl p-3 flex items-center justify-between">
            <span className="text-[12.5px] text-muted flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-lime" /> Calorias derivadas
            </span>
            <span className="text-lg font-bold text-lime">
              {derived.toLocaleString('pt-BR')} <span className="text-[11px] text-muted">kcal</span>
            </span>
          </div>

          {warnings.length > 0 && (
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-[12px] text-amber-300/90 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-1.5">
                  ⚠ {w}
                </li>
              ))}
            </ul>
          )}

          <div className="bg-lime/5 border border-lime/20 rounded-xl p-3 text-[11.5px] text-muted space-y-1">
            <p className="text-lime font-bold text-[12px]">Limites de segurança do motor</p>
            <p>· Gordura mínima 0,6 g/kg (esteroidogênese)</p>
            <p>· Proteína dentro de 0,6–3,5 g/kg</p>
            <p>· Piso calórico: 1.500 kcal (M) / 1.200 kcal (F)</p>
          </div>
        </div>

        <div className="bg-base border-t border-elevated p-4 safe-bottom">
          {error && (
            <p className="mb-2 text-[12.5px] text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-white bg-panel border border-line cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-5 py-2.5 bg-lime hover:bg-lime text-base font-bold text-xs rounded-xl active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Aplicar minha dieta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
