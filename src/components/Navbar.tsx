import React from 'react';
import { Sparkles, BrainCircuit, Activity, Dumbbell, BookOpen } from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { NotificationDropdown } from './NotificationDropdown';
import { Wordmark } from './ui/Brand';

interface NavbarProps {
  profile: UserProfile;
  notifications: AppNotification[];
  onOpenAiChat: () => void;
  onOpenAdaptive: () => void;
  onOpenProfile: () => void;
  onOpenCheckin: () => void;
  onOpenExerciseLibrary: () => void;
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onSelectActionTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  notifications,
  onOpenAiChat,
  onOpenAdaptive,
  onOpenProfile,
  onOpenCheckin,
  onOpenExerciseLibrary,
  onMarkNotificationRead,
  onClearNotifications,
  onSelectActionTab,
}) => {
  const goalLabels: Record<string, string> = {
    hipertrofia: 'Hipertrofia',
    perda_gordura: 'Perda de gordura',
    recomposicao: 'Recomposição',
    manutencao: 'Manutenção',
    ganho_peso: 'Ganho de peso',
    performance: 'Performance',
  };

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Wordmark compact />
          <div className="hidden items-center gap-3 border-l border-line pl-4 lg:flex">
            <div className="text-[13px] leading-tight">
              <div className="font-medium text-strong">{profile.name}</div>
              <div className="text-muted">{goalLabels[profile.goal] || 'Fitness'}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button onClick={onOpenExerciseLibrary} className="icon-btn hidden md:inline-flex" title="Biblioteca de exercícios" aria-label="Biblioteca de exercícios">
            <Dumbbell className="h-[17px] w-[17px]" />
          </button>

          <button
            onClick={onOpenCheckin}
            className="btn btn-outline hidden h-9 px-3.5 lg:inline-flex"
            title="Check-in semanal"
          >
            <Activity className="h-4 w-4 text-lime" />
            <span>Check-in</span>
          </button>

          <button
            onClick={onOpenAdaptive}
            className="btn btn-outline hidden h-9 px-3.5 xl:inline-flex"
            title="Motor adaptativo"
          >
            <BrainCircuit className="h-4 w-4 text-lime" />
            <span>Ajustes</span>
          </button>

          <button
            onClick={onOpenAiChat}
            className="btn btn-lime h-9 px-3 sm:px-4"
            title="Falar com o KINETIC IA"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">KINETIC IA</span>
          </button>

          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={onMarkNotificationRead}
            onClearAll={onClearNotifications}
            onSelectAction={onSelectActionTab}
          />

          <button
            onClick={onOpenProfile}
            title="Perfil e avaliação"
            className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elevated text-[13px] font-semibold text-ink transition hover:border-lime/50"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
};
