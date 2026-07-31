import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { BudgetingSkeleton } from '../ui/Skeleton';
import { Envelope } from '../../types';

export function Budgeting() {
  const { workspace, envelopes, transactions, familyMembers, openTransactionModal, openEnvelopeModal, deleteEnvelope } = useFinance();
  const { language, t } = useThemeLanguage();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Envelope | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [budgetWsFilter, setBudgetWsFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getMonthName = (monthIdx: number) => {
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return language === 'id' ? monthsId[monthIdx] : monthsEn[monthIdx];
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [budgetWsFilter, selectedMonth, selectedYear]);

  const wsEnvelopes = envelopes.filter(e => budgetWsFilter === 'all' ? true : (e.workspaceId || 'keluarga') === budgetWsFilter);
  const wsTransactions = transactions.filter(t => budgetWsFilter === 'all' ? true : (t.workspaceId || 'keluarga') === budgetWsFilter);
  
  const currentMonthStart = new Date(selectedYear, selectedMonth, 1).getTime();
  const currentMonthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999).getTime();
  const currentMonthTransactions = wsTransactions.filter(t => {
    const tTime = new Date(t.date).getTime();
    return tTime >= currentMonthStart && tTime <= currentMonthEnd;
  });

  const envelopeSpending = wsEnvelopes.map(env => {
    const spent = currentMonthTransactions.filter(t => t.category === env.category && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { ...env, spent, ratio: env.allocatedAmount > 0 ? spent / env.allocatedAmount : 0 };
  });

  const totalAllocated = envelopeSpending.reduce((acc, env) => acc + env.allocatedAmount, 0);
  const totalSpent = envelopeSpending.reduce((acc, env) => acc + env.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const globalRatio = totalAllocated > 0 ? totalSpent / totalAllocated : 0;

  const attentionNeeded = [...envelopeSpending].sort((a, b) => b.ratio - a.ratio).slice(0, 2);

  // Date calculation for days left
  const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const daysLeft = isCurrentMonth ? lastDay.getDate() - today.getDate() : 0;

  const confirmDeleteEnvelope = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetCat = deleteTarget.category;
    try {
      await deleteEnvelope(deleteTarget.id);
      showToast(
        `Pos Anggaran "${targetCat}" berhasil dihapus.`,
        'success',
        'Amplop Dihapus'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete envelope', err);
      showToast(
        err.message || 'Gagal menghapus pos anggaran.',
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const linkedTxCount = deleteTarget ? wsTransactions.filter(t => t.category === deleteTarget.category).length : 0;

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex flex-col">
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="font-display-md text-on-surface mb-2">{t('budgetingTitle')}</h2>
            <p className="font-body-lg text-on-surface-variant">{t('budgetingSubtitle')}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface border border-outline-variant rounded-xl px-2 py-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="font-label-md min-w-[100px] text-center font-bold text-on-surface">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBudgetWsFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  budgetWsFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Semua Workspace' : 'All Workspaces'}
              </button>
              <button
                type="button"
                onClick={() => setBudgetWsFilter('keluarga')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  budgetWsFilter === 'keluarga'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Keluarga' : 'Family'}
              </button>
              <button
                type="button"
                onClick={() => setBudgetWsFilter('pribadi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  budgetWsFilter === 'pribadi'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {language === 'id' ? 'Pribadi' : 'Personal'}
              </button>
            </div>

            <Button variant="primary" icon="add" onClick={() => openEnvelopeModal()} className="shadow-md">
              {t('addEnvelope')}
            </Button>
          </div>
        </div>

        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Total Remaining */}
          <Card variant="elevated" className="md:col-span-8 p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-700"></div>
            <div className="relative z-10">
              <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">{t('totalBudgetRemaining')}</h3>
              <div className="flex items-end gap-4 mb-6">
                <span className="font-display-lg text-on-surface">{formatCurrency(totalRemaining)}</span>
                <span className="font-body-sm text-on-surface-variant mb-2">/ {formatCurrency(totalAllocated)}</span>
              </div>
              {/* Global Progress */}
              <div className="w-full bg-surface-container-high rounded-full h-3 mb-2 overflow-hidden">
                <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(globalRatio * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between font-label-sm text-on-surface-variant">
                <span>{daysLeft} {t('daysLeftInMonth')}</span>
                <span>{Math.max(0, 100 - Math.round(globalRatio * 100))}% {t('remaining')}</span>
              </div>
            </div>
          </Card>

          {/* Top Overspending */}
          <Card variant="default" className="md:col-span-4 p-6 flex flex-col">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-4">{t('attentionNeeded')}</h3>
            <ul className="flex flex-col gap-4 flex-grow justify-center">
              {attentionNeeded.length > 0 ? attentionNeeded.map(env => (
                <li key={`attn-${env.id}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${env.ratio > 1 ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container/20 text-tertiary'}`}>
                      <span className="material-symbols-outlined text-[16px]">{env.ratio > 1 ? 'restaurant' : 'local_mall'}</span>
                    </div>
                    <span className="font-body-sm font-semibold">{env.category}</span>
                  </div>
                  <span className={`font-label-md ${env.ratio > 1 ? 'text-error' : 'text-tertiary'}`}>
                    {env.ratio > 1 ? `-${formatCurrency(env.spent - env.allocatedAmount)}` : `${Math.round(env.ratio * 100)}% ${t('used')}`}
                  </span>
                </li>
              )) : (
                <li className="text-on-surface-variant font-body-sm text-center py-4">{t('noAttentionNeeded')}</li>
              )}
            </ul>
          </Card>
        </div>

        {/* Envelope Grid */}
        <h3 className="font-headline-sm text-on-surface mb-6">{t('yourEnvelopes')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envelopeSpending.map((env, i) => {
            const isOver = env.ratio > 1;
            const isWarning = env.ratio > 0.85 && !isOver;
            
            const iconBg = i % 3 === 0 ? 'bg-secondary-container text-on-secondary-container' : i % 3 === 1 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-container text-on-primary-container';
            const iconName = i % 3 === 0 ? 'shopping_cart' : i % 3 === 1 ? 'bolt' : 'savings';
            
            let barColor = 'bg-primary';
            let textColor = 'text-primary';
            let statusText = t('onTrack');
            
            if (isOver) {
              barColor = 'bg-error';
              textColor = 'text-error';
              statusText = `${t('overBy')} ${formatCurrency(env.spent - env.allocatedAmount)}`;
            } else if (isWarning) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-600';
              statusText = `${formatCurrency(env.allocatedAmount - env.spent)} ${t('remainingShort')}`;
            } else {
              barColor = 'bg-emerald-500';
              textColor = 'text-emerald-600';
              statusText = `${formatCurrency(env.allocatedAmount - env.spent)} ${t('remainingShort')}`;
            }

            return (
              <Card key={env.id} variant="default" className={`border ${isOver ? 'border-error/30' : 'border-outline-variant'} p-6 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden`}>
                {isOver && <div className="absolute top-0 right-0 w-2 h-full bg-error"></div>}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isOver ? 'bg-error-container text-on-error-container' : iconBg} flex items-center justify-center`}>
                      <span className="material-symbols-outlined">{isOver ? 'restaurant' : iconName}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-on-surface">{env.category}</h4>
                      <span className="font-label-sm text-on-surface-variant">
                        {isOver ? t('discretionary') : isWarning ? t('fixed') : t('essential')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEnvelopeModal(env)}
                      className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 cursor-pointer"
                      title={language === 'id' ? 'Ubah' : 'Edit'}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(env)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
                      title={t('delete')}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-headline-md ${isOver ? 'text-error' : 'text-on-surface'}`}>{formatCurrency(env.spent)}</span>
                    <span className="font-body-sm text-on-surface-variant">/ {formatCurrency(env.allocatedAmount)}</span>
                  </div>
                  <div className={`w-full ${isOver ? 'bg-error-container' : 'bg-surface-container-high'} rounded-full h-2 mb-1 overflow-hidden`}>
                    <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(env.ratio * 100, 100)}%` }}></div>
                  </div>
                  <div className={`text-right font-label-sm font-medium ${textColor} flex items-center justify-end gap-1`}>
                    {isOver && <span className="material-symbols-outlined text-[14px]">warning</span>}
                    {statusText}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-outline-variant">
                  <Button variant="outline" fullWidth onClick={() => openTransactionModal(env.category)}>
                    {t('logExpense')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Family Member Budget Allocations (Workspace Keluarga) */}
        {workspace === 'keluarga' && familyMembers.length > 0 && (
          <Card variant="default" className="p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  {language === 'id' ? 'Anggaran per Anggota Keluarga' : 'Family Member Budget Breakdown'}
                </h3>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  {language === 'id' 
                    ? 'Batas dan realisasi pengeluaran bulanan masing-masing anggota keluarga.' 
                    : 'Monthly budget limit and spending per family member.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {familyMembers.map((member) => {
                const memberSpent = currentMonthTransactions
                  .filter(t => t.type === 'expense' && t.familyMember === member.name)
                  .reduce((acc, t) => acc + t.amount, 0);
                const budgetLimit = member.monthlyBudget || 0;
                const ratio = budgetLimit > 0 ? memberSpent / budgetLimit : 0;
                const isOver = budgetLimit > 0 && memberSpent > budgetLimit;

                return (
                  <div key={member.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-label-lg font-bold text-on-surface">{member.name}</div>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                            {member.role}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div className="my-3">
                        <div className="text-xs text-on-surface-variant mb-1">
                          {language === 'id' ? 'Pengeluaran Bln Ini:' : 'This Month Spent:'}
                        </div>
                        <div className={`font-label-lg font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-on-surface'}`}>
                          {formatCurrency(memberSpent)}
                        </div>
                        {budgetLimit > 0 && (
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            {language === 'id' ? 'Batas:' : 'Limit:'} {formatCurrency(budgetLimit)}
                          </div>
                        )}
                      </div>
                    </div>

                    {budgetLimit > 0 && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/40">
                        <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isOver ? 'bg-red-500' : ratio > 0.8 ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant">
                          <span>{Math.round(ratio * 100)}%</span>
                          <span>{isOver ? (language === 'id' ? 'Melebihi Limit' : 'Over Limit') : (language === 'id' ? 'Aman' : 'Safe')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Mobile View */}
      <div className="flex flex-col md:hidden w-full space-y-6 mt-4">
        {/* Screen Title */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm font-bold text-on-surface">{t('budgetingTitle')}</h2>
            <p className="font-body-sm text-on-surface-variant">{workspace.toUpperCase()}</p>
          </div>
          <Button variant="primary" size="sm" icon="add" onClick={() => openEnvelopeModal()}>
            {t('addEnvelope')}
          </Button>
        </div>
        
        <div className="flex items-center justify-between bg-surface border border-outline-variant rounded-xl px-2 py-1.5 w-full">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-label-lg text-center font-bold text-on-surface">
            {getMonthName(selectedMonth)} {selectedYear}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Summary Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Allocated Card */}
          <Card variant="default" className="p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm uppercase tracking-wider text-on-surface-variant">{t('allocated')}</span>
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </div>
            </div>
            <div className="font-headline-sm font-semibold text-primary mt-2 truncate">{formatCurrency(totalAllocated)}</div>
          </Card>
          
          {/* Spent Card */}
          <Card variant="default" className="p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm uppercase tracking-wider text-on-surface-variant">{t('spent')}</span>
              <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </div>
            </div>
            <div className="font-headline-sm font-semibold text-primary mt-2 truncate">{formatCurrency(totalSpent)}</div>
          </Card>
          
          {/* Remaining Balance (Spans 2 columns) */}
          <Card variant="primary" className="col-span-2 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <span className="font-label-sm uppercase tracking-wider text-on-primary font-medium opacity-90">{t('remaining')}</span>
              <div className="font-headline-lg font-bold text-on-primary mt-1 truncate">{formatCurrency(totalRemaining)}</div>
              
              {/* Progress Bar */}
              <div className="mt-4 w-full bg-primary-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary-container h-full rounded-full" style={{ width: `${Math.min(globalRatio * 100, 100)}%` }}></div>
              </div>
              <div className="mt-2 flex justify-between text-on-primary font-label-sm text-[11px] opacity-90">
                <span>{Math.round(globalRatio * 100)}% {t('used')}</span>
                <span>Target: 100%</span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Envelopes List */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm text-on-surface">{t('budgetEnvelopes')}</h3>
          </div>
          <div className="space-y-4">
            {envelopeSpending.map(env => (
              <Card key={`mob-env-${env.id}`} variant="default" className="overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${env.ratio > 1 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined">{env.ratio > 1 ? 'warning' : 'category'}</span>
                    </div>
                    <div>
                      <div className="font-body-lg font-semibold text-primary">{env.category}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-body-sm text-on-surface-variant text-[12px]">{formatCurrency(env.spent)} / {formatCurrency(env.allocatedAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-body-lg font-semibold text-right ${env.ratio > 1 ? 'text-error' : 'text-on-surface'}`}>
                      {Math.round(env.ratio * 100)}%
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEnvelopeModal(env)}
                        className="text-on-surface-variant hover:text-primary p-1 rounded transition-colors cursor-pointer"
                        title={language === 'id' ? 'Ubah Amplop' : 'Edit Envelope'}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(env)}
                        className="text-on-surface-variant hover:text-error p-1 rounded transition-colors cursor-pointer"
                        title={language === 'id' ? 'Hapus Amplop' : 'Delete Envelope'}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Delete Envelope Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteEnvelope}
        title="Konfirmasi Hapus Amplop Anggaran"
        message="Apakah Anda yakin ingin menghapus alokasi anggaran amplop ini?"
        warningMessage={linkedTxCount > 0 
          ? `Terdapat ${linkedTxCount} transaksi terpakai pada kategori "${deleteTarget?.category}". Menghapus amplop ini tidak menghapus transaksi, tetapi batas anggaran kategori ini akan hilang.` 
          : undefined}
        itemDetails={deleteTarget ? [
          { label: 'Kategori Amplop', value: deleteTarget.category },
          { label: 'Alokasi Anggaran', value: formatCurrency(deleteTarget.allocatedAmount) },
          { label: 'Total Terpakai', value: formatCurrency(deleteTarget.spent) },
          { label: 'Sisa Anggaran', value: formatCurrency(deleteTarget.allocatedAmount - deleteTarget.spent) }
        ] : []}
        confirmText="Hapus Amplop"
        isLoading={isDeleting}
      />
    </>
  );
}

