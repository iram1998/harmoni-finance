import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PolicySection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export function PrivacyPolicy({ onBack }: { onBack?: () => void }) {
  const sections: PolicySection[] = [
    {
      id: '1',
      icon: 'database',
      title: '1. Informasi yang Kami Kumpulkan',
      summary: 'Penjelasan jenis data profil, transaksi, dan log penggunaan yang dicatat.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Untuk memberikan layanan manajemen keuangan keluarga dan pribadi yang optimal, kami dapat mengumpulkan informasi berikut:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li><strong className="text-on-surface">Informasi Akun:</strong> Nama lengkap, alamat email, foto profil, dan preferensi workspace.</li>
            <li><strong className="text-on-surface">Data Transaksi Keuangan:</strong> Catatan pemasukan, pengeluaran, tagihan mendatang, target tabungan (goals), serta kategori anggaran amplop yang Anda masukkan secara mandiri.</li>
            <li><strong className="text-on-surface">Informasi Penggunaan:</strong> Log aktivitas sistem, preferensi tampilan, dan riwayat navigasi di dalam aplikasi untuk meningkatkan performa layanan.</li>
          </ul>
        </div>
      )
    },
    {
      id: '2',
      icon: 'insights',
      title: '2. Penggunaan Informasi',
      summary: 'Tujuan penggunaan data untuk visualisasi, analisis, dan fitur kolaborasi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Informasi yang dikumpulkan digunakan secara khusus untuk:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li>Menyajikan visualisasi arus kas (cash flow), alokasi amplop anggaran, dan laporan keuangan secara real-time.</li>
            <li>Memberikan pengingat tagihan (bill reminders) dan melacak kemajuan target finansial Anda.</li>
            <li>Memfasilitasi kolaborasi ruang kerja (workspace) antara anggota keluarga atau akun pribadi.</li>
            <li>Meningkatkan fitur keamanan, stabilitas aplikasi, dan pengalaman pengguna secara keseluruhan.</li>
          </ul>
        </div>
      )
    },
    {
      id: '3',
      icon: 'verified_user',
      title: '3. Keamanan & Perlindungan Data',
      summary: 'Standar enkripsi HTTPS, keamanan Firestore, dan jaminan tanpa penjualan data.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Keamanan data Anda adalah prioritas utama kami. Kami menerapkan standar perlindungan data yang ketat:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li><strong className="text-on-surface">Enkripsi Data:</strong> Seluruh data dikirim melalui koneksi HTTPS yang terenkripsi dan disimpan dengan protokol enkripsi standar industri.</li>
            <li><strong className="text-on-surface">Tanpa Penjualan Data:</strong> Kami <span className="text-error font-medium">TIDAK PERNAH</span> menjual, menyewakan, atau memperdagangkan data pribadi maupun transaksi finansial Anda kepada pihak ketiga mana pun.</li>
            <li><strong className="text-on-surface">Akses Terbatas:</strong> Hanya Anda dan anggota workspace yang Anda beri izin yang dapat melihat detail keuangan Anda.</li>
          </ul>
        </div>
      )
    },
    {
      id: '4',
      icon: 'manage_accounts',
      title: '4. Hak Pengguna',
      summary: 'Hak untuk mengakses, memperbarui, mengunduh laporan, dan menghapus akun.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Anda memiliki kontrol penuh atas data keuangan Anda di Harmoni Finansial, termasuk hak untuk:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li>Mengakses dan memperbarui informasi profil serta riwayat transaksi kapan saja.</li>
            <li>Mengekspor laporan keuangan ke format terstruktur (seperti CSV atau PDF).</li>
            <li>Menghapus data transaksi, kategori anggaran, atau mengajukan penghapusan akun secara permanen.</li>
          </ul>
        </div>
      )
    },
    {
      id: '5',
      icon: 'mail',
      title: '5. Pertanyaan & Hubungi Kami',
      summary: 'Kanal komunikasi resmi untuk bantuan dan pertanyaan seputar privasi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Jika Anda memiliki pertanyaan, saran, atau kekhawatiran terkait Kebijakan Privasi ini, silakan hubungi tim dukungan kami melalui email di <a href="mailto:support@harmoni.id" className="text-primary font-semibold hover:underline">support@harmoni.id</a> atau melalui halaman Bantuan & Dukungan di aplikasi.
          </p>
        </div>
      )
    }
  ];

  // State to track expanded sections (all open by default or all closed)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['1', '3']));
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
            <span className="material-symbols-outlined text-2xl">shield_person</span>
            <span className="font-label-lg uppercase tracking-wider">Harmoni Finansial</span>
          </div>
          <h1 className="font-headline-lg font-bold text-on-surface">Kebijakan Privasi Interaktif</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Terakhir Diperbarui: 22 Juli 2026
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
            <span className="material-symbols-outlined text-white text-2xl">lock</span>
          </div>
          <div>
            <h2 className="font-title-md font-semibold text-white mb-1">
              Komitmen Kami Terhadap Privasi Anda
            </h2>
            <p className="font-body-md text-white/90 leading-relaxed">
              Di Harmoni Finansial, kami menghargai dan melindungi privasi data keuangan Anda. Klik pada setiap poin di bawah ini untuk melihat detail lengkapnya.
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
            placeholder="Cari topik privasi..."
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

      {/* Accordion Section List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <Card className="p-8 text-center text-on-surface-variant">
            Poin kebijakan privasi tidak ditemukan untuk kata kunci "{searchQuery}".
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
