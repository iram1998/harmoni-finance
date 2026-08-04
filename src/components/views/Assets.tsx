import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getAssetEffectiveValue, calculateAssetDepreciation, parseDMSToDecimal, parseCombinedCoordinates, decimalToDMS, formatDateDDMMYYYY } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AssetsSkeleton } from '../ui/Skeleton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Asset, WorkspaceType, PaymentAccount } from '../../types';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AssetMapView } from '../AssetMapView';
import { AssetMapPickerModal } from '../AssetMapPickerModal';
import { AssetDetailModal } from '../AssetDetailModal';
import { AssetSimulationModal } from '../AssetSimulationModal';
import { PaymentAccountDetailsModal } from '../modals/PaymentAccountDetailsModal';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

export function Assets() {
  const { 
    workspace, 
    assets, 
    addAsset, 
    updateAsset, 
    deleteAsset, 
    paymentAccounts,
    addPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    transactions,
    user 
  } = useFinance();
  const { language, t } = useThemeLanguage();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Payment Accounts (Bank / E-Wallet) State
  const [isPayAccModalOpen, setIsPayAccModalOpen] = useState(false);
  const [isPayAccCollapsed, setIsPayAccCollapsed] = useState(false);
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
  const [detailPayAccTarget, setDetailPayAccTarget] = useState<PaymentAccount | null>(null);
  const [isDeletingPayAcc, setIsDeletingPayAcc] = useState(false);

  // Pagination & Fullscreen Chart State
  const [payAccPage, setPayAccPage] = useState(1);
  const payAccPerPage = 8;

  const [assetPage, setAssetPage] = useState(1);
  const [assetPerPage, setAssetPerPage] = useState(6);

  const [isFullChartOpen, setIsFullChartOpen] = useState(false);
  const [isFullPieChartOpen, setIsFullPieChartOpen] = useState(false);
  const [fullChartSort, setFullChartSort] = useState<'default' | 'value' | 'roi' | 'name'>('default');

  const handleOpenAddPayAccModal = () => {
    setEditingPayAcc(null);
    setPayAccName('');
    setPayAccType('bank');
    setPayAccWs(filterMode === 'pribadi' ? 'pribadi' : (filterMode === 'keluarga' ? 'keluarga' : workspace));
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [workspace]);

  // View Mode: 'grid' | 'table' | 'map'
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');

  // Filter modes: 'pribadi' | 'keluarga' | 'all'
  const [filterMode, setFilterMode] = useState<'pribadi' | 'keluarga' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Properti / Lahan');
  const [formParentAssetId, setFormParentAssetId] = useState<string>('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'owned' | 'sold' | 'liquidated'>('owned');
  const [formWorkspace, setFormWorkspace] = useState<WorkspaceType>(workspace);
  const [formError, setFormError] = useState('');

  // Location & Image form states
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLocationName, setFormLocationName] = useState('');
  const [formAreaSize, setFormAreaSize] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');

  // Depreciation configurations
  const [formDepreciationMethod, setFormDepreciationMethod] = useState<'none' | 'straight_line' | 'declining_balance'>('none');
  const [formDepreciationUsefulLife, setFormDepreciationUsefulLife] = useState('5');
  const [formDepreciationSalvageValue, setFormDepreciationSalvageValue] = useState('0');
  const [formUseAutoDepreciation, setFormUseAutoDepreciation] = useState(false);
  const [expandedDepreciationId, setExpandedDepreciationId] = useState<string | null>(null);

  // Asset Categories
  const CATEGORIES = [
    'Rekening Bank / E-Wallet',
    'Unit Usaha / Bisnis',
    'Properti / Lahan',
    'Peralatan & Mebel Usaha',
    'Mesin & Inventaris Usaha',
    'Konstruksi & Renovasi',
    'Kendaraan',
    'Emas / Logam Mulia',
    'Elektronik & Gadget',
    'Surat Berharga / Investasi',
    'Barang Antik & Koleksi',
    'Lainnya'
  ];

  // Preset Images gallery for quick selection
  const IMAGE_PRESETS = [
    { label: 'Unit Usaha / Toko', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80' },
    { label: 'Rekening Bank / E-Wallet', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tanah Kavling', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
    { label: 'Rumah / Bangunan', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sawah / Kebun', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80' },
    { label: 'Mobil', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80' },
    { label: 'Motor', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
    { label: 'Emas Batangan', url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Perhiasan / Jam', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80' },
    { label: 'Laptop / PC', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    { label: 'Perabotan', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' }
  ];

  // Helper translations for categories
  const translateCategory = (cat: string) => {
    if (language === 'en') {
      switch (cat) {
        case 'Rekening Bank / E-Wallet': return 'Bank Account / E-Wallet';
        case 'Unit Usaha / Bisnis': return 'Business Unit / Enterprise';
        case 'Properti / Lahan': return 'Property & Land';
        case 'Kendaraan': return 'Vehicles';
        case 'Emas / Logam Mulia': return 'Gold & Precious Metals';
        case 'Elektronik & Gadget': return 'Electronics & Gadgets';
        case 'Surat Berharga / Investasi': return 'Securities & Investments';
        case 'Barang Antik & Koleksi': return 'Antiques & Collectibles';
        default: return 'Others';
      }
    }
    return cat;
  };

  // Render dynamic form fields based on selected asset category
  const renderCategorySpecificFields = () => {
    switch (formCategory) {
      case 'Unit Usaha / Bisnis':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">store</span>
              {language === 'id' ? 'Detail Unit Usaha / Toko' : 'Business Unit Details'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Bidang Usaha / Sektor' : 'Industry / Sector'}
                placeholder="cth. Kuliner / Perdagangan / Jasa"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Persentase Kepemilikan (%)' : 'Ownership Share (%)'}
                placeholder="cth. 100 atau 50"
                value={formAreaSize}
                onChange={(e) => setFormAreaSize(e.target.value)}
              />
            </div>
            <Input
              label={language === 'id' ? 'Lokasi / Alamat Toko (Opsional)' : 'Store Location / Address (Optional)'}
              placeholder="cth. Jl. Sudirman No. 12, Jakarta"
              value={formLocationName}
              onChange={(e) => setFormLocationName(e.target.value)}
            />
          </div>
        );

      case 'Rekening Bank / E-Wallet':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
              {language === 'id' ? 'Detail Rekening Bank / E-Wallet' : 'Bank Account / E-Wallet Details'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Nomor Rekening / No. HP' : 'Account No / Phone No'}
                placeholder="cth. 8830192831 / 08123456789"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Atas Nama / Pemilik' : 'Account Holder'}
                placeholder="cth. Ahmad Ramli"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
        );
      case 'Properti / Lahan':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                {language === 'id' ? 'Lokasi & Koordinat Peta Properti' : 'Property Location & Map Coordinates'}
              </label>
              <Button
                type="button"
                variant="outline"
                className="text-xs py-1 px-2.5 h-7 cursor-pointer"
                onClick={() => setIsMapPickerOpen(true)}
              >
                📍 {language === 'id' ? 'Pilih di Peta' : 'Pick on Map'}
              </Button>
            </div>

            <Input
              label={language === 'id' ? 'Alamat / Nama Lokasi' : 'Address / Location Name'}
              placeholder={language === 'id' ? 'Contoh: Jl. Raya Cijeruk Blok B3, Bogor' : 'Example: Cijeruk Road Block B3'}
              value={formLocationName}
              onChange={(e) => setFormLocationName(e.target.value)}
            />

            <div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={language === 'id' ? 'Luas Area (m²)' : 'Area Size (m²)'}
                  type="number"
                  placeholder="Contoh: 250"
                  value={formAreaSize}
                  onChange={(e) => setFormAreaSize(e.target.value)}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDetectGPS}
                    className="w-full text-xs h-10 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">my_location</span>
                    {language === 'id' ? 'Deteksi GPS' : 'GPS Detect'}
                  </Button>
                </div>
              </div>

              {/* Borongan Helper Kalsel */}
              <div className="mt-2 text-[11px] bg-primary/5 text-primary p-2.5 rounded-lg border border-primary/20 space-y-1">
                <div className="font-bold flex items-center justify-between flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    🌾 {language === 'id' ? 'Satuan Borongan (Kalsel):' : 'Borongan Unit (South Kalimantan):'}
                  </span>
                  {formAreaSize && !isNaN(parseFloat(formAreaSize)) && parseFloat(formAreaSize) > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
                      ≈ {((parseFloat(formAreaSize) * 35) / 10000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Borongan
                    </span>
                  ) : (
                    <span className="text-on-surface-variant font-normal text-[10px]">
                      1 Hektar (10.000 m²) = 35 Borongan
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-primary/10">
                  <span>1 Borongan ≈ 285,7 m²</span>
                  <button
                    type="button"
                    onClick={() => {
                      const inputBorongan = prompt(language === 'id' ? 'Masukkan luas dalam satuan Borongan (misal: 2 atau 3.5):' : 'Enter area size in Borongan:');
                      if (inputBorongan) {
                        const bNum = parseFloat(inputBorongan);
                        if (!isNaN(bNum) && bNum > 0) {
                          const convertedM2 = Math.round((bNum * 10000) / 35);
                          setFormAreaSize(convertedM2.toString());
                        }
                      }
                    }}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    ⚡ {language === 'id' ? 'Isi dengan Borongan' : 'Fill in Borongan'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/40 space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant block">
                {language === 'id' ? 'Tempel Format DMS / Desimal Gabungan (misal: 2°51\'34.52"S 114°54\'5.49"E):' : 'Paste Combined DMS / Decimal (e.g. 2°51\'34.52"S 114°54\'5.49"E):'}
              </label>
              <input
                type="text"
                placeholder={language === 'id' ? 'Tempel di sini untuk isi otomatis Lat & Lng...' : 'Paste here to auto-fill Lat & Lng...'}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface font-mono"
                onChange={(e) => {
                  const parsed = parseCombinedCoordinates(e.target.value);
                  if (parsed) {
                    setFormLatitude(parsed.lat.toFixed(6));
                    setFormLongitude(parsed.lng.toFixed(6));
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Latitude"
                  placeholder='-6.2088 atau 2°51"34.52"S'
                  value={formLatitude}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseDMSToDecimal(val);
                    if (parsed !== null && isNaN(Number(val))) {
                      setFormLatitude(parsed.toFixed(6));
                    } else {
                      setFormLatitude(val);
                    }
                  }}
                />
                {formLatitude && !isNaN(parseFloat(formLatitude)) && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                    DMS: {decimalToDMS(parseFloat(formLatitude), true)}
                  </span>
                )}
              </div>

              <div>
                <Input
                  label="Longitude"
                  placeholder='106.8456 atau 114°54"5.49"E'
                  value={formLongitude}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseDMSToDecimal(val);
                    if (parsed !== null && isNaN(Number(val))) {
                      setFormLongitude(parsed.toFixed(6));
                    } else {
                      setFormLongitude(val);
                    }
                  }}
                />
                {formLongitude && !isNaN(parseFloat(formLongitude)) && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                    DMS: {decimalToDMS(parseFloat(formLongitude), false)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'Kendaraan':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">directions_car</span>
              {language === 'id' ? 'Spesifikasi Kendaraan' : 'Vehicle Specifications'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Plat Nomor / STNK / Identitas' : 'License Plate / STNK'}
                placeholder="cth. B 1234 ABC"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Tahun Pembuatan' : 'Manufacture Year'}
                placeholder="cth. 2022"
                type="number"
                value={formAreaSize}
                onChange={(e) => setFormAreaSize(e.target.value)}
              />
            </div>
          </div>
        );

      case 'Emas / Logam Mulia':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">diamond</span>
              {language === 'id' ? 'Spesifikasi Emas & Logam Mulia' : 'Gold & Precious Metal Specs'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Berat Total (Gram)' : 'Total Weight (Grams)'}
                type="number"
                placeholder="cth. 10"
                value={formAreaSize}
                onChange={(e) => setFormAreaSize(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Kadar / Karat & Penerbit' : 'Purity & Issuer'}
                placeholder="cth. 24 Karat (ANTAM / UBS)"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
              />
            </div>
          </div>
        );

      case 'Elektronik & Gadget':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">devices</span>
              {language === 'id' ? 'Spesifikasi Elektronik & Gadget' : 'Electronics & Gadget Specs'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Nomor Seri / IMEI / SN' : 'Serial No / IMEI / SN'}
                placeholder="cth. SN-98234123"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Masa Garansi / Status Kondisi' : 'Warranty / Condition'}
                placeholder="cth. Garansi s/d Dec 2026"
                value={formAreaSize}
                onChange={(e) => setFormAreaSize(e.target.value)}
              />
            </div>
          </div>
        );

      case 'Surat Berharga / Investasi':
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">show_chart</span>
              {language === 'id' ? 'Detail Investasi & Sekuritas' : 'Investment & Brokerage Details'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={language === 'id' ? 'Kode Saham / Reksa Dana' : 'Ticker / Fund Name'}
                placeholder="cth. BBCA / Sucorinvest Money Market"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
              />
              <Input
                label={language === 'id' ? 'Platform Sekuritas / Broker' : 'Broker / Platform'}
                placeholder="cth. Stockbit / Bareksa / Bibit"
                value={formAreaSize}
                onChange={(e) => setFormAreaSize(e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
              {language === 'id' ? 'Keterangan Tambahan Barang' : 'Additional Item Details'}
            </label>
            <Input
              label={language === 'id' ? 'Identifikasi / Kelengkapan' : 'Item Specs'}
              placeholder="cth. Sertifikat / Nomor Seri / Kelengkapan"
              value={formLocationName}
              onChange={(e) => setFormLocationName(e.target.value)}
            />
          </div>
        );
    }
  };

  // Filter assets based on mode (Only show top-level main assets by default to keep clean structure)
  const filteredAssets = assets.filter(asset => {
    // 1. Exclude sub-assets from main standalone card list
    if (asset.parentAssetId) {
      if (!searchTerm) return false;
      // If search is active, show sub-asset directly only if parent does not match
      const parent = assets.find(p => p.id === asset.parentAssetId);
      const parentMatches = parent && parent.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (parentMatches) return false;
      if (!asset.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }

    // 2. Workspace filter
    if (filterMode === 'pribadi' && asset.workspaceId !== 'pribadi') {
      return false;
    }
    if (filterMode === 'keluarga' && asset.workspaceId !== 'keluarga') {
      return false;
    }
    // 3. Search term filter (matches main asset name OR any of its sub-asset names)
    if (searchTerm) {
      const matchSelf = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSub = assets.some(sa => sa.parentAssetId === asset.id && sa.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSelf && !matchSub) {
        return false;
      }
    }
    // 4. Category filter
    if (selectedCategory !== 'all' && asset.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Filter payment accounts based on mode (pribadi / keluarga / all)
  const filteredPaymentAccounts = paymentAccounts.filter(acc => {
    if (filterMode === 'pribadi' && acc.workspaceId !== 'pribadi') return false;
    if (filterMode === 'keluarga' && acc.workspaceId !== 'keluarga') return false;
    return true;
  });

  // Reset pagination pages on filter changes
  useEffect(() => {
    setPayAccPage(1);
  }, [filterMode, filteredPaymentAccounts.length]);

  useEffect(() => {
    setAssetPage(1);
  }, [filterMode, selectedCategory, searchTerm, filteredAssets.length, assetPerPage]);

  // Pagination Slice Calculations
  const totalPayAccPages = Math.ceil(filteredPaymentAccounts.length / payAccPerPage) || 1;
  const currentPayAccs = filteredPaymentAccounts.slice((payAccPage - 1) * payAccPerPage, payAccPage * payAccPerPage);

  const totalAssetPages = Math.ceil(filteredAssets.length / assetPerPage) || 1;
  const currentAssets = filteredAssets.slice((assetPage - 1) * assetPerPage, assetPage * assetPerPage);

  // Calculate statistics
  const ownedAssets = filteredAssets.filter(a => a.status === 'owned');
  const totalPurchasePrice = ownedAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const totalCurrentValue = ownedAssets.reduce((sum, a) => sum + (getAssetEffectiveValue(a, assets, transactions) || 0), 0);
  const netROI = totalCurrentValue - totalPurchasePrice;
  const roiPercentage = totalPurchasePrice > 0 ? (netROI / totalPurchasePrice) * 100 : 0;

  // Group assets by category for Recharts Pie Chart
  const categoryData = ownedAssets.reduce((acc: { [key: string]: number }, asset) => {
    const cat = translateCategory(asset.category);
    acc[cat] = (acc[cat] || 0) + getAssetEffectiveValue(asset, assets, transactions);
    return acc;
  }, {});

  const chartColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'
  ];

  const chartData = Object.keys(categoryData).map((cat, index) => ({
    name: cat,
    value: categoryData[cat],
    color: chartColors[index % chartColors.length]
  }));

  // Helper for smart short names on chart X-Axis preserving distinguishing suffixes (e.g. Simpang, Datu Kabul)
  const getSmartShortName = (fullName: string): string => {
    if (fullName.length <= 16) return fullName;
    // Strip common leading prefix words to expose specific location/identifier
    const cleaned = fullName.replace(/^(Tanah|Lahan|Bangunan|Properti|Kendaraan|Mobil|Motor)\s+/i, '');
    if (cleaned.length <= 18) return cleaned;
    // If still long, shorten middle while keeping first and last word
    const parts = cleaned.split(/\s+/);
    if (parts.length > 2) {
      return `${parts[0]} ... ${parts[parts.length - 1]}`;
    }
    return cleaned.substring(0, 16) + '…';
  };

  // Create comparative values list for Bar Chart with unique X-Axis keys
  const nameCounts: Record<string, number> = {};
  const barChartData = ownedAssets.map(asset => {
    const buyPrice = asset.purchasePrice || 0;
    const currVal = getAssetEffectiveValue(asset, assets, transactions) || 0;
    const diff = currVal - buyPrice;
    const diffPercent = buyPrice > 0 ? ((diff / buyPrice) * 100).toFixed(1) : '0';

    let shortName = getSmartShortName(asset.name);
    if (nameCounts[shortName]) {
      nameCounts[shortName]++;
      shortName = `${shortName} (${nameCounts[shortName]})`;
    } else {
      nameCounts[shortName] = 1;
    }

    return {
      id: asset.id,
      fullName: asset.name,
      name: shortName,
      buyPrice,
      currVal,
      diff,
      diffPercent,
      category: translateCategory(asset.category),
      location: asset.locationName || '-',
      purchaseDate: formatDateDDMMYYYY(asset.purchaseDate),
      [language === 'id' ? 'Harga Beli' : 'Purchase Price']: buyPrice,
      [language === 'id' ? 'Nilai Sekarang' : 'Current Value']: currVal,
    };
  });

  const sortedBarChartData = React.useMemo(() => {
    const data = [...barChartData];
    if (fullChartSort === 'value') {
      data.sort((a, b) => b.currVal - a.currVal);
    } else if (fullChartSort === 'roi') {
      data.sort((a, b) => b.diff - a.diff);
    } else if (fullChartSort === 'name') {
      data.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return data;
  }, [barChartData, fullChartSort]);

  // Handle image file upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'id' ? 'Ukuran gambar maksimal 5MB' : 'Max image size is 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Get current device GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert(language === 'id' ? 'Browser Anda tidak mendukung lokasi GPS' : 'Your browser does not support GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLatitude(pos.coords.latitude.toFixed(6));
        setFormLongitude(pos.coords.longitude.toFixed(6));
        showToast(
          language === 'id' ? 'Koordinat GPS berhasil diperoleh!' : 'GPS coordinates obtained!',
          'info',
          'GPS Detected'
        );
      },
      (err) => {
        console.error('GPS error:', err);
        alert(language === 'id' ? 'Gagal mengambil posisi GPS' : 'Failed to fetch GPS location');
      },
      { enableHighAccuracy: true }
    );
  };

  // Open modals helper
  const handleOpenAddModal = () => {
    setFormName('');
    setFormCategory('Properti / Lahan');
    setFormParentAssetId('');
    setFormPurchasePrice('');
    setFormCurrentValue('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormStatus('owned');
    setFormWorkspace(filterMode === 'keluarga' || filterMode === 'pribadi' ? filterMode : workspace);
    setFormImageUrl('');
    setFormLocationName('');
    setFormAreaSize('');
    setFormLatitude('');
    setFormLongitude('');
    setFormError('');
    setFormDepreciationMethod('none');
    setFormDepreciationUsefulLife('5');
    setFormDepreciationSalvageValue('0');
    setFormUseAutoDepreciation(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormParentAssetId(asset.parentAssetId || '');
    setFormPurchasePrice(asset.purchasePrice.toString());
    setFormCurrentValue(asset.currentValue.toString());
    setFormPurchaseDate(asset.purchaseDate);
    setFormNotes(asset.notes || '');
    setFormStatus(asset.status);
    setFormWorkspace(asset.workspaceId);
    setFormImageUrl(asset.imageUrl || '');
    setFormLocationName(asset.locationName || '');
    setFormAreaSize(asset.areaSize ? asset.areaSize.toString() : '');
    setFormLatitude(asset.latitude !== undefined && asset.latitude !== null ? asset.latitude.toString() : '');
    setFormLongitude(asset.longitude !== undefined && asset.longitude !== null ? asset.longitude.toString() : '');
    setFormError('');
    setFormDepreciationMethod(asset.depreciationMethod || 'none');
    setFormDepreciationUsefulLife((asset.depreciationUsefulLife ?? 5).toString());
    setFormDepreciationSalvageValue((asset.depreciationSalvageValue ?? 0).toString());
    setFormUseAutoDepreciation(asset.useAutoDepreciation || false);
    setIsEditModalOpen(true);
  };

  // Handle Form Submissions
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPurchasePrice || !formCurrentValue || !formPurchaseDate) {
      setFormError(language === 'id' ? 'Harap lengkapi semua field wajib.' : 'Please fill out all required fields.');
      return;
    }

    const priceNum = parseFloat(formPurchasePrice);
    const valueNum = parseFloat(formCurrentValue);

    if (isNaN(priceNum) || isNaN(valueNum)) {
      setFormError(language === 'id' ? 'Nominal harga harus berupa angka valid.' : 'Prices must be valid numbers.');
      return;
    }

    const latNum = formLatitude ? parseFloat(formLatitude) : undefined;
    const lngNum = formLongitude ? parseFloat(formLongitude) : undefined;
    const areaNum = formAreaSize ? parseFloat(formAreaSize) : undefined;

    try {
      await addAsset(
        formName,
        formCategory,
        priceNum,
        valueNum,
        formPurchaseDate,
        formNotes,
        formWorkspace,
        formDepreciationMethod,
        parseInt(formDepreciationUsefulLife) || 5,
        parseFloat(formDepreciationSalvageValue) || 0,
        formUseAutoDepreciation,
        {
          imageUrl: formImageUrl,
          locationName: formLocationName,
          latitude: latNum,
          longitude: lngNum,
          areaSize: areaNum,
          parentAssetId: formParentAssetId || undefined,
        }
      );
      showToast(
        `Aset "${formName}" (Nilai: Rp ${valueNum.toLocaleString('id-ID')}) berhasil disimpan!`,
        'success',
        'Aset Ditambahkan'
      );
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving asset');
      showToast(
        err.message || 'Gagal menyimpan aset.',
        'error',
        'Gagal Menyimpan'
      );
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    if (!formName.trim() || !formPurchasePrice || !formCurrentValue || !formPurchaseDate) {
      setFormError(language === 'id' ? 'Harap lengkapi semua field wajib.' : 'Please fill out all required fields.');
      return;
    }

    const priceNum = parseFloat(formPurchasePrice);
    const valueNum = parseFloat(formCurrentValue);

    if (isNaN(priceNum) || isNaN(valueNum)) {
      setFormError(language === 'id' ? 'Nominal harga harus berupa angka valid.' : 'Prices must be valid numbers.');
      return;
    }

    const latNum = formLatitude ? parseFloat(formLatitude) : undefined;
    const lngNum = formLongitude ? parseFloat(formLongitude) : undefined;
    const areaNum = formAreaSize ? parseFloat(formAreaSize) : undefined;

    try {
      await updateAsset(
        editingAsset.id,
        formName,
        formCategory,
        priceNum,
        valueNum,
        formPurchaseDate,
        formNotes,
        formStatus,
        formWorkspace,
        formDepreciationMethod,
        parseInt(formDepreciationUsefulLife) || 5,
        parseFloat(formDepreciationSalvageValue) || 0,
        formUseAutoDepreciation,
        {
          imageUrl: formImageUrl,
          locationName: formLocationName,
          latitude: latNum,
          longitude: lngNum,
          areaSize: areaNum,
          parentAssetId: formParentAssetId || undefined,
        }
      );
      showToast(
        `Catatan aset "${formName}" berhasil diperbarui!`,
        'success',
        'Aset Diperbarui'
      );
      setIsEditModalOpen(false);
      setEditingAsset(null);
    } catch (err: any) {
      setFormError(err.message || 'Error updating asset');
      showToast(
        err.message || 'Gagal memperbarui aset.',
        'error',
        'Gagal Memperbarui'
      );
    }
  };

  const promptDeleteAsset = (asset: Asset) => {
    setDeleteTarget(asset);
  };

  const handleApplySimulatedValue = async (assetId: string, newValue: number) => {
    const targetAsset = assets.find(a => a.id === assetId);
    if (!targetAsset) return;
    try {
      await updateAsset(
        assetId,
        targetAsset.name,
        targetAsset.category,
        targetAsset.purchasePrice,
        newValue,
        targetAsset.purchaseDate,
        targetAsset.notes || '',
        targetAsset.status,
        targetAsset.workspaceId,
        targetAsset.depreciationMethod,
        targetAsset.depreciationUsefulLife,
        targetAsset.depreciationSalvageValue,
        targetAsset.useAutoDepreciation,
        {
          imageUrl: targetAsset.imageUrl,
          locationName: targetAsset.locationName,
          latitude: targetAsset.latitude,
          longitude: targetAsset.longitude,
          areaSize: targetAsset.areaSize
        }
      );
      showToast(
        `Nilai aset "${targetAsset.name}" berhasil diperbarui menjadi ${formatCurrency(newValue)} berdasarkan simulasi.`,
        'success',
        'Nilai Aset Diperbarui'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui nilai aset.', 'error', 'Error');
    }
  };

  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetName = deleteTarget.name;
    try {
      await deleteAsset(deleteTarget.id);
      showToast(
        `Catatan aset "${targetName}" berhasil dihapus.`,
        'success',
        'Aset Dihapus'
      );
      if (isEditModalOpen && editingAsset?.id === deleteTarget.id) {
        setIsEditModalOpen(false);
        setEditingAsset(null);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete asset', err);
      showToast(
        err.message || 'Gagal menghapus aset.',
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <AssetsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Filter Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">home_work</span>
            <h2 className="font-headline-md font-black text-on-surface text-xl sm:text-2xl">
              {language === 'id' ? 'Manajemen Aset & Barang' : 'Assets & Items Management'}
            </h2>
          </div>
          <p className="font-body-md text-on-surface-variant mt-1 text-xs sm:text-sm">
            {language === 'id'
              ? 'Kelola nilai kekayaan fisik, tanah/lahan, kendaraan, foto, serta lokasi peta aset Anda.'
              : 'Track physical assets, property/land, vehicles, photos, and location maps.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Workspace Filter Buttons */}
          <div className="inline-flex p-1 bg-surface-container-high rounded-xl border border-outline-variant/60">
            <button
              onClick={() => setFilterMode('keluarga')}
              className={`px-3 py-1.5 rounded-lg font-label-sm font-bold text-xs transition-all cursor-pointer ${
                filterMode === 'keluarga'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('familyWorkspace')}
            </button>
            <button
              onClick={() => setFilterMode('pribadi')}
              className={`px-3 py-1.5 rounded-lg font-label-sm font-bold text-xs transition-all cursor-pointer ${
                filterMode === 'pribadi'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('personalWorkspace')}
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-label-sm font-bold text-xs transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Semua Workspace' : 'All Workspaces'}
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={() => setIsSimulationModalOpen(true)}
            className="font-bold cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            {language === 'id' ? 'Simulasi & Prediksi Nilai' : 'Value Simulation'}
          </Button>

          <Button variant="primary" icon="add" onClick={handleOpenAddModal} className="font-bold cursor-pointer text-xs sm:text-sm">
            {language === 'id' ? 'Tambah Aset' : 'Add Asset'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="outlined" className="p-4 sm:p-5 border-l-4 border-l-primary">
          <span className="font-label-sm text-on-surface-variant block">{language === 'id' ? 'Total Nilai Aset' : 'Total Asset Value'}</span>
          <h3 className="font-headline-sm font-black text-on-surface text-lg sm:text-2xl mt-1">
            {formatCurrency(totalCurrentValue)}
          </h3>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            {ownedAssets.length} {language === 'id' ? 'aset aktif dimiliki' : 'active assets owned'}
          </span>
        </Card>

        <Card variant="outlined" className="p-4 sm:p-5 border-l-4 border-l-blue-500">
          <span className="font-label-sm text-on-surface-variant block">{language === 'id' ? 'Total Modal Beli' : 'Total Cost Price'}</span>
          <h3 className="font-headline-sm font-black text-on-surface text-lg sm:text-2xl mt-1">
            {formatCurrency(totalPurchasePrice)}
          </h3>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            {language === 'id' ? 'Nilai perolehan awal' : 'Initial purchase cost'}
          </span>
        </Card>

        <Card variant="outlined" className={`p-4 sm:p-5 border-l-4 ${netROI >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <span className="font-label-sm text-on-surface-variant block">{language === 'id' ? 'Apresiasi / Imbal Hasil' : 'Value Growth / ROI'}</span>
          <h3 className={`font-headline-sm font-black text-lg sm:text-2xl mt-1 ${netROI >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {netROI >= 0 ? '+' : ''}{formatCurrency(netROI)}
          </h3>
          <span className="text-[11px] font-bold text-on-surface-variant mt-1 block">
            {roiPercentage >= 0 ? '+' : ''}{roiPercentage.toFixed(1)}% {language === 'id' ? 'perubahan dari modal' : 'change from cost'}
          </span>
        </Card>

        <Card variant="outlined" className="p-4 sm:p-5 border-l-4 border-l-amber-500">
          <span className="font-label-sm text-on-surface-variant block">{language === 'id' ? 'Aset Terlokasi (Peta)' : 'Mapped Assets'}</span>
          <h3 className="font-headline-sm font-black text-on-surface text-lg sm:text-2xl mt-1">
            {filteredAssets.filter(a => a.latitude && a.longitude).length} / {filteredAssets.length}
          </h3>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            {language === 'id' ? 'Aset dilengkapi koordinat' : 'Assets with location pinned'}
          </span>
        </Card>
      </div>

      {/* Rekening Bank & E-Wallet (Aset Likuid Kas) Section */}
      <Card variant="outlined" className="p-4 sm:p-5 bg-surface rounded-2xl border-outline-variant shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/60">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsPayAccCollapsed(!isPayAccCollapsed)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">account_balance_wallet</span>
              <h3 className="font-headline-sm text-on-surface font-bold text-base sm:text-lg">
                {language === 'id' ? 'Rekening Bank & E-Wallet (Aset Likuid Kas)' : 'Bank Accounts & E-Wallets (Active Cash)'}
              </h3>
              <span className="bg-emerald-500/10 text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded-full">
                {filteredPaymentAccounts.length} {language === 'id' ? 'Rekening' : 'Accounts'}
              </span>
            </div>
            <button 
              type="button" 
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer ml-1"
              title={isPayAccCollapsed ? 'Buka List Rekening' : 'Sembunyikan List Rekening'}
            >
              {isPayAccCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-on-surface-variant block">{language === 'id' ? 'Total Saldo Likuid' : 'Total Liquid Balance'}</span>
              <span className="font-headline-xs text-primary font-bold text-base sm:text-lg">
                {formatCurrency(filteredPaymentAccounts.reduce((sum, a) => sum + (a.balance || 0), 0))}
              </span>
            </div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleOpenAddPayAccModal}
              className="flex items-center gap-1 cursor-pointer font-bold text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Tambah Rekening' : 'Add Account'}</span>
            </Button>
          </div>
        </div>

        {!isPayAccCollapsed && (
          <div className="mt-4">
            {filteredPaymentAccounts.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-outline-variant rounded-xl bg-surface-container-low/50">
                <p className="font-label-md text-on-surface-variant">
                  {language === 'id' ? 'Belum ada rekening atau e-wallet pada filter ini.' : 'No bank accounts or e-wallets in this filter.'}
                </p>
                <Button variant="outline" size="sm" onClick={handleOpenAddPayAccModal} className="mt-2 text-xs cursor-pointer">
                  + {language === 'id' ? 'Tambah Rekening Baru' : 'Add New Account'}
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in fade-in duration-200">
                  {currentPayAccs.map((acc) => {
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
                      onClick={() => setDetailPayAccTarget(acc)}
                      className="p-3 rounded-xl border border-outline-variant bg-surface-container-low hover:border-primary/50 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: acc.color || '#2563eb' }}
                        >
                          <span className="material-symbols-outlined text-lg">{getIconName(acc.type)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-label-md text-on-surface font-bold truncate flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{acc.name}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${acc.workspaceId === 'pribadi' ? 'bg-purple-500/10 text-purple-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {acc.workspaceId === 'pribadi' ? 'Pribadi' : 'Keluarga'}
                            </span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant truncate">
                            {acc.accountNumber ? `No: ${acc.accountNumber}` : (acc.holderName || '-')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="font-label-lg font-bold text-on-surface text-sm">
                          {formatCurrency(acc.balance)}
                        </div>
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEditPayAccModal(acc); }}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Edit Rekening"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeletePayAccTarget(acc); }}
                            className="p-1 rounded text-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Hapus Rekening"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPayAccPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-outline-variant/50 text-xs">
                  <div className="text-on-surface-variant">
                    {language === 'id'
                      ? `Menampilkan ${Math.min((payAccPage - 1) * payAccPerPage + 1, filteredPaymentAccounts.length)} - ${Math.min(payAccPage * payAccPerPage, filteredPaymentAccounts.length)} dari ${filteredPaymentAccounts.length} Rekening`
                      : `Showing ${Math.min((payAccPage - 1) * payAccPerPage + 1, filteredPaymentAccounts.length)} - ${Math.min(payAccPage * payAccPerPage, filteredPaymentAccounts.length)} of ${filteredPaymentAccounts.length} Accounts`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={payAccPage === 1}
                      onClick={() => setPayAccPage(p => Math.max(p - 1, 1))}
                      className="px-2 py-1 text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </Button>
                    {Array.from({ length: totalPayAccPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setPayAccPage(page)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          payAccPage === page
                            ? 'bg-primary text-on-primary shadow-2xs'
                            : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={payAccPage === totalPayAccPages}
                      onClick={() => setPayAccPage(p => Math.min(p + 1, totalPayAccPages))}
                      className="px-2 py-1 text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}
      </Card>

      {/* Analytics Charts Section (Collapsible or visible) */}
      {ownedAssets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Chart */}
          <Card variant="outlined" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h4 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
                {language === 'id' ? 'Komposisi Aset per Kategori' : 'Asset Allocation by Category'}
              </h4>
              <button
                type="button"
                onClick={() => setIsFullPieChartOpen(true)}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-all cursor-pointer active:scale-95"
                title={language === 'id' ? 'Buka Layar Penuh Grafik' : 'Open Fullscreen Chart'}
              >
                <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                <span>{language === 'id' ? 'Lihat Semua' : 'Full View'}</span>
              </button>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Asset Value Comparison */}
          <Card variant="outlined" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h4 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
                {language === 'id' ? 'Perbandingan Harga Beli vs Nilai Sekarang' : 'Cost vs Current Value'}
              </h4>
              <div className="flex items-center gap-2">
                {ownedAssets.length > 0 && (
                  <span className="text-[11px] text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/60">
                    {language === 'id' ? `${barChartData.length} Aset Fisik` : `${barChartData.length} Physical Assets`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullChartOpen(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-all cursor-pointer active:scale-95"
                  title={language === 'id' ? 'Buka Layar Penuh Grafik' : 'Open Fullscreen Chart'}
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                  <span>{language === 'id' ? 'Lihat Semua' : 'Full View'}</span>
                </button>
              </div>
            </div>
            <div className="h-[290px] w-full overflow-x-auto">
              <div style={{ minWidth: barChartData.length > 6 ? `${barChartData.length * 95}px` : '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    stroke="#cbd5e1"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1" 
                    tickFormatter={(v) => `${v >= 1000000000 ? (v / 1000000000).toFixed(1) + 'M' : v >= 1000000 ? (v / 1000000).toFixed(0) + 'Jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v}`} 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const buyPrice = data.buyPrice;
                        const currVal = data.currVal;
                        const diff = currVal - buyPrice;
                        const isGain = diff >= 0;

                        return (
                          <div className="bg-surface p-3 rounded-xl border border-outline-variant shadow-lg text-xs space-y-1.5 min-w-[210px] z-50">
                            <p className="font-bold text-on-surface border-b border-outline-variant/60 pb-1">
                              {data.fullName}
                            </p>
                            <div className="flex justify-between items-center text-on-surface-variant">
                              <span>{language === 'id' ? 'Harga Beli:' : 'Purchase Price:'}</span>
                              <span className="font-semibold text-on-surface">{formatCurrency(buyPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-on-surface-variant">
                              <span>{language === 'id' ? 'Nilai Sekarang:' : 'Current Value:'}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(currVal)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-outline-variant/40">
                              <span>{language === 'id' ? 'Selisih (ROI):' : 'Difference (ROI):'}</span>
                              <span className={`font-bold ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                                {isGain ? '+' : ''}{formatCurrency(diff)} ({isGain ? '+' : ''}{data.diffPercent}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey={language === 'id' ? 'Harga Beli' : 'Purchase Price'} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={language === 'id' ? 'Nilai Sekarang' : 'Current Value'} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* View Mode Toggle, Search, and Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-outline-variant">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={language === 'id' ? 'Cari nama aset, lokasi, kendaraan...' : 'Search asset name, location, vehicle...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="search"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="w-full sm:w-56">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              icon="filter_list"
            >
              <option value="all">{language === 'id' ? 'Semua Kategori' : 'All Categories'}</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{translateCategory(cat)}</option>
              ))}
            </Select>
          </div>

          {/* View Mode Switcher: Grid vs Table vs Map */}
          <div className="inline-flex p-1 bg-surface-container-high rounded-xl border border-outline-variant/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              {language === 'id' ? 'Kartu' : 'Grid'}
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              {language === 'id' ? 'Tabel' : 'Table'}
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              {language === 'id' ? 'Peta Lokasi' : 'Map View'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Asset List Display */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">home_work</span>
          <h4 className="font-headline-sm text-on-surface">{language === 'id' ? 'Tidak ada aset ditemukan' : 'No assets found'}</h4>
          <p className="font-body-md text-on-surface-variant mt-2 max-w-md">
            {language === 'id' 
              ? 'Mulai catat aset dan barang berharga Anda seperti kendaraan, tanah, atau emas untuk memantau kekayaan bersih keluarga.' 
              : 'Start recording your assets and valuable belongings like vehicles, land, or gold to track family net worth.'}
          </p>
          <Button variant="secondary" className="mt-6 font-bold cursor-pointer" onClick={handleOpenAddModal}>
            {language === 'id' ? 'Tambah Aset Pertama' : 'Add First Asset'}
          </Button>
        </div>
      ) : viewMode === 'map' ? (
        <AssetMapView assets={filteredAssets} onSelectAsset={setSelectedDetailAsset} />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-surface shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">{language === 'id' ? 'Foto & Nama Aset' : 'Photo & Asset'}</th>
                <th className="p-3.5">{language === 'id' ? 'Kategori' : 'Category'}</th>
                <th className="p-3.5">{language === 'id' ? 'Lokasi' : 'Location'}</th>
                <th className="p-3.5">{language === 'id' ? 'Harga Beli' : 'Cost'}</th>
                <th className="p-3.5">{language === 'id' ? 'Nilai Sekarang' : 'Current Value'}</th>
                <th className="p-3.5 text-center">{language === 'id' ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-on-surface">
              {currentAssets.map((asset) => {
                const effVal = getAssetEffectiveValue(asset, assets, transactions);
                return (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedDetailAsset(asset)}
                    className="hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} alt={asset.name} className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-primary">
                            <span className="material-symbols-outlined text-[20px]">
                              {asset.category.toLowerCase().includes('properti') ? 'home_work' : 'inventory_2'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-on-surface text-sm">{asset.name}</div>
                          <div className="text-[10px] text-on-surface-variant">{formatDateDDMMYYYY(asset.purchaseDate)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-semibold text-xs">
                        {translateCategory(asset.category)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {asset.locationName ? (
                        <div className="text-xs text-on-surface-variant truncate max-w-[180px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-[14px]">location_on</span>
                          {asset.locationName}
                        </div>
                      ) : (
                        <span className="text-outline text-xs">-</span>
                      )}
                    </td>

                    <td className="p-3.5 font-medium">{formatCurrency(asset.purchasePrice)}</td>

                    <td className="p-3.5 font-bold text-primary">{formatCurrency(effVal)}</td>

                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(asset)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => promptDeleteAsset(asset)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View Cards with Photos and Location Pin Badges */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentAssets.map(asset => {
            const effectiveValue = getAssetEffectiveValue(asset, assets, transactions);
            const isDepreciating = asset.depreciationMethod && asset.depreciationMethod !== 'none';
            const depDetails = isDepreciating 
              ? calculateAssetDepreciation(
                  asset.purchasePrice,
                  asset.purchaseDate,
                  asset.depreciationMethod,
                  asset.depreciationUsefulLife,
                  asset.depreciationSalvageValue
                )
              : null;

            let iconName = 'inventory_2';
            if (asset.category.includes('Usaha') || asset.category.includes('Bisnis') || asset.category.includes('Toko')) iconName = 'store';
            else if (asset.category.includes('Rekening') || asset.category.includes('Bank') || asset.category.includes('E-Wallet')) iconName = 'account_balance_wallet';
            else if (asset.category.includes('Properti') || asset.category.includes('Lahan')) iconName = 'home_work';
            else if (asset.category.includes('Kendaraan')) iconName = 'directions_car';
            else if (asset.category.includes('Emas') || asset.category.includes('Mulia')) iconName = 'diamond';
            else if (asset.category.includes('Elektronik')) iconName = 'devices';
            else if (asset.category.includes('Investasi') || asset.category.includes('Surat')) iconName = 'show_chart';

            return (
              <Card
                key={asset.id}
                variant="outlined"
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-outline-variant/80 flex flex-col justify-between group cursor-pointer"
                onClick={() => setSelectedDetailAsset(asset)}
              >
                <div>
                  {/* Photo Banner Header */}
                  {asset.imageUrl ? (
                    <div className="relative h-44 w-full overflow-hidden bg-surface-container-high">
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        <span className="font-body-sm px-2.5 py-0.5 rounded-full bg-black/60 text-white font-bold text-[10px] uppercase backdrop-blur-xs">
                          {translateCategory(asset.category)}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                        <span className={`font-body-sm px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          asset.status === 'owned' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {asset.status === 'owned' ? (language === 'id' ? 'Dimiliki' : 'Owned') : asset.status}
                        </span>
                      </div>

                      {asset.locationName && (
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-medium truncate flex items-center gap-1 drop-shadow-md">
                          <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                          {asset.locationName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border-b border-outline-variant/40 flex justify-between items-start bg-surface-container-low">
                      <span className="font-body-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>{iconName}</span>
                        {translateCategory(asset.category)}
                      </span>

                      <span className={`font-body-sm px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        asset.status === 'owned' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {asset.status === 'owned' ? (language === 'id' ? 'Dimiliki' : 'Owned') : asset.status}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 sm:p-5">
                    <h4 className="font-title-md text-on-surface font-extrabold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {asset.name}
                    </h4>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.parentAssetId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          ↳ {assets.find(p => p.id === asset.parentAssetId)?.name}
                        </span>
                      )}
                      {assets.some(sub => sub.parentAssetId === asset.id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          🏢 {assets.filter(sub => sub.parentAssetId === asset.id).length} Sub-Aset
                        </span>
                      )}
                    </div>

                    {asset.locationName && !asset.imageUrl && (
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                        <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                        {asset.locationName}
                      </p>
                    )}

                    {asset.notes && (
                      <p className="text-xs text-on-surface-variant line-clamp-2 my-2.5 italic">
                        "{asset.notes}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-b border-outline-variant/50 py-3 my-3">
                      <div>
                        <p className="text-[11px] text-on-surface-variant">{language === 'id' ? 'Harga Beli' : 'Cost Price'}</p>
                        <p className="text-xs sm:text-sm font-semibold text-on-surface mt-0.5">{formatCurrency(asset.purchasePrice)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-on-surface-variant">{language === 'id' ? 'Nilai Sekarang' : 'Current Value'}</p>
                        <p className="text-xs sm:text-sm font-bold text-primary mt-0.5">{formatCurrency(effectiveValue)}</p>
                      </div>
                      {(asset.category.toLowerCase().includes('properti') || asset.category.toLowerCase().includes('lahan') || asset.category.toLowerCase().includes('tanah')) && Number(asset.areaSize) > 0 && (
                        <div className="col-span-2 text-[10px] bg-primary/5 p-1.5 rounded-md border border-primary/10 flex items-center justify-between font-bold text-primary">
                          <span>📐 {formatCurrency(Math.round(effectiveValue / Number(asset.areaSize)))} / m²</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            🌾 {formatCurrency(Math.round(effectiveValue / ((Number(asset.areaSize) * 35) / 10000)))} / borongan
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDateDDMMYYYY(asset.purchaseDate)}
                      </span>
                      {Boolean(asset.areaSize) && (
                        <span className="font-semibold text-primary text-[11px]">
                          {asset.category.includes('Usaha') || asset.category.includes('Bisnis')
                            ? `🤝 ${asset.areaSize}% Kepemilikan`
                            : asset.category.toLowerCase().includes('properti') || asset.category.toLowerCase().includes('lahan') || asset.category.toLowerCase().includes('tanah')
                            ? `📐 ${asset.areaSize} m² (~${((Number(asset.areaSize) * 35) / 10000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Borongan)`
                            : `${asset.areaSize}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="px-4 pb-4 pt-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    className="flex-1 h-8 font-label-sm text-xs cursor-pointer"
                    icon="edit"
                    onClick={() => handleOpenEditModal(asset)}
                  >
                    {language === 'id' ? 'Ubah' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-red-500 hover:bg-red-50 border-red-200 dark:border-red-900/30 hover:text-red-600 px-2.5 cursor-pointer"
                    onClick={() => promptDeleteAsset(asset)}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls for Main Asset List */}
      {filteredAssets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-4 bg-surface rounded-2xl border border-outline-variant shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant font-medium">
              {language === 'id'
                ? `Menampilkan ${Math.min((assetPage - 1) * assetPerPage + 1, filteredAssets.length)} - ${Math.min(assetPage * assetPerPage, filteredAssets.length)} dari ${filteredAssets.length} Aset`
                : `Showing ${Math.min((assetPage - 1) * assetPerPage + 1, filteredAssets.length)} - ${Math.min(assetPage * assetPerPage, filteredAssets.length)} of ${filteredAssets.length} Assets`}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span>{language === 'id' ? 'Tampilkan:' : 'Show:'}</span>
              <select
                value={assetPerPage}
                onChange={(e) => setAssetPerPage(Number(e.target.value))}
                className="bg-surface-container-high text-on-surface font-bold rounded-lg px-2 py-1 text-xs border border-outline-variant/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>

          {totalAssetPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={assetPage === 1}
                onClick={() => setAssetPage(p => Math.max(p - 1, 1))}
                className="px-2 py-1 text-xs cursor-pointer flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{language === 'id' ? 'Sebelumnya' : 'Prev'}</span>
              </Button>

              {Array.from({ length: totalAssetPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setAssetPage(page)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    assetPage === page
                      ? 'bg-primary text-on-primary shadow-2xs'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {page}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={assetPage === totalAssetPages}
                onClick={() => setAssetPage(p => Math.min(p + 1, totalAssetPages))}
                className="px-2 py-1 text-xs cursor-pointer flex items-center gap-0.5"
              >
                <span>{language === 'id' ? 'Berikutnya' : 'Next'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-surface rounded-t-[28px] sm:rounded-2xl border-t sm:border border-outline-variant shadow-2xl overflow-hidden">
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-3 sm:hidden shrink-0" />

            <div className="flex justify-between items-center px-5 py-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div>
                <h3 className="font-headline-sm text-on-surface font-extrabold text-base sm:text-lg">
                  {language === 'id' ? 'Tambah Aset, Lahan & Barang' : 'Add Asset & Items'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {language === 'id' ? 'Catat tanah, rumah, kendaraan, atau barang berharga.' : 'Record land, property, vehicles, or items.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined block text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 text-error rounded-xl font-body-sm text-center border border-red-500/20">
                  {formError}
                </div>
              )}

              <Input
                label={language === 'id' ? 'Nama Aset / Barang / Lahan *' : 'Asset / Property Name *'}
                placeholder={language === 'id' ? 'Contoh: Tanah Kavling Bogor, Mobil Honda Brio' : 'Example: Bogor Land Lot, Honda Brio Car'}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={language === 'id' ? 'Kategori Aset *' : 'Asset Category *'}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{translateCategory(cat)}</option>
                  ))}
                </Select>

                <Select
                  label={language === 'id' ? 'Workspace Pemilik *' : 'Workspace Owner *'}
                  value={formWorkspace}
                  onChange={(e) => setFormWorkspace(e.target.value as WorkspaceType)}
                >
                  <option value="keluarga">{t('familyWorkspace')}</option>
                  <option value="pribadi">{t('personalWorkspace')}</option>
                </Select>
              </div>

              <Select
                label={language === 'id' ? 'Induk Aset / Unit Usaha (Opsional)' : 'Parent Asset / Business Unit (Optional)'}
                value={formParentAssetId}
                onChange={(e) => setFormParentAssetId(e.target.value)}
              >
                <option value="">{language === 'id' ? '-- Utama / Bukan Sub-Aset --' : '-- Main Asset (No Parent) --'}</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    🏢 {a.name} ({a.category})
                  </option>
                ))}
              </Select>

              {/* Photo Upload / Preset Selector Block */}
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2.5">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                    {language === 'id' ? 'Foto / Gambar Aset' : 'Asset Photo / Image'}
                  </span>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      {language === 'id' ? 'Hapus Foto' : 'Remove Photo'}
                    </button>
                  )}
                </label>

                {formImageUrl && (
                  <div className="relative h-32 w-full rounded-lg overflow-hidden border border-outline-variant">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <span className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      {language === 'id' ? 'Unggah Foto' : 'Upload File'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">
                    {language === 'id' ? 'Atau Pilih Galeri Preset Cepat:' : 'Or Select Quick Preset:'}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-surface border border-outline-variant/60 hover:bg-primary/10 hover:border-primary/40 text-on-surface whitespace-nowrap cursor-pointer transition-colors"
                      >
                        📷 {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category-Specific Dynamic Form Fields */}
              {renderCategorySpecificFields()}

              {/* Price & Purchase Date Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === 'id' ? 'Harga Beli (Rp) *' : 'Purchase Price *'}
                  type="number"
                  placeholder="0"
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  required
                />
                <Input
                  label={language === 'id' ? 'Nilai Sekarang (Rp) *' : 'Current Market Value *'}
                  type="number"
                  placeholder="0"
                  value={formCurrentValue}
                  onChange={(e) => setFormCurrentValue(e.target.value)}
                  required
                />
              </div>

              <Input
                label={language === 'id' ? 'Tanggal Perolehan *' : 'Purchase Date *'}
                type="date"
                value={formPurchaseDate}
                onChange={(e) => setFormPurchaseDate(e.target.value)}
                required
              />

              {/* Depreciation Settings */}
              <div className="border border-outline-variant/60 rounded-xl p-3.5 bg-surface-container-low">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">analytics</span>
                    {language === 'id' ? 'Penyusutan Nilai Otomatis' : 'Automatic Depreciation'}
                  </span>
                  <select
                    value={formDepreciationMethod}
                    onChange={(e) => {
                      const method = e.target.value as 'none' | 'straight_line' | 'declining_balance';
                      setFormDepreciationMethod(method);
                      if (method !== 'none') {
                        setFormUseAutoDepreciation(true);
                      } else {
                        setFormUseAutoDepreciation(false);
                      }
                    }}
                    className="text-xs bg-surface border border-outline-variant rounded-md px-2 py-1 text-on-surface font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="none">{language === 'id' ? 'Nonaktif' : 'Disabled'}</option>
                    <option value="straight_line">{language === 'id' ? 'Garis Lurus' : 'Straight Line'}</option>
                    <option value="declining_balance">{language === 'id' ? 'Saldo Menurun' : 'Declining Balance'}</option>
                  </select>
                </div>

                {formDepreciationMethod !== 'none' && (
                  <div className="space-y-3.5 mt-3 pt-3 border-t border-outline-variant/40">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={language === 'id' ? 'Masa Manfaat (Tahun) *' : 'Useful Life (Years) *'}
                        type="number"
                        min="1"
                        max="100"
                        value={formDepreciationUsefulLife}
                        onChange={(e) => setFormDepreciationUsefulLife(e.target.value)}
                        required
                      />
                      <Input
                        label={language === 'id' ? 'Nilai Sisa / Residual (Rp) *' : 'Salvage Value (IDR) *'}
                        type="number"
                        min="0"
                        value={formDepreciationSalvageValue}
                        onChange={(e) => setFormDepreciationSalvageValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label={language === 'id' ? 'Catatan Tambahan' : 'Additional Notes'}
                placeholder={language === 'id' ? 'Contoh: Nomor Sertifikat, Plat Nomor, dsb' : 'Example: Certificate Number, Plate, etc'}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />

              <div className="flex gap-3 justify-end mt-4">
                <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="primary" type="submit" className="font-bold cursor-pointer">
                  {t('save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Update Asset Modal */}
      {isEditModalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-surface rounded-t-[28px] sm:rounded-2xl border-t sm:border border-outline-variant shadow-2xl overflow-hidden">
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-3 sm:hidden shrink-0" />

            <div className="flex justify-between items-center px-5 py-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div>
                <h3 className="font-headline-sm text-on-surface font-extrabold text-base sm:text-lg">
                  {language === 'id' ? 'Ubah Data Aset & Lahan' : 'Edit Asset & Property'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {language === 'id' ? 'Sesuaikan nilai taksir, foto, atau lokasi terbaru.' : 'Update latest value, photo, or location.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAsset(null);
                }}
                className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined block text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 text-error rounded-xl font-body-sm text-center border border-red-500/20">
                  {formError}
                </div>
              )}

              <Input
                label={language === 'id' ? 'Nama Aset / Barang / Lahan *' : 'Asset / Property Name *'}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={language === 'id' ? 'Kategori Aset *' : 'Asset Category *'}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{translateCategory(cat)}</option>
                  ))}
                </Select>

                <Select
                  label={language === 'id' ? 'Workspace Pemilik *' : 'Workspace Owner *'}
                  value={formWorkspace}
                  onChange={(e) => setFormWorkspace(e.target.value as WorkspaceType)}
                >
                  <option value="keluarga">{t('familyWorkspace')}</option>
                  <option value="pribadi">{t('personalWorkspace')}</option>
                </Select>
              </div>

              <Select
                label={language === 'id' ? 'Induk Aset / Unit Usaha (Opsional)' : 'Parent Asset / Business Unit (Optional)'}
                value={formParentAssetId}
                onChange={(e) => setFormParentAssetId(e.target.value)}
              >
                <option value="">{language === 'id' ? '-- Utama / Bukan Sub-Aset --' : '-- Main Asset (No Parent) --'}</option>
                {assets
                  .filter(a => editingAsset ? a.id !== editingAsset.id : true)
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      🏢 {a.name} ({a.category})
                    </option>
                  ))}
              </Select>

              {/* Photo Upload / Preset Selector Block */}
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2.5">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                    {language === 'id' ? 'Foto / Gambar Aset' : 'Asset Photo / Image'}
                  </span>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      {language === 'id' ? 'Hapus Foto' : 'Remove Photo'}
                    </button>
                  )}
                </label>

                {formImageUrl && (
                  <div className="relative h-32 w-full rounded-lg overflow-hidden border border-outline-variant">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <span className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      {language === 'id' ? 'Unggah Foto Baru' : 'Upload New Photo'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">
                    {language === 'id' ? 'Atau Pilih Galeri Preset Cepat:' : 'Or Select Quick Preset:'}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-surface border border-outline-variant/60 hover:bg-primary/10 hover:border-primary/40 text-on-surface whitespace-nowrap cursor-pointer transition-colors"
                      >
                        📷 {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category-Specific Dynamic Form Fields */}
              {renderCategorySpecificFields()}

              {/* Price & Status */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === 'id' ? 'Harga Beli (Rp) *' : 'Purchase Price *'}
                  type="number"
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  required
                />
                <Input
                  label={language === 'id' ? 'Nilai Sekarang (Rp) *' : 'Current Market Value *'}
                  type="number"
                  value={formCurrentValue}
                  onChange={(e) => setFormCurrentValue(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === 'id' ? 'Tanggal Perolehan *' : 'Purchase Date *'}
                  type="date"
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  required
                />

                <Select
                  label={language === 'id' ? 'Status Kepemilikan *' : 'Ownership Status *'}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'owned' | 'sold' | 'liquidated')}
                >
                  <option value="owned">{language === 'id' ? 'Masih Dimiliki' : 'Owned'}</option>
                  <option value="sold">{language === 'id' ? 'Sudah Terjual' : 'Sold'}</option>
                  <option value="liquidated">{language === 'id' ? 'Dicairkan' : 'Liquidated'}</option>
                </Select>
              </div>

              {/* Depreciation Settings */}
              <div className="border border-outline-variant/60 rounded-xl p-3.5 bg-surface-container-low">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">analytics</span>
                    {language === 'id' ? 'Penyusutan Nilai Otomatis' : 'Automatic Depreciation'}
                  </span>
                  <select
                    value={formDepreciationMethod}
                    onChange={(e) => {
                      const method = e.target.value as 'none' | 'straight_line' | 'declining_balance';
                      setFormDepreciationMethod(method);
                      if (method !== 'none') {
                        setFormUseAutoDepreciation(true);
                      } else {
                        setFormUseAutoDepreciation(false);
                      }
                    }}
                    className="text-xs bg-surface border border-outline-variant rounded-md px-2 py-1 text-on-surface font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="none">{language === 'id' ? 'Nonaktif' : 'Disabled'}</option>
                    <option value="straight_line">{language === 'id' ? 'Garis Lurus' : 'Straight Line'}</option>
                    <option value="declining_balance">{language === 'id' ? 'Saldo Menurun' : 'Declining Balance'}</option>
                  </select>
                </div>

                {formDepreciationMethod !== 'none' && (
                  <div className="space-y-3.5 mt-3 pt-3 border-t border-outline-variant/40">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={language === 'id' ? 'Masa Manfaat (Tahun) *' : 'Useful Life (Years) *'}
                        type="number"
                        min="1"
                        max="100"
                        value={formDepreciationUsefulLife}
                        onChange={(e) => setFormDepreciationUsefulLife(e.target.value)}
                        required
                      />
                      <Input
                        label={language === 'id' ? 'Nilai Sisa / Residual (Rp) *' : 'Salvage Value (IDR) *'}
                        type="number"
                        min="0"
                        value={formDepreciationSalvageValue}
                        onChange={(e) => setFormDepreciationSalvageValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label={language === 'id' ? 'Catatan Tambahan' : 'Additional Notes'}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />

              <div className="flex justify-between items-center mt-6">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  onClick={() => promptDeleteAsset(editingAsset)}
                >
                  {language === 'id' ? 'Hapus Aset' : 'Delete Asset'}
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingAsset(null);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button variant="primary" type="submit" className="font-bold cursor-pointer">
                    {t('save')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AssetDetailModal
        asset={selectedDetailAsset}
        isOpen={Boolean(selectedDetailAsset)}
        onClose={() => setSelectedDetailAsset(null)}
        onEdit={(a) => handleOpenEditModal(a)}
        onDelete={(a) => promptDeleteAsset(a)}
      />

      {/* Map Picker Modal */}
      <AssetMapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={formLatitude ? parseFloat(formLatitude) : -6.2088}
        initialLng={formLongitude ? parseFloat(formLongitude) : 106.8456}
        onSelectLocation={(lat, lng, addr) => {
          setFormLatitude(lat.toString());
          setFormLongitude(lng.toString());
          if (addr && !formLocationName) {
            setFormLocationName(addr);
          }
        }}
      />

      {/* Asset Simulation & Value Forecasting Modal */}
      <AssetSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        assets={assets}
        onApplyUpdatedValue={handleApplySimulatedValue}
      />

      {/* Confirm Delete Asset Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAsset}
        title="Konfirmasi Hapus Aset"
        message="Apakah Anda yakin ingin menghapus catatan aset ini? Seluruh riwayat penyusutan dan statistik terkait aset ini akan terhapus."
        itemDetails={deleteTarget ? [
          { label: 'Nama Aset', value: deleteTarget.name },
          { label: 'Kategori', value: deleteTarget.category },
          { label: 'Harga Beli', value: formatCurrency(deleteTarget.purchasePrice) },
          { label: 'Nilai Saat Ini', value: formatCurrency(deleteTarget.currentValue) }
        ] : []}
        confirmText="Hapus Aset"
        isLoading={isDeleting}
      />

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

      {/* Payment Account Details Modal */}
      <PaymentAccountDetailsModal 
        isOpen={Boolean(detailPayAccTarget)}
        onClose={() => setDetailPayAccTarget(null)}
        account={detailPayAccTarget}
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

      {/* Fullscreen Chart Modal */}
      {isFullChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="w-full h-full flex flex-col bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-w-7xl mx-auto">
            {/* Fullscreen Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">bar_chart</span>
                  <h3 className="font-headline-sm text-on-surface font-extrabold text-lg sm:text-xl">
                    {language === 'id' ? 'Grafik Lengkap Perbandingan Nilai Aset' : 'Full Asset Value Comparison Chart'}
                  </h3>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {language === 'id' 
                    ? 'Perbandingan harga beli awal vs nilai pasar sekarang untuk seluruh aset fisik' 
                    : 'Comparison of initial purchase price vs current market value for all physical assets'}
                </p>
              </div>

              {/* Header Actions: Sort controls & Close button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-xl border border-outline-variant/60 text-xs">
                  <span className="text-on-surface-variant font-medium text-[11px] hidden sm:inline">{language === 'id' ? 'Urutkan:' : 'Sort:'}</span>
                  <button
                    onClick={() => setFullChartSort('default')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      fullChartSort === 'default' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setFullChartSort('value')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      fullChartSort === 'value' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {language === 'id' ? 'Nilai' : 'Value'}
                  </button>
                  <button
                    onClick={() => setFullChartSort('roi')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      fullChartSort === 'roi' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    ROI
                  </button>
                  <button
                    onClick={() => setFullChartSort('name')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      fullChartSort === 'name' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {language === 'id' ? 'Nama' : 'Name'}
                  </button>
                </div>

                <button
                  onClick={() => setIsFullChartOpen(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container-lowest border-b border-outline-variant/60 shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/40">
                <span className="text-on-surface-variant text-[11px] block">{language === 'id' ? 'Total Aset Fisik' : 'Total Physical Assets'}</span>
                <span className="font-extrabold text-on-surface text-sm sm:text-base mt-0.5 block">{sortedBarChartData.length} Aset</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/40">
                <span className="text-on-surface-variant text-[11px] block">{language === 'id' ? 'Total Harga Beli' : 'Total Purchase Price'}</span>
                <span className="font-extrabold text-on-surface text-sm sm:text-base mt-0.5 block">{formatCurrency(totalPurchasePrice)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/40">
                <span className="text-on-surface-variant text-[11px] block">{language === 'id' ? 'Total Nilai Sekarang' : 'Total Current Value'}</span>
                <span className="font-extrabold text-primary text-sm sm:text-base mt-0.5 block">{formatCurrency(totalCurrentValue)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/40">
                <span className="text-on-surface-variant text-[11px] block">{language === 'id' ? 'Net Gain / ROI' : 'Net Gain / ROI'}</span>
                <span className={`font-extrabold text-sm sm:text-base mt-0.5 block ${netROI >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                  {netROI >= 0 ? '+' : ''}{formatCurrency(netROI)} ({netROI >= 0 ? '+' : ''}{roiPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Fullscreen Interactive Chart Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-x-auto overflow-y-auto">
              <div style={{ minWidth: sortedBarChartData.length > 5 ? `${sortedBarChartData.length * 110}px` : '100%', minHeight: '480px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedBarChartData} margin={{ top: 20, right: 20, left: 10, bottom: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis 
                      dataKey="fullName" 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      stroke="#cbd5e1"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={90}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      stroke="#cbd5e1" 
                      tickFormatter={(v) => `${v >= 1000000000 ? (v / 1000000000).toFixed(1) + 'M' : v >= 1000000 ? (v / 1000000).toFixed(0) + 'Jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v}`} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const buyPrice = data.buyPrice;
                          const currVal = data.currVal;
                          const diff = currVal - buyPrice;
                          const isGain = diff >= 0;

                          return (
                            <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-2xl text-xs space-y-2 min-w-[240px] z-50">
                              <p className="font-extrabold text-on-surface border-b border-outline-variant/60 pb-1.5 text-sm">
                                {data.fullName}
                              </p>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span>{language === 'id' ? 'Kategori:' : 'Category:'}</span>
                                <span className="font-semibold text-on-surface">{data.category}</span>
                              </div>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span>{language === 'id' ? 'Tanggal Beli:' : 'Purchase Date:'}</span>
                                <span className="font-semibold text-on-surface">{data.purchaseDate}</span>
                              </div>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span>{language === 'id' ? 'Lokasi:' : 'Location:'}</span>
                                <span className="font-semibold text-on-surface truncate max-w-[140px]">{data.location}</span>
                              </div>
                              <div className="pt-2 border-t border-outline-variant/40 space-y-1.5">
                                <div className="flex justify-between items-center text-on-surface-variant">
                                  <span>{language === 'id' ? 'Harga Beli:' : 'Purchase Price:'}</span>
                                  <span className="font-semibold text-on-surface">{formatCurrency(buyPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center text-on-surface-variant">
                                  <span>{language === 'id' ? 'Nilai Sekarang:' : 'Current Value:'}</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(currVal)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-outline-variant/40">
                                  <span>{language === 'id' ? 'Selisih (ROI):' : 'Difference (ROI):'}</span>
                                  <span className={`font-bold ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                                    {isGain ? '+' : ''}{formatCurrency(diff)} ({isGain ? '+' : ''}{data.diffPercent}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }} />
                    <Bar dataKey={language === 'id' ? 'Harga Beli' : 'Purchase Price'} fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={language === 'id' ? 'Nilai Sekarang' : 'Current Value'} fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsFullChartOpen(false)} className="px-6 font-bold cursor-pointer">
                {language === 'id' ? 'Tutup Fullscreen' : 'Close Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Category Pie Chart Modal */}
      {isFullPieChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="w-full h-full flex flex-col bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-w-5xl mx-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">pie_chart</span>
                <h3 className="font-headline-sm text-on-surface font-extrabold text-lg sm:text-xl">
                  {language === 'id' ? 'Komposisi Aset per Kategori (Layar Penuh)' : 'Asset Allocation by Category (Full View)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFullPieChartOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-8 overflow-y-auto">
              <div className="w-full md:w-1/2 h-[350px] sm:h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 space-y-3 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60 max-h-[400px] overflow-y-auto">
                <h4 className="font-bold text-on-surface text-base mb-3 pb-2 border-b border-outline-variant/60">
                  {language === 'id' ? 'Rincian Aset Kategori' : 'Category Allocation Details'}
                </h4>
                {chartData.map((item, idx) => {
                  const percentage = totalCurrentValue > 0 ? ((item.value / totalCurrentValue) * 100).toFixed(1) : '0';
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant/40">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-on-surface text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-on-surface text-sm">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-on-surface-variant font-medium">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsFullPieChartOpen(false)} className="px-6 font-bold cursor-pointer">
                {language === 'id' ? 'Tutup Fullscreen' : 'Close Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
