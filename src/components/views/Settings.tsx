import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { useFinance } from '../../store';
import { SettingsSkeleton } from '../ui/Skeleton';
import { Plus, Pencil, Trash2, Check, X, Shield, Fingerprint, Clock, Key, Lock, AlertCircle, CheckCircle, UserPlus, Users, Scale } from 'lucide-react';
import { FamilyMember, PaymentAccount, WorkspaceType } from '../../types';
import { DatabaseMigration } from '../DatabaseMigration';
import { EnvironmentOverride } from '../EnvironmentOverride';
import { formatCurrency } from '../../utils';

export function Settings() {
  const { language, setLanguage, theme, setTheme, t } = useThemeLanguage();
  const { showToast } = useToast();
  const { 
    workspace,
    customCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    transactions, 
    envelopes, 
    autoCleanActivityLogs, 
    activityLogs,
    familyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    paymentAccounts,
    addPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    reconcilePaymentAccount,
    user
  } = useFinance();

  const FAMILY_ROLES = [
    { id: 'Kepala Keluarga', labelId: 'Kepala Keluarga', labelEn: 'Head of Household' },
    { id: 'Suami', labelId: 'Suami', labelEn: 'Husband' },
    { id: 'Istri', labelId: 'Istri', labelEn: 'Wife' },
    { id: 'Anak Laki-laki', labelId: 'Anak Laki-laki', labelEn: 'Son' },
    { id: 'Anak Perempuan', labelId: 'Anak Perempuan', labelEn: 'Daughter' },
    { id: 'Ayah', labelId: 'Ayah (Orang Tua)', labelEn: 'Father' },
    { id: 'Ibu', labelId: 'Ibu (Orang Tua)', labelEn: 'Mother' },
    { id: 'Saudara Laki-laki', labelId: 'Saudara Laki-laki', labelEn: 'Brother' },
    { id: 'Saudara Perempuan', labelId: 'Saudara Perempuan', labelEn: 'Sister' },
    { id: 'Kakek / Nenek', labelId: 'Kakek / Nenek', labelEn: 'Grandparent' },
    { id: 'Kerabat / Lainnya', labelId: 'Kerabat / Lainnya', labelEn: 'Relative / Other' }
  ];
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState('#2563eb');

  // Auto-clean audit trail state
  const [isAutoCleanEnabled, setIsAutoCleanEnabled] = useState(() => {
    return localStorage.getItem('harmoni_autoclean_enabled') === 'true';
  });
  const [autoCleanDays, setAutoCleanDays] = useState(() => {
    return localStorage.getItem('harmoni_autoclean_days') || '30';
  });
  const [isCleaningAuditLogs, setIsCleaningAuditLogs] = useState(false);
  
  // Asset revaluation reminder state
  const [isAssetRevalReminderEnabled, setIsAssetRevalReminderEnabled] = useState(() => {
    return localStorage.getItem('harmoni_reval_reminder_enabled') !== 'false';
  });
  
  // Category delete state
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<any | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Family member state
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [familyMemberRole, setFamilyMemberRole] = useState('Anggota');
  const [familyMemberBudget, setFamilyMemberBudget] = useState('');
  const [familyMemberEmail, setFamilyMemberEmail] = useState('');
  const [isSubmittingFamily, setIsSubmittingFamily] = useState(false);

  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState<FamilyMember | null>(null);
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);

  // Payment Accounts (Bank / E-Wallet) State
  const [isPayAccModalOpen, setIsPayAccModalOpen] = useState(false);
  const [editingPayAcc, setEditingPayAcc] = useState<PaymentAccount | null>(null);
  const [payAccName, setPayAccName] = useState('');
  const [payAccType, setPayAccType] = useState<'bank' | 'ewallet' | 'cash' | 'investment'>('bank');
  const [payAccWs, setPayAccWs] = useState<WorkspaceType>('keluarga');
  const [payAccNumber, setPayAccNumber] = useState('');
  const [payAccHolder, setPayAccHolder] = useState('');
  const [payAccBalance, setPayAccBalance] = useState('');
  const [payAccColor, setPayAccColor] = useState('#2563eb');
  const [isSubmittingPayAcc, setIsSubmittingPayAcc] = useState(false);

  const [deletePayAccTarget, setDeletePayAccTarget] = useState<PaymentAccount | null>(null);
  const [isDeletingPayAcc, setIsDeletingPayAcc] = useState(false);

  // Reconciliation (Rekonsiliasi Saldo) State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileTarget, setReconcileTarget] = useState<PaymentAccount | null>(null);
  const [reconcileRealBalance, setReconcileRealBalance] = useState('');
  const [reconcileReason, setReconcileReason] = useState('Penyesuaian Akhir Bulan');
  const [isSubmittingReconcile, setIsSubmittingReconcile] = useState(false);

  const handleOpenReconcileModal = (acc: PaymentAccount) => {
    setReconcileTarget(acc);
    setReconcileRealBalance(acc.balance.toString());
    setReconcileReason(language === 'id' ? 'Penyesuaian Akhir Bulan' : 'End of Month Adjustment');
    setIsReconcileModalOpen(true);
  };

  const handleSaveReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileTarget) return;
    const realBalanceNum = parseFloat(reconcileRealBalance);
    if (isNaN(realBalanceNum)) {
      showToast(language === 'id' ? 'Saldo riil harus diisi dengan angka.' : 'Real balance must be a number.', 'error', 'Validasi Gagal');
      return;
    }
    if (!reconcileReason.trim()) {
      showToast(language === 'id' ? 'Alasan penyesuaian harus diisi.' : 'Adjustment reason is required.', 'error', 'Validasi Gagal');
      return;
    }

    setIsSubmittingReconcile(true);
    try {
      await reconcilePaymentAccount(reconcileTarget.id, realBalanceNum, reconcileReason.trim());
      showToast(
        language === 'id' 
          ? `Rekonsiliasi saldo "${reconcileTarget.name}" berhasil dilakukan.` 
          : `Reconciliation of "${reconcileTarget.name}" completed successfully.`,
        'success',
        language === 'id' ? 'Rekonsiliasi Berhasil' : 'Reconciliation Success'
      );
      setIsReconcileModalOpen(false);
    } catch (err: any) {
      console.error('Error in reconciliation:', err);
      showToast(err.message || 'Gagal melakukan rekonsiliasi.', 'error', 'Gagal');
    } finally {
      setIsSubmittingReconcile(false);
    }
  };

  const handleOpenAddFamilyModal = () => {
    setEditingFamilyMember(null);
    setFamilyMemberName(user?.displayName || '');
    setFamilyMemberRole('Kepala Keluarga');
    setFamilyMemberBudget('');
    setFamilyMemberEmail(user?.email || '');
    setIsFamilyModalOpen(true);
  };

  const handleOpenEditFamilyModal = (member: FamilyMember) => {
    setEditingFamilyMember(member);
    setFamilyMemberName(member.name);
    setFamilyMemberRole(member.role);
    setFamilyMemberBudget(member.monthlyBudget ? member.monthlyBudget.toString() : '');
    setFamilyMemberEmail(member.email || '');
    setIsFamilyModalOpen(true);
  };

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyMemberName.trim() || !familyMemberRole.trim()) return;

    setIsSubmittingFamily(true);
    const parsedBudget = parseFloat(familyMemberBudget) || 0;

    try {
      if (editingFamilyMember) {
        await updateFamilyMember(
          editingFamilyMember.id,
          familyMemberName.trim(),
          familyMemberRole.trim(),
          parsedBudget,
          familyMemberEmail.trim()
        );
        showToast(
          language === 'id' ? `Data ${familyMemberName} berhasil diperbarui.` : `Updated ${familyMemberName}.`,
          'success',
          'Berhasil Diperbarui'
        );
      } else {
        await addFamilyMember(
          familyMemberName.trim(),
          familyMemberRole.trim(),
          parsedBudget,
          familyMemberEmail.trim()
        );
        showToast(
          language === 'id' ? `Anggota keluarga ${familyMemberName} berhasil ditambahkan.` : `Added ${familyMemberName}.`,
          'success',
          'Anggota Ditambahkan'
        );
      }
      setIsFamilyModalOpen(false);
    } catch (err: any) {
      console.error('Error saving family member:', err);
      showToast(err.message || 'Gagal menyimpan data anggota keluarga.', 'error', 'Gagal');
    } finally {
      setIsSubmittingFamily(false);
    }
  };

  const handleConfirmDeleteFamily = async () => {
    if (!deleteFamilyTarget) return;
    setIsDeletingFamily(true);
    const targetName = deleteFamilyTarget.name;
    try {
      await deleteFamilyMember(deleteFamilyTarget.id);
      showToast(
        language === 'id' ? `Anggota keluarga "${targetName}" telah dihapus.` : `Removed family member "${targetName}".`,
        'success',
        'Berhasil Dihapus'
      );
      setDeleteFamilyTarget(null);
    } catch (err: any) {
      console.error('Error deleting family member:', err);
      showToast(err.message || 'Gagal menghapus anggota keluarga.', 'error', 'Gagal Hapus');
    } finally {
      setIsDeletingFamily(false);
    }
  };

  const handleOpenAddPayAccModal = () => {
    setEditingPayAcc(null);
    setPayAccName('');
    setPayAccType('bank');
    setPayAccWs(workspace || 'keluarga');
    setPayAccNumber('');
    setPayAccHolder(user?.displayName || '');
    setPayAccBalance('');
    setPayAccColor('#2563eb');
    setIsPayAccModalOpen(true);
  };

  const handleOpenEditPayAccModal = (acc: PaymentAccount) => {
    setEditingPayAcc(acc);
    setPayAccName(acc.name);
    setPayAccType(acc.type);
    setPayAccWs(acc.workspaceId || 'keluarga');
    setPayAccNumber(acc.accountNumber || '');
    setPayAccHolder(acc.holderName || '');
    setPayAccBalance(acc.balance.toString());
    setPayAccColor(acc.color || '#2563eb');
    setIsPayAccModalOpen(true);
  };

  const handleSavePayAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAccName.trim()) {
      showToast('Nama rekening/dompet harus diisi.', 'error', 'Validasi Gagal');
      return;
    }
    const balanceNum = parseFloat(payAccBalance) || 0;
    setIsSubmittingPayAcc(true);

    try {
      if (editingPayAcc) {
        await updatePaymentAccount(
          editingPayAcc.id,
          payAccName.trim(),
          payAccType,
          balanceNum,
          payAccNumber.trim(),
          payAccHolder.trim(),
          payAccColor,
          payAccWs
        );
        showToast(`Rekening "${payAccName}" berhasil diperbarui.`, 'success', 'Rekening Diperbarui');
      } else {
        await addPaymentAccount(
          payAccName.trim(),
          payAccType,
          balanceNum,
          payAccNumber.trim(),
          payAccHolder.trim(),
          payAccColor,
          payAccWs
        );
        showToast(`Rekening "${payAccName}" berhasil ditambahkan.`, 'success', 'Rekening Ditambahkan');
      }
      setIsPayAccModalOpen(false);
    } catch (err: any) {
      console.error('Error saving payment account:', err);
      showToast(err.message || 'Gagal menyimpan rekening.', 'error', 'Gagal');
    } finally {
      setIsSubmittingPayAcc(false);
    }
  };

  const handleConfirmDeletePayAcc = async () => {
    if (!deletePayAccTarget) return;
    setIsDeletingPayAcc(true);
    const targetName = deletePayAccTarget.name;
    try {
      await deletePaymentAccount(deletePayAccTarget.id);
      showToast(`Rekening "${targetName}" berhasil dihapus.`, 'success', 'Rekening Dihapus');
      setDeletePayAccTarget(null);
    } catch (err: any) {
      console.error('Error deleting payment account:', err);
      showToast(err.message || 'Gagal menghapus rekening.', 'error', 'Gagal Hapus');
    } finally {
      setIsDeletingPayAcc(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setIsDeletingCategory(true);
    const targetName = deleteCategoryTarget.name;
    try {
      await deleteCategory(deleteCategoryTarget.id);
      showToast(
        `Kategori "${targetName}" berhasil dihapus.`,
        'success',
        'Kategori Dihapus'
      );
      setDeleteCategoryTarget(null);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      showToast(
        err.message || 'Gagal menghapus kategori.',
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const categoryLinkedTxCount = deleteCategoryTarget 
    ? transactions.filter(t => t.category === deleteCategoryTarget.name).length 
    : 0;
  
  const categoryLinkedEnvelopeCount = deleteCategoryTarget 
    ? envelopes.filter(e => e.category === deleteCategoryTarget.name).length 
    : 0;

  // Security PIN & Biometric Access Protection Options
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(() => {
    return localStorage.getItem('harmoni_pin_enabled') === 'true';
  });
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => {
    return localStorage.getItem('harmoni_biometric_enabled') === 'true';
  });
  const [autolockDelay, setAutolockDelay] = useState(() => {
    return localStorage.getItem('harmoni_autolock_delay') || '60000'; // Default 1 minute
  });
  const [pinValue, setPinValue] = useState('');
  const [pinConfirmValue, setPinConfirmValue] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const handleToggleSecurity = (enabled: boolean) => {
    setSecurityError('');
    setSecuritySuccess('');
    
    if (enabled) {
      // Require PIN setup if none exists
      const existingHash = localStorage.getItem('harmoni_pin_hash');
      if (!existingHash) {
        setShowPinSetup(true);
        setSecurityError(language === 'id' ? 'Silakan buat PIN pengunci terlebih dahulu.' : 'Please set up a secure lock PIN first.');
        return;
      }
      localStorage.setItem('harmoni_pin_enabled', 'true');
      setIsSecurityEnabled(true);
      showTemporarySuccess(language === 'id' ? 'Proteksi keamanan PIN berhasil diaktifkan.' : 'PIN access protection successfully enabled.');
    } else {
      localStorage.setItem('harmoni_pin_enabled', 'false');
      setIsSecurityEnabled(false);
      // Disable biometric too if security is fully turned off
      localStorage.setItem('harmoni_biometric_enabled', 'false');
      setIsBiometricEnabled(false);
      showTemporarySuccess(language === 'id' ? 'Proteksi keamanan dinonaktifkan.' : 'Access protection disabled.');
    }
  };

  const handleToggleBiometric = (enabled: boolean) => {
    setSecurityError('');
    setSecuritySuccess('');

    if (enabled) {
      if (!isSecurityEnabled) {
        setSecurityError(language === 'id' ? 'Silakan aktifkan PIN Pengunci terlebih dahulu.' : 'Please enable PIN Lock first.');
        return;
      }
      localStorage.setItem('harmoni_biometric_enabled', 'true');
      setIsBiometricEnabled(true);
      showTemporarySuccess(language === 'id' ? 'Otentikasi biometrik (Sidik Jari/Wajah) diaktifkan.' : 'Biometric authentication (Fingerprint/Face) enabled.');
    } else {
      localStorage.setItem('harmoni_biometric_enabled', 'false');
      setIsBiometricEnabled(false);
      showTemporarySuccess(language === 'id' ? 'Otentikasi biometrik dinonaktifkan.' : 'Biometric authentication disabled.');
    }
  };

  const handleSaveAutolockDelay = (val: string) => {
    localStorage.setItem('harmoni_autolock_delay', val);
    setAutolockDelay(val);
    showTemporarySuccess(
      language === 'id' 
        ? 'Durasi penguncian otomatis berhasil diperbarui.' 
        : 'Auto-lock duration successfully updated.'
    );
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!/^\d{4,6}$/.test(pinValue)) {
      setSecurityError(language === 'id' ? 'PIN harus berupa angka sepanjang 4 - 6 digit.' : 'PIN must be a 4 - 6 digit number.');
      return;
    }

    if (pinValue !== pinConfirmValue) {
      setSecurityError(language === 'id' ? 'Konfirmasi PIN yang Anda masukkan tidak cocok.' : 'PIN confirmation does not match.');
      return;
    }

    localStorage.setItem('harmoni_pin_hash', pinValue);
    localStorage.setItem('harmoni_pin_enabled', 'true');
    setIsSecurityEnabled(true);
    setPinValue('');
    setPinConfirmValue('');
    setShowPinSetup(false);
    showTemporarySuccess(language === 'id' ? 'PIN pengunci baru berhasil dibuat dan diaktifkan!' : 'New lock PIN successfully created and enabled!');
  };

  const showTemporarySuccess = (msg: string) => {
    setSecuritySuccess(msg);
    setTimeout(() => {
      setSecuritySuccess('');
    }, 4000);
  };

  const handleToggleAutoClean = async (enabled: boolean) => {
    localStorage.setItem('harmoni_autoclean_enabled', enabled ? 'true' : 'false');
    setIsAutoCleanEnabled(enabled);
    if (enabled) {
      const days = parseInt(autoCleanDays, 10) || 30;
      setIsCleaningAuditLogs(true);
      try {
        const cleaned = await autoCleanActivityLogs(days);
        showToast(
          language === 'id' 
            ? `Pembersihan otomatis diaktifkan. ${cleaned} log lama (> ${days} hari) berhasil dibersihkan.`
            : `Auto-clean enabled. ${cleaned} logs older than ${days} days cleaned.`,
          'success',
          language === 'id' ? 'Auto Clean Aktif' : 'Auto Clean Enabled'
        );
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsCleaningAuditLogs(false);
      }
    } else {
      showToast(
        language === 'id' ? 'Pembersihan otomatis log aktivitas dinonaktifkan.' : 'Audit log auto-clean disabled.',
        'info',
        language === 'id' ? 'Auto Clean Nonaktif' : 'Auto Clean Disabled'
      );
    }
  };

  const handleToggleRevalReminder = (enabled: boolean) => {
    localStorage.setItem('harmoni_reval_reminder_enabled', enabled ? 'true' : 'false');
    setIsAssetRevalReminderEnabled(enabled);
    showToast(
      language === 'id' 
        ? (enabled ? 'Pengingat revaluasi berkala tahunan aktif.' : 'Pengingat revaluasi dinonaktifkan.') 
        : (enabled ? 'Annual revaluation reminder enabled.' : 'Revaluation reminder disabled.'),
      enabled ? 'success' : 'info',
      language === 'id' ? 'Pengaturan Disimpan' : 'Settings Updated'
    );
  };

  const handleSaveAutoCleanDays = (val: string) => {
    localStorage.setItem('harmoni_autoclean_days', val);
    setAutoCleanDays(val);
    showToast(
      language === 'id' ? `Batas simpan audit log diperbarui menjadi ${val} hari.` : `Audit log retention threshold updated to ${val} days.`,
      'success',
      'Settings Updated'
    );
  };

  const handleManualRunAutoClean = async () => {
    const days = parseInt(autoCleanDays, 10) || 30;
    setIsCleaningAuditLogs(true);
    try {
      const cleaned = await autoCleanActivityLogs(days);
      showToast(
        language === 'id' 
          ? `Pembersihan selesai. ${cleaned} log lama (> ${days} hari) dibersihkan dari database.`
          : `Clean completed. ${cleaned} logs older than ${days} days cleaned from database.`,
        cleaned > 0 ? 'success' : 'info',
        language === 'id' ? 'Hasil Pembersihan' : 'Clean Results'
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membersihkan log.', 'error', 'Error');
    } finally {
      setIsCleaningAuditLogs(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      if (editingId) {
        await updateCategory(editingId, nameInput.trim(), activeTab, colorInput);
        showToast(
          `Kategori "${nameInput.trim()}" berhasil diperbarui!`,
          'success',
          'Kategori Diperbarui'
        );
      } else {
        await addCategory(nameInput.trim(), activeTab, colorInput);
        showToast(
          `Kategori kustom "${nameInput.trim()}" berhasil ditambahkan!`,
          'success',
          'Kategori Ditambahkan'
        );
      }
      // Reset form
      setNameInput('');
      setColorInput('#2563eb');
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err: any) {
      console.error("Error saving category:", err);
      showToast(
        err.message || 'Gagal menyimpan kategori.',
        'error',
        'Gagal Menyimpan'
      );
    }
  };

  const handleStartEdit = (category: any) => {
    setEditingId(category.id);
    setNameInput(category.name);
    setColorInput(category.color || '#2563eb');
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setNameInput('');
    setColorInput('#2563eb');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const COLOR_OPTIONS = [
    '#2563eb', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
    '#06b6d4'  // Cyan
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Theme and Language Settings Card */}
      <Card variant="default" className="p-6 border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-2xl">palette</span>
          <div>
            <h3 className="font-headline-sm text-on-surface">{t('appearanceAndLanguage')}</h3>
            <p className="font-body-sm text-on-surface-variant">{t('appearanceSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Selection */}
          <div className="flex flex-col gap-3">
            <label className="font-label-lg text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">translate</span>
              {t('language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  language === 'id'
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">language</span>
                <span>{t('indonesian')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  language === 'en'
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">public</span>
                <span>{t('english')}</span>
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="flex flex-col gap-3">
            <label className="font-label-lg text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">contrast</span>
              {t('theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-amber-500">light_mode</span>
                <span>{t('lightMode')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-indigo-400">dark_mode</span>
                <span>{t('darkMode')}</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Security and Access Protection Card */}
      <Card variant="default" className="p-6 border border-outline-variant shadow-sm overflow-hidden animate-fadeIn">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <Shield className="text-primary w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-headline-sm text-on-surface">
              {language === 'id' ? 'Proteksi Keamanan Akses' : 'Access Security Protection'}
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              {language === 'id' 
                ? 'Amankan data keuangan pribadi dan keluarga yang sensitif menggunakan PIN atau sidik jari' 
                : 'Secure sensitive personal and family financial data using PIN or fingerprint lock'}
            </p>
          </div>
        </div>

        {/* Global Notifications for Security Settings */}
        {securitySuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-label-lg flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{securitySuccess}</span>
          </div>
        )}

        {securityError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-label-lg flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{securityError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Toggles and Configuration */}
          <div className="space-y-6">
            {/* Toggle 1: PIN Access Protection */}
            <div className="flex items-start justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 hover:bg-surface-container-low transition-colors duration-200">
              <div className="flex gap-3.5 max-w-[80%]">
                <div className="p-2.5 rounded-lg bg-primary-container text-on-primary-container mt-0.5 animate-fadeIn">
                  <Lock className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-label-lg text-on-surface">
                    {language === 'id' ? 'Aktifkan Pengunci PIN' : 'Enable PIN Lock'}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {language === 'id' 
                      ? 'Wajibkan kode PIN 4-6 digit setiap kali aplikasi dibuka atau setelah tidak aktif.' 
                      : 'Require a 4-6 digit PIN passcode whenever the app is opened or after inactivity.'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                <input 
                  type="checkbox" 
                  checked={isSecurityEnabled} 
                  onChange={(e) => handleToggleSecurity(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Toggle 2: Biometric Access */}
            <div className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-200 ${
              isSecurityEnabled 
                ? 'border-outline-variant bg-surface-container-low/60 hover:bg-surface-container-low' 
                : 'border-outline-variant/30 bg-surface-container-low/20 opacity-50 cursor-not-allowed'
            }`}>
              <div className="flex gap-3.5 max-w-[80%]">
                <div className={`p-2.5 rounded-lg mt-0.5 transition-colors ${
                  isSecurityEnabled ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  <Fingerprint className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className={`font-label-lg ${isSecurityEnabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {language === 'id' ? 'Otentikasi Biometrik (Sidik Jari / Wajah)' : 'Biometric Authentication (Fingerprint / Face ID)'}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {language === 'id' 
                      ? 'Gunakan sensor biometrik perangkat Anda untuk membuka aplikasi secara instan dan aman.' 
                      : 'Use your device\'s hardware biometrics sensor to unlock the app instantly and securely.'}
                  </p>
                </div>
              </div>
              <label className={`relative inline-flex items-center mt-1 ${isSecurityEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} select-none`}>
                <input 
                  type="checkbox" 
                  checked={isBiometricEnabled} 
                  disabled={!isSecurityEnabled}
                  onChange={(e) => handleToggleBiometric(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Dropdown: Auto-Lock Delay */}
            <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 ${
              isSecurityEnabled 
                ? 'border-outline-variant bg-surface-container-low/60 hover:bg-surface-container-low' 
                : 'border-outline-variant/30 bg-surface-container-low/20 opacity-50'
            }`}>
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 shrink-0 transition-colors ${isSecurityEnabled ? 'text-primary' : 'text-on-surface-variant'}`} />
                <h4 className={`font-label-lg ${isSecurityEnabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {language === 'id' ? 'Waktu Penguncian Otomatis' : 'Auto-Lock Inactivity Timeout'}
                </h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'id' 
                  ? 'Aplikasi akan terkunci secara otomatis setelah periode tidak aktif yang dipilih.' 
                  : 'The application will automatically lock after the selected duration of inactivity.'}
              </p>
              <div className="mt-1">
                <select
                  disabled={!isSecurityEnabled}
                  value={autolockDelay}
                  onChange={(e) => handleSaveAutolockDelay(e.target.value)}
                  className={`w-full max-w-xs px-3.5 py-2 bg-surface border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all ${
                    isSecurityEnabled 
                      ? 'border-outline-variant text-on-surface' 
                      : 'border-outline-variant/30 text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  <option value="0">{language === 'id' ? 'Seketika / Instan' : 'Immediately'}</option>
                  <option value="15000">15 {language === 'id' ? 'Detik' : 'Seconds'}</option>
                  <option value="60000">1 {language === 'id' ? 'Menit' : 'Minute'}</option>
                  <option value="300000">5 {language === 'id' ? 'Menit' : 'Minutes'}</option>
                  <option value="900000">15 {language === 'id' ? 'Menit' : 'Minutes'}</option>
                  <option value="3600000">1 {language === 'id' ? 'Jam' : 'Hour'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Change PIN / PIN Setup Interface */}
          <div className="border border-outline-variant/60 rounded-2xl p-5 bg-surface-container-low/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3.5">
                <Key className="text-primary w-5 h-5 shrink-0" />
                <h4 className="font-label-lg text-on-surface">
                  {language === 'id' ? 'Kelola PIN Keamanan' : 'Manage Security PIN'}
                </h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                {language === 'id' 
                  ? 'Ganti kode PIN akses Anda secara berkala untuk menjaga kerahasiaan data pribadi keluarga Anda.' 
                  : 'Regularly change your security PIN to maintain confidential control over family records.'}
              </p>

              {!showPinSetup && (
                <div className="mt-4">
                  <Button 
                    variant={isSecurityEnabled ? "primary" : "outline"}
                    onClick={() => {
                      setShowPinSetup(true);
                      setSecurityError('');
                      setSecuritySuccess('');
                    }}
                  >
                    {localStorage.getItem('harmoni_pin_hash') 
                      ? (language === 'id' ? 'Ganti PIN Akses' : 'Change Access PIN')
                      : (language === 'id' ? 'Buat PIN Baru' : 'Create New PIN')}
                  </Button>
                </div>
              )}

              {showPinSetup && (
                <form onSubmit={handleSaveNewPin} className="space-y-4 mt-2 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-sm text-on-surface-variant block mb-1">
                        {language === 'id' ? 'PIN Baru (4-6 Angka)' : 'New PIN (4-6 digits)'}
                      </label>
                      <input
                        type="password"
                        required
                        pattern="\d{4,6}"
                        maxLength={6}
                        value={pinValue}
                        onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold tracking-widest text-lg"
                      />
                    </div>
                    <div>
                      <label className="font-label-sm text-on-surface-variant block mb-1">
                        {language === 'id' ? 'Konfirmasi PIN Baru' : 'Confirm New PIN'}
                      </label>
                      <input
                        type="password"
                        required
                        pattern="\d{4,6}"
                        maxLength={6}
                        value={pinConfirmValue}
                        onChange={(e) => setPinConfirmValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold tracking-widest text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-outline-variant/40">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="sm"
                    >
                      {language === 'id' ? 'Simpan PIN' : 'Save PIN'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowPinSetup(false);
                        setPinValue('');
                        setPinConfirmValue('');
                        setSecurityError('');
                      }}
                    >
                      {language === 'id' ? 'Batal' : 'Cancel'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 shrink-0">info</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {language === 'id' 
                  ? 'PIN dan otentikasi biometrik disimpan secara aman dan terenkripsi pada perangkat lokal Anda.' 
                  : 'PIN and biometric credentials are saved securely directly on your local device client.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Auto-Clean Audit Trail Card */}
      <Card variant="default" className="p-6 border border-outline-variant shadow-sm overflow-hidden animate-fadeIn">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-2xl">auto_delete</span>
          <div>
            <h3 className="font-headline-sm text-on-surface">
              {language === 'id' ? 'Pembersihan Otomatis Log Audit (Auto Clean)' : 'Audit Trail Auto-Clean'}
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              {language === 'id' 
                ? 'Kelola retensi otomatis untuk menghapus riwayat audit log lama agar database tetap efisien dan cepat' 
                : 'Manage automatic retention to purge old audit log records to keep database lean and fast'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Toggle & Days Selector */}
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 hover:bg-surface-container-low transition-colors duration-200">
              <div className="flex gap-3.5 max-w-[80%]">
                <div className="p-2.5 rounded-lg bg-primary-container text-on-primary-container mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-on-surface">
                    {language === 'id' ? 'Aktifkan Auto Clean Log' : 'Enable Log Auto-Clean'}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {language === 'id' 
                      ? 'Secara otomatis menghapus log aktivitas yang lebih tua dari jumlah hari yang ditentukan.' 
                      : 'Automatically delete activity logs older than the specified retention days.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                <input 
                  type="checkbox" 
                  checked={isAutoCleanEnabled} 
                  onChange={(e) => handleToggleAutoClean(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
              isAutoCleanEnabled 
                ? 'border-outline-variant bg-surface-container-low/60' 
                : 'border-outline-variant/30 bg-surface-container-low/20 opacity-50'
            }`}>
              <h4 className="font-label-lg text-on-surface">
                {language === 'id' ? 'Batas Simpan Riwayat (Hari)' : 'Audit Trail Retention Period (Days)'}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'id' 
                  ? 'Pilih berapa hari riwayat audit trail disimpan sebelum dibersihkan otomatis.' 
                  : 'Select how many days audit logs are kept before automated purging.'}
              </p>

              <select
                disabled={!isAutoCleanEnabled}
                value={autoCleanDays}
                onChange={(e) => handleSaveAutoCleanDays(e.target.value)}
                className={`w-full max-w-xs px-3.5 py-2.5 bg-surface border rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary transition-all ${
                  isAutoCleanEnabled 
                    ? 'border-outline-variant text-on-surface cursor-pointer' 
                    : 'border-outline-variant/30 text-on-surface-variant cursor-not-allowed'
                }`}
              >
                <option value="7">7 {language === 'id' ? 'Hari' : 'Days'}</option>
                <option value="14">14 {language === 'id' ? 'Hari' : 'Days'}</option>
                <option value="30">30 {language === 'id' ? 'Hari (Default)' : 'Days (Default)'}</option>
                <option value="60">60 {language === 'id' ? 'Hari' : 'Days'}</option>
                <option value="90">90 {language === 'id' ? 'Hari' : 'Days'}</option>
                <option value="180">180 {language === 'id' ? 'Hari' : 'Days'}</option>
                <option value="365">365 {language === 'id' ? 'Hari (1 Tahun)' : 'Days (1 Year)'}</option>
              </select>
            </div>
          </div>

          {/* Right Column: Status & Manual Trigger */}
          <div className="border border-outline-variant/60 rounded-2xl p-5 bg-surface-container-low/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3.5">
                <span className="material-symbols-outlined text-primary text-[22px]">cleaning_services</span>
                <h4 className="font-label-lg text-on-surface">
                  {language === 'id' ? 'Pembersihan Manual' : 'Manual Maintenance'}
                </h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                {language === 'id' 
                  ? `Total ${activityLogs.length} catatan audit trail di database. Anda dapat menjalankan pembersihan manual kapan saja untuk menghapus data lebih tua dari ${autoCleanDays} hari.` 
                  : `Total ${activityLogs.length} audit trail records in database. You can trigger a manual cleanup anytime to delete records older than ${autoCleanDays} days.`}
              </p>

              <Button
                variant="primary"
                size="sm"
                isLoading={isCleaningAuditLogs}
                onClick={handleManualRunAutoClean}
                className="font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] mr-1">auto_delete</span>
                {language === 'id' ? 'Jalankan Pembersihan Sekarang' : 'Run Cleanup Now'}
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 shrink-0">check_circle</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {language === 'id' 
                  ? 'Pembersihan hanya menghapus catatan log aktivitas dan TIDAK mempengaruhi data transaksi, aset, atau saldo.' 
                  : 'Cleanup only purges activity log entries and NEVER affects transactions, assets, or balance totals.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Asset Revaluation Reminder */}
      <Card variant="default" className="p-6 border border-outline-variant shadow-sm overflow-hidden animate-fadeIn">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-2xl">event_upcoming</span>
          <div>
            <h3 className="font-headline-sm text-on-surface">
              {language === 'id' ? 'Pengingat Revaluasi Aset' : 'Asset Revaluation Reminder'}
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              {language === 'id' 
                ? 'Kelola notifikasi pengingat untuk menilai kembali (revaluasi) aset fisik Anda yang tidak menyusut otomatis' 
                : 'Manage reminders to re-evaluate physical assets that do not automatically depreciate'}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 hover:bg-surface-container-low transition-colors duration-200">
          <div className="flex gap-3.5 max-w-[80%]">
            <div className="p-2.5 rounded-lg bg-primary-container text-on-primary-container mt-0.5">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <h4 className="font-label-lg text-on-surface">
                {language === 'id' ? 'Aktifkan Pengingat Tahunan' : 'Enable Annual Reminder'}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {language === 'id' 
                  ? 'Menampilkan peringatan di Dashboard jika ada aset yang nilainya tidak diperbarui selama lebih dari 1 tahun.' 
                  : 'Displays an alert on the Dashboard if any asset\'s value has not been updated for more than 1 year.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
            <input 
              type="checkbox" 
              checked={isAssetRevalReminderEnabled} 
              onChange={(e) => handleToggleRevalReminder(e.target.checked)} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </Card>

      {/* Bento Grid Layout for Settings */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Members & Roles (Spans 7 cols on XL) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Family Members Card */}
          <Card variant="default" className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-sm text-on-surface">
                  {language === 'id' ? 'Anggota Keluarga' : 'Family Members'}
                </h3>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  {language === 'id' ? 'Kelola anggota, peran, dan alokasi anggaran bulanan keluarga.' : 'Manage members, roles, and monthly budget allocations.'}
                </p>
              </div>
              <Button icon="person_add" onClick={handleOpenAddFamilyModal}>
                {language === 'id' ? 'Tambah Anggota' : 'Add Member'}
              </Button>
            </div>

            <div className="border border-outline-variant rounded-xl overflow-hidden flex-1 bg-surface">
              {familyMembers.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl">group_off</span>
                  </div>
                  <h4 className="font-label-lg text-on-surface font-bold">
                    {language === 'id' ? 'Belum Ada Anggota Keluarga' : 'No Family Members Yet'}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                    {language === 'id'
                      ? 'Tambahkan anggota keluarga untuk membagi peran dan memantau batasan anggaran masing-masing.'
                      : 'Add family members to assign roles and manage individual budget limits.'}
                  </p>
                  <Button variant="outline" size="sm" icon="add" className="mt-4" onClick={handleOpenAddFamilyModal}>
                    {language === 'id' ? 'Tambah Anggota Pertama' : 'Add First Member'}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="font-label-md text-on-surface-variant uppercase py-3 px-4">
                          {language === 'id' ? 'Anggota' : 'Member'}
                        </th>
                        <th className="font-label-md text-on-surface-variant uppercase py-3 px-4">
                          {language === 'id' ? 'Peran / Hubungan' : 'Role'}
                        </th>
                        <th className="font-label-md text-on-surface-variant uppercase py-3 px-4">
                          {language === 'id' ? 'Anggaran Bulanan' : 'Monthly Budget'}
                        </th>
                        <th className="font-label-md text-on-surface-variant uppercase py-3 px-4 text-right">
                          {language === 'id' ? 'Aksi' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {familyMembers.map((member) => {
                        const initials = member.name
                          ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          : 'FM';
                        return (
                          <tr key={member.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-xs shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-label-lg text-on-surface font-semibold truncate">
                                    {member.name}
                                  </div>
                                  {member.email && (
                                    <div className="font-body-sm text-on-surface-variant text-xs truncate">
                                      {member.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-xs font-medium">
                                {language === 'id' ? (FAMILY_ROLES.find(r => r.id === member.role)?.labelId || member.role) : (FAMILY_ROLES.find(r => r.id === member.role)?.labelEn || member.role)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-label-lg text-on-surface font-medium">
                                {member.monthlyBudget ? formatCurrency(member.monthlyBudget) : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditFamilyModal(member)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                  title={language === 'id' ? 'Edit Anggota' : 'Edit Member'}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteFamilyTarget(member)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title={language === 'id' ? 'Hapus Anggota' : 'Delete Member'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Rekening/Wallets & Categories (Spans 5 cols on XL) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Payment Accounts (Bank & E-Wallet) Management Card */}
          <Card variant="default" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-sm text-on-surface">Rekening Bank & E-Wallet</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  Kelola rekening bank, e-wallet, dan kas tunai untuk transaksi harian.
                </p>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleOpenAddPayAccModal}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </Button>
            </div>

            {paymentAccounts.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-outline-variant rounded-xl bg-surface-container-low/50">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">account_balance_wallet</span>
                <p className="font-label-lg text-on-surface">Belum ada rekening atau e-wallet</p>
                <p className="font-body-sm text-on-surface-variant mt-1 mb-4">Tambahkan rekening bank atau e-wallet Anda untuk mencatat saldo.</p>
                <Button variant="outline" size="sm" onClick={handleOpenAddPayAccModal}>
                  + Tambah Rekening Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentAccounts.map((acc) => {
                  const getIconName = (type: string) => {
                    switch (type) {
                      case 'bank': return 'account_balance';
                      case 'ewallet': return 'smartphone';
                      case 'cash': return 'payments';
                      case 'investment': return 'trending_up';
                      default: return 'account_balance_wallet';
                    }
                  };
                  const getTypeBadge = (type: string) => {
                    switch (type) {
                      case 'bank': return { label: 'Bank', bg: 'bg-blue-500/10 text-blue-600' };
                      case 'ewallet': return { label: 'E-Wallet', bg: 'bg-emerald-500/10 text-emerald-600' };
                      case 'cash': return { label: 'Kas Tunai', bg: 'bg-amber-500/10 text-amber-600' };
                      case 'investment': return { label: 'Investasi', bg: 'bg-purple-500/10 text-purple-600' };
                      default: return { label: type, bg: 'bg-primary/10 text-primary' };
                    }
                  };
                  const badge = getTypeBadge(acc.type);

                  return (
                    <div 
                      key={acc.id} 
                      className="border border-outline-variant rounded-xl p-3.5 hover:border-primary/50 transition-all flex items-center justify-between group bg-surface hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-xs"
                          style={{ backgroundColor: acc.color || '#2563eb' }}
                        >
                          <span className="material-symbols-outlined text-xl">{getIconName(acc.type)}</span>
                        </div>
                        <div>
                          <div className="font-label-lg text-on-surface flex items-center gap-2">
                            <span>{acc.name}</span>
                            <span className={`font-label-sm px-2 py-0.5 rounded-full text-[11px] ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="font-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5 text-xs">
                            {acc.accountNumber && <span>No: {acc.accountNumber}</span>}
                            {acc.holderName && <span>• {acc.holderName}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-headline-xs text-on-surface font-bold">
                            {formatCurrency(acc.balance)}
                          </div>
                          <div className="text-[11px] text-on-surface-variant">Saldo Aktif</div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenReconcileModal(acc)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title={language === 'id' ? 'Rekonsiliasi Saldo' : 'Reconcile Balance'}
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPayAccModal(acc)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Edit Rekening"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePayAccTarget(acc)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Hapus Rekening"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Budget Categories Card */}
          <Card variant="default" className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-headline-sm text-on-surface">Kategori Transaksi</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">Kelola kategori kustom pemasukan & pengeluaran Anda.</p>
              </div>
              {!isFormOpen && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => { setEditingId(null); setNameInput(''); setColorInput('#2563eb'); setIsFormOpen(true); }}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </Button>
              )}
            </div>

            {/* Toggle Tabs (Expense vs Income) */}
            <div className="flex bg-surface-container-low p-1 rounded-xl mb-4 border border-outline-variant">
              <button
                type="button"
                onClick={() => { setActiveTab('expense'); handleCancel(); }}
                className={`flex-1 py-2 text-center rounded-lg font-label-md transition-all ${
                  activeTab === 'expense'
                    ? 'bg-surface text-on-surface font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('income'); handleCancel(); }}
                className={`flex-1 py-2 text-center rounded-lg font-label-md transition-all ${
                  activeTab === 'income'
                    ? 'bg-surface text-on-surface font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Inline Add/Edit Form */}
            {isFormOpen && (
              <form onSubmit={handleSaveCategory} className="bg-surface-container-low p-4 rounded-xl mb-4 border border-outline-variant animate-fadeIn">
                <h4 className="font-label-lg text-on-surface mb-3 flex items-center justify-between">
                  <span>{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</span>
                  <button type="button" onClick={handleCancel} className="text-on-surface-variant hover:text-on-surface">
                    <X className="w-4 h-4" />
                  </button>
                </h4>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1">Nama Kategori</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Contoh: Belanja Bulanan"
                      className="w-full px-3 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary font-body-md"
                    />
                  </div>

                  <div>
                    <label className="font-label-sm text-on-surface-variant block mb-1.5">Warna Indikator</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColorInput(c)}
                          className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center transition-all cursor-pointer relative"
                          style={{ backgroundColor: c }}
                        >
                          {colorInput === c && (
                            <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Batal</Button>
                    <Button type="submit" variant="primary" size="sm">Simpan</Button>
                  </div>
                </div>
              </form>
            )}

            {/* Categories List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {customCategories
                .filter((c) => c.type === activeTab)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                        style={{ backgroundColor: cat.color || '#2563eb' }}
                      ></div>
                      <span className="font-medium text-on-surface text-sm">{cat.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCategoryTarget(cat)}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {customCategories.filter((c) => c.type === activeTab).length === 0 && (
                <div className="text-center py-8 text-on-surface-variant font-body-sm">
                  Tidak ada kategori {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'} kustom.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Environment Override Tool */}
      <EnvironmentOverride />

      {/* Migration Tool */}
      <DatabaseMigration />

      {/* Confirm Delete Category Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategoryTarget)}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={confirmDeleteCategory}
        title="Konfirmasi Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteCategoryTarget?.name}"?`}
        warningMessage={
          categoryLinkedTxCount > 0 || categoryLinkedEnvelopeCount > 0
            ? `Kategori ini sedang digunakan oleh ${categoryLinkedTxCount} transaksi dan ${categoryLinkedEnvelopeCount} amplop anggaran. Menghapus kategori ini dapat membuat transaksi dan amplop tersebut tidak berkategori.`
            : undefined
        }
        itemDetails={deleteCategoryTarget ? [
          { label: 'Nama Kategori', value: deleteCategoryTarget.name },
          { label: 'Tipe', value: deleteCategoryTarget.type === 'expense' ? 'Pengeluaran' : 'Pemasukan' },
          { label: 'Jumlah Transaksi Terkait', value: `${categoryLinkedTxCount} transaksi` },
          { label: 'Jumlah Amplop Terkait', value: `${categoryLinkedEnvelopeCount} amplop` }
        ] : []}
        confirmText="Hapus Kategori"
        isLoading={isDeletingCategory}
      />

      {/* Confirm Delete Family Member Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteFamilyTarget)}
        onClose={() => setDeleteFamilyTarget(null)}
        onConfirm={handleConfirmDeleteFamily}
        title={language === 'id' ? 'Konfirmasi Hapus Anggota Keluarga' : 'Confirm Delete Family Member'}
        message={
          language === 'id'
            ? `Apakah Anda yakin ingin menghapus "${deleteFamilyTarget?.name}" dari daftar anggota keluarga?`
            : `Are you sure you want to remove "${deleteFamilyTarget?.name}" from family members?`
        }
        itemDetails={deleteFamilyTarget ? [
          { label: 'Nama', value: deleteFamilyTarget.name },
          { label: language === 'id' ? 'Peran' : 'Role', value: language === 'id' ? (FAMILY_ROLES.find(r => r.id === deleteFamilyTarget.role)?.labelId || deleteFamilyTarget.role) : (FAMILY_ROLES.find(r => r.id === deleteFamilyTarget.role)?.labelEn || deleteFamilyTarget.role) },
          { label: 'Anggaran Bulanan', value: deleteFamilyTarget.monthlyBudget ? formatCurrency(deleteFamilyTarget.monthlyBudget) : '-' }
        ] : []}
        confirmText={language === 'id' ? 'Hapus Anggota' : 'Delete Member'}
        isLoading={isDeletingFamily}
      />

      {/* Add / Edit Family Member Modal */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2 text-on-surface text-lg font-bold">
                <Users className="w-5 h-5 text-primary" />
                <span>
                  {editingFamilyMember
                    ? (language === 'id' ? 'Edit Anggota Keluarga' : 'Edit Family Member')
                    : (language === 'id' ? 'Tambah Anggota Keluarga Baru' : 'Add New Family Member')}
                </span>
              </div>
              <button
                onClick={() => setIsFamilyModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamilyMember} className="p-5 space-y-4">
              <Input
                label={language === 'id' ? 'Nama Lengkap' : 'Full Name'}
                type="text"
                value={familyMemberName}
                onChange={e => setFamilyMemberName(e.target.value)}
                placeholder="cth. Siti Aminah"
                icon="person"
                required
              />

              <Select
                label={language === 'id' ? 'Peran / Hubungan Keluarga' : 'Role / Relationship'}
                value={familyMemberRole}
                onChange={e => setFamilyMemberRole(e.target.value)}
                icon="badge"
                required
              >
                {FAMILY_ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {language === 'id' ? role.labelId : role.labelEn}
                  </option>
                ))}
              </Select>

              <Input
                label={language === 'id' ? 'Alokasi Anggaran Bulanan (Rp)' : 'Monthly Budget Allocation (Rp)'}
                type="number"
                value={familyMemberBudget}
                onChange={e => setFamilyMemberBudget(e.target.value)}
                placeholder="0"
                icon="payments"
                min="0"
              />

              <div>
                <Input
                  label={language === 'id' ? 'Email Akun Terhubung' : 'Connected Account Email'}
                  type="email"
                  value={familyMemberEmail}
                  onChange={e => setFamilyMemberEmail(e.target.value)}
                  placeholder="cth. email.anggota@gmail.com"
                  icon="mail"
                />
                {user?.email && familyMemberEmail !== user.email && (
                  <button
                    type="button"
                    onClick={() => setFamilyMemberEmail(user.email || '')}
                    className="text-xs text-primary hover:underline mt-1 font-medium cursor-pointer"
                  >
                    {language === 'id' ? `+ Gunakan email akun saya (${user.email})` : `+ Use my account email (${user.email})`}
                  </button>
                )}
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {language === 'id'
                    ? 'Email ini digunakan agar anggota keluarga yang login dengan akun Google/Firebase terhubung ke workspace ini.'
                    : 'This email connects the family member when they log in to the app.'}
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setIsFamilyModalOpen(false)}
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmittingFamily}
                >
                  {editingFamilyMember
                    ? (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
                    : (language === 'id' ? 'Tambah Anggota' : 'Add Member')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Payment Account Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletePayAccTarget)}
        onClose={() => setDeletePayAccTarget(null)}
        onConfirm={handleConfirmDeletePayAcc}
        title="Konfirmasi Hapus Rekening"
        message={`Apakah Anda yakin ingin menghapus rekening "${deletePayAccTarget?.name}"?`}
        itemDetails={deletePayAccTarget ? [
          { label: 'Nama Rekening', value: deletePayAccTarget.name },
          { label: 'Jenis', value: deletePayAccTarget.type.toUpperCase() },
          { label: 'Nomor Rekening / No HP', value: deletePayAccTarget.accountNumber || '-' },
          { label: 'Saldo', value: formatCurrency(deletePayAccTarget.balance) }
        ] : []}
        confirmText="Hapus Rekening"
        isLoading={isDeletingPayAcc}
      />

      {/* Add / Edit Payment Account Modal */}
      {isPayAccModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2 text-on-surface text-lg font-bold">
                <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                <span>{editingPayAcc ? 'Edit Rekening / E-Wallet' : 'Tambah Rekening / E-Wallet Baru'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPayAccModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayAcc} className="p-5 space-y-4">
              <Input
                label="Nama Bank / E-Wallet"
                type="text"
                value={payAccName}
                onChange={e => setPayAccName(e.target.value)}
                placeholder="cth. Bank BCA Utama, GoPay, ShopeePay"
                icon="account_balance"
                required
              />

              <Select
                label="Jenis Akun / Pembayaran"
                value={payAccType}
                onChange={e => setPayAccType(e.target.value as any)}
                icon="category"
                required
              >
                <option value="bank">Bank (BCA, Mandiri, BRI, BNI, Jago, dll)</option>
                <option value="ewallet">E-Wallet (GoPay, OVO, ShopeePay, Dana, LinkAja)</option>
                <option value="cash">Kas Tunai (Dompet / Brankas Kas)</option>
                <option value="investment">Investasi / Deposito / Reksadana</option>
              </Select>

              <Select
                label="Kategori Ruang Kerja (Akses)"
                value={payAccWs}
                onChange={e => setPayAccWs(e.target.value as WorkspaceType)}
                icon="domain"
                required
              >
                <option value="keluarga">Keluarga (Rekening Bersama / Operasional Rumah)</option>
                <option value="pribadi">Pribadi (Rekening / Dompet Pribadi Anggota)</option>
              </Select>

              <Input
                label="Nomor Rekening / No. HP E-Wallet"
                type="text"
                value={payAccNumber}
                onChange={e => setPayAccNumber(e.target.value)}
                placeholder="cth. 8830192831 atau 081234567890"
                icon="credit_card"
              />

              <Input
                label="Atas Nama / Pemilik Rekening"
                type="text"
                value={payAccHolder}
                onChange={e => setPayAccHolder(e.target.value)}
                placeholder="cth. Ahmad Ramli"
                icon="person"
              />

              <Input
                label="Saldo Aktif Saat Ini (Rp)"
                type="number"
                value={payAccBalance}
                onChange={e => setPayAccBalance(e.target.value)}
                placeholder="0"
                icon="payments"
                min="0"
                step="1000"
              />

              <div>
                <label className="font-label-sm text-on-surface-variant block mb-1.5">Warna Indikator</label>
                <div className="flex flex-wrap gap-2">
                  {['#2563eb', '#0284c7', '#059669', '#7c3aed', '#d97706', '#dc2626', '#4f46e5'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPayAccColor(c)}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center transition-all cursor-pointer relative"
                      style={{ backgroundColor: c }}
                    >
                      {payAccColor === c && (
                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3 border-t border-outline-variant">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setIsPayAccModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmittingPayAcc}
                >
                  {editingPayAcc ? 'Simpan Perubahan' : 'Tambah Rekening'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconciliation Modal (Rekonsiliasi Saldo) */}
      {isReconcileModalOpen && reconcileTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2 text-on-surface text-lg font-bold">
                <Scale className="w-5 h-5 text-emerald-600" />
                <span>Rekonsiliasi Saldo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReconcile} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
                <div className="font-semibold text-on-surface mb-1">Akun: {reconcileTarget.name}</div>
                <div className="text-on-surface-variant flex justify-between items-center mt-2">
                  <span>Saldo Aplikasi Saat Ini:</span>
                  <span className="font-bold">{formatCurrency(reconcileTarget.balance)}</span>
                </div>
              </div>

              <Input
                label="Saldo Riil Saat Ini (Real)"
                type="number"
                value={reconcileRealBalance}
                onChange={e => setReconcileRealBalance(e.target.value)}
                placeholder="Masukkan saldo nyata di buku tabungan/e-wallet Anda"
                icon="payments"
                required
              />

              <Input
                label="Alasan Rekonsiliasi / Penyesuaian"
                type="text"
                value={reconcileReason}
                onChange={e => setReconcileReason(e.target.value)}
                placeholder="cth. Penyesuaian Akhir Bulan, Selisih Transaksi Kecil"
                icon="notes"
                required
              />

              {reconcileTarget && reconcileRealBalance !== '' && !isNaN(parseFloat(reconcileRealBalance)) && (
                <div className="p-3.5 rounded-xl text-xs space-y-2.5 border bg-surface-container-lowest/50 border-outline-variant">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-on-surface-variant">Selisih Penyesuaian:</span>
                    <span className={parseFloat(reconcileRealBalance) - reconcileTarget.balance > 0 ? 'text-emerald-600 font-bold' : parseFloat(reconcileRealBalance) - reconcileTarget.balance < 0 ? 'text-error font-bold' : 'text-on-surface font-bold'}>
                      {parseFloat(reconcileRealBalance) - reconcileTarget.balance > 0 ? '+' : ''}
                      {formatCurrency(parseFloat(reconcileRealBalance) - reconcileTarget.balance)}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Sistem akan mencatat transaksi penyesuaian otomatis di kategori <strong className="text-on-surface">"Penyesuaian Saldo"</strong> sebesar selisih di atas agar riwayat keuangan Anda tetap terlacak secara 1:1 antara aplikasi dan realitas.
                  </p>
                </div>
              )}

              <div className="pt-3 flex gap-3 border-t border-outline-variant">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setIsReconcileModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmittingReconcile}
                >
                  Terapkan Penyesuaian
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
