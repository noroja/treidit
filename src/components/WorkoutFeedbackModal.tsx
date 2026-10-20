import React, { useState } from 'react';
import { MessageSquareHeart, X, Check, HeartPulse } from 'lucide-react';
import { WorkoutFeedback } from '../types';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface WorkoutFeedbackModalProps {
  history: WorkoutFeedback[];
  onClose: () => void;
  onAddFeedback: (feedback: WorkoutFeedback) => void;
}

/**
 * Feedback do atleta sobre o treino em uso (§7): percepção, dor e adesão à
 * rotina. É registro (MEDIDO), não prescrição — alimenta o histórico que o
 * motor e o check-in semanal usam, nunca altera carga por conta própria.
 */
export const WorkoutFeedbackModal: React.FC<WorkoutFeedbackModalProps> = ({ history, onClose, onAddFeedback }) => {
  useLockBodyScroll(true);

  const [rating, setRating] = useState<number>(0);
  const [pain, setPain] = useState(false);
  const [fitsSchedule, setFitsSchedule] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (rating < 1 || rating > 5) {
      setError('Escolha uma nota de 1 a 5.');
      return;
    }
    const trimmed = note.trim();
    if (trimmed.length > 400) {
      setError('Observação: máximo de 400 caracteres.');
      return;
    }
    onAddFeedback({
      id: `fb_${Date.now()}`,
      date: new Date().toISOString(),
      rating: rating as 1 | 2 | 3 | 4 | 5,
      painReported: pain,
      fitsSchedule,
      note: trimmed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto safe-bottom">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="bg-base p-4 border-b border-elevated flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/25 flex items-center justify-center">
              <MessageSquareHeart className="w-4 h-4 text-lime" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Feedback do treino</h2>
              <p className="text-[12.5px] text-muted">Como está sendo treinar com esse programa?</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-muted hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* Nota de 1 a 5 */}
          <div>
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">
              Percepção geral (1 = ruim · 5 = ótimo)
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`py-2.5 rounded-xl text-sm font-bold cursor-pointer border transition ${
                    rating >= n
                      ? 'bg-lime text-base border-lime'
                      : 'bg-base text-muted border-line hover:border-lime/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Dor */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-base/60 border border-line rounded-xl p-3">
            <input
              type="checkbox"
              checked={pain}
              onChange={(e) => setPain(e.target.checked)}
              className="w-4 h-4 accent-lime cursor-pointer"
            />
            <span className="text-[13px] text-strong flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-danger" /> Tive dor articular ou incômodo relevante
            </span>
          </label>

          {/* Adesão */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-base/60 border border-line rounded-xl p-3">
            <input
              type="checkbox"
              checked={fitsSchedule}
              onChange={(e) => setFitsSchedule(e.target.checked)}
              className="w-4 h-4 accent-lime cursor-pointer"
            />
            <span className="text-[13px] text-strong">Consigo cumprir as sessões na rotina de vida</span>
          </label>

          {/* Observação */}
          <div>
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">
              Observação técnica (opcional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Ex.: Lower tem dois exercícios repetidos com Upper; terça e quinta sobram 20min..."
              className="w-full bg-base border border-line rounded-xl px-3 py-2 text-[14px] text-white focus:outline-none focus:border-lime/50 resize-none"
            />
            <span className="text-[10.5px] text-muted">{note.length}/400</span>
          </div>

          {/* Histórico recente */}
          {history.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Registros recentes</span>
              <div className="space-y-1.5">
                {history.slice(0, 3).map((fb) => (
                  <div key={fb.id} className="bg-base/60 border border-line rounded-lg px-3 py-2 text-[12px] flex items-center justify-between gap-2">
                    <span className="text-muted">{new Date(fb.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                    <span className="text-lime font-bold">{'★'.repeat(fb.rating)}</span>
                    <span className="text-muted truncate max-w-[45%]">{fb.note || (fb.painReported ? 'com dor' : 'sem dor')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <Check className="w-4 h-4" /> Registrar feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
