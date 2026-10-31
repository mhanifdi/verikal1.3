/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Formulir Kebiasaan Makan Bergizi — JAWARA 28
 * Halaman 1:
 * - Pilih Sesi Makan (Sarapan, Siang, Malam / Sahur, Malam jika puasa)
 * - Status Puasa terintegrasi dengan Beribadah (tidak bisa dicheck, muncul badge 'Sedang Berpuasa' jika ibadah menginstruksikan)
 * - Poin Minum di opsi awal: <8 gelas = 25 poin, >=8 gelas = 45 poin
 * - Bonus-bonus di Halaman 1 (sekali pengisian sehari):
 *   - Makanan khas Betawi: check & tulis nama makanan (5 poin bonus)
 *   - Adiwiyata: membawa tumbler / tempat minum (10 poin bonus)
 * Halaman 2:
 * - Rentang ideal sesi makan ditampilkan
 * - 2 Opsi Waktu: Makan di rentang ideal (10 poin) vs di luar rentang ideal (5 poin)
 * - Isi Piringku:
 *   1. Makanan pokok (15 poin)
 *   2. Sayur mayur (15 poin)
 *   3. Lauk pauk (7,5 poin)
 *   4. Buah-buahan (7,5 poin)
 * Formulir dimulai dari 0 (belum terisi).
 * Mencatat seluruh jawaban murid ke database.
 */

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Check,
  Wheat,
  Drumstick,
  Carrot,
  Apple,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  Droplet,
  Coffee,
  BookOpen,
} from 'lucide-react';

interface MakanBergiziFormProps {
  onSuccess: (score: number, payload: any, isCounter?: boolean, subCategory?: string) => void;
  onCancel: () => void;
  todayLogs?: any[];
  isMissedEntry?: boolean;
  targetDate?: string;
  initialPuasaSunnah?: boolean;
}

