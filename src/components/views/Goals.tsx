import React, { useEffect, useState } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GoalContributionModal } from '../GoalContributionModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { GoalsSkeleton } from '../ui/Skeleton';
import { Goal } from '../../types';

export function Goals() {
  const { workspace, goals, openGoalModal, deleteGoal } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [goalsWsFilter, setGoalsWsFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteGoal = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetName = deleteTarget.name;
    try {
      await deleteGoal(deleteTarget.id);
      showToast(
        `Target tabungan "${targetName}" berhasil dihapus.`,
        'success',
        'Target Dihapus'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete goal', err);
      showToast(
        err.message || 'Gagal menghapus target tabungan.',
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [goalsWsFilter]);

  const wsGoals = goals.filter(g => goalsWsFilter === 'all' ? true : (g.workspaceId || 'keluarga') === goalsWsFilter);

  const totalSaved = wsGoals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalTarget = wsGoals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  
  // Progress animation state
  const [mounted, setMounted] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setMounted(true);
    }
  }, [isLoading]);

  const calculateOffset = (percent: number) => {
    const circumference = 251.2;
    return mounted ? circumference - (percent / 100) * circumference : circumference;
  };

  if (isLoading) {
    return <GoalsSkeleton />;
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex flex-col">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
          <div>
            <h2 className="font-display-md text-on-background">{t('goalsTitle')}</h2>
            <p className="font-body-lg text-on-surface-variant mt-2">{t('goalsSubtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGoalsWsFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  goalsWsFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Semua Workspace' : 'All Workspaces'}
              </button>
              <button
                type="button"
                onClick={() => setGoalsWsFilter('keluarga')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  goalsWsFilter === 'keluarga'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Keluarga' : 'Family'}
              </button>
              <button
                type="button"
                onClick={() => setGoalsWsFilter('pribadi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  goalsWsFilter === 'pribadi'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Pribadi' : 'Personal'}
              </button>
            </div>

            <Button variant="primary" className="hidden md:flex shadow-md" icon="add" onClick={openGoalModal}>
              {t('addGoal')}
            </Button>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Total Savings Widget */}
          <Card variant="elevated" className="md:col-span-4 p-6 flex flex-col justify-between">
            <div>
              <p className="font-label-md text-outline uppercase tracking-wider mb-1">Total Saved</p>
              <h3 className="font-headline-lg text-on-surface">{formatCurrency(totalSaved)}</h3>
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="font-label-sm">+4.2% from last month</span>
            </div>
          </Card>

          {/* Overall Progress Widget */}
          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-container-high stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                <circle 
                  className="text-primary stroke-current transition-all duration-1000 ease-in-out" 
                  cx="50" cy="50" fill="transparent" r="40" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={calculateOffset(overallProgress)} 
                  strokeLinecap="round" strokeWidth="8">
                </circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-label-lg text-on-surface">{Math.round(overallProgress)}%</span>
              </div>
            </div>
            <div>
              <h3 className="font-headline-sm text-on-surface mb-2">Overall Goal Completion</h3>
              <p className="font-body-sm text-on-surface-variant">You are on track to meet your active goals. Keep up the consistent contributions.</p>
            </div>
          </div>
        </div>

        {/* Goal Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {wsGoals.map((goal, i) => {
            const ratio = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            
            // Determine icon, colors, and mock texts based on index for variety
            const iconBg = i % 3 === 0 ? 'bg-secondary-container text-primary' : i % 3 === 1 ? 'bg-tertiary-fixed text-tertiary' : 'bg-surface-dim text-on-surface';
            const iconName = i % 3 === 0 ? 'health_and_safety' : i % 3 === 1 ? 'directions_car' : 'flight_takeoff';
            const progressColor = i % 3 === 0 ? 'text-primary' : i % 3 === 1 ? 'text-tertiary' : 'text-on-surface';
            
            // Generate a mock monthly value for the UI 
            const monthlyTarget = Math.round(goal.targetAmount / 24); // mock 24 months

            return (
              <div key={`desktop-${goal.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => setDeleteTarget(goal)}
                    className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
                    title="Hapus Target"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <span className="material-symbols-outlined">{iconName}</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-on-surface">{goal.name}</h4>
                    <p className="font-body-sm text-on-surface-variant">{i % 3 === 0 ? 'Safety Net' : i % 3 === 1 ? 'Vehicle Replacement' : 'Family Vacation'}</p>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle className="text-surface-container-high stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="10"></circle>
                      <circle 
                        className={`${progressColor} stroke-current transition-all duration-1000 ease-in-out`} 
                        cx="50" cy="50" fill="transparent" r="40" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={calculateOffset(ratio)} 
                        strokeLinecap="round" strokeWidth="10">
                      </circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline-md text-on-surface">{Math.round(ratio)}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b border-surface-variant py-4">
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-1">Target</p>
                    <p className="font-label-lg text-on-surface">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-1">Saved</p>
                    <p className="font-label-lg text-on-surface">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-1">Monthly</p>
                    <p className={`font-label-lg ${ratio < 20 ? 'text-error' : 'text-on-surface'}`}>
                      {ratio < 20 ? `Need ${formatCurrency(monthlyTarget)}` : formatCurrency(monthlyTarget)}
                    </p>
                  </div>
                  <div>
                    <p className="font-label-sm text-outline uppercase mb-1">Est. Date</p>
                    <p className="font-label-lg text-on-surface">
                      {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <button onClick={() => setSelectedGoal(goal)} className="w-full bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant font-label-lg py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    {t('addProgress')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col md:hidden w-full pb-24 mt-2">
        {/* Header Section */}
        <section className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="font-headline-sm font-bold text-on-surface mb-1">{t('goalsTitle')}</h1>
            <p className="font-body-sm text-on-surface-variant">{t('goalsSubtitle')}</p>
          </div>
          <button onClick={openGoalModal} className="w-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all duration-200 rounded-lg px-4 py-3 flex items-center justify-center gap-2 shadow-sm font-semibold">
            <span className="material-symbols-outlined">add</span>
            <span className="font-label-lg">{t('addGoal')}</span>
          </button>
        </section>

        {/* Goals Bento Grid */}
        <section className="grid grid-cols-1 gap-4">
          {wsGoals.map((goal, i) => {
            const ratio = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const monthlyTarget = Math.round(goal.targetAmount / 24); // mock 24 months
            
            // Varied icon styles based on index
            const iconName = i % 3 === 0 ? 'health_and_safety' : i % 3 === 1 ? 'architecture' : 'landscape';

            return (
              <div key={`mob-${goal.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 relative overflow-hidden group">
                {/* Decorative background */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center border border-outline-variant/50">
                      <span className="material-symbols-outlined">{iconName}</span>
                    </div>
                    <h3 className="font-headline-sm text-on-surface">{goal.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-md text-primary">{Math.round(ratio)}%</span>
                    <button 
                      onClick={() => setDeleteTarget(goal)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
                      title="Hapus Target"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5 z-10">
                  <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(ratio, 100)}%` }}></div>
                  </div>
                </div>

                {/* Amounts Grid */}
                <div className="grid grid-cols-2 gap-4 z-10">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-on-surface-variant">{t('totalSaved')}</span>
                    <span className="font-body-md font-semibold text-on-surface">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-end text-right">
                    <span className="font-label-sm text-on-surface-variant">Target</span>
                    <span className="font-body-md font-semibold text-on-surface">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Suggestion Footer */}
                <button onClick={() => setSelectedGoal(goal)} className="w-full text-left pt-4 border-t border-outline-variant mt-1 flex justify-between items-center z-10 bg-surface -mx-5 -mb-5 px-5 py-4 rounded-b-xl hover:bg-surface-container-low transition-colors active:bg-surface-container">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span className="font-label-md">{t('addProgress')}</span>
                  </div>
                  <span className="font-label-lg text-primary">
                    +{formatCurrency(monthlyTarget)}
                  </span>
                </button>
              </div>
            );
          })}
        </section>
      </div>

      <GoalContributionModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />

      {/* Confirm Delete Goal Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteGoal}
        title="Konfirmasi Hapus Target Finansial"
        message="Apakah Anda yakin ingin menghapus target finansial ini?"
        itemDetails={deleteTarget ? [
          { label: 'Nama Target', value: deleteTarget.name },
          { label: 'Target Nominal', value: formatCurrency(deleteTarget.targetAmount) },
          { label: 'Terkumpul Saat Ini', value: formatCurrency(deleteTarget.currentAmount) },
          { label: 'Tenggat Waktu', value: new Date(deleteTarget.deadline).toLocaleDateString('id-ID') }
        ] : []}
        confirmText="Hapus Target"
        isLoading={isDeleting}
      />
    </>
  );
}

