import React, { useState } from 'react';
import { Bell, Check, Trash2, Calendar, Dumbbell, Flame, BrainCircuit } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectAction: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'checkin':
        return <Calendar className="w-3.5 h-3.5 text-lime-dim" />;
      case 'treino':
        return <Dumbbell className="w-3.5 h-3.5 text-lime" />;
      case 'dieta':
        return <Flame className="w-3.5 h-3.5 text-lime-dim" />;
      case 'ajuste':
        return <BrainCircuit className="w-3.5 h-3.5 text-lime-dim" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-muted" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn relative active:scale-95"
        title="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="metric absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-lime px-1 text-[11px] font-semibold text-lime-ink">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-panel border border-elevated rounded-2xl  z-50 overflow-hidden text-xs">
            <div className="p-3.5 bg-base border-b border-elevated flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-lime/20 text-lime font-bold text-[11px]">
                    {unreadCount} nova(s)
                  </span>
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-muted hover:text-danger text-[12.5px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Limpar todas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-elevated/60 p-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-faint text-xs">
                  Nenhuma notificação no momento.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onMarkAsRead(n.id);
                      if (n.actionTab) {
                        onSelectAction(n.actionTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-2.5 ${
                      n.read ? 'hover:bg-elevated/40 text-muted' : 'bg-base/60 hover:bg-elevated/60 text-strong'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-panel border border-elevated shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className={`font-semibold truncate ${n.read ? 'text-strong' : 'text-white'}`}>
                          {n.title}
                        </strong>
                        <span className="text-[11px] text-faint font-mono shrink-0">{n.date}</span>
                      </div>
                      <p className="text-[12.5px] text-muted mt-0.5 leading-snug">
                        {n.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
