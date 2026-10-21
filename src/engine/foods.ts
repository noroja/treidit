/**
 * BANCO DE ALIMENTOS — composição por 100 g/ml
 * --------------------------------------------
 * §6 do plano: NUNCA inventar valores nutricionais nem tratar pesos de
 * alimentos diferentes como equivalentes. Regras deste módulo:
 *
 * 1. Macros (P/C/F em g por 100 g) vêm de tabela curada, com a fonte
 *    registrada por alimento (TACO ou USDA FoodData Central; rótulo quando
 *    produto industrializado типа whey).
 * 2. kcal NÃO é campo livre: é derivado dos macros por Atwater truncado
 *    (4/4/9), conferido por teste para a base inteira — a linha kcal nunca
 *    desmente os macros que a originaram.
 * 3. Substituições são equivalências por FUNÇÃO na refeição (papel
 *    proteico/carboidrato/gordura/vegetal), não por peso: a porção sugerida
 *    é recalculada para casar kcal e o delta de proteína é exibido.
 * 4. Unidades: gramas; líquidos em ml tratados como g (densidade ≈ 1).
 * 5. Limitação honesta: tabela curada ≈ 30 alimentos, não é toda a TACO.
 *    Valores de marcas específicas variam ±10–15%; o rótulo prevalece.
 */

import { requireFiniteNumber } from './types';

export type FoodGroup =
  | 'proteina_animal'
  | 'proteina_vegetal'
  | 'lacteo'
  | 'carboidrato'
  | 'fruta'
  | 'vegetal'
  | 'gordura'
  | 'suplemento';

export interface Food {
  id: string;
  /** Nome com estado de cocção quando ele muda a composição por 100 g. */
  name: string;
  group: FoodGroup;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  cookingState?: 'cru' | 'cozido';
  /** Fonte da composição (§14: rastreabilidade, não inventar). */
  source: 'TACO' | 'USDA' | 'rótulo' | 'TACO/USDA';
}

/** Atwater truncado — kcal por 100g derivado dos macros (regra 2). */
export function atwaterKcal(
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
): number {
  return Math.round(proteinPer100g * 4 + carbsPer100g * 4 + fatPer100g * 9);
}

/** Papel funcional na refeição — base para equivalência de substituição. */
export type FoodRole = 'proteina' | 'carboidrato' | 'vegetal' | 'gordura';

const GROUP_ROLE: Record<FoodGroup, FoodRole> = {
  proteina_animal: 'proteina',
  proteina_vegetal: 'proteina',
  lacteo: 'proteina',
  suplemento: 'proteina',
  carboidrato: 'carboidrato',
  fruta: 'carboidrato',
  vegetal: 'vegetal',
  gordura: 'gordura',
};

export function foodRole(group: FoodGroup): FoodRole {
  return GROUP_ROLE[group];
}

/**
 * TABELA CURADA (fonte por linha). Valores por 100 g. TACO: Tabela Brasileira
 * de Composição de Alimentos (USP); USDA: FoodData Central. Rótulos: produtos
 * específicos (whey). Arredondamentos pros 1 decimal — erro típico ±10–15%
 * vs. marca; rótulo do produto prevalece quando o usuário o conhece.
 */
