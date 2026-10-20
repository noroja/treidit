/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Anthropometry,
  WorkoutProgram,
  NutritionPlan,
  MealItem,
  WorkoutSessionLog,
  DailyNutritionLog, 
  RecoveryLog, 
  AdaptiveAdjustment,
  WeeklyCheckinReport,
  AppNotification
} from './types';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_ANTHROPOMETRY, 
  INITIAL_WORKOUT_PROGRAM, 
  INITIAL_NUTRITION_PLAN, 
  INITIAL_WORKOUT_LOGS, 
  INITIAL_NUTRITION_LOGS, 
  INITIAL_RECOVERY, 
  INITIAL_ADAPTIVE_ADJUSTMENTS,
  INITIAL_NOTIFICATIONS
} from './data/initialData';
import { generateNutritionPlan, generateWorkoutProgram, runAdaptiveAudit } from './utils/calculations';
import { computeConsumedFromMeals } from './engine/meals';

import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { WorkoutView } from './components/WorkoutView';
import { NutritionView } from './components/NutritionView';
import { EvolutionView } from './components/EvolutionView';
import { MethodologyView } from './components/MethodologyView';
import { ErgogenicsView } from './components/ErgogenicsView';
import { ProfileView } from './components/ProfileView';

import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { AdaptiveEngineModal } from './components/AdaptiveEngineModal';
import { AICoachModal } from './components/AICoachModal';
import { ProfileOnboardingModal } from './components/ProfileOnboardingModal';
import { WeeklyCheckinModal } from './components/WeeklyCheckinModal';
import { ExerciseLibraryModal } from './components/ExerciseLibraryModal';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [methodologySubTab, setMethodologySubTab] = useState<'metodo' | 'ergogenicos'>('metodo');

  // Modals
  const [activeRoutineIndex, setActiveRoutineIndex] = useState<number | null>(null);
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  // App Domain State with LocalStorage Persistence
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('kinetic_profile');
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  const [anthropometry, setAnthropometry] = useState<Anthropometry[]>(() => {
    try {
      const saved = localStorage.getItem('kinetic_anthropometry');
      return saved ? JSON.parse(saved) : INITIAL_ANTHROPOMETRY;
    } catch {
      return INITIAL_ANTHROPOMETRY;
    }
  });

  const [program, setProgram] = useState<WorkoutProgram>(() => {
    try {
      const saved = localStorage.getItem('kinetic_program');
      return saved ? JSON.parse(saved) : INITIAL_WORKOUT_PROGRAM;
    } catch {
      return INITIAL_WORKOUT_PROGRAM;
    }
  });

  const [nutrition, setNutrition] = useState<NutritionPlan>(() => {
    try {
      const saved = localStorage.getItem('kinetic_nutrition');
      return saved ? JSON.parse(saved) : INITIAL_NUTRITION_PLAN;
    } catch {
      return INITIAL_NUTRITION_PLAN;
    }
  });

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('kinetic_workout_logs');
      return saved ? JSON.parse(saved) : INITIAL_WORKOUT_LOGS;
    } catch {
      return INITIAL_WORKOUT_LOGS;
    }
  });

  const [todayNutrition, setTodayNutrition] = useState<DailyNutritionLog>(() => {
    try {
      const saved = localStorage.getItem('kinetic_today_nutrition');
      return saved ? JSON.parse(saved) : INITIAL_NUTRITION_LOGS[0];
    } catch {
      return INITIAL_NUTRITION_LOGS[0];
    }
  });

  const [recovery, setRecovery] = useState<RecoveryLog>(() => {
    try {
      const saved = localStorage.getItem('kinetic_recovery');
      return saved ? JSON.parse(saved) : INITIAL_RECOVERY;
    } catch {
      return INITIAL_RECOVERY;
    }
  });

  const [adjustments, setAdjustments] = useState<AdaptiveAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem('kinetic_adjustments');
      return saved ? JSON.parse(saved) : INITIAL_ADAPTIVE_ADJUSTMENTS;
    } catch {
      return INITIAL_ADAPTIVE_ADJUSTMENTS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('kinetic_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('kinetic_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('kinetic_anthropometry', JSON.stringify(anthropometry));
  }, [anthropometry]);

  useEffect(() => {
    localStorage.setItem('kinetic_program', JSON.stringify(program));
  }, [program]);

  useEffect(() => {
    localStorage.setItem('kinetic_nutrition', JSON.stringify(nutrition));
  }, [nutrition]);

  useEffect(() => {
    localStorage.setItem('kinetic_workout_logs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  useEffect(() => {
    localStorage.setItem('kinetic_today_nutrition', JSON.stringify(todayNutrition));
  }, [todayNutrition]);

  useEffect(() => {
    localStorage.setItem('kinetic_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('kinetic_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Handlers for notifications
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Handlers
  const handleStartWorkout = (routineIndex: number) => {
    setActiveRoutineIndex(routineIndex);
  };

  const handleFinishWorkout = (log: WorkoutSessionLog) => {
    setWorkoutLogs((prev) => [log, ...prev]);
    setActiveRoutineIndex(null);

    // Run adaptive check after recording
    const latestAudit = runAdaptiveAudit(profile, anthropometry, [log, ...workoutLogs], nutrition, 0.9);
    setAdjustments((prev) => [latestAudit, ...prev]);
  };

  const handleAddAnthropometry = (newRecord: Anthropometry) => {
    const updated = [newRecord, ...anthropometry];
    setAnthropometry(updated);

    // Update profile weight as well
    setProfile((prev) => ({
      ...prev,
      weightKg: newRecord.weightKg,
    }));

    // Trigger adaptive evaluation with new morphological response
    const latestAudit = runAdaptiveAudit({ ...profile, weightKg: newRecord.weightKg }, updated, workoutLogs, nutrition, 0.9);
    setAdjustments((prev) => [latestAudit, ...prev]);
  };

  const handleSaveProfile = (updatedProfile: UserProfile, anthropometryUpdate?: Partial<Anthropometry>) => {
    setProfile(updatedProfile);

    // Regenerate program & nutrition tailored to new preferences/split
    const newProgram = generateWorkoutProgram(updatedProfile);
    const newNutrition = generateNutritionPlan(updatedProfile);
    setProgram(newProgram);
    setNutrition(newNutrition);

    if (anthropometryUpdate && anthropometry.length > 0) {
      const topRecord = { ...anthropometry[0], ...anthropometryUpdate };
      setAnthropometry([topRecord, ...anthropometry.slice(1)]);
    }

    const latestAudit = runAdaptiveAudit(updatedProfile, anthropometry, workoutLogs, newNutrition, 0.9);
    setAdjustments((prev) => [latestAudit, ...prev]);
  };

  const handleToggleMealCompleted = (mealId: string) => {
    setNutrition((prev) => {
      const updatedMeals = prev.meals.map((m) => {
        if (m.id === mealId) {
          const toggled = !m.completed;
          return {
            ...m,
            completed: toggled,
            items: m.items.map((it) => ({ ...it, completed: toggled })),
          };
        }
        return m;
      });

      // Recalculate consumed from completed meals — FASE 3: via motor de refeições
      const consumed = computeConsumedFromMeals(updatedMeals);

      setTodayNutrition((prevToday) => ({
        ...prevToday,
        consumedCalories: consumed.caloriesKcal,
        consumedProtein: consumed.proteinG,
        consumedCarbs: consumed.carbsG,
        consumedFat: consumed.fatG,
      }));

      return {
        ...prev,
        meals: updatedMeals,
      };
    });
  };

  const handleQuickAddWater = (amountMl: number) => {
    setTodayNutrition((prev) => ({
      ...prev,
      consumedWaterMl: prev.consumedWaterMl + amountMl,
    }));
  };

  // FASE 3: edição/substituição/adição de itens de refeição — consumo do dia
  // sempre RE-DERIVADO das refeições completadas (motor de refeições, nunca somado na UI).
  const handleUpdateMealItems = (mealId: string, nextItems: MealItem[]) => {
    setNutrition((prev) => {
      const meals = prev.meals.map((m) =>
        m.id === mealId ? { ...m, items: nextItems } : m
      );
      const consumed = computeConsumedFromMeals(meals);
      setTodayNutrition((prevToday) => ({
        ...prevToday,
        consumedCalories: consumed.caloriesKcal,
        consumedProtein: consumed.proteinG,
        consumedCarbs: consumed.carbsG,
        consumedFat: consumed.fatG,
      }));
      return { ...prev, meals };
    });
  };

  const handleApplyAdjustment = (adjustmentToApply: AdaptiveAdjustment) => {
    setAdjustments((prev) =>
      prev.map((a) => (a.id === adjustmentToApply.id ? { ...a, applied: true } : a))
    );

    // If adjustment suggests deload or calories
    if (adjustmentToApply.status === 'deload_recommended') {
      setProgram((prev) => ({
        ...prev,
        isDeloadWeek: true,
      }));
    } else if (adjustmentToApply.status === 'adjustment_needed') {
      if (adjustmentToApply.title.includes('Redução de 150 kcal')) {
        setNutrition((prev) => ({
          ...prev,
          targetMacros: {
            ...prev.targetMacros,
            calories: prev.targetMacros.calories - 150,
            carbsGrams: Math.max(50, prev.targetMacros.carbsGrams - 35),
          },
        }));
      } else if (adjustmentToApply.title.includes('Aumento de 200 kcal')) {
        setNutrition((prev) => ({
          ...prev,
          targetMacros: {
            ...prev.targetMacros,
            calories: prev.targetMacros.calories + 200,
            carbsGrams: prev.targetMacros.carbsGrams + 50,
          },
        }));
      }
    }
  };

  const handleApplyCheckinReport = (report: WeeklyCheckinReport) => {
    const newAdj: AdaptiveAdjustment = {
      id: `adj_checkin_${Date.now()}`,
      date: report.date,
      status: report.status === 'deload' ? 'deload_recommended' : report.status === 'manter' ? 'optimal' : 'adjustment_needed',
      title: report.title,
      whatChanged: report.decisao,
      whyChanged: report.interpretacao,
      dataTrigger: report.resposta,
      evaluationMetrics: `Monitorar média móvel e ${report.ajustesRecomendados.focoCarboidrato}`,
      applied: true,
    };

    setAdjustments((prev) => [newAdj, ...prev]);

    // Apply calories if recommended
    if (report.ajustesRecomendados.caloriasDelta !== 0) {
      setNutrition((prev) => ({
        ...prev,
        targetMacros: {
          ...prev.targetMacros,
          calories: prev.targetMacros.calories + report.ajustesRecomendados.caloriasDelta,
          carbsGrams: Math.max(50, prev.targetMacros.carbsGrams + Math.round(report.ajustesRecomendados.caloriasDelta / 4)),
        },
      }));
    }

    // Apply deload if indicated
    if (report.status === 'deload') {
      setProgram((prev) => ({
        ...prev,
        isDeloadWeek: true,
      }));
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Deseja restaurar os dados de exemplo do aplicativo?')) {
      localStorage.clear();
      setProfile(INITIAL_USER_PROFILE);
      setAnthropometry(INITIAL_ANTHROPOMETRY);
      setProgram(INITIAL_WORKOUT_PROGRAM);
      setNutrition(INITIAL_NUTRITION_PLAN);
      setWorkoutLogs(INITIAL_WORKOUT_LOGS);
      setTodayNutrition(INITIAL_NUTRITION_LOGS[0]);
      setRecovery(INITIAL_RECOVERY);
      setAdjustments(INITIAL_ADAPTIVE_ADJUSTMENTS);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  };

  const latestAdjustment = adjustments[0] || INITIAL_ADAPTIVE_ADJUSTMENTS[0];

  return (
    <div className="flex min-h-screen flex-col bg-base font-sans text-strong selection:bg-lime selection:text-lime-ink">
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        notifications={notifications}
        onOpenAiChat={() => setShowAiModal(true)}
        onOpenAdaptive={() => setShowAdaptiveModal(true)}
        onOpenProfile={() => setCurrentTab('perfil')}
        onOpenCheckin={() => setShowCheckinModal(true)}
        onOpenExerciseLibrary={() => setShowExerciseLibrary(true)}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        onSelectActionTab={(tab) => setCurrentTab(tab as TabType)}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-6">
        {currentTab === 'inicio' && (
          <DashboardView
            profile={profile}
            program={program}
            nutrition={nutrition}
            anthropometry={anthropometry}
            todayNutrition={todayNutrition}
            recovery={recovery}
            latestAdjustment={latestAdjustment}
            workoutLogs={workoutLogs}
            onStartWorkout={handleStartWorkout}
            onNavigateTab={setCurrentTab}
            onOpenAi={() => setShowAiModal(true)}
            onOpenAdaptive={() => setShowAdaptiveModal(true)}
            onOpenCheckin={() => setShowCheckinModal(true)}
            onQuickAddWater={handleQuickAddWater}
            onOpenExerciseLibrary={() => setShowExerciseLibrary(true)}
          />
        )}

        {currentTab === 'treino' && (
          <WorkoutView
            program={program}
            workoutLogs={workoutLogs}
            onStartRoutine={handleStartWorkout}
            onOpenAi={() => setShowAiModal(true)}
            onOpenAdaptive={() => setShowAdaptiveModal(true)}
            onOpenExerciseLibrary={() => setShowExerciseLibrary(true)}
          />
        )}

        {currentTab === 'dieta' && (
          <NutritionView
            nutrition={nutrition}
            todayNutrition={todayNutrition}
            profile={profile}
            onUpdateNutritionLog={setTodayNutrition}
            onToggleMealCompleted={handleToggleMealCompleted}
            onAddWater={handleQuickAddWater}
            onUpdateMealItems={handleUpdateMealItems}
            onOpenAi={() => setShowAiModal(true)}
            onOpenAdaptive={() => setShowAdaptiveModal(true)}
          />
        )}

        {currentTab === 'evolucao' && (
          <EvolutionView
            anthropometry={anthropometry}
            profile={profile}
            workoutLogs={workoutLogs}
            onAddAnthropometry={handleAddAnthropometry}
            onOpenAi={() => setShowAiModal(true)}
          />
        )}

        {currentTab === 'metodologia' && (
          <div className="space-y-4">
            {/* Sub-navigation between Methodology and Ergogenics */}
            <div className="flex items-center gap-2 bg-panel p-1.5 rounded-2xl border border-elevated w-fit">
              <button
                onClick={() => setMethodologySubTab('metodo')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  methodologySubTab === 'metodo'
                    ? 'bg-lime text-base  '
                    : 'text-muted hover:text-white'
                }`}
              >
                Metodologia & Referências
              </button>
              <button
                onClick={() => setMethodologySubTab('ergogenicos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  methodologySubTab === 'ergogenicos'
                    ? 'bg-lime text-base  '
                    : 'text-muted hover:text-white'
                }`}
              >
                Recursos Ergogênicos (Redução de Danos)
              </button>
            </div>

            {methodologySubTab === 'metodo' ? (
              <MethodologyView />
            ) : (
              <ErgogenicsView />
            )}
          </div>
        )}

        {currentTab === 'perfil' && (
          <ProfileView
            profile={profile}
            latestAnthropometry={anthropometry[0]}
            program={program}
            nutrition={nutrition}
            onOpenEvaluation={() => setShowOnboardingModal(true)}
            onOpenAdaptive={() => setShowAdaptiveModal(true)}
            onOpenAi={() => setShowAiModal(true)}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onStartWorkout={() => handleStartWorkout(0)}
      />

      {/* Exercise & Biomechanics Library Modal */}
      {showExerciseLibrary && (
        <ExerciseLibraryModal
          onClose={() => setShowExerciseLibrary(false)}
        />
      )}

      {/* Active Workout Execution Modal */}
      {activeRoutineIndex !== null && program.routines[activeRoutineIndex] && (
        <ActiveWorkoutModal
          routine={program.routines[activeRoutineIndex]}
          lastLogs={workoutLogs}
          onClose={() => setActiveRoutineIndex(null)}
          onFinishWorkout={handleFinishWorkout}
        />
      )}

      {/* Adaptive Feedback Engine Modal */}
      {showAdaptiveModal && (
        <AdaptiveEngineModal
          adjustment={latestAdjustment}
          adjustmentHistory={adjustments}
          profile={profile}
          anthropometry={anthropometry}
          program={program}
          nutrition={nutrition}
          workoutLogs={workoutLogs}
          todayNutrition={todayNutrition}
          onClose={() => setShowAdaptiveModal(false)}
          onApplyAdjustment={handleApplyAdjustment}
        />
      )}

      {/* AI Assistant Chat Modal */}
      {showAiModal && (
        <AICoachModal
          profile={profile}
          anthropometry={anthropometry}
          program={program}
          nutrition={nutrition}
          workoutLogs={workoutLogs}
          todayNutrition={todayNutrition}
          latestAdjustment={latestAdjustment}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* Onboarding & Initial Evaluation Modal */}
      {showOnboardingModal && (
        <ProfileOnboardingModal
          initialProfile={profile}
          latestAnthropometry={anthropometry[0]}
          onClose={() => setShowOnboardingModal(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {/* Central Weekly Check-in Modal */}
      {showCheckinModal && (
        <WeeklyCheckinModal
          profile={profile}
          program={program}
          nutrition={nutrition}
          anthropometry={anthropometry}
          workoutLogs={workoutLogs}
          todayNutrition={todayNutrition}
          recovery={recovery}
          onClose={() => setShowCheckinModal(false)}
          onApplyCheckinReport={handleApplyCheckinReport}
        />
      )}
    </div>
  );
}