export const MakanBergiziForm: React.FC<MakanBergiziFormProps> = ({
  onSuccess,
  onCancel,
  todayLogs = [],
  isMissedEntry = false,
  targetDate,
  initialPuasaSunnah = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const displayDate = targetDate || todayStr;
  const isPastDay = displayDate < todayStr || isMissedEntry;

  const [currentPage, setCurrentPage] = useState<1 | 2>(1);

  // Deteksi status puasa dari props atau logs ibadah hari ini
  let detectedPuasa = initialPuasaSunnah;
  if (!detectedPuasa) {
    for (const log of todayLogs) {
      if (log.habit_code === 'ibadah') {
        try {
          const p = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
          if (p?.puasaSunnah || p?.puasa || p?.isPuasa) {
            detectedPuasa = true;
            break;
          }
        } catch {}
      }
    }
  }

  // State Halaman 1 (dimulai dari 0)
  const [selectedMeal, setSelectedMeal] = useState<'sarapan' | 'siang' | 'malam' | 'sahur' | ''>('');
  const [waterGlasses, setWaterGlasses] = useState<'<8' | '>=8' | ''>('');
  const [makananBetawi, setMakananBetawi] = useState<boolean>(false);
  const [namaMakananBetawi, setNamaMakananBetawi] = useState<string>('');
  const [bawaTumbler, setBawaTumbler] = useState<boolean>(false);

  // State Halaman 2 (dimulai dari 0)
  const [waktuKategori, setWaktuKategori] = useState<'ideal' | 'diluar_ideal' | ''>('');
  const [piring, setPiring] = useState({
    pokok: false,
    sayur: false,
    lauk: false,
    buah: false,
  });

  const [showHonestyModal, setShowHonestyModal] = useState<boolean>(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Periksa apakah bonus sudah pernah diklaim hari ini pada log sesi lain
  const alreadyClaimedBetawi = todayLogs.some((l) => {
    try {
      const p = typeof l.payload === 'string' ? JSON.parse(l.payload) : l.payload;
      return Boolean(p?.makananBetawi);
    } catch {
      return false;
    }
  });

  const alreadyClaimedTumbler = todayLogs.some((l) => {
    try {
      const p = typeof l.payload === 'string' ? JSON.parse(l.payload) : l.payload;
      return Boolean(p?.bawaTumbler);
    } catch {
      return false;
    }
  });

  // Konfigurasi sesi makan
  const MEAL_SESSIONS = detectedPuasa
    ? [
        {
          key: 'sahur' as const,
          label: 'Makan Sahur',
          rangeStr: '03.00 – 04.30 WIB',
          desc: 'Santap sahur bernutrisi sebelum imsak',
        },
        {
          key: 'malam' as const,
          label: 'Buka Puasa & Makan Malam',
          rangeStr: '18.00 – 19.30 WIB',
          desc: 'Berbuka puasa dan makan malam bergizi',
        },
      ]
    : [
        {
          key: 'sarapan' as const,
          label: 'Sarapan Pagi',
          rangeStr: '06.00 – 08.00 WIB',
          desc: 'Energi utama untuk konsentrasi belajar pagi',
        },
        {
          key: 'siang' as const,
          label: 'Makan Siang',
          rangeStr: '11.30 – 13.00 WIB',
          desc: 'Pemulihan tenaga di tengah aktivitas sekolah',
        },
        {
          key: 'malam' as const,
          label: 'Makan Malam',
          rangeStr: '18.00 – 19.30 WIB',
          desc: 'Makan malam seimbang sebelum istirahat',
        },
      ];

  const currentMealConfig = MEAL_SESSIONS.find((m) => m.key === selectedMeal);

  // Perhitungan Poin
  const minumScore = waterGlasses === '>=8' ? 45 : waterGlasses === '<8' ? 25 : 0;
  const waktuScore = waktuKategori === 'ideal' ? 10 : waktuKategori === 'diluar_ideal' ? 5 : 0;

  let piringScore = 0;
  if (piring.pokok) piringScore += 15;
  if (piring.sayur) piringScore += 15;
  if (piring.lauk) piringScore += 7.5;
  if (piring.buah) piringScore += 7.5;

  const mealTotal = waktuScore + piringScore; // maks 55
  const baseScore = Math.min(100, Math.round(minumScore + mealTotal));

  let bonusPoints = 0;
  if (makananBetawi && !alreadyClaimedBetawi) bonusPoints += 5;
  if (bawaTumbler && !alreadyClaimedTumbler) bonusPoints += 10;

  const rawTotal = baseScore + bonusPoints;
  const currentScore = Math.min(100, rawTotal);
  const overflowBonus = Math.max(0, rawTotal - 100);

  const handleConfirmHonesty = () => {
    setShowHonestyModal(false);

    const answers = [
      {
        question_code: 'makan_sesi',
        question_text: 'Sesi Makan yang Diisi',
        answer_value: selectedMeal,
        answer_text: currentMealConfig ? `${currentMealConfig.label} (${currentMealConfig.rangeStr})` : selectedMeal,
        points: 0,
      },
      {
        question_code: 'makan_status_puasa',
        question_text: 'Status Berpuasa',
        answer_value: detectedPuasa ? 'puasa' : 'tidak_puasa',
        answer_text: detectedPuasa ? 'Sedang Berpuasa (Terintegrasi Ibadah)' : 'Tidak Berpuasa',
        points: 0,
      },
      {
        question_code: 'makan_air_minum',
        question_text: 'Asupan Air Putih Hari Ini',
        answer_value: waterGlasses,
        answer_text: waterGlasses === '>=8' ? '≥ 8 Gelas Air Putih (45 Poin)' : '< 8 Gelas Air Putih (25 Poin)',
        points: minumScore,
      },
      {
        question_code: 'makan_bonus_betawi',
        question_text: 'Makan Makanan Khas Betawi (+5 Poin Bonus)',
        answer_value: makananBetawi ? (namaMakananBetawi.trim() || 'Ya') : 'tidak',
        answer_text: makananBetawi ? `Ya - ${namaMakananBetawi.trim() || 'Kuliner Khas Betawi'} (+5 Poin)` : 'Tidak',
        points: makananBetawi && !alreadyClaimedBetawi ? 5 : 0,
      },
      {
        question_code: 'makan_bonus_tumbler',
        question_text: 'Membawa Tumbler / Tempat Minum Sendiri (+10 Poin Bonus)',
        answer_value: bawaTumbler ? 'ya' : 'tidak',
        answer_text: bawaTumbler ? 'Ya - Membawa Tumbler (+10 Poin)' : 'Tidak',
        points: bawaTumbler && !alreadyClaimedTumbler ? 10 : 0,
      },
      {
        question_code: 'makan_rentang_waktu',
        question_text: 'Waktu Pelaksanaan Sesi Makan',
        answer_value: waktuKategori,
        answer_text: waktuKategori === 'ideal' ? 'Makan di rentang waktu ideal (10 Poin)' : 'Di luar rentang waktu ideal (5 Poin)',
        points: waktuScore,
      },
      {
        question_code: 'makan_piring_pokok',
        question_text: 'Isi Piringku: Makanan Pokok (Karbohidrat)',
        answer_value: piring.pokok ? 'ada' : 'tidak',
        answer_text: piring.pokok ? 'Tersedia (15 Poin)' : 'Tidak ada (0 Poin)',
        points: piring.pokok ? 15 : 0,
      },
      {
        question_code: 'makan_piring_sayur',
        question_text: 'Isi Piringku: Sayur Mayur',
        answer_value: piring.sayur ? 'ada' : 'tidak',
        answer_text: piring.sayur ? 'Tersedia (15 Poin)' : 'Tidak ada (0 Poin)',
        points: piring.sayur ? 15 : 0,
      },
      {
        question_code: 'makan_piring_lauk',
        question_text: 'Isi Piringku: Lauk Pauk (Protein)',
        answer_value: piring.lauk ? 'ada' : 'tidak',
        answer_text: piring.lauk ? 'Tersedia (7,5 Poin)' : 'Tidak ada (0 Poin)',
        points: piring.lauk ? 7.5 : 0,
      },
      {
        question_code: 'makan_piring_buah',
        question_text: 'Isi Piringku: Buah-buahan',
        answer_value: piring.buah ? 'ada' : 'tidak',
        answer_text: piring.buah ? 'Tersedia (7,5 Poin)' : 'Tidak ada (0 Poin)',
        points: piring.buah ? 7.5 : 0,
      },
    ];

    onSuccess(
      currentScore,
      {
        entryMode: isPastDay ? 'formulir_terlewat' : 'tepat_hari_fleksibel',
        session: selectedMeal,
        selectedMeal,
        waterGlasses,
        minumScore,
        isPuasa: detectedPuasa,
        makananBetawi,
        namaMakananBetawi: namaMakananBetawi.trim(),
        bawaTumbler,
        waktuKategori,
        waktuScore,
        piring,
        piringScore,
        baseScore,
        bonusPoints,
        overflowBonus,
        score: currentScore,
        isMissed: isPastDay,
        journalDate: displayDate,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        answers,
      },
      true,
      selectedMeal
    );
  };

  return (
    <div className="modal-backdrop-blur fixed inset-0 w-screen h-screen z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#19ae5d] text-white flex items-center justify-center shadow-xs">
              <Utensils className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#19ae5d]">
                  Makan Bergizi • Halaman {currentPage} dari 2
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#19ae5d]" /> Tanggal: {displayDate}
                </span>
                {isPastDay && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Formulir Terlewat
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">
                {currentPage === 1 ? 'Pilih Sesi Makan, Minum & Bonus' : 'Waktu Sesi & Isi Piringku'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex-shrink-0 px-6 pt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-1">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step === currentPage ? 'bg-[#19ae5d]' : step < currentPage ? 'bg-emerald-700' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-[#19ae5d] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            Nilai: {currentScore} / 100
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Status Puasa: Terintegrasi dengan Ibadah */}
          {detectedPuasa && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-2.5">
              <span className="text-base">🌙</span>
              <div>
                <span className="text-xs font-black text-amber-900 block">
                  Sedang Berpuasa
                </span>
                <span className="text-[11px] text-amber-700">
                  Status puasa aktif otomatis dari jurnal Kebiasaan Beribadah. Sesi makan disesuaikan (Sahur &amp; Berbuka).
                </span>
              </div>
            </div>
          )}

          {currentPage === 1 && (
            <div className="space-y-4">
              {/* 1. Pilih Sesi Makan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Pilih Sesi Makan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MEAL_SESSIONS.map((m) => {
                    const isSelected = selectedMeal === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedMeal(m.key)}
                        className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#19ae5d] ring-1 ring-[#19ae5d] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{m.label}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            {m.rangeStr}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Poin Minum Air Putih */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    2. Asupan Air Putih Hari Ini:
                  </label>
                  <span className="text-xs font-black text-[#19ae5d]">
                    {minumScore} / 45 Poin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      key: '<8' as const,
                      label: '< 8 Gelas',
                      pts: 25,
                      desc: 'Asupan air di bawah rekomendasi ideal harian',
                    },
                    {
                      key: '>=8' as const,
                      label: '≥ 8 Gelas (Ideal)',
                      pts: 45,
                      desc: 'Memenuhi kebutuhan cairan hidrasi harian (±2 Liter)',
                    },
                  ].map((w) => {
                    const isSelected = waterGlasses === w.key;
                    return (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => setWaterGlasses(w.key)}
                        className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#19ae5d] ring-1 ring-[#19ae5d] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{w.label}</span>
                            <Droplet className={`w-3.5 h-3.5 ${isSelected ? 'text-[#19ae5d]' : 'text-slate-400'}`} />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">{w.desc}</span>
                        </div>
                        <span className="text-[11px] font-black text-[#19ae5d] mt-2 block">
                          +{w.pts} Poin
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Bonus-Bonus (Sekali Pengisian Sehari) */}
              <div className="space-y-2.5 pt-1">
                <span className="block text-xs font-bold text-slate-800">
                  3. Poin Bonus Harian (Sekali Pengisian Sehari):
                </span>

                {/* Bonus Makanan Khas Betawi */}
                <div
                  className={`p-3 rounded-2xl border-2 transition-all ${
                    makananBetawi
                      ? 'bg-orange-50/80 border-orange-400 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <label
                    onClick={() => {
                      if (alreadyClaimedBetawi) return;
                      setMakananBetawi(!makananBetawi);
                    }}
                    className={`flex items-start justify-between gap-2.5 cursor-pointer ${
                      alreadyClaimedBetawi ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 ${
                          makananBetawi ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {makananBetawi && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Makan Makanan Khas Betawi (+5 Poin Bonus)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {alreadyClaimedBetawi
                            ? 'Bonus ini telah diklaim pada pengisian sebelumnya hari ini.'
                            : 'Contoh: Sayur gabus pucung, semur jengkol, soto Betawi, kerak telor, roti buaya'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md shrink-0">
                      +5 Bonus
                    </span>
                  </label>

                  {makananBetawi && !alreadyClaimedBetawi && (
                    <div className="mt-2.5 pt-2.5 border-t border-orange-200/60">
                      <input
                        type="text"
                        value={namaMakananBetawi}
                        onChange={(e) => setNamaMakananBetawi(e.target.value)}
                        placeholder="Tuliskan nama makanan khas Betawi yang dimakan..."
                        className="w-full p-2 bg-white border border-orange-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>

                {/* Bonus Adiwiyata Tumbler */}
                <label
                  onClick={() => {
                    if (alreadyClaimedTumbler) return;
                    setBawaTumbler(!bawaTumbler);
                  }}
                  className={`flex items-start justify-between gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    bawaTumbler
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200'
                  } ${alreadyClaimedTumbler ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 ${
                        bawaTumbler ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {bawaTumbler && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Membawa Tumbler / Tempat Minum Sendiri (Bonus Adiwiyata)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {alreadyClaimedTumbler
                          ? 'Bonus ini telah diklaim pada sesi makan sebelumnya hari ini.'
                          : 'Aksi ramah lingkungan mengurangi sampah plastik sekali pakai.'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    +10 Bonus
                  </span>
                </label>
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className="space-y-4">
              {/* Rentang Ideal Sesi Terpilih */}
              {currentMealConfig && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[11px] uppercase font-black text-emerald-800 tracking-wider block">
                    Rentang Ideal {currentMealConfig.label}:
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                    {currentMealConfig.rangeStr}
                  </span>
                </div>
              )}

              {/* 2 Opsi Waktu Pelaksanaan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Waktu Pelaksanaan Sesi Makan:
                  </label>
                  <span className="text-xs font-black text-[#19ae5d]">
                    {waktuScore} / 10 Poin
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWaktuKategori('ideal')}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      waktuKategori === 'ideal'
                        ? 'bg-emerald-50/80 border-[#19ae5d] ring-1 ring-[#19ae5d] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Makan di Rentang Ideal</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Sesuai jam makan ideal tubuh</span>
                    </div>
                    <span className="text-[11px] font-black text-[#19ae5d] mt-2 block">+10 Poin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaktuKategori('diluar_ideal')}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      waktuKategori === 'diluar_ideal'
                        ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Di Luar Rentang Ideal</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Terlambat atau mendahului jadwal</span>
                    </div>
                    <span className="text-[11px] font-black text-amber-700 mt-2 block">+5 Poin</span>
                  </button>
                </div>
              </div>

              {/* Komposisi Isi Piringku */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Komposisi Isi Piringku:
                  </label>
                  <span className="text-xs font-black text-[#19ae5d]">
                    {piringScore} / 45 Poin
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      key: 'pokok' as const,
                      label: '1. Makanan Pokok',
                      sub: 'Nasi, jagung, singkong, ubi, kentang, mie',
                      pts: '15 Poin',
                      icon: Wheat,
                      color: 'text-amber-600',
                    },
                    {
                      key: 'sayur' as const,
                      label: '2. Sayur Mayur',
                      sub: 'Bayam, kangkung, wortel, buncis, brokoli',
                      pts: '15 Poin',
                      icon: Carrot,
                      color: 'text-emerald-600',
                    },
                    {
                      key: 'lauk' as const,
                      label: '3. Lauk Pauk',
                      sub: 'Ayam, ikan, telur, tempe, tahu, daging',
                      pts: '7,5 Poin',
                      icon: Drumstick,
                      color: 'text-red-500',
                    },
                    {
                      key: 'buah' as const,
                      label: '4. Buah-buahan',
                      sub: 'Pisang, pepaya, apel, jeruk, melon, semangka',
                      pts: '7,5 Poin',
                      icon: Apple,
                      color: 'text-rose-500',
                    },
                  ].map((item) => {
                    const isChecked = piring[item.key];
                    const IconComp = item.icon;
                    return (
                      <label
                        key={item.key}
                        onClick={() => setPiring((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`flex items-start justify-between gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 ${
                              isChecked ? 'bg-[#19ae5d] border-[#19ae5d] text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                              <span className="text-xs font-bold text-slate-900">{item.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                              {item.sub}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-[#19ae5d] shrink-0">
                          +{item.pts}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Total Score Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                    Nilai Capaian Makan Bergizi:
                  </span>
                  <span className="text-2xl font-black">{currentScore} / 100</span>
                  <span className="text-[11px] text-emerald-100 block mt-0.5">
                    Minum ({minumScore}) + Waktu ({waktuScore}) + Piring ({piringScore})
                    {bonusPoints > 0 ? ` + Bonus (+${bonusPoints})` : ''}
                  </span>
                  {overflowBonus > 0 && (
                    <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full inline-block mt-1">
                      +{overflowBonus} Poin Bonus masuk ke Poin Hebat
                    </span>
                  )}
                </div>
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>
            </div>
          )}

          {/* Rujukan Ilmiah Remang-remang di Bagian Paling Bawah */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1.5 leading-relaxed">
              <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Rujukan: Pedoman Gizi Seimbang &amp; Panduan Isi Piringku — Kementerian Kesehatan Republik Indonesia (Kemenkes RI).
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div>
            {currentPage === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
          <div>
            {currentPage === 1 ? (
              <button
                type="button"
                disabled={!selectedMeal || !waterGlasses}
                onClick={() => {
                  if (!selectedMeal) {
                    alert('Silakan pilih salah satu sesi makan.');
                    return;
                  }
                  if (!waterGlasses) {
                    alert('Silakan pilih asupan air putih hari ini.');
                    return;
                  }
                  setCurrentPage(2);
                }}
                className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all ${
                  !selectedMeal || !waterGlasses
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-[#19ae5d] hover:bg-emerald-700 text-white cursor-pointer'
                }`}
              >
                Lanjut <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!waktuKategori}
                onClick={() => {
                  if (!waktuKategori) {
                    alert('Silakan pilih waktu pelaksanaan sesi makan (ideal / di luar ideal).');
                    return;
                  }
                  setShowHonestyModal(true);
                }}
                className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all ${
                  !waktuKategori
                    ? 'bg-slate-300 cursor-not-allowed opacity-60'
                    : 'bg-[#19ae5d] hover:bg-emerald-700 cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" /> Simpan Jurnal
              </button>
            )}
          </div>
        </div>
      </div>

      {showHonestyModal && (
        <div className="honesty-backdrop-blur fixed inset-0 w-screen h-screen z-[100] bg-slate-950/75 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#19ae5d] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Pernyataan Kejujuran Makan Bergizi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Jurnal tanggal {displayDate} • Nilai Capaian: {currentScore} / 100
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium text-left">
              "Saya menyatakan dengan sejujur-jujurnya bahwa porsi makan dan asupan gizi yang saya laporkan sesuai dengan yang saya konsumsi."
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHonestyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Koreksi
              </button>
              <button
                type="button"
                onClick={handleConfirmHonesty}
                className="flex-1 py-2.5 rounded-xl bg-[#19ae5d] hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer"
              >
                Simpan &amp; Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
