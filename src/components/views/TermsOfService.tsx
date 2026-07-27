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
      title: '1. Penerimaan Syarat',
      summary: 'Pernyataan persetujuan saat mendaftar atau menggunakan platform.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Dengan membuat akun atau menggunakan fitur di Harmoni Finansial, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen ini serta Kebijakan Privasi kami. Jika Anda tidak menyetujui syarat ini, Anda dapat menghentikan penggunaan platform.
          </p>
        </div>
      )
    },
    {
      id: '2',
      icon: 'apps',
      title: '2. Deskripsi Layanan',
      summary: 'Cakupan fitur pencatatan cash flow, amplop anggaran, target tabungan, dan laporan.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Harmoni Finansial menyediakan alat perencanaan dan penganggaran keuangan mandiri, termasuk namun tidak terbatas pada:
          </p>
          <ul className="list-disc list-inside space-y-2 font-body-md text-on-surface-variant pl-2">
            <li>Pencatatan transaksi arus kas masuk dan keluar (Cash Flow) secara otomatis dan manual.</li>
            <li>Sistem alokasi anggaran berbasis amplop digital (Envelope Budgeting).</li>
            <li>Pemantauan target pencapaian tabungan (Goal Tracking) dan pendaftaran tagihan rutin.</li>
            <li>Laporan analitis dan statistik kesehatan keuangan harian dan bulanan.</li>
          </ul>
        </div>
      )
    },
    {
      id: '3',
      icon: 'account_circle',
      title: '3. Akun & Kerahasiaan',
      summary: 'Tanggung jawab penuh pengguna dalam menjaga kredensial kata sandi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan kredensial akun Anda. Segala aktivitas yang terjadi di bawah akun Anda merupakan tanggung jawab Anda sepenuhnya. Harmoni tidak bertanggung jawab atas kerugian akibat kelalaian pengguna dalam menjaga kata sandi atau informasi rahasia.
          </p>
        </div>
      )
    },
    {
      id: '4',
      icon: 'warning',
      title: '4. Penafian Nasihat Keuangan',
      summary: 'Platform ini adalah alat pencatatan peranti lunak, bukan konsultan resmi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Harmoni Finansial adalah platform peranti lunak manajemen keuangan dan pencatatan pribadi. Layanan ini <strong className="text-on-surface">TIDAK memberikan nasihat keuangan, investasi, pajak, atau hukum berlisensi</strong>. Informasi dan grafik yang disajikan bersifat edukatif dan bantu pencatatan belaka. Silakan berkonsultasi dengan penasihat keuangan profesional untuk keputusan finansial penting.
          </p>
        </div>
      )
    },
    {
      id: '5',
      icon: 'copyright',
      title: '5. Hak Kekayaan Intelektual',
      summary: 'Perlindungan atas seluruh antarmuka, kode sumber, logo, dan desain platform.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Seluruh elemen dalam aplikasi ini, termasuk antarmuka, logo, desain visual, ikon, kode sumber, dan konten teks merupakan hak milik intelektual Harmoni Finansial. Dilarang menggandakan, mendistribusikan, atau memodifikasi bagian mana pun dari layanan ini tanpa izin tertulis dari kami.
          </p>
        </div>
      )
    },
    {
      id: '6',
      icon: 'update',
      title: '6. Perubahan Ketentuan',
      summary: 'Hak untuk memperbarui syarat layanan sewaktu-waktu dengan publikasi revisi.',
      content: (
        <div className="space-y-3 pt-2">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Kami berhak memperbarui Syarat dan Ketentuan Layanan ini sewaktu-waktu. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini dengan pembaruan tanggal revisi.
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
            <span className="font-label-lg uppercase tracking-wider">Harmoni Finansial</span>
          </div>
          <h1 className="font-headline-lg font-bold text-on-surface">Syarat & Ketentuan Interaktif</h1>
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
            <span className="material-symbols-outlined text-white text-2xl">description</span>
          </div>
          <div>
            <h2 className="font-title-md font-semibold text-white mb-1">
              Ketentuan Penggunaan Platform Harmoni
            </h2>
            <p className="font-body-md text-white/90 leading-relaxed">
              Selamat datang di Harmoni Finansial. Klik pada setiap pasal di bawah ini untuk membuka dan membaca detail aturan layanan secara interaktif.
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
