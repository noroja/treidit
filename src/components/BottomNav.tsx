import React from 'react';
import { Home, Dumbbell, Utensils, LineChart, User, Plus } from 'lucide-react';

export type TabType = 'inicio' | 'treino' | 'dieta' | 'evolucao' | 'metodologia' | 'perfil';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onStartWorkout: () => void;
}

const navItems = [
  { id: 'inicio' as TabType, label: 'Início', icon: Home },
  { id: 'treino' as TabType, label: 'Treino', icon: Dumbbell },
  { id: 'dieta' as TabType, label: 'Nutrição', icon: Utensils },
  { id: 'evolucao' as TabType, label: 'Evolução', icon: LineChart },
  { id: 'perfil' as TabType, label: 'Perfil', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, onStartWorkout }) => {
  const left = navItems.slice(0, 2);
  const right = navItems.slice(2);

  const item = (entry: (typeof navItems)[number]) => {
    const Icon = entry.icon;
    const isActive = currentTab === entry.id;
    return (
      <button
        key={entry.id}
        onClick={() => onSelectTab(entry.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-2 transition ${
          isActive ? 'text-lime' : 'text-faint hover:text-strong'
        }`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.4 : 1.9} />
        <span className="truncate text-[11.5px] font-medium leading-none">{entry.label}</span>
      </button>
    );
  };

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#0a0c08]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center px-2 pb-1.5 pt-1">
        {left.map(item)}

        <div className="flex w-[64px] shrink-0 justify-center">
          <button
            onClick={onStartWorkout}
            aria-label="Iniciar treino de hoje"
            title="Iniciar treino de hoje"
            className="-mt-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-lime text-lime-ink transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>

        {right.map(item)}
      </div>
    </nav>
  );
};
