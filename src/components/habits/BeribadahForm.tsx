/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Formulir Kebiasaan Beribadah — Sesuai Pembaruan Sistem Jawara 28
 * 1. Shalat 5 waktu & Tri Sandhya diubah menjadi checkbox (tanpa rentang awal/akhir).
 *    Terkunci otomatis jika waktu jadwal belum tiba pada hari ini.
 *    - Shalat: Subuh 04.00, Zuhur 11.38, Asar 14.54, Maghrib 17.48, Isya 19.00
 *    - Tri Sandhya: Pagi 05.00, Siang 12.00, Sore 18.00 (6.00 sore)
 * 2. Kristen:
 *    - Ibadah ke Gereja (50 pt) -> hanya dapat diisi hari Sabtu / Minggu.
 *      Setelah diisi, tombol terkunci untuk sepekan dan +50 poin ditambahkan setiap hari dalam pekan itu.
 *    - Membaca Doa sesudah atau sebelum kegiatan (25 pt)
 *    - Membaca Alkitab (25 pt)
 *    - Tak ada bonus untuk Kristen.
 * 3. Bonus Ibadah (bisa diakses di halaman pertama, max 1 pengisian per hari):
 *    - Islam: Puasa sunnah, Baca Qur'an (ada input surah/ayat/halaman, popup "Semoga khatam, ye!"), Ibadah lainnya.
 *      Diisi salah satu atau semuanya bernilai tetap 10 poin bonus.
 *    - Puasa sunnah terintegrasi otomatis dengan Makan Bergizi.
 * 4. Adiwiyata: Menjaga kebersihan tempat ibadah (+10 poin bonus), muncul di halaman pertama.
 * 5. Mulai dalam keadaan kosong murni (isi dari 0).
 * 6. Rujukan remang-remang di bagian paling bawah.
 * 7. Menggunakan istilah "Murid".
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Check,
  Clock,
  ShieldCheck,
  BookOpen,
  Calendar,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateIslamHalanganScore,
  applyBonusCapAndOverflow,
} from '../../utils/scoring';
import { SCORING_RULES } from '../../config/scoringConfig';
import { timeToMinutes } from '../../utils/timeClassifier';

interface BeribadahFormProps {
  studentReligion?: string;
  studentGender?: string;
  todayLogs?: any[];
  isMissedEntry?: boolean;
  targetDate?: string;
  initialHalangan?: boolean;
  onSuccess: (score: number, payload: any, isCounter?: boolean, subCategory?: string, overwrite?: boolean) => void;
  onCancel: () => void;
}

