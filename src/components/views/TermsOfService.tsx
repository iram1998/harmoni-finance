import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TermSection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export function TermsOfService({ onBack }: { onBack?: () => void }) {
  const sections: TermSection[] = [
    {
      id: '1',
      icon: 'check_circle',
      title: '1. Penerimaan Syarat & Ketentuan',
      summary: 'Pernyataan persetujuan saat mendaftar, mengautentikasi, atau menggunakan fitur platform.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Dengan membuat akun, melakukan autentikasi, atau mengakses layanan Noora Harmoni Finance, Anda menyatakan secara sadar telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen Syarat & Ketentuan ini beserta Kebijakan Privasi kami. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda dipersilakan menghentikan penggunaan platform.
          </p>
        </div>
      )
    },
    {
      id: '2',
      icon: 'apps',
      title: '2. Cakupan Fitur & Modul Layanan',
      summary: 'Cakupan fitur pencatatan cash flow, utang-piutang, aset, tagihan, anggaran, dan laporan.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Noora Harmoni Finance menyediakan platform peranti lunak perencanaan dan pengelolaan keuangan mandiri yang mencakup:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li>Modul Arus Kas (Cash Flow) & Rekening Pembayaran untuk pencatatan transaksi Pemasukan, Pengeluaran, dan Transfer.</li>
            <li>Modul Utang & Piutang (Debts & Receivables) untuk mencatat kewajiban, klaim pembayaran, dan pelunasan bertahap.</li>
            <li>Modul Aset & Barang (Assets & Property) untuk pemantauan inventaris fisik/keuangan, peta lokasi, dan simulasi penyusutan.</li>
            <li>Modul Amplop Anggaran (Envelope Budgeting), Pengingat Tagihan (Bills), dan Target Tabungan (Goals).</li>
            <li>Laporan Analitis Lintas Workspace dan fitur ekspor cetak PDF/CSV.</li>
          </ul>
        </div>
      )
    },
    {
      id: '3',
      icon: 'account_circle',
      title: '3. Tanggung Jawab Akun, Workspace & Pengunci Layar',
      summary: 'Kerahasiaan akun, otorisasi ruang kerja Keluarga vs Pribadi, serta PIN Passcode.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Pengguna bertanggung jawab penuh atas kerahasiaan kredensial dan penggunaan fitur keamanan:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li><strong className="text-on-surface">Kerahasiaan Kredensial:</strong> Pengguna wajib menjaga kata sandi akun dan tidak membagikannya kepada pihak yang tidak berhak.</li>
            <li><strong className="text-on-surface">Pengaturan Workspace:</strong> Pengguna bertanggung jawab atas anggota keluarga yang diundang ke dalam Workspace Keluarga. Data di Workspace Pribadi tetap terisolasi penuh.</li>
            <li><strong className="text-on-surface">Pengunci Layar (Passcode Security):</strong> Fitur kunci PIN lokal disediakan untuk perlindungan tambahan dari akses langsung pada fisik perangkat pengguna.</li>
          </ul>
        </div>
      )
    },
    {
      id: '4',
      icon: 'warning',
      title: '4. Penafian Nasihat Keuangan & Hukum',
      summary: 'Platform ini adalah alat peranti lunak pencatatan mandiri, bukan konsultan keuangan resmi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Noora Harmoni Finance adalah platform pencatatan peranti lunak independen. Layanan ini <strong className="text-on-surface">TIDAK memberikan nasihat keuangan, investasi, perpajakan, atau hukum berlisensi</strong>. Seluruh perhitungan, grafik, dan estimasi penyusutan bersifat informatif dan bantu pencatatan belaka. Silakan berkonsultasi dengan penasihat keuangan terdaftar untuk keputusan finansial penting.
          </p>
        </div>
      )
    },
    {
      id: '5',
      icon: 'copyright',
      title: '5. Hak Kekayaan Intelektual',
      summary: 'Perlindungan atas antarmuka, kode sumber, sistem komponen, logo, dan ikon platform.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Seluruh elemen dalam platform ini, termasuk sistem antarmuka UI/UX, desain komponen, logo Noora Harmoni Finance, kode sumber, dan konten teks merupakan hak kekayaan intelektual milik Noora Harmoni Finance. Dilarang menggandakan, mendistribusikan, merekayasa balik (reverse engineer), atau memodifikasi bagian mana pun tanpa izin tertulis dari kami.
          </p>
        </div>
      )
    },
    {
      id: '6',
      icon: 'update',
      title: '6. Perubahan Ketentuan Layanan',
      summary: 'Hak untuk memperbarui syarat dan ketentuan layanan secara berkala.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Kami berhak memperbarui dan menyempurnakan Syarat & Ketentuan ini sewaktu-waktu sesuai perkembangan fitur atau aturan hukum. Perubahan akan berlaku efektif setelah dipublikasikan di halaman ini dengan pembaruan tanggal revisi.
          </p>
        </div>
      )
    }
  ];

  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['1', '2']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-2xl">gavel</span>
            <span className="font-label-lg uppercase tracking-wider">Noora Harmoni Finance</span>
          </div>
          <h1 className="font-headline-lg font-bold text-on-surface">Syarat & Ketentuan Interaktif</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Terakhir Diperbarui: 30 Juli 2026
          </p>
        </div>
        {onBack && (
          <Button variant="outline" icon="arrow_back" onClick={onBack} className="w-fit">
            Kembali ke Dashboard
          </Button>
        )}
      </div>

      {/* Intro Banner */}
      <Card variant="primary" className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-2xl">description</span>
          </div>
          <div>
            <h2 className="font-title-md font-semibold text-white mb-1">
              Ketentuan Penggunaan Platform NOHARFIN
            </h2>
            <p className="font-body-md text-white/90 leading-relaxed">
              Selamat datang di Noora Harmoni Finance. Klik pada setiap pasal di bawah ini untuk membuka dan membaca detail aturan layanan secara interaktif.
            </p>
          </div>
        </div>
      </Card>

      {/* Accordion Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Cari pasal atau ketentuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">unfold_more</span>
            Buka Semua
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">unfold_less</span>
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <Card className="p-8 text-center text-on-surface-variant">
            Pasal ketentuan tidak ditemukan untuk kata kunci "{searchQuery}".
          </Card>
        ) : (
          filteredSections.map((section) => {
            const isOpen = openIds.has(section.id);
            return (
              <Card
                key={section.id}
                variant="elevated"
                className={`transition-all duration-200 border ${
                  isOpen ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : 'border-outline-variant hover:border-primary/30'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 text-left flex items-start justify-between gap-4 focus:outline-none group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container group-hover:bg-primary/20'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{section.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      {!isOpen && (
                        <p className="font-body-sm text-on-surface-variant mt-1 line-clamp-1">
                          {section.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-primary/10 text-primary rotate-180' : 'bg-surface-container-high text-on-surface-variant group-hover:bg-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-xl">expand_more</span>
                  </div>
                </button>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-0 border-t border-outline-variant/40 mt-2 animate-fadeIn">
                    {section.content}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
