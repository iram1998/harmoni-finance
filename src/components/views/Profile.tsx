import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProfileSkeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils';
import { Plus, Pencil, Trash2, X, Users, CreditCard, Mail } from 'lucide-react';

export function Profile() {
  const { user, superAdminId, loginWithGoogle, logout, familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useFinance();
  const { t, language } = useThemeLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('Kepala Keluarga');
  const [budgetInput, setBudgetInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const budgetVal = parseFloat(budgetInput) || 0;

    try {
      if (editingId) {
        await updateFamilyMember(editingId, nameInput.trim(), roleInput, budgetVal, emailInput.trim());
      } else {
        await addFamilyMember(nameInput.trim(), roleInput, budgetVal, emailInput.trim());
      }
      handleCancel();
    } catch (err) {
      console.error("Error saving family member:", err);
    }
  };

  const handleStartEdit = (member: any) => {
    setEditingId(member.id);
    setNameInput(member.name);
    setRoleInput(member.role);
    setBudgetInput(member.monthlyBudget.toString());
    setEmailInput(member.email || '');
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setNameInput('');
    setRoleInput('Kepala Keluarga');
    setBudgetInput('');
    setEmailInput('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const isAnonymous = user?.isAnonymous ?? true;
  const displayName = user?.displayName || (isAnonymous ? 'Pengguna Tamu (Guest)' : 'Pengguna Harmoni');
  const email = user?.email || (isAnonymous ? 'Sesi Lokal Firestore (Anonim)' : 'Terhubung');
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=ffffff&size=256`;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-lg font-bold text-on-surface">{t('profileTitle')}</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          {t('profileSubtitle')}
        </p>
      </div>

      {/* User Card */}
      <Card variant="elevated" className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-surface-container-high bg-surface-variant shrink-0">
          <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="font-headline-md font-bold text-on-surface">{displayName}</h2>
              {isAnonymous ? (
                <span className="w-fit mx-auto md:mx-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Akses Tamu (Tersimpan di Cloud)
                </span>
              ) : (
                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                  <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Akun Terverifikasi Google
                  </span>
                  {user?.uid === superAdminId ? (
                    <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      Kepala Keluarga (Super Admin)
                    </span>
                  ) : (
                    <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Anggota Keluarga
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="font-body-md text-on-surface-variant">{email}</p>
          </div>

          {isAnonymous ? (
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant text-left space-y-3">
              <p className="font-body-sm text-on-surface-variant">
                Saat ini Anda menggunakan akun tamu. Semua transaksi dan anggaran tersimpan di database Cloud Firestore secara real-time. Masuk dengan Google untuk menyinkronkan data di semua perangkat Anda.
              </p>
              <Button onClick={loginWithGoogle} variant="primary" icon="login" className="w-full md:w-auto">
                Masuk / Sinkronkan dengan Google
              </Button>
            </div>
          ) : (
            <div className="pt-2">
              <Button onClick={logout} variant="outline" icon="logout" className="text-error border-error/30 hover:bg-error-container/20">
                Keluar Akun
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Kelola Anggota Keluarga & Anggaran Bersama */}
      <Card variant="elevated" className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline-sm font-bold text-on-surface">Anggota Keluarga & Anggaran</h3>
              <p className="font-body-sm text-on-surface-variant mt-0.5">Kelola alokasi batas anggaran bulanan untuk setiap anggota keluarga.</p>
            </div>
          </div>
          {!isFormOpen && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setIsFormOpen(true); setEditingId(null); }}
              className="flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </Button>
          )}
        </div>

        {/* Member Form */}
        {isFormOpen && (
          <form onSubmit={handleSaveMember} className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h4 className="font-headline-xs font-semibold text-on-surface">
                {editingId ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h4>
              <button type="button" onClick={handleCancel} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-md text-on-surface-variant block mb-1.5">Nama Anggota</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Ahmad Ramli"
                  className="w-full px-3.5 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-body-md transition-all"
                />
              </div>

              <div>
                <label className="font-label-md text-on-surface-variant block mb-1.5">Hubungan / Peran</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-body-md transition-all"
                >
                  {FAMILY_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {language === 'id' ? role.labelId : (role.labelEn || role.labelId)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-md text-on-surface-variant block mb-1.5">Batas Anggaran Bulanan (IDR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-on-surface-variant font-body-md">Rp</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 1500000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-body-md transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-md text-on-surface-variant block mb-1.5">Email (Opsional untuk Akses Akun)</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Contoh: email@keluarga.com"
                  className="w-full px-3.5 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-body-md transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Batal</Button>
              <Button type="submit" variant="primary" size="sm">
                {editingId ? 'Simpan Perubahan' : 'Tambah Anggota'}
              </Button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-start justify-between p-4 rounded-2xl border border-outline-variant bg-surface-container-lowest hover:border-primary/50 transition-all shadow-sm group"
            >
              <div className="flex gap-3.5">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-inner shrink-0 uppercase">
                  {member.name.substring(0, 2)}
                </div>
                <div className="space-y-1 font-body-sm text-on-surface-variant">
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-headline-xs font-bold text-on-surface leading-tight">{member.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {language === 'id' ? (FAMILY_ROLES.find(r => r.id === member.role)?.labelId || member.role) : (FAMILY_ROLES.find(r => r.id === member.role)?.labelEn || member.role)}
                    </span>
                  </div>
                  
                  {member.email ? (
                    <p className="font-body-xs text-on-surface-variant flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{member.email}</span>
                    </p>
                  ) : (
                    <p className="font-body-xs text-on-surface-variant/70 italic">Sesi keuangan offline keluarga</p>
                  )}

                  <div className="pt-1.5 flex items-center gap-1.5 text-on-surface-variant font-label-sm">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Anggaran: <strong className="text-on-surface">{formatCurrency(member.monthlyBudget)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleStartEdit(member)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                  title="Edit Data"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus data keluarga "${member.name}"?`)) {
                      deleteFamilyMember(member.id);
                    }
                  }}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {familyMembers.length === 0 && (
            <div className="col-span-full text-center py-12 text-on-surface-variant bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
              <p className="font-body-md font-semibold">Belum Ada Anggota Keluarga</p>
              <p className="font-body-sm mt-1 max-w-md mx-auto">Klik tombol &ldquo;Tambah Anggota&rdquo; untuk melacak keuangan bersama keluarga.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Security & Database Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined font-bold text-2xl">cloud_sync</span>
            <h3 className="font-headline-sm font-semibold text-on-surface">Status Database</h3>
          </div>
          <div className="space-y-2 font-body-sm text-on-surface-variant">
            <div className="flex justify-between py-1 border-b border-outline-variant">
              <span>Penyimpanan Backend:</span>
              <span className="font-semibold text-emerald-600">Firebase Firestore</span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant">
              <span>Keamanan Akses:</span>
              <span className="font-semibold text-on-surface">Aturan Firestore Aktif</span>
            </div>
            <div className="flex justify-between py-1">
              <span>ID Pengguna (UID):</span>
              <span className="font-mono text-xs text-on-surface truncate max-w-[180px]">{user?.uid || '-'}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined font-bold text-2xl">verified</span>
            <h3 className="font-headline-sm font-semibold text-on-surface">Fitur Aktif</h3>
          </div>
          <ul className="space-y-2 font-body-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
              Pencatatan Pemasukan & Pengeluaran Real-time
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
              Manajemen Amplop Anggaran
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
              Pelacakan Target Tabungan & Tagihan
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
