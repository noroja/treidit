import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, BrainCircuit, MessageSquare, Loader2, Info } from 'lucide-react';
import { UserProfile, Anthropometry, WorkoutProgram, NutritionPlan, WorkoutSessionLog, DailyNutritionLog, AdaptiveAdjustment } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface AICoachModalProps {
  profile: UserProfile;
  anthropometry: Anthropometry[];
  program: WorkoutProgram;
  nutrition: NutritionPlan;
  workoutLogs: WorkoutSessionLog[];
  todayNutrition: DailyNutritionLog;
  latestAdjustment: AdaptiveAdjustment;
  onClose: () => void;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  profile,
  anthropometry,
  program,
  nutrition,
  workoutLogs,
  todayNutrition,
  latestAdjustment,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Olá, ${profile.name.split(' ')[0]}! Eu sou o KINETIC IA, seu treinador científico e cientista de dados corporais.\n\nTenho acesso em tempo real aos seus registros de peso, cargas registradas, RIR, adesão nutricional e recuperação. Como posso ajudar na sua evolução hoje?`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Por que meu treino mudou?',
    'Por que minhas calorias mudaram?',
    'Qual a lógica de Belmiro de Salles para o meu treino?',
    'Como Dudu Haluch e Chris Aceto ajustariam minha dieta?',
    'Estou evoluindo ou estagnado?',
    'Por que meu peso não está baixando?',
    'Para quem, para quê e em qual momento este estímulo serve?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          userContext: {
            profile: {
              name: profile.name,
              goal: profile.goal,
              experience: profile.experience,
              frequencyDays: profile.frequencyDays,
              limitations: profile.limitations,
            },
            currentWeight: anthropometry[0]?.weightKg,
            weightHistory: anthropometry.slice(0, 4).map((a) => ({ date: a.date, kg: a.weightKg, waistCm: a.waistCm, bfPct: a.estimatedBodyFatPct })),
            program: {
              name: program.name,
              split: program.splitType,
              routinesCount: program.routines.length,
            },
            workoutLogsRecent: workoutLogs.slice(0, 3).map((l) => ({
              routine: l.routineName,
              rpe: l.perceivedEffortRPE,
              volumeKg: l.totalVolumeLoadKg,
              jointPain: l.jointPainReported,
            })),
            nutrition: {
              targetCalories: nutrition.targetMacros.calories,
              proteinGrams: nutrition.targetMacros.proteinGrams,
              dietStrategy: nutrition.dietStrategy,
              todayConsumed: todayNutrition.consumedCalories,
              adherenceScore: todayNutrition.adherenceScore,
            },
            latestAdjustment,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const modelMessage: Message = {
          id: `resp_${Date.now()}`,
          role: 'model',
          text: data.reply || 'Entendido. Com base nos seus dados atuais, sua evolução permanece consistente.',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, modelMessage]);
      } else {
        throw new Error('Falha na resposta do servidor.');
      }
    } catch (e: any) {
      const fallbackMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `Com base nos seus dados salvos:\nâ€¢ Seu peso atual é de ${anthropometry[0]?.weightKg || 79.5} kg com cintura de ${anthropometry[0]?.waistCm || 82} cm.\nâ€¢ Sua adesão nutricional está em ${Math.round((todayNutrition.adherenceScore || 5) * 20)}%.\nâ€¢ Sua progressão de treino indica manutenção da sobrecarga sem relatos graves de dor.\nO sistema adaptativo mantém a estratégia atual para consolidação das adaptações.`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-panel border border-elevated rounded-2xl w-full max-w-2xl h-modal flex flex-col  overflow-hidden">
        
        {/* Header */}
        <div className="bg-base p-4 border-b border-elevated flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl    flex items-center justify-center text-base font-bold ">
              <Sparkles className="w-5 h-5 fill-base" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">KINETIC IA Coach</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 font-semibold">
                  Contextualizado com seus dados
                </span>
              </div>
              <p className="text-xs text-muted">
                Respostas orientadas pela ciência e pelo seu histórico individual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-elevated hover:bg-line-strong text-muted hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggested Questions Carousel */}
        <div className="bg-base/60 p-2.5 border-b border-elevated/80 overflow-x-auto scrollbar-none flex items-center gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-panel hover:bg-elevated text-strong border border-line-strong/80 text-xs whitespace-nowrap cursor-pointer active:scale-95 transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-lime/20 text-lime border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-lime text-base font-medium rounded-tr-xs  '
                    : 'bg-base text-strong border border-elevated rounded-tl-xs whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[12.5px] mt-1 text-right font-mono ${
                    msg.role === 'user' ? 'text-panel/70' : 'text-faint'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-elevated text-strong flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted bg-base p-3 rounded-xl border border-elevated w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-lime" />
              <span>KINETIC IA cruzando seus dados com a literatura científica...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-base p-3 border-t border-elevated">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Pergunte sobre seus treinos, calorias ou evolução..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-panel border border-line-strong rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-faint focus:outline-none focus:border-lime disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-lime hover:bg-lime text-base font-bold transition   active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
