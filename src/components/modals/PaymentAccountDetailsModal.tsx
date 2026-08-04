import React, { useState, useEffect } from 'react';
import { PaymentAccount, Transaction } from '../../types';
import { useFinance } from '../../store';
import { formatCurrency, formatDateFriendly } from '../../utils';
import { Button } from '../ui/Button';

interface PaymentAccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: PaymentAccount | null;
}

export function PaymentAccountDetailsModal({ isOpen, onClose, account }: PaymentAccountDetailsModalProps) {
  const { transactions } = useFinance();
  const [page, setPage] = useState(1);
  const itemsPerPage = 8; // small pagination size

  // Reset page when account changes
  useEffect(() => {
    setPage(1);
  }, [account]);

  if (!isOpen || !account) return null;

  // Filter transactions related to this account
  const accountTransactions = transactions.filter(t => t.paymentAccountId === account.id);
  
  // Sort by newest date, then newest input/entry time
  const getCreatedTimestamp = (t: any): number => {
    if (t.createdAt) {
      const time = new Date(t.createdAt).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    if (t.id && typeof t.id === 'string' && t.id.includes('-')) {
      const parts = t.id.split('-');
      for (const part of parts) {
        if (/^\d{12,14}$/.test(part)) {
          const num = parseInt(part, 10);
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }
    return 0;
  };

  const sortedTransactions = [...accountTransactions].sort((a, b) => {
    const dayA = a.date ? a.date.slice(0, 10) : '';
    const dayB = b.date ? b.date.slice(0, 10) : '';
    let result = dayB.localeCompare(dayA);
    if (result === 0) {
      result = getCreatedTimestamp(b) - getCreatedTimestamp(a);
    }
    return result;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1;
  const currentItems = sortedTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bank': return { label: 'Bank', bg: 'bg-blue-500/10 text-blue-600' };
      case 'ewallet': return { label: 'E-Wallet', bg: 'bg-emerald-500/10 text-emerald-600' };
      case 'cash': return { label: 'Kas Tunai', bg: 'bg-amber-500/10 text-amber-600' };
      case 'investment': return { label: 'Investasi', bg: 'bg-purple-500/10 text-purple-600' };
      default: return { label: type, bg: 'bg-primary/10 text-primary' };
    }
  };
  const badge = getTypeBadge(account.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: account.color || '#2563eb' }}
            >
              <span className="material-symbols-outlined text-[20px]">
                {account.type === 'bank' ? 'account_balance' : account.type === 'ewallet' ? 'smartphone' : account.type === 'cash' ? 'payments' : 'trending_up'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                {account.name}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.bg}`}>
                  {badge.label}
                </span>
              </h3>
              <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                <span>{account.accountNumber ? `No: ${account.accountNumber}` : (account.holderName || '-')}</span>
                <span>•</span>
                <span className={`font-semibold ${account.workspaceId === 'pribadi' ? 'text-purple-600' : 'text-amber-600'}`}>
                  {account.workspaceId === 'pribadi' ? 'Pribadi' : 'Keluarga'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Balance Overview */}
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-on-surface-variant mb-1 font-medium">Saldo Saat Ini</div>
            <div className="font-headline-md font-bold text-primary">
              {formatCurrency(account.balance)}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] -mx-2 px-2">
          <h4 className="font-label-md font-bold text-on-surface mb-3 flex items-center justify-between">
            <span>Riwayat Arus Kas</span>
            <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] text-on-surface-variant font-medium">
              {sortedTransactions.length} Transaksi
            </span>
          </h4>
          
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
              <span className="material-symbols-outlined text-4xl opacity-20 mb-2">receipt_long</span>
              <p>Belum ada transaksi di rekening ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentItems.map(tx => (
                <div key={tx.id} className="p-3 bg-surface border border-outline-variant rounded-xl flex items-center justify-between hover:bg-surface-container-lowest transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : tx.type === 'expense' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {tx.type === 'income' ? 'south_west' : tx.type === 'expense' ? 'north_east' : 'swap_horiz'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-on-surface truncate">{tx.description}</div>
                      <div className="text-[10px] text-on-surface-variant flex gap-2">
                        <span>{formatDateFriendly(tx.date)}</span>
                        <span className="capitalize">{tx.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm shrink-0 ml-2 ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant/60 pt-4 mt-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-2 py-1 h-7 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-2 py-1 h-7 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