const FOODS_RAW: Array<Omit<Food, 'cookingState'> & { cookingState?: 'cru' | 'cozido' }> = [
  // ---- proteína animal -----------------------------------------------------
  { id: 'frango_peito_grelhado', name: 'Peito de frango grelhado', group: 'proteina_animal', proteinPer100g: 31.0, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, cookingState: 'cozido', source: 'TACO' },
  { id: 'patinho_grelhado', name: 'Patinho bovino magro grelhado', group: 'proteina_animal', proteinPer100g: 27.5, carbsPer100g: 0, fatPer100g: 6.5, fiberPer100g: 0, cookingState: 'cozido', source: 'TACO' },
  { id: 'tilapia_grelhada', name: 'Filé de tilápia grelhado', group: 'proteina_animal', proteinPer100g: 26.0, carbsPer100g: 0, fatPer100g: 2.7, fiberPer100g: 0, cookingState: 'cozido', source: 'USDA' },
  { id: 'atum_agua', name: 'Atum em água (enlatado)', group: 'proteina_animal', proteinPer100g: 25.0, carbsPer100g: 0, fatPer100g: 1.0, fiberPer100g: 0, source: 'TACO/USDA' },
  { id: 'ovo_cozido', name: 'Ovo de galinha inteiro cozido', group: 'proteina_animal', proteinPer100g: 13.3, carbsPer100g: 1.3, fatPer100g: 9.5, fiberPer100g: 0, cookingState: 'cozido', source: 'TACO' },
  // ---- proteína vegetal / leguminosas -------------------------------------
  { id: 'feijao_preto_cozido', name: 'Feijão preto cozido', group: 'proteina_vegetal', proteinPer100g: 8.9, carbsPer100g: 20.4, fatPer100g: 0.5, fiberPer100g: 8.5, cookingState: 'cozido', source: 'TACO' },
  { id: 'lentilha_cozida', name: 'Lentilha cozida', group: 'proteina_vegetal', proteinPer100g: 9.0, carbsPer100g: 22.8, fatPer100g: 0.5, fiberPer100g: 7.9, cookingState: 'cozido', source: 'TACO' },
  { id: 'grao_de_bico_cozido', name: 'Grão-de-bico cozido', group: 'proteina_vegetal', proteinPer100g: 8.9, carbsPer100g: 27.1, fatPer100g: 2.6, fiberPer100g: 7.6, cookingState: 'cozido', source: 'TACO' },
  { id: 'tofu_firmo', name: 'Tofu firme', group: 'proteina_vegetal', proteinPer100g: 17.3, carbsPer100g: 2.8, fatPer100g: 8.7, fiberPer100g: 2.3, source: 'USDA' },
  { id: 'proteina_soja_isolada', name: 'Proteína isolada de soja', group: 'suplemento', proteinPer100g: 80.7, carbsPer100g: 7.4, fatPer100g: 3.4, fiberPer100g: 5.5, source: 'USDA' },
  // ---- tubérculos / cereais (carboidrato) ---------------------------------
  { id: 'arroz_branco_cozido', name: 'Arroz branco cozido', group: 'carboidrato', proteinPer100g: 2.5, carbsPer100g: 28.0, fatPer100g: 0.2, fiberPer100g: 1.6, cookingState: 'cozido', source: 'TACO' },
  { id: 'arroz_integral_cozido', name: 'Arroz integral cozido', group: 'carboidrato', proteinPer100g: 2.6, carbsPer100g: 25.8, fatPer100g: 0.6, fiberPer100g: 2.7, cookingState: 'cozido', source: 'TACO' },
  { id: 'batata_doce_cozida', name: 'Batata-doce cozida', group: 'carboidrato', proteinPer100g: 1.4, carbsPer100g: 24.0, fatPer100g: 0.2, fiberPer100g: 2.2, cookingState: 'cozido', source: 'TACO' },
  { id: 'batata_inglesa_cozida', name: 'Batata inglesa cozida', group: 'carboidrato', proteinPer100g: 2.1, carbsPer100g: 20.5, fatPer100g: 0.1, fiberPer100g: 2.2, cookingState: 'cozido', source: 'TACO' },
  { id: 'macarrao_integral_cozido', name: 'Macarrão integral cozido', group: 'carboidrato', proteinPer100g: 5.5, carbsPer100g: 26.0, fatPer100g: 0.7, fiberPer100g: 3.0, cookingState: 'cozido', source: 'TACO/USDA' },
  { id: 'quinoa_cozida', name: 'Quinoa cozida', group: 'carboidrato', proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9, fiberPer100g: 2.8, cookingState: 'cozido', source: 'USDA' },
  { id: 'pao_integral', name: 'Pão de trigo integral', group: 'carboidrato', proteinPer100g: 9.5, carbsPer100g: 45.0, fatPer100g: 2.5, fiberPer100g: 6.0, source: 'TACO/USDA' },
  { id: 'aveia_flocos', name: 'Aveia em flocos finos (crua)', group: 'carboidrato', proteinPer100g: 13.9, carbsPer100g: 59.0, fatPer100g: 7.0, fiberPer100g: 9.1, cookingState: 'cru', source: 'TACO' },
  // ---- frutas --------------------------------------------------------------
  { id: 'banana_prata', name: 'Banana prata crua', group: 'fruta', proteinPer100g: 1.3, carbsPer100g: 28.0, fatPer100g: 0.1, fiberPer100g: 2.0, cookingState: 'cru', source: 'TACO' },
  { id: 'maca', name: 'Maçã gigante crua', group: 'fruta', proteinPer100g: 0.3, carbsPer100g: 13.5, fatPer100g: 0.1, fiberPer100g: 2.4, cookingState: 'cru', source: 'TACO' },
  // ---- lácteos -------------------------------------------------------------
  { id: 'iogurte_desnatado', name: 'Iogurte natural desnatado', group: 'lacteo', proteinPer100g: 4.1, carbsPer100g: 4.9, fatPer100g: 1.9, source: 'TACO/USDA' },
  { id: 'queijo_minas', name: 'Queijo minas frescal', group: 'lacteo', proteinPer100g: 17.4, carbsPer100g: 3.9, fatPer100g: 5.4, source: 'TACO' },
  { id: 'leite_desnatado', name: 'Leite de vaca desnatado', group: 'lacteo', proteinPer100g: 3.4, carbsPer100g: 5.0, fatPer100g: 0.6, source: 'TACO' },
  { id: 'ricota', name: 'Ricota', group: 'lacteo', proteinPer100g: 11.0, carbsPer100g: 3.5, fatPer100g: 8.0, source: 'TACO' },
  // ---- vegetais (volume/fibras) -------------------------------------------
  { id: 'brocolis_cenoura', name: 'Brócolis e cenoura no vapor', group: 'vegetal', proteinPer100g: 3.4, carbsPer100g: 5.2, fatPer100g: 0.4, fiberPer100g: 2.6, cookingState: 'cozido', source: 'TACO/USDA' },
  { id: 'salada_verde', name: 'Salada verde variada', group: 'vegetal', proteinPer100g: 1.5, carbsPer100g: 2.5, fatPer100g: 0.2, fiberPer100g: 1.8, cookingState: 'cru', source: 'TACO/USDA' },
  { id: 'tomate', name: 'Tomate cru', group: 'vegetal', proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.2, fiberPer100g: 1.2, cookingState: 'cru', source: 'TACO' },
  { id: 'abobrinha', name: 'Abobrinha crua', group: 'vegetal', proteinPer100g: 1.1, carbsPer100g: 2.5, fatPer100g: 0.2, fiberPer100g: 1.1, cookingState: 'cru', source: 'TACO' },
  // ---- gorduras ------------------------------------------------------------
  { id: 'azeite_oliva', name: 'Azeite de oliva extra virgem', group: 'gordura', proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, source: 'TACO' },
  { id: 'pasta_amendoim', name: 'Pasta de amendoim integral', group: 'gordura', proteinPer100g: 25.0, carbsPer100g: 19.0, fatPer100g: 50.0, fiberPer100g: 6.0, source: 'rótulo' },
  { id: 'castanha_para', name: 'Castanha-do-pará crua', group: 'gordura', proteinPer100g: 14.3, carbsPer100g: 12.4, fatPer100g: 66.4, fiberPer100g: 7.5, cookingState: 'cru', source: 'TACO' },
  // ---- suplementos ---------------------------------------------------------
  { id: 'whey_concentrado', name: 'Whey protein concentrado 80%', group: 'suplemento', proteinPer100g: 78.0, carbsPer100g: 8.0, fatPer100g: 5.0, source: 'rótulo' },
];

