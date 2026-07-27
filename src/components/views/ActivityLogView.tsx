import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ActivityLog } from '../../types';

export function ActivityLogView() {
  const { activityLogs, deleteActivityLog, clearActivityLogs, autoCleanActivityLogs } = useFinance();
  const { language } = useThemeLanguage();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Auto-clean settings state
  const [isAutoCleanModalOpen, setIsAutoCleanModalOpen] = useState(false);
  const [autoCleanEnabled, setAutoCleanEnabled] = useState<boolean>(() => {
    return localStorage.getItem('harmoni_autoclean_enabled') === 'true';
  });
  const [autoCleanDays, setAutoCleanDays] = useState<string>(() => {
    return localStorage.getItem('harmoni_autoclean_days') || '30';
  });
  const [isCleaningNow, setIsCleaningNow] = useState(false);

  // Modal confirmation states
  const [deleteTarget, setDeleteTarget] = useState<ActivityLog | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter logs
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAction, filterEntity, pageSize]);

  // Calculate pagination boundaries
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Count logs older than configured auto-clean days
  const cutoffDays = parseInt(autoCleanDays, 10) || 30;
  const cutoffTimestamp = Date.now() - (cutoffDays * 24 * 60 * 60 * 1000);
  const eligibleOldLogsCount = activityLogs.filter(log => {
    const time = new Date(log.timestamp).getTime();
    return !isNaN(time) && time < cutoffTimestamp;
  }).length;

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteActivityLog(deleteTarget.id);
      showToast(
        language === 'id' ? 'Item log aktivitas berhasil dihapus.' : 'Activity log entry deleted.',
        'success',
        language === 'id' ? 'Log Dihapus' : 'Log Deleted'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || (language === 'id' ? 'Gagal menghapus log aktivitas.' : 'Failed to delete activity log.'),
        'error',
        language === 'id' ? 'Gagal Hapus' : 'Delete Failed'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearActivityLogs();
      showToast(
        language === 'id' ? 'Seluruh riwayat aktivitas sistem telah dibersihkan.' : 'All activity log history has been cleared.',
        'success',
        language === 'id' ? 'Log Dibersihkan' : 'Logs Cleared'
      );
      setIsClearAllModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || (language === 'id' ? 'Gagal membersihkan log aktivitas.' : 'Failed to clear activity logs.'),
        'error',
        language === 'id' ? 'Gagal Membersihkan' : 'Clear Failed'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAutoCleanSettings = async () => {
    localStorage.setItem('harmoni_autoclean_enabled', autoCleanEnabled ? 'true' : 'false');
    localStorage.setItem('harmoni_autoclean_days', autoCleanDays);

    if (autoCleanEnabled && cutoffDays > 0) {
      setIsCleaningNow(true);
      try {
        const cleaned = await autoCleanActivityLogs(cutoffDays);
        showToast(
          language === 'id' 
            ? `Pengaturan pembersihan otomatis disimpan. ${cleaned} log lama (> ${cutoffDays} hari) berhasil dibersihkan.`
            : `Auto-clean settings saved. ${cleaned} logs older than ${cutoffDays} days removed.`,
          'success',
          language === 'id' ? 'Auto Clean Aktif' : 'Auto Clean Enabled'
        );
      } catch (err: any) {
        console.error('Auto clean execution error:', err);
        showToast(
          language === 'id' ? 'Pengaturan disimpan tetapi gagal membersihkan log.' : 'Settings saved but failed to purge logs.',
          'warning',
          'Warning'
        );
      } finally {
        setIsCleaningNow(false);
      }
    } else {
      showToast(
        language === 'id' ? 'Pengaturan pembersihan otomatis telah diperbarui.' : 'Auto-clean settings updated.',
        'info',
        language === 'id' ? 'Pengaturan Disimpan' : 'Settings Saved'
      );
    }
    setIsAutoCleanModalOpen(false);
  };

  const handleManualTriggerAutoClean = async () => {
    setIsCleaningNow(true);
    try {
      const cleaned = await autoCleanActivityLogs(cutoffDays);
      showToast(
        language === 'id' 
          ? `Pembersihan selesai! ${cleaned} log lama (> ${cutoffDays} hari) berhasil dihapus.`
          : `Clean completed! ${cleaned} logs older than ${cutoffDays} days removed.`,
        cleaned > 0 ? 'success' : 'info',
        language === 'id' ? 'Pembersihan Selesai' : 'Cleanup Complete'
      );
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || 'Gagal menjalankan pembersihan otomatis.',
        'error',
        'Error'
      );
    } finally {
      setIsCleaningNow(false);
    }
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider w-fit">
            {language === 'id' ? 'TAMBAH' : 'ADD'}
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider w-fit">
            {language === 'id' ? 'UBAH' : 'EDIT'}
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider w-fit">
            {language === 'id' ? 'HAPUS' : 'DELETE'}
          </span>
        );
      default:
        return null;
    }
  };

  const getEntityIcon = (entity: ActivityLog['entityType']) => {
    switch (entity) {
      case 'TRANSACTION': return 'payments';
      case 'ASSET': return 'real_estate_agent';
      case 'BILL': return 'receipt_long';
      case 'ENVELOPE': return 'mail';
      case 'GOAL': return 'savings';
      case 'CATEGORY': return 'category';
      case 'FAMILY_MEMBER': return 'group';
      default: return 'history';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-md text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[32px]">history_edu</span>
            {language === 'id' ? 'Log Aktivitas & Audit Trail' : 'Activity Logs & Audit Trail'}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {language === 'id' 
              ? 'Catatan riwayat lengkap semua penambahan, perubahan, dan penghapusan data di aplikasi.' 
              : 'Complete audit trail of all data additions, updates, and deletions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Auto Clean Config Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAutoCleanModalOpen(true)}
            className="font-bold cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">auto_delete</span>
            <span>{language === 'id' ? 'Auto Clean' : 'Auto Clean'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              autoCleanEnabled 
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
            }`}>
              {autoCleanEnabled ? `${autoCleanDays}d ON` : 'OFF'}
            </span>
          </Button>

          {activityLogs.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsClearAllModalOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">cleaning_services</span>
              {language === 'id' ? 'Bersihkan Semua' : 'Clear All'}
            </Button>
          )}
        </div>
      </div>

      {/* Auto Clean Status Banner if Active */}
      {autoCleanEnabled && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400 shrink-0">
              verified
            </span>
            <span>
              {language === 'id' 
                ? `Pembersihan Otomatis AKTIF: Log yang lebih tua dari ${autoCleanDays} hari akan dibersihkan secara berkala.`
                : `Auto-Clean ACTIVE: Audit logs older than ${autoCleanDays} days are cleaned automatically.`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {eligibleOldLogsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold text-[11px]">
                {eligibleOldLogsCount} {language === 'id' ? 'log siap dibersihkan' : 'logs ready'}
              </span>
            )}
            <button
              onClick={() => setIsAutoCleanModalOpen(true)}
              className="font-bold underline hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer"
            >
              {language === 'id' ? 'Atur' : 'Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search Card */}
      <Card variant="default" className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'id' ? 'Cari judul atau rincian log...' : 'Search log title or details...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">{language === 'id' ? 'Semua Aksi (Tambah/Ubah/Hapus)' : 'All Actions'}</option>
              <option value="CREATE">{language === 'id' ? 'Aksi Tambah (CREATE)' : 'Create Actions'}</option>
              <option value="UPDATE">{language === 'id' ? 'Aksi Perubahan (UPDATE)' : 'Update Actions'}</option>
              <option value="DELETE">{language === 'id' ? 'Aksi Penghapusan (DELETE)' : 'Delete Actions'}</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">{language === 'id' ? 'Semua Tipe Data' : 'All Data Types'}</option>
              <option value="TRANSACTION">{language === 'id' ? 'Transaksi' : 'Transactions'}</option>
              <option value="ASSET">{language === 'id' ? 'Aset' : 'Assets'}</option>
              <option value="BILL">{language === 'id' ? 'Tagihan' : 'Bills'}</option>
              <option value="ENVELOPE">{language === 'id' ? 'Amplop Anggaran' : 'Envelopes'}</option>
              <option value="GOAL">{language === 'id' ? 'Target Finansial' : 'Goals'}</option>
              <option value="CATEGORY">{language === 'id' ? 'Kategori' : 'Categories'}</option>
              <option value="FAMILY_MEMBER">{language === 'id' ? 'Anggota Keluarga' : 'Family Members'}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Log List Card */}
      <Card variant="default" className="p-4 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Header Range Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/60">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider">
                {language === 'id' 
                  ? `Menampilkan ${totalItems > 0 ? startIndex + 1 : 0}–${endIndex} dari ${totalItems} Log`
                  : `Showing ${totalItems > 0 ? startIndex + 1 : 0}–${endIndex} of ${totalItems} Logs`}
              </span>
              {filteredLogs.length !== activityLogs.length && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {language === 'id' ? `Difilter dari ${activityLogs.length}` : `Filtered from ${activityLogs.length}`}
                </span>
              )}
            </div>

            {/* Page Size Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-on-surface-variant font-medium">
                {language === 'id' ? 'Tampilkan:' : 'Show:'}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value={10}>10 / {language === 'id' ? 'halaman' : 'page'}</option>
                <option value={25}>25 / {language === 'id' ? 'halaman' : 'page'}</option>
                <option value={50}>50 / {language === 'id' ? 'halaman' : 'page'}</option>
                <option value={100}>100 / {language === 'id' ? 'halaman' : 'page'}</option>
              </select>
            </div>
          </div>

          {paginatedLogs.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">history_toggle_off</span>
              <p className="font-body-md text-on-surface-variant max-w-md">
                {activityLogs.length === 0
                  ? (language === 'id' ? 'Belum ada aktivitas terekam. Lakukan transaksi atau tambah data untuk melihat log.' : 'No activity logged yet.')
                  : (language === 'id' ? 'Tidak ada log yang sesuai dengan filter pencarian.' : 'No logs match your filter criteria.')}
              </p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-y-3 before:left-[19px] sm:before:left-[23px] before:w-[2px] before:bg-outline-variant/30 space-y-0.5">
              {paginatedLogs.map((log) => (
                <div 
                  key={log.id}
                  className="relative py-3 pl-12 pr-3 sm:pl-14 sm:pr-4 rounded-xl hover:bg-surface-container-lowest transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-[11px] sm:left-[15px] top-3.5 w-[18px] h-[18px] rounded-full bg-surface border-4 border-surface z-10 flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      log.action === 'CREATE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                      log.action === 'UPDATE' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                      'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getActionBadge(log.action)}
                      <h4 className="font-bold text-on-surface text-sm truncate max-w-[200px] sm:max-w-sm">{log.title}</h4>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-on-surface-variant flex items-center gap-1 border border-outline-variant/40 bg-surface-container-high/50">
                        <span className="material-symbols-outlined text-[12px] opacity-70">
                          {getEntityIcon(log.entityType)}
                        </span>
                        {log.workspaceId === 'personal' ? 'Personal' : log.workspaceId === 'keluarga' ? 'Keluarga' : log.workspaceId}
                      </span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                  
                  {/* Timestamp & Action */}
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0 pt-0.5">
                    <span className="text-[11px] text-outline font-medium tracking-wide">
                      {new Date(log.timestamp).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(log)}
                      className="text-on-surface-variant hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                      title={language === 'id' ? 'Hapus Log Ini' : 'Delete this log'}
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer Controls */}
        {totalItems > 0 && (
          <div className="mt-6 pt-4 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-on-surface-variant font-medium">
              {language === 'id'
                ? `Halaman ${safeCurrentPage} dari ${totalPages}`
                : `Page ${safeCurrentPage} of ${totalPages}`}
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page Button */}
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={language === 'id' ? 'Halaman Pertama' : 'First Page'}
              >
                <span className="material-symbols-outlined text-[18px]">first_page</span>
              </button>

              {/* Prev Page Button */}
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{language === 'id' ? 'Sebelumnya' : 'Prev'}</span>
              </button>

              {/* Dynamic Page Buttons */}
              <div className="hidden sm:flex items-center gap-1 mx-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pageNum = safeCurrentPage;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (safeCurrentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (safeCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = safeCurrentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        safeCurrentPage === pageNum
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>{language === 'id' ? 'Berikutnya' : 'Next'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>

              {/* Last Page Button */}
              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={language === 'id' ? 'Halaman Terakhir' : 'Last Page'}
              >
                <span className="material-symbols-outlined text-[18px]">last_page</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Auto Clean Configuration Modal */}
      {isAutoCleanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">auto_delete</span>
                </div>
                <div>
                  <h3 className="font-headline-sm font-bold text-on-surface">
                    {language === 'id' ? 'Pengaturan Pembersihan Otomatis' : 'Auto-Clean Settings'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {language === 'id' ? 'Atur retensi data riwayat audit trail Anda.' : 'Manage audit trail data retention.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAutoCleanModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-low">
              <div>
                <h4 className="font-label-lg text-on-surface font-bold">
                  {language === 'id' ? 'Aktifkan Auto Clean' : 'Enable Auto-Clean'}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  {language === 'id' 
                    ? 'Hapus log aktivitas lama secara otomatis dari Firestore.' 
                    : 'Automatically purge old audit logs from Firestore.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input 
                  type="checkbox" 
                  checked={autoCleanEnabled} 
                  onChange={(e) => setAutoCleanEnabled(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Retention Threshold Dropdown / Input */}
            <div className={`space-y-3 transition-all ${autoCleanEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="font-label-md text-on-surface block">
                {language === 'id' ? 'Batas Usia Log Dihapus (Hari)' : 'Log Retention Threshold (Days)'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['7', '14', '30', '60', '90', '180', '365'].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setAutoCleanDays(days)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center ${
                      autoCleanDays === days
                        ? 'border-primary bg-primary-container text-on-primary-container shadow-xs'
                        : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="text-sm">{days}</span>
                    <span className="text-[10px] opacity-80">{language === 'id' ? 'Hari' : 'Days'}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs text-on-surface-variant block mb-1 font-medium">
                  {language === 'id' ? 'Atau masukkan jumlah hari kustom:' : 'Or enter custom days threshold:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={autoCleanDays}
                    onChange={(e) => setAutoCleanDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary font-bold"
                  />
                  <span className="text-xs text-on-surface-variant font-bold shrink-0">
                    {language === 'id' ? 'Hari' : 'Days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary & Run Manual Clean */}
            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">
                  {language === 'id' ? 'Log terpengaruh (> ' + cutoffDays + ' hari):' : 'Affected logs (> ' + cutoffDays + ' days):'}
                </span>
                <span className="font-bold text-on-surface">
                  {eligibleOldLogsCount} {language === 'id' ? 'catatan' : 'entries'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={isCleaningNow || eligibleOldLogsCount === 0}
                onClick={handleManualTriggerAutoClean}
                className="w-full text-xs font-bold justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] mr-1">cleaning_services</span>
                {isCleaningNow 
                  ? (language === 'id' ? 'Membersihkan...' : 'Cleaning...')
                  : (language === 'id' ? 'Jalankan Pembersihan Sekarang' : 'Run Clean Now')}
              </Button>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoCleanModalOpen(false)}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAutoCleanSettings}
                isLoading={isCleaningNow}
              >
                {language === 'id' ? 'Simpan Pengaturan' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSingle}
        title={language === 'id' ? 'Hapus Catatan Log' : 'Delete Log Entry'}
        message={language === 'id' ? 'Apakah Anda yakin ingin menghapus catatan riwayat aktivitas ini secara permanen?' : 'Are you sure you want to permanently delete this log entry?'}
        itemDetails={deleteTarget ? [
          { label: language === 'id' ? 'Aktivitas' : 'Activity', value: deleteTarget.title },
          { label: language === 'id' ? 'Rincian' : 'Details', value: deleteTarget.details },
          { label: language === 'id' ? 'Waktu' : 'Timestamp', value: new Date(deleteTarget.timestamp).toLocaleString('id-ID') }
        ] : []}
        confirmText={language === 'id' ? 'Hapus Log' : 'Delete Log'}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleClearAll}
        title={language === 'id' ? 'Bersihkan Semua Log Aktivitas' : 'Clear All Activity Logs'}
        message={language === 'id' 
          ? 'Peringatan: Semua riwayat log aktivitas audit trail di workspace ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.'
          : 'Warning: All audit trail activity history in this workspace will be permanently deleted. This action cannot be undone.'}
        confirmText={language === 'id' ? 'Ya, Hapus Semua Log' : 'Yes, Clear All Logs'}
        isLoading={isDeleting}
      />
    </div>
  );
}