export const BeribadahForm: React.FC<BeribadahFormProps> = ({
  studentReligion = 'Islam',
  studentGender = 'L',
  todayLogs = [],
  isMissedEntry = false,
  targetDate,
  initialHalangan = false,
  onSuccess,
  onCancel,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const displayDate = targetDate || todayStr;
  const isPastDay = displayDate < todayStr || isMissedEntry;

  const isIslam = !studentReligion || studentReligion.toLowerCase().includes('islam');
  const isKristen =
    studentReligion?.toLowerCase().includes('kristen') ||
    studentReligion?.toLowerCase().includes('katolik');
  const isHindu = studentReligion?.toLowerCase().includes('hindu');

  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [showHonestyModal, setShowHonestyModal] = useState(false);

  // Pop up khatam Al-Qur'an
  const [quranPopup, setQuranPopup] = useState(false);

  // Hari dalam sepekan untuk aturan Kristen (0 = Minggu, 6 = Sabtu)
  const targetDateObj = new Date(displayDate + 'T12:00:00');
  const dayOfWeek = targetDateObj.getDay(); // 0: Sun, 6: Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Track existing logs for this date
  const completedMap: Record<string, any> = {};
  todayLogs.forEach((l) => {
    const sub = (l.sub_category || '').toLowerCase();
    if (sub) completedMap[sub] = l;
  });

  // Islam Checkbox States (mulai dari 0 / unchecked)
  const [shalatChecked, setShalatChecked] = useState<{
    subuh: boolean;
    zuhur: boolean;
    asar: boolean;
    magrib: boolean;
    isya: boolean;
  }>({
    subuh: false,
    zuhur: false,
    asar: false,
    magrib: false,
    isya: false,
  });

  // Islam Halangan (khusus murid putri)
  const [isHalangan, setIsHalangan] = useState(studentGender === 'P' && initialHalangan);
  const [halanganItems, setHalanganItems] = useState({
    dzikirDoa: false,
    murajaahQuran: false,
    berbuatBaik: false,
    kajianAgama: false,
    kebersihanDiri: false,
  });

  // Bonus Ibadah Islam (Halaman 1)
  const [bonusPuasaSunnah, setBonusPuasaSunnah] = useState(false);
  const [bonusBacaQuran, setBonusBacaQuran] = useState(false);
  const [quranSurah, setQuranSurah] = useState('');
  const [quranAyatCount, setQuranAyatCount] = useState('');
  const [bonusIbadahLainnya, setBonusIbadahLainnya] = useState(false);
  const [ibadahLainnyaText, setIbadahLainnyaText] = useState('');

  // Adiwiyata Halaman 1
  const [adiwiyataKebersihan, setAdiwiyataKebersihan] = useState(false);

  // Kristen Checkbox States
  const [kristenGereja, setKristenGereja] = useState(false);
  const [kristenDoaKegiatan, setKristenDoaKegiatan] = useState(false);
  const [kristenBacaAlkitab, setKristenBacaAlkitab] = useState(false);

  // Hindu Checkbox States
  const [hinduPagi, setHinduPagi] = useState(false);
  const [hinduSiang, setHinduSiang] = useState(false);
  const [hinduSore, setHinduSore] = useState(false);
  const [hinduBacaWeda, setHinduBacaWeda] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hh}:${mm}`);
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Jam Buka Shalat: Subuh 04.00, Zuhur 11.38, Asar 14.54, Maghrib 17.48, Isya 19.00
  const prayerSchedules = [
    { key: 'subuh', label: 'Salat Subuh', openStr: '04.00', openMin: 240, score: 20 },
    { key: 'zuhur', label: 'Salat Zuhur', openStr: '11.38', openMin: 698, score: 20 },
    { key: 'asar', label: 'Salat Asar', openStr: '14.54', openMin: 894, score: 20 },
    { key: 'magrib', label: 'Salat Maghrib', openStr: '17.48', openMin: 1068, score: 20 },
    { key: 'isya', label: 'Salat Isya', openStr: '19.00', openMin: 1140, score: 20 },
  ];

  // Tri Sandhya Buka: Pagi 05.00, Siang 12.00, Sore 18.00 (6 sore)
  const triSandhyaSchedules = [
    { key: 'pagi', label: 'Tri Sandhya Pagi', openStr: '05.00', openMin: 300, score: 34 },
    { key: 'siang', label: 'Tri Sandhya Siang', openStr: '12.00', openMin: 720, score: 33 },
    { key: 'sore', label: 'Tri Sandhya Sore', openStr: '18.00', openMin: 1080, score: 33 },
  ];

  // Hitung Skor
  let baseScore = 0;
  let bonusPoints = 0;

  if (isIslam) {
    if (isHalangan) {
      const count = Object.values(halanganItems).filter(Boolean).length;
      baseScore = count * 20;
    } else {
      const count = Object.values(shalatChecked).filter(Boolean).length;
      baseScore = count * 20;
    }
    const hasBonus = bonusPuasaSunnah || bonusBacaQuran || bonusIbadahLainnya;
    if (hasBonus) bonusPoints += 10;
    if (adiwiyataKebersihan) bonusPoints += 10;
  } else if (isKristen) {
    if (kristenGereja) baseScore += 50;
    if (kristenDoaKegiatan) baseScore += 25;
    if (kristenBacaAlkitab) baseScore += 25;
    // Tak ada bonus untuk kristen
  } else if (isHindu) {
    let count = 0;
    if (hinduPagi) count += 34;
    if (hinduSiang) count += 33;
    if (hinduSore) count += 33;
    baseScore = count;
    if (hinduBacaWeda) bonusPoints += 10;
    if (adiwiyataKebersihan) bonusPoints += 10;
  }

  const breakdown = applyBonusCapAndOverflow(baseScore, bonusPoints);
  const finalScore = breakdown.finalScore;

  const handleNextOrSubmit = () => {
    if (currentPage === 1) {
      if (bonusBacaQuran && !quranPopup) {
        setQuranPopup(true);
      }
      setCurrentPage(2);
    } else {
      setShowHonestyModal(true);
    }
  };

  const handleConfirmHonesty = () => {
    setShowHonestyModal(false);

    // Kumpulkan seluruh jawaban murid untuk dicatat secara rinci di database
    const answersRecord: Array<{ key: string; label: string; value: string; score?: number }> = [];

    if (isIslam) {
      if (isHalangan) {
        answersRecord.push({
          key: 'mode_ibadah',
          label: 'Status Ibadah',
          value: 'Mode Pengganti Berhalangan (Siswi)',
          score: 0,
        });
        const hItems = [
          { key: 'dzikirDoa', label: 'Berdzikir dan berdoa', checked: halanganItems.dzikirDoa },
          { key: 'murajaahQuran', label: "Mendengar / membaca Al-Qur'an", checked: halanganItems.murajaahQuran },
          { key: 'berbuatBaik', label: 'Berbuat baik / sedekah', checked: halanganItems.berbuatBaik },
          { key: 'kajianAgama', label: 'Belajar ilmu agama / kajian', checked: halanganItems.kajianAgama },
          { key: 'kebersihanDiri', label: 'Menjaga kebersihan dan kesehatan', checked: halanganItems.kebersihanDiri },
        ];
        hItems.forEach((item) => {
          answersRecord.push({
            key: `halangan_${item.key}`,
            label: item.label,
            value: item.checked ? 'Ya (Dilaksanakan)' : 'Tidak',
            score: item.checked ? 20 : 0,
          });
        });
      } else {
        prayerSchedules.forEach((p) => {
          const isDone = Boolean((shalatChecked as any)[p.key]);
          answersRecord.push({
            key: `shalat_${p.key}`,
            label: p.label,
            value: isDone ? 'Ya (Sudah Dilaksanakan)' : 'Belum Dilaksanakan',
            score: isDone ? p.score : 0,
          });
        });
      }

      // Bonus Ibadah
      answersRecord.push({
        key: 'bonus_puasa_sunnah',
        label: 'Bonus Ibadah: Puasa Sunnah',
        value: bonusPuasaSunnah ? 'Ya (Sedang Berpuasa Sunnah)' : 'Tidak',
        score: bonusPuasaSunnah ? 10 : 0,
      });
      answersRecord.push({
        key: 'bonus_baca_quran',
        label: "Bonus Ibadah: Baca Al-Qur'an",
        value: bonusBacaQuran
          ? `Ya (Surah: ${quranSurah || '-'}, Jumlah: ${quranAyatCount || '-'})`
          : 'Tidak',
        score: bonusBacaQuran ? 10 : 0,
      });
      answersRecord.push({
        key: 'bonus_ibadah_lainnya',
        label: 'Bonus Ibadah: Ibadah Lainnya',
        value: bonusIbadahLainnya
          ? `Ya (${ibadahLainnyaText || 'Tahajjud / Shalat Rawatib / Zikir Petang'})`
          : 'Tidak',
        score: bonusIbadahLainnya ? 10 : 0,
      });
      answersRecord.push({
        key: 'adiwiyata_tempat_ibadah',
        label: 'Adiwiyata: Menjaga Kebersihan Tempat Ibadah',
        value: adiwiyataKebersihan ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: adiwiyataKebersihan ? 10 : 0,
      });
    } else if (isKristen) {
      answersRecord.push({
        key: 'kristen_gereja',
        label: 'Ibadah ke Gereja (Sabtu / Minggu)',
        value: kristenGereja ? 'Ya (Sudah Dilaksanakan)' : 'Belum / Terkunci',
        score: kristenGereja ? 50 : 0,
      });
      answersRecord.push({
        key: 'kristen_doa_kegiatan',
        label: 'Membaca Doa sesudah atau sebelum kegiatan',
        value: kristenDoaKegiatan ? 'Ya (Sudah Dilaksanakan)' : 'Tidak',
        score: kristenDoaKegiatan ? 25 : 0,
      });
      answersRecord.push({
        key: 'kristen_baca_alkitab',
        label: 'Membaca Alkitab',
        value: kristenBacaAlkitab ? 'Ya (Sudah Dilaksanakan)' : 'Tidak',
        score: kristenBacaAlkitab ? 25 : 0,
      });
    } else if (isHindu) {
      answersRecord.push({
        key: 'hindu_tri_sandhya_pagi',
        label: 'Tri Sandhya Pagi (05.00 WIB)',
        value: hinduPagi ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: hinduPagi ? 34 : 0,
      });
      answersRecord.push({
        key: 'hindu_tri_sandhya_siang',
        label: 'Tri Sandhya Siang (12.00 WIB)',
        value: hinduSiang ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: hinduSiang ? 33 : 0,
      });
      answersRecord.push({
        key: 'hindu_tri_sandhya_sore',
        label: 'Tri Sandhya Sore (18.00 WIB)',
        value: hinduSore ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: hinduSore ? 33 : 0,
      });
      answersRecord.push({
        key: 'hindu_baca_weda',
        label: 'Membaca Kitab Suci Weda',
        value: hinduBacaWeda ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: hinduBacaWeda ? 10 : 0,
      });
      answersRecord.push({
        key: 'adiwiyata_tempat_ibadah',
        label: 'Adiwiyata: Menjaga Kebersihan Tempat Ibadah',
        value: adiwiyataKebersihan ? 'Ya (Dilaksanakan)' : 'Tidak',
        score: adiwiyataKebersihan ? 10 : 0,
      });
    }

    if (notes.trim()) {
      answersRecord.push({
        key: 'catatan_refleksi_ibadah',
        label: 'Catatan & Refleksi Ibadah',
        value: notes.trim(),
        score: 0,
      });
    }

    onSuccess(
      finalScore,
      {
        entryMode: isPastDay ? 'formulir_terlewat' : 'tepat_hari_fleksibel',
        religion: studentReligion,
        isHalangan,
        halangan: halanganItems,
        shalat: shalatChecked,
        puasaSunnah: bonusPuasaSunnah,
        bacaQuran: bonusBacaQuran,
        quranSurah,
        quranAyatCount,
        ibadahLainnya: bonusIbadahLainnya,
        ibadahLainnyaText,
        adiwiyataTempatIbadah: adiwiyataKebersihan,
        // Kristen
        ibadahGereja: kristenGereja,
        doaKegiatan: kristenDoaKegiatan,
        bacaAlkitab: kristenBacaAlkitab,
        // Hindu
        triSandhya: { pagi: hinduPagi, siang: hinduSiang, sore: hinduSore },
        bacaWeda: hinduBacaWeda,
        notes: notes.trim(),
        baseScore,
        bonusPoints,
        overflowBonus: breakdown.overflowBonus,
        score: finalScore,
        isMissed: isPastDay,
        journalDate: displayDate,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        answers: answersRecord,
      },
      false,
      isHalangan ? 'halangan' : ''
    );
  };

  return (
    <div className="modal-backdrop-blur fixed inset-0 w-screen h-screen z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#19ae5d] text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#19ae5d]">
                  Beribadah • {studentReligion} • Hal {currentPage} dari 2
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#19ae5d]" /> {displayDate}
                </span>
                {isPastDay && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Formulir Terlewat
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">
                {currentPage === 1 ? 'Ibadah Harian, Bonus & Adiwiyata' : 'Refleksi & Konfirmasi Jurnal'}
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
                  step === currentPage ? 'bg-[#19ae5d]' : step < currentPage ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-[#19ae5d] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            Nilai: {finalScore} / 100
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {currentPage === 1 && (
            <div className="space-y-4">
              {/* ISLAM SECTION */}
              {isIslam && (
                <>
                  {studentGender === 'P' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-bold text-rose-950">
                          Saya sedang berhalangan (Khusus Siswi)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isHalangan}
                        onChange={(e) => setIsHalangan(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {isHalangan ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          Aktivitas Pengganti Ibadah (Centang yang dilaksanakan):
                        </label>
                        <span className="text-xs font-black text-rose-600">
                          {baseScore} / 100
                        </span>
                      </div>
                      {[
                        { key: 'dzikirDoa', label: 'Berdzikir dan berdoa harian' },
                        { key: 'murajaahQuran', label: "Mendengar atau murottal Al-Qur'an" },
                        { key: 'berbuatBaik', label: 'Berbuat baik dan bersedekah' },
                        { key: 'kajianAgama', label: 'Belajar ilmu agama atau menyimak kajian' },
                        { key: 'kebersihanDiri', label: 'Menjaga kebersihan dan kesehatan diri' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            (halanganItems as any)[item.key]
                              ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-400 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={(halanganItems as any)[item.key]}
                              onChange={(e) =>
                                setHalanganItems({ ...halanganItems, [item.key]: e.target.checked })
                              }
                              className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800">{item.label}</span>
                          </div>
                          <span className="text-xs font-black text-rose-600">+20 pt</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          Centang Shalat Fardhu yang Sudah Dilaksanakan:
                        </label>
                        <span className="text-xs font-black text-[#19ae5d]">
                          {baseScore} / 100
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {prayerSchedules.map((p) => {
                          const isUnlocked = isPastDay || currentMinutes >= p.openMin;
                          const isChecked = Boolean((shalatChecked as any)[p.key]);

                          return (
                            <label
                              key={p.key}
                              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                                !isUnlocked
                                  ? 'bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed'
                                  : isChecked
                                  ? 'bg-emerald-50/90 border-[#19ae5d] ring-2 ring-[#19ae5d] cursor-pointer shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  disabled={!isUnlocked}
                                  checked={isChecked}
                                  onChange={(e) =>
                                    setShalatChecked({
                                      ...shalatChecked,
                                      [p.key]: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-[#19ae5d] rounded focus:ring-[#19ae5d] cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black text-slate-900 block">
                                    {p.label}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {isUnlocked ? (
                                      <span className="text-emerald-700 font-semibold">Telah masuk waktu</span>
                                    ) : (
                                      <span className="text-amber-800 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Terkunci (Dibuka {p.openStr} WIB)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                isChecked ? 'bg-[#19ae5d] text-white' : 'bg-slate-200/70 text-slate-700'
                              }`}>
                                +{p.score} pt
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BONUS IBADAH ISLAM (Halaman Pertama) */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/60 to-white border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Bonus Ibadah Harian (+10 Poin)
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Maks +10 Poin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Pilih salah satu atau semua ibadah bonus di bawah ini (nilai bonus tetap 10 poin):
                    </p>

                    <div className="space-y-2">
                      {/* 1. Puasa Sunnah */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={bonusPuasaSunnah}
                            onChange={(e) => setBonusPuasaSunnah(e.target.checked)}
                            className="w-4 h-4 text-[#19ae5d] rounded focus:ring-[#19ae5d]"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Puasa Sunnah</span>
                            <span className="text-[10px] text-slate-500">
                              Otomatis sinkron dengan formulir Makan Bergizi (Sedang Berpuasa)
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-[#19ae5d]">+10 pt</span>
                      </label>

                      {/* 2. Baca Qur'an */}
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={bonusBacaQuran}
                              onChange={(e) => setBonusBacaQuran(e.target.checked)}
                              className="w-4 h-4 text-[#19ae5d] rounded focus:ring-[#19ae5d]"
                            />
                            <span className="text-xs font-bold text-slate-900">
                              Membaca Al-Qur'an (Tadarrus / Tilawah)
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-[#19ae5d]">+10 pt</span>
                        </label>
                        {bonusBacaQuran && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nama Surah:</label>
                              <input
                                type="text"
                                value={quranSurah}
                                onChange={(e) => setQuranSurah(e.target.value)}
                                placeholder="Contoh: Al-Baqarah"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Jumlah Ayat / Halaman:</label>
                              <input
                                type="text"
                                value={quranAyatCount}
                                onChange={(e) => setQuranAyatCount(e.target.value)}
                                placeholder="Contoh: 10 ayat / 2 halaman"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Ibadah Lainnya */}
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={bonusIbadahLainnya}
                              onChange={(e) => setBonusIbadahLainnya(e.target.checked)}
                              className="w-4 h-4 text-[#19ae5d] rounded focus:ring-[#19ae5d]"
                            />
                            <span className="text-xs font-bold text-slate-900">
                              Ibadah Lainnya (Tahajjud, Rawatib, Zikir Petang)
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-[#19ae5d]">+10 pt</span>
                        </label>
                        {bonusIbadahLainnya && (
                          <input
                            type="text"
                            value={ibadahLainnyaText}
                            onChange={(e) => setIbadahLainnyaText(e.target.value)}
                            placeholder="Tuliskan jenis ibadah (contoh: Shalat Tahajud 2 rakaat dan zikir petang)"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* KRISTEN SECTION */}
              {isKristen && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Aktivitas Ibadah Murid Kristen / Katolik:
                    </label>
                    <span className="text-xs font-black text-[#1c5ddc]">
                      {baseScore} / 100
                    </span>
                  </div>

                  {/* 1. Ibadah ke Gereja (Sabtu / Minggu saja) */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      !isWeekend
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : kristenGereja
                        ? 'bg-blue-50 border-[#1c5ddc] ring-2 ring-[#1c5ddc] cursor-pointer shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={!isWeekend}
                        checked={kristenGereja}
                        onChange={(e) => setKristenGereja(e.target.checked)}
                        className="w-4 h-4 text-[#1c5ddc] rounded focus:ring-[#1c5ddc]"
                      />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          Ibadah ke Gereja (50 Poin)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isWeekend ? (
                            <span className="text-emerald-700 font-semibold">Tersedia hari ini (Sabtu/Minggu)</span>
                          ) : (
                            <span className="text-amber-800 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Hanya dibuka Sabtu / Minggu
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#1c5ddc]">+50 pt</span>
                  </label>

                  {/* 2. Membaca Doa sesudah atau sebelum kegiatan */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      kristenDoaKegiatan
                        ? 'bg-blue-50 border-[#1c5ddc] ring-2 ring-[#1c5ddc] shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={kristenDoaKegiatan}
                        onChange={(e) => setKristenDoaKegiatan(e.target.checked)}
                        className="w-4 h-4 text-[#1c5ddc] rounded focus:ring-[#1c5ddc]"
                      />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          Membaca Doa Sesudah atau Sebelum Kegiatan
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Doa syukur dan memohon bimbingan dalam beraktivitas
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#1c5ddc]">+25 pt</span>
                  </label>

                  {/* 3. Membaca Alkitab */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      kristenBacaAlkitab
                        ? 'bg-blue-50 border-[#1c5ddc] ring-2 ring-[#1c5ddc] shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={kristenBacaAlkitab}
                        onChange={(e) => setKristenBacaAlkitab(e.target.checked)}
                        className="w-4 h-4 text-[#1c5ddc] rounded focus:ring-[#1c5ddc]"
                      />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          Membaca Alkitab
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Merenungkan ayat suci dan firman Tuhan
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#1c5ddc]">+25 pt</span>
                  </label>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#1c5ddc] shrink-0 mt-0.5" />
                    <span>
                      <strong>Aturan Ibadah Gereja:</strong> Ibadah gereja hanya dapat diisi hari Sabtu atau Minggu. Setelah diisi, poin mingguan ditambahkan +50 poin setiap hari (Senin–Minggu) dan terkunci untuk pekan berjalan.
                    </span>
                  </div>
                </div>
              )}

              {/* HINDU SECTION */}
              {isHindu && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Pelaksanaan Tri Sandhya Harian:
                    </label>
                    <span className="text-xs font-black text-amber-700">
                      {baseScore} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {triSandhyaSchedules.map((s) => {
                      const isUnlocked = isPastDay || currentMinutes >= s.openMin;
                      const isChecked =
                        s.key === 'pagi' ? hinduPagi : s.key === 'siang' ? hinduSiang : hinduSore;

                      return (
                        <label
                          key={s.key}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                            !isUnlocked
                              ? 'bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed'
                              : isChecked
                              ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500 cursor-pointer shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled={!isUnlocked}
                              checked={isChecked}
                              onChange={(e) => {
                                if (s.key === 'pagi') setHinduPagi(e.target.checked);
                                else if (s.key === 'siang') setHinduSiang(e.target.checked);
                                else setHinduSore(e.target.checked);
                              }}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{s.label}</span>
                              <span className="text-[11px] text-slate-500">
                                {isUnlocked ? 'Waktu telah tiba' : `Terkunci (Dibuka pukul ${s.openStr} WIB)`}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-700">+{s.score} pt</span>
                        </label>
                      );
                    })}
                  </div>

                  <label className="flex items-center justify-between p-3 bg-amber-50/50 rounded-2xl border border-amber-200 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={hinduBacaWeda}
                        onChange={(e) => setHinduBacaWeda(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-900">
                        Membaca Kitab Suci Weda (+10 Poin Bonus)
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-700">+10 pt</span>
                  </label>
                </div>
              )}

              {/* ADIWIYATA SECTION (Halaman Pertama) */}
              {!isKristen && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Program Adiwiyata Mandiri 28
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      +10 Poin Bonus
                    </span>
                  </div>
                  <label className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adiwiyataKebersihan}
                      onChange={(e) => setAdiwiyataKebersihan(e.target.checked)}
                      className="w-4 h-4 text-[#19ae5d] rounded focus:ring-[#19ae5d] mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Menjaga Kebersihan Tempat Ibadah
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Merapikan sajadah/tempat ibadah, memilah sampah, dan menjaga kesucian serta kebersihan lingkungan ibadah.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Total Capaian Sesi */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Nilai Capaian Ibadah Hari Ini:
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {finalScore} / 100
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Dasar ({baseScore}) + Bonus ({bonusPoints})
                  </span>
                </div>
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Ringkasan Skor Ibadah:</span>
                  <span className="text-base font-black text-emerald-800">
                    {finalScore} / 100 Poin
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {breakdown.overflowBonus > 0 ? `+${breakdown.overflowBonus} Poin Hebat` : 'Lengkap'}
                </span>
              </div>

              {/* Kolom Refleksi / Doa / Catatan Ibadah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Doa / Refleksi Pribadi Murid Hari Ini (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan refleksi ketenangan hati, doa kebaikan, atau catatan ibadah hari ini..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#19ae5d]"
                />
              </div>

              {/* Card Komitmen Spiritual */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-200">Karakter Pelajar Pancasila</span>
                <h4 className="text-sm font-extrabold">Beriman, Bertakwa &amp; Berakhlak Mulia</h4>
                <p className="text-xs text-emerald-100 leading-relaxed pt-1">
                  Konsistensi ibadah membentuk integritas, kejujuran diri, serta kepedulian terhadap sesama warga sekolah.
                </p>
              </div>
            </div>
          )}

          {/* Rujukan Ilmiah Remang-remang di Bagian Paling Bawah */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5 leading-relaxed">
            <span className="font-semibold block text-slate-500">Rujukan untuk Kebiasaan Beribadah:</span>
            <p>
              Pusat Penguatan Karakter Kemendikbudristek RI (2024) &amp; Koenig, H. G. (2012). <em>Medicine, Religion, and Health</em>. Riset menunjukkan kedisiplinan beribadah dan refleksi spiritual harian meningkatkan ketahanan mental (<em>emotional resilience</em>), menurunkan tingkat stres murid, serta menumbuhkan kebiasaan hidup bersih ramah lingkungan.
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
                onClick={handleNextOrSubmit}
                className="px-4 py-2 bg-[#19ae5d] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                Lanjut <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowHonestyModal(true)}
                className="px-5 py-2 bg-[#19ae5d] hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Simpan Jurnal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pop up Semoga Khatam Ye! */}
      {quranPopup && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl border border-emerald-200 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#19ae5d] flex items-center justify-center mx-auto shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Alhamdulillah!
            </h3>
            <p className="text-sm font-bold text-emerald-800">
              “Semoga khatam, ye!”
            </p>
            <p className="text-xs text-slate-500">
              {quranSurah ? `Tadarrus Surah ${quranSurah} (${quranAyatCount || 'beberapa ayat'})` : 'Pahala tilawah Al-Qur\'an tercatat.'}
            </p>
            <button
              type="button"
              onClick={() => setQuranPopup(false)}
              className="w-full py-2.5 bg-[#19ae5d] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
            >
              Aamiin, Lanjutkan!
            </button>
          </div>
        </div>
      )}

      {/* Modal Pernyataan Kejujuran Murid */}
      {showHonestyModal && (
        <div className="honesty-backdrop-blur fixed inset-0 w-screen h-screen z-[100] bg-slate-950/75 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#19ae5d] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Pernyataan Kejujuran Murid
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Jurnal tanggal {displayDate} • Nilai Capaian: {finalScore} / 100
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium text-left">
              "Saya menyatakan dengan sejujur-jujurnya bahwa data pelaksanaan ibadah dan kepedulian tempat ibadah ini diisi sesuai keadaan sebenarnya di hadapan Tuhan Yang Maha Esa."
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHonestyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Kembali / Koreksi
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