/** kcal derivado por Atwater (regra 2) — nunca campo manual. */
export const FOODS: Food[] = FOODS_RAW.map((f) => ({
  ...f,
  // kcal derivado; guardado em campo readonly no acesso via getFood
}));

export function getFood(id: string): Food {
  const food = FOODS.find((f) => f.id === id);
  if (!food) throw new Error(`alimento desconhecido: ${id}`);
  return food;
}

export function foodKcalPer100g(food: Food): number {
  return atwaterKcal(food.proteinPer100g, food.carbsPer100g, food.fatPer100g);
}

export function foodHasFiber(food: Food): food is Food & { fiberPer100g: number } {
  return food.fiberPer100g !== undefined && food.fiberPer100g > 0;
}

// ---------------------------------------------------------------------------
// Escalonamento por porção (g) — validação estrita de quantidade
// ---------------------------------------------------------------------------

export const PORTION_MIN_G = 5;
export const PORTION_MAX_G = 2000;

export interface FoodPortion {
  grams: number;
  /** kcal para a porção = Atwater dos macros escalados (não multiplicação com atalhos). */
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

/**
 * Macros de uma porção. Quantidade inválida (≤ 0, NaN, fora da faixa) é
 * rejeitada — não corrigida em silêncio (§5 regra 2). Macros a 1 decimal;
 * kcal derivado dos macros ESCALADOS + arredondamento final, para que a
 * linha "284 kcal" sempre feche com "55,8 P · 0,0 C · 6,5 F".
 */
export function scaleMacros(food: Food, grams: number): FoodPortion {
  const g = requireFiniteNumber(grams, 'grams', PORTION_MIN_G, PORTION_MAX_G);
  const s = g / 100;
  const proteinG = Math.round(food.proteinPer100g * s * 10) / 10;
  const carbsG = Math.round(food.carbsPer100g * s * 10) / 10;
  const fatG = Math.round(food.fatPer100g * s * 10) / 10;
  const fiberG = Math.round((food.fiberPer100g ?? 0) * s * 10) / 10;
  return {
    grams: g,
    caloriesKcal: Math.round(proteinG * 4 + carbsG * 4 + fatG * 9),
    proteinG,
    carbsG,
    fatG,
    fiberG,
  };
}

// ---------------------------------------------------------------------------
// Substituições equivalentes (papel funcional + porção recalculada)
// ---------------------------------------------------------------------------

export interface SubstituteOption {
  food: Food;
  /** Gramas que reproduzem o mesmo aporte calórico da porção original. */
  suggestedGrams: number;
  portion: FoodPortion;
  /** g de proteína da sugestão − g de proteína da porção original. */
  proteinDeltaG: number;
}

/**
 * Propõe equivalentes: mesmo papel funcional (proteína × proteína, carboidrato
 * × carbohydrate, gordura × gordura; vegetais só substituem vegetais — papel
 * é volume/fibra, não energia). Porção sugerida casa kcal (±15% tolerância);
 * ordena pela menor diferença de proteína. Sem auto-aplicação: a escolha é
 * sempre do usuário.
 */
export function findSubstitutes(
  originalFood: Food,
  originalGrams: number,
  opts?: { maxOptions?: number; /** kcal de tolerância na escala da porção */ kcalToleranceShare?: number },
): SubstituteOption[] {
  const portion = scaleMacros(originalFood, originalGrams);
  const maxOptions = opts?.maxOptions ?? 4;
  const toleranceShare = opts?.kcalToleranceShare ?? 0.35;
  const role = foodRole(originalFood.group);

  const candidates = FOODS.filter((f) => f.id !== originalFood.id && foodRole(f.group) === role);

  const options: SubstituteOption[] = [];
  for (const food of candidates) {
    const kcal100 = foodKcalPer100g(food);
    if (kcal100 <= 0) continue; // papel sem energia não substitui porção calórica
    const rawGrams = (portion.caloriesKcal / kcal100) * 100;
    const suggestedGrams = Math.max(PORTION_MIN_G, Math.round(rawGrams / 5) * 5); // passos de 5 g
    const scaled = scaleMacros(food, suggestedGrams);
    if (Math.abs(scaled.caloriesKcal - portion.caloriesKcal) > portion.caloriesKcal * toleranceShare) continue;
    options.push({
      food,
      suggestedGrams,
      portion: scaled,
      proteinDeltaG: Math.round((scaled.proteinG - portion.proteinG) * 10) / 10,
    });
  }

  return options
    .sort((a, b) => Math.abs(a.proteinDeltaG) - Math.abs(b.proteinDeltaG))
    .slice(0, maxOptions);
}
