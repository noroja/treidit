import { ExerciseLibraryItem } from '../types';
import rawExercises from './exercises-ptbr-full.json';

interface RawExercise {
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
  id: string;
}

const muscleGroupMap: Record<string, string> = {
  'peito': 'Peitoral',
  'dorsais': 'Costas',
  'meio-das-costas': 'Costas',
  'inferior-das-costas': 'Lombar',
  'trapezio': 'Trapézio',
  'quadriceps': 'Quadríceps',
  'isquiotibiais': 'Isquiotibiais',
  'gluteos': 'Glúteos',
  'ombros': 'Deltoides',
  'biceps': 'Braços (Bíceps)',
  'triceps': 'Braços (Tríceps)',
  'antebracos': 'Braços (Antebraço)',
  'panturrilhas': 'Panturrilhas',
  'abdominais': 'Abdômen & Core',
  'adutores': 'Pernas (Adutores)',
  'abdutores': 'Pernas (Abdutores)',
  'pescoco': 'Pescoço',
};

const equipmentMap: Record<string, string> = {
  'peso-do-corpo': 'Peso Corporal',
  'barra': 'Barra Olímpica',
  'halteres': 'Halteres',
  'cabo': 'Polia / Crossover',
  'maquina': 'Máquina',
  'kettlebell': 'Kettlebell',
  'barra-w': 'Barra W / EZ',
  'faixas': 'Elásticos / Faixas',
  'bola-medicinal': 'Medicine Ball',
  'bola-de-exercicio': 'Bola Suíça',
  'rolo-de-espuma': 'Rolo de Liberação',
  'outros': 'Aparelho Específico',
};

const levelMap: Record<string, string> = {
  'iniciante': 'Iniciante',
  'intermediario': 'Intermediário',
  'especialista': 'Avançado',
};

function formatRawExercise(raw: RawExercise): ExerciseLibraryItem {
  const primaryMuscleKey = raw.primaryMuscles?.[0] || 'geral';
  const muscleGroup = muscleGroupMap[primaryMuscleKey] || (primaryMuscleKey.charAt(0).toUpperCase() + primaryMuscleKey.slice(1));
  const equipment = equipmentMap[raw.equipment] || (raw.equipment || 'Geral');
  const difficulty = levelMap[raw.level] || 'Intermediário';
  const mechanics = raw.mechanic === 'isolado' ? 'Isolador (Monoarticular)' : 'Composto (Multiarticular)';
  
  const targetRirRecommendation = raw.mechanic === 'isolado'
    ? 'RIR 0-1 (Fadiga periférica controlada, descanso de 60-90s)'
    : 'RIR 1-2 (Alta tensão mecânica, descanso de 2-3min - Belmiro de Salles)';

  const instructions = Array.isArray(raw.instructions) ? raw.instructions : [];
  const executionTips = instructions.length > 0 
    ? instructions.slice(0, 2).join(' ') 
    : 'Execute com amplitude completa mantendo controle excêntrico e postura neutra.';

  const commonMistakes = instructions.length > 2 
    ? 'Evite compensações corporais: ' + instructions[instructions.length - 1]
    : 'Evite roubar com impulsos articulares e não encurte a amplitude sob carga.';

  const imageUrls = (raw.images || []).map(
    (img) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`
  );

  return {
    id: raw.id || `ex_${Math.random()}`,
    name: raw.name,
    muscleGroup,
    equipment,
    difficulty,
    mechanics,
    executionTips,
    commonMistakes,
    targetRirRecommendation,
    instructions,
    images: imageUrls,
    primaryMuscles: raw.primaryMuscles || [],
    secondaryMuscles: raw.secondaryMuscles || [],
    force: raw.force,
    category: raw.category,
  };
}

// Full translated database of 870+ exercises from exercicios-bd-ptbr
export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = (rawExercises as RawExercise[]).map(formatRawExercise);

// Helper for muscle groups list
export const AVAILABLE_MUSCLE_GROUPS = [
  'todos',
  'Peitoral',
  'Costas',
  'Quadríceps',
  'Isquiotibiais',
  'Deltoides',
  'Glúteos',
  'Braços (Bíceps)',
  'Braços (Tríceps)',
  'Abdômen & Core',
  'Panturrilhas',
];
