import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { formatCurrency } from '../utils';

interface GlobalSearchBarProps {
  setCurrentView: (view: string) => void;
  className?: string;
}

type FilterCategory = 'all' | 'transactions' | 'bills' | 'goals';

export function GlobalSearchBar({ setCurrentView, className = '' }: GlobalSearchBarProps) {
  const { transactions, bills, goals } = useFinance();
  const { t } = useThemeLanguage();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanQuery = query.trim().toLowerCase();

  // Search logic
  const filteredTransactions = cleanQuery
    ? transactions.filter(t => 
        t.description.toLowerCase().includes(cleanQuery) ||
        t.category.toLowerCase().includes(cleanQuery) ||
        t.amount.toString().includes(cleanQuery) ||
        t.workspaceId.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredBills = cleanQuery
    ? bills.filter(b => 
        b.name.toLowerCase().includes(cleanQuery) ||
        b.amount.toString().includes(cleanQuery) ||
        b.workspaceId.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredGoals = cleanQuery
    ? goals.filter(g => 
        g.name.toLowerCase().includes(cleanQuery) ||
        g.targetAmount.toString().includes(cleanQuery) ||
        g.workspaceId.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = 
    (activeFilter === 'all' || activeFilter === 'transactions' ? filteredTransactions.length : 0) +
    (activeFilter === 'all' || activeFilter === 'bills' ? filteredBills.length : 0) +
    (activeFilter === 'all' || activeFilter === 'goals' ? filteredGoals.length : 0);

  const handleSelectResult = (targetView: string) => {
    setCurrentView(targetView);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          className="w-full h-11 pl-11 pr-10 bg-surface-container-low border border-outline-variant rounded-full font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner placeholder:text-on-surface-variant/60"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Floating Results Dropdown */}
      {isOpen && cleanQuery.length > 0 && (
        <div className="absolute left-0 right-0 top-13 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header & Category Filters */}
          <div className="p-3 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-label-md text-on-surface-variant font-bold px-1">
              {t('searchResults')} ({totalResults})
            </span>

            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'transactions', 'bills', 'goals'] as FilterCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    activeFilter === cat
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat === 'all' && t('filterAll')}
                  {cat === 'transactions' && t('filterTransactions')}
                  {cat === 'bills' && t('filterBills')}
                  {cat === 'goals' && t('filterGoals')}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-2 divide-y divide-outline-variant/40">
            {totalResults === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p className="font-body-md font-medium">{t('noSearchResults')}</p>
                <p className="font-label-sm text-outline mt-1">Coba kata kunci lain atau periksa ejaan Anda</p>
              </div>
            ) : (
              <>
                {/* TRANSACTIONS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'transactions') && filteredTransactions.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 font-label-sm font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                      <span>{t('filterTransactions')}</span>
                      <span className="text-xs text-on-surface-variant font-normal">({filteredTransactions.length})</span>
                    </div>
                    {filteredTransactions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult('cash-flow')}
                        className="p-3 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors flex items-center justify-between group my-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl flex items-center justify-center ${
                            item.type === 'income' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {item.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                          </div>
                          <div>
                            <p className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span className="capitalize">{item.category}</span>
                              <span>•</span>
                              <span>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span>•</span>
                              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant font-bold">
                                {item.workspaceId}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-headline-sm font-bold ${
                            item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BILLS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'bills') && filteredBills.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 font-label-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t('filterBills')}</span>
                      <span className="text-xs text-on-surface-variant font-normal">({filteredBills.length})</span>
                    </div>
                    {filteredBills.map((bill) => (
                      <div
                        key={bill.id}
                        onClick={() => handleSelectResult('bills')}
                        className="p-3 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors flex items-center justify-between group my-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                          </div>
                          <div>
                            <p className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {bill.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span>Jatuh Tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                bill.isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' : 'bg-rose-100 text-rose-800 dark:bg-rose-950'
                              }`}>
                                {bill.isPaid ? 'Lunas' : 'Belum Lunas'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-headline-sm font-bold text-on-surface">
                            {formatCurrency(bill.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* GOALS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'goals') && filteredGoals.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 font-label-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t('filterGoals')}</span>
                      <span className="text-xs text-on-surface-variant font-normal">({filteredGoals.length})</span>
                    </div>
                    {filteredGoals.map((goal) => {
                      const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                      return (
                        <div
                          key={goal.id}
                          onClick={() => handleSelectResult('goals')}
                          className="p-3 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors flex items-center justify-between group my-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center">
                              <span className="material-symbols-outlined text-lg">ads_click</span>
                            </div>
                            <div>
                              <p className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {goal.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                <span>Terkumpul {progress}%</span>
                                <span>•</span>
                                <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant font-bold">
                                  {goal.workspaceId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-headline-sm font-bold text-primary">
                              {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
