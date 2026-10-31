/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Layers,
  Database,
  Quote,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  Sliders,
  Check,
  Clock,
  Heart,
  Activity,
  Utensils,
  GraduationCap,
  Moon,
  Sun,
  Lock,
  Eye,
  BookOpen,
  Sunrise,
  Dumbbell,
  Smile,
  Save,
} from 'lucide-react';
import {
  Student,
  Teacher,
  TeacherAssignmentType,
  AdminJournalEntry,
} from '../../types';
import { api } from '../../utils/api';
import { StudentReportModal } from '../common/StudentReportModal';
import { HabitAnswersModal } from '../common/HabitAnswersModal';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AdminDashboardProps {
  admin: Teacher;
  allStudents: Student[];
  onLogout: () => void;
  onRefreshStudents?: () => void;
}

type AdminControlTab =
  | 'overview'
  | 'period'
  | 'instruments'
  | 'students'
  | 'teachers'
  | 'classes_rombels'
  | 'journals'
  | 'admins'
  | 'announcements';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  allStudents,
  onLogout,
  onRefreshStudents,
}) => {
  const [activeTab, setActiveTab] = useState<AdminControlTab>('overview');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);
  const [inspectJournalAnswers, setInspectJournalAnswers] = useState<{
    studentId: string;
    studentName: string;
    habitCode: string;
    habitTitle: string;
    logDate: string;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // =========================================================================
  // G.1: OVERVIEW STATE
  // =========================================================================
  const [overviewData, setOverviewData] = useState<any>(null);
  const [serverTodayDate, setServerTodayDate] = useState<string>('');

  // =========================================================================
  // JADWAL PENGAMBILAN DATA (DATA COLLECTION PERIOD)
  // =========================================================================
  const [periodForm, setPeriodForm] = useState({
    start_date: '2026-10-15',
    end_date: '2026-11-15',
  });
  const [periodSaving, setPeriodSaving] = useState(false);

  // =========================================================================
  // G.0: MANAJEMEN AKUN ADMIN
  // =========================================================================
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState<{
    id?: string;
    nip: string;
    name: string;
    username: string;
    password?: string;
    is_active?: boolean;
  }>({
    id: '',
    nip: '',
    name: '',
    username: '',
    password: '123',
    is_active: true,
  });

  // =========================================================================
  // INSTRUMEN 7 KAIH (FULL GUI STATE & INTERACTIVE PREVIEW)
  // =========================================================================
  const [instruments, setInstruments] = useState<any[]>([]);
  const [guiHabitCode, setGuiHabitCode] = useState<string>('bangun');
  const [guiVariant, setGuiVariant] = useState<string>('islam');
  const [instrumentSaving, setInstrumentSaving] = useState(false);

  // Full GUI Configurations for all 7 Habits & Variants
  const [habitConfigs, setHabitConfigs] = useState<Record<string, {
    title: string;
    subtitle: string;
    category: string;
    base_points: number;
    max_daily_sessions: number;
    rubric: Array<{ id: string; label: string; score: number; tag: string }>;
  }>>({
    'bangun': {
      title: 'Bangun Pagi',
      subtitle: 'Pukul 04.00 – 06.40 WIB',
      category: 'Kedisiplinan & Waktu',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'bp-1', label: 'Waktu: 04.00 – 04.20 WIB (Awal Waktu)', score: 75, tag: 'Waktu' },
        { id: 'bp-2', label: 'Waktu: 04.21 – 04.40 WIB', score: 70, tag: 'Waktu' },
        { id: 'bp-3', label: 'Waktu: 04.41 – 05.00 WIB', score: 65, tag: 'Waktu' },
        { id: 'bp-4', label: 'Waktu: 05.01 – 06.20 WIB', score: 60, tag: 'Waktu' },
        { id: 'bp-5', label: 'Waktu: 06.21 – 06.40 WIB', score: 55, tag: 'Waktu' },
        { id: 'bp-6', label: 'Kondisi: Sangat Segar & Bugar (5 Bintang)', score: 25, tag: 'Kondisi' },
        { id: 'bp-7', label: 'Kondisi: Cukup Segar (4 Bintang)', score: 20, tag: 'Kondisi' },
        { id: 'bp-8', label: 'Kondisi: Kurang Segar / Mengantuk (3 Bintang)', score: 15, tag: 'Kondisi' },
      ],
    },
    'beribadah_islam': {
      title: 'Beribadah — Shalat 5 Waktu & Sunnah',
      subtitle: 'Subuh, Dzuhur, Ashar, Maghrib, Isya',
      category: 'Karakter Spiritual & Keagamaan',
      base_points: 100,
      max_daily_sessions: 5,
      rubric: [
        { id: 'sh-1', label: 'Shalat Subuh Tepat Waktu', score: 20, tag: 'Wajib' },
        { id: 'sh-2', label: 'Shalat Dzuhur Tepat Waktu', score: 20, tag: 'Wajib' },
        { id: 'sh-3', label: 'Shalat Ashar Tepat Waktu', score: 20, tag: 'Wajib' },
        { id: 'sh-4', label: 'Shalat Maghrib Tepat Waktu', score: 20, tag: 'Wajib' },
        { id: 'sh-5', label: 'Shalat Isya Tepat Waktu', score: 20, tag: 'Wajib' },
        { id: 'sh-6', label: 'Bonus Ibadah Sunnah (Dhuha / Rawatib / Tahajud)', score: 5, tag: 'Bonus Sunnah' },
        { id: 'sh-7', label: "Bonus Tadarus Al-Qur'an (Per Halaman)", score: 5, tag: 'Bonus Literasi' },
      ],
    },
    'beribadah_kristen': {
      title: 'Beribadah — Doa & Saat Teduh',
      subtitle: '5 Sesi Doa Harian & Renungan Alkitab',
      category: 'Karakter Spiritual & Keagamaan',
      base_points: 100,
      max_daily_sessions: 5,
      rubric: [
        { id: 'kr-1', label: 'Doa Pagi Bangun Tidur', score: 20, tag: 'Doa' },
        { id: 'kr-2', label: 'Membaca Alkitab & Saat Teduh', score: 20, tag: 'Firman' },
        { id: 'kr-3', label: 'Doa Saat Makan Siang / Pagi', score: 20, tag: 'Doa' },
        { id: 'kr-4', label: 'Doa Sebelum / Sesudah Belajar', score: 20, tag: 'Doa' },
        { id: 'kr-5', label: 'Doa Malam Sebelum Tidur', score: 20, tag: 'Doa' },
        { id: 'kr-6', label: 'Bonus Pendalaman Kitab Suci & Komitmen Moral', score: 5, tag: 'Bonus' },
      ],
    },
    'beribadah_hindu': {
      title: 'Beribadah — Puja Tri Sandhya',
      subtitle: 'Pagi (06.00), Siang (12.00), Sore (18.00 WIB)',
      category: 'Karakter Spiritual & Keagamaan',
      base_points: 100,
      max_daily_sessions: 3,
      rubric: [
        { id: 'hn-1', label: 'Tri Sandhya Pagi (Ideal 06.00 WIB)', score: 35, tag: 'Tri Sandhya' },
        { id: 'hn-2', label: 'Tri Sandhya Siang (Ideal 12.00 WIB)', score: 35, tag: 'Tri Sandhya' },
        { id: 'hn-3', label: 'Tri Sandhya Sore (Ideal 18.00 WIB)', score: 30, tag: 'Tri Sandhya' },
        { id: 'hn-4', label: 'Bonus Membaca Kitab Suci Weda / Sloka Gita', score: 5, tag: 'Bonus' },
      ],
    },
    'beribadah_halangan': {
      title: 'Beribadah — Khusus Berhalangan',
      subtitle: "5 Amalan Kebaikan & Udzur Syar'i (Tanpa Pengurangan Nilai)",
      category: 'Karakter Spiritual & Keagamaan',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'hl-1', label: 'Berdzikir dan Berdoa Memohon Kebaikan', score: 20, tag: 'Amalan' },
        { id: 'hl-2', label: "Mendengarkan atau Muraja'ah Ayat Al-Qur'an / Tausiyah", score: 20, tag: 'Amalan' },
        { id: 'hl-3', label: 'Berbuat Baik dan Bersedekah / Menolong Sesama', score: 20, tag: 'Amalan' },
        { id: 'hl-4', label: 'Belajar Ilmu Agama, Karakter, atau Adab Islami', score: 20, tag: 'Amalan' },
        { id: 'hl-5', label: 'Menjaga Kebersihan Diri dan Lingkungan Sekitar', score: 20, tag: 'Amalan' },
      ],
    },
    'makan_normal': {
      title: 'Makan Bergizi Seimbang (Pola Normal)',
      subtitle: '3 Sesi: Sarapan, Makan Siang, Makan Malam',
      category: 'Pola Hidup Sehat & Gizi',
      base_points: 100,
      max_daily_sessions: 3,
      rubric: [
        { id: 'mn-1', label: 'Waktu Makan Ideal Tepat Waktu', score: 15, tag: 'Waktu' },
        { id: 'mn-2', label: 'Piring Gizi: Karbohidrat Sehat', score: 17.5, tag: 'Piring Gizi' },
        { id: 'mn-3', label: 'Piring Gizi: Lauk Berprotein', score: 17.5, tag: 'Piring Gizi' },
        { id: 'mn-4', label: 'Piring Gizi: Sayur-mayur Berserat', score: 15, tag: 'Piring Gizi' },
        { id: 'mn-5', label: 'Piring Gizi: Buah-buahan Segar', score: 15, tag: 'Piring Gizi' },
        { id: 'mn-6', label: 'Minum Air Putih Cukup (>= 2 Gelas per Sesi)', score: 20, tag: 'Hidrasi' },
        { id: 'mn-7', label: 'Bonus Adiwiyata: Membawa Kotak Makan Sendiri', score: 5, tag: 'Adiwiyata' },
        { id: 'mn-8', label: 'Bonus Adiwiyata: Membawa Tumbler Air Minum Sendiri', score: 5, tag: 'Adiwiyata' },
      ],
    },
    'makan_puasa': {
      title: 'Makan Bergizi — Mode Puasa',
      subtitle: '2 Sesi: Sahur Sehat & Berbuka Puasa',
      category: 'Pola Hidup Sehat & Gizi',
      base_points: 100,
      max_daily_sessions: 2,
      rubric: [
        { id: 'mp-1', label: 'Sahur Tepat Waktu (03.30 – 10m sblm Imsak)', score: 20, tag: 'Waktu' },
        { id: 'mp-2', label: 'Porsi Sahur: Karbohidrat Kompleks & Protein', score: 25, tag: 'Gizi Sahur' },
        { id: 'mp-3', label: 'Hidrasi Sahur: Cukup Air Putih (>= 2 Gelas)', score: 15, tag: 'Hidrasi' },
        { id: 'mp-4', label: 'Berbuka Tepat Waktu saat Adzan Maghrib', score: 20, tag: 'Waktu' },
        { id: 'mp-5', label: 'Porsi Berbuka: Takjil Sehat, Sayur & Buah', score: 20, tag: 'Gizi Berbuka' },
        { id: 'mp-6', label: 'Bonus Adiwiyata: Menghindari Wadah Plastik Sekali Pakai', score: 5, tag: 'Adiwiyata' },
      ],
    },
    'berolahraga': {
      title: 'Berolahraga & Aktivitas Fisik',
      subtitle: 'Senam, Lari, Peregangan, Olahraga Permainan',
      category: 'Kesehatan & Kebugaran',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'ol-1', label: 'Aktivitas Fisik Mandiri / Stretching', score: 10, tag: 'Aktivitas' },
        { id: 'ol-2', label: 'Aktivitas Fisik Kelompok / Ekskul Olahraga', score: 10, tag: 'Aktivitas' },
        { id: 'ol-3', label: 'Jalan Kaki / Naik-Turun Tangga Sekolah', score: 10, tag: 'Aktivitas' },
        { id: 'ol-4', label: 'Durasi Olahraga > 30 Menit', score: 45, tag: 'Durasi' },
        { id: 'ol-5', label: 'Durasi Olahraga 15 – 30 Menit', score: 35, tag: 'Durasi' },
        { id: 'ol-6', label: 'Catatan Jurnal Reflektif (>= 15 Karakter)', score: 15, tag: 'Refleksi' },
        { id: 'ol-7', label: 'Bonus Adiwiyata: Bersepeda / Jalan Kaki ke Sekolah', score: 5, tag: 'Adiwiyata' },
      ],
    },
    'belajar': {
      title: 'Gemar Belajar Mandiri & Literasi',
      subtitle: 'Membaca Buku, Mengulang Pelajaran, Eksplorasi Sains',
      category: 'Akademik & Literasi',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'bl-1', label: 'Durasi Belajar Mandiri >= 60 Menit', score: 60, tag: 'Durasi' },
        { id: 'bl-2', label: 'Durasi Belajar Mandiri 30 – 59 Menit', score: 40, tag: 'Durasi' },
        { id: 'bl-3', label: 'Jumlah Topik / Mapel Dilatih (>= 2 Mapel)', score: 30, tag: 'Intensitas' },
        { id: 'bl-4', label: 'Ringkasan Catatan Materi Jelas & Reflektif', score: 10, tag: 'Kualitas' },
      ],
    },
    'bermasyarakat': {
      title: 'Bermasyarakat & Kepedulian Sosial',
      subtitle: 'Bakti Sosial, Membantu Orang Tua, Gotong Royong Lingkungan',
      category: 'Sosial & Budi Pekerti',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'bm-1', label: 'Membantu Pekerjaan Rumah Tangga Orang Tua', score: 25, tag: 'Keluarga' },
        { id: 'bm-2', label: 'Menerapkan 5S (Senyum, Salam, Sapa, Sopan, Santun)', score: 25, tag: 'Sekolah' },
        { id: 'bm-3', label: 'Aksi Peduli Lingkungan / Pilah Sampah Adiwiyata', score: 25, tag: 'Lingkungan' },
        { id: 'bm-4', label: 'Tolong Menolong Teman atau Warga Sekitar', score: 25, tag: 'Sosial' },
      ],
    },
    'tidur': {
      title: 'Tidur Cepat & Istirahat Cukup',
      subtitle: 'Tidur Sebelum Pukul 22.00 WIB untuk Pemulihan Optimal',
      category: 'Pola Hidup Sehat & Disiplin',
      base_points: 100,
      max_daily_sessions: 1,
      rubric: [
        { id: 'td-1', label: 'Tidur Tepat Waktu Sebelum 21.30 WIB', score: 80, tag: 'Waktu' },
        { id: 'td-2', label: 'Tidur Antara 21.31 – 22.15 WIB', score: 70, tag: 'Waktu' },
        { id: 'td-3', label: 'Tidur Antara 22.16 – 23.00 WIB', score: 55, tag: 'Waktu' },
        { id: 'td-4', label: 'Mematikan Gadget / Layar 15 Menit Sebelum Tidur', score: 10, tag: 'Kualitas' },
        { id: 'td-5', label: 'Mempersiapkan Perlengkapan Sekolah Esok Hari', score: 10, tag: 'Persiapan' },
      ],
    },
  });

  // Interactive Live Student Preview State (Dynamic Simulation)
  const [previewSelections, setPreviewSelections] = useState<Record<string, any>>({
    wakeTime: '04.10',
    wakeFreshness: 5,
    islamSubuh: true,
    islamDzuhur: true,
    islamAshar: true,
    islamMaghrib: true,
    islamIsya: true,
    islamSunnah: true,
    islamQuranPages: 2,
    kristenDoaBangun: true,
    kristenAlkitab: true,
    kristenDoaMakan: true,
    kristenDoaBelajar: true,
    kristenDoaTidur: true,
    hinduTriPagi: true,
    hinduTriSiang: true,
    hinduTriSore: true,
    hinduWeda: true,
    halanganDzikir: true,
    halanganMendengar: true,
    halanganKebaikan: true,
    halanganKajian: true,
    halanganKebersihan: true,
    makanKarbo: true,
    makanLauk: true,
    makanSayur: true,
    makanBuah: true,
    makanAir: 2,
    makanKotak: true,
    makanTumbler: true,
    olahragaAktivitas: 'Mandiri & Stretching',
    olahragaDurasi: '35',
    olahragaDeskripsi: 'Lari pagi mengelilingi lapangan SMAN 28 selama 35 menit.',
    olahragaAdiwiyata: true,
    belajarDurasi: '65',
    belajarTopikCount: 2,
    belajarCatatan: 'Membahas bab 4 kalkulus dan merangkum biologi sel.',
    masyarakatOrtu: true,
    masyarakat5S: true,
    masyarakatAdiwiyata: true,
    masyarakatTolong: true,
    tidurWaktu: '21.20',
    tidurLayar: true,
    tidurPersiapan: true,
  });

  // Helper to determine active key in habitConfigs
  const activeHabitKey =
    guiHabitCode === 'beribadah'
      ? `beribadah_${guiVariant || 'islam'}`
      : guiHabitCode === 'makan'
      ? `makan_${guiVariant || 'normal'}`
      : guiHabitCode;

  // Active configuration for GUI editor
  const currentConfig = habitConfigs[activeHabitKey] || habitConfigs['bangun'];

  // =========================================================================
  // G.2: MANAJEMEN MURID & CSV
  // =========================================================================
  const [adminStudents, setAdminStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<any>({
    id: '',
    nisn: '',
    name: '',
    password: '123',
    gender: 'L',
    religion: 'Islam',
    class_name: 'X-1',
    rombel_name: '',
    wali_name: '',
    angkatan: '2025/2026',
    status: 'ACTIVE',
    is_demo: 0,
  });

  // =========================================================================
  // G.3: MANAJEMEN GURU & ROLE
  // =========================================================================
  const [adminTeachers, setAdminTeachers] = useState<any[]>([]);
  const [teacherFilterRole, setTeacherFilterRole] = useState<string>('ALL');
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState<any>({
    id: '',
    nip: '',
    username: '',
    name: '',
    password: '123',
    subject: 'Pendidikan Karakter',
    is_walas: true,
    is_wali: false,
    is_tim_7_kaih: false,
    class_name: 'X-1',
    is_demo: 0,
  });

  // =========================================================================
  // G.4 & G.5: KELAS, GURU WALI (ROMBEL), & ANGKATAN
  // =========================================================================
  const [classesRombelsData, setClassesRombelsData] = useState<{
    classes: any[];
    rombels: any[];
  }>({ classes: [], rombels: [] });
  const [cohortsList, setCohortsList] = useState<any[]>([]);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [editingCohortName, setEditingCohortName] = useState<string>('');
  const [walasModalOpen, setWalasModalOpen] = useState(false);
  const [targetClassForWalas, setTargetClassForWalas] = useState<any | null>(null);
  const [selectedWalasTeacherId, setSelectedWalasTeacherId] = useState<string>('');
  const [selectedGuruWaliTeacherId, setSelectedGuruWaliTeacherId] = useState<string>('');
  const [newClassForm, setNewClassForm] = useState({ name: '', cohort_name: '2025/2026' });
  const [newRombelForm, setNewRombelForm] = useState({ name: '', wali_name: '', cohort_name: '2025/2026' });

  // =========================================================================
  // G.6: DATABASE JURNAL & AUDIT KOREKSI
  // =========================================================================
  const [journalsList, setJournalsList] = useState<AdminJournalEntry[]>([]);
  const [journalFilterDate, setJournalFilterDate] = useState<string>('');
  const [journalFilterHabit, setJournalFilterHabit] = useState<string>('');
  const [editingJournal, setEditingJournal] = useState<AdminJournalEntry | null>(null);
  const [newJournalScore, setNewJournalScore] = useState<number>(100);
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // =========================================================================
  // PENGUMUMAN & QUOTES
  // =========================================================================
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<{
    id: string;
    type: 'ANNOUNCEMENT' | 'QUOTE';
    title: string;
    content: string;
    author: string;
  }>({
    id: '',
    type: 'QUOTE',
    title: '',
    content: '',
    author: '',
  });

  // Load Main Data
  const loadControlPanelData = async () => {
    try {
      setLoading(true);
      const [ovData, stList, tchList, crData, pData, instData, annList, jRes, admList] = await Promise.all([
        api.getAdminOverview(),
        api.getStudents(),
        api.getTeachers(),
        api.getAdminClassesAndRombels(),
        api.getDataCollectionPeriod().catch(() => ({ startDate: '2026-10-15', endDate: '2026-11-15' })),
        api.getInstruments().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getAdminJournals({}),
        api.getAdminAccounts().catch(() => []),
      ]);

      setOverviewData(ovData);
      setAdminStudents(stList || []);
      setAdminTeachers(tchList || []);
      setClassesRombelsData(crData || { classes: [], rombels: [] });
      setCohortsList(crData?.cohorts || []);
      if (pData?.startDate && pData?.endDate) {
        setPeriodForm({ start_date: pData.startDate, end_date: pData.endDate });
      }
      setInstruments(instData || []);
      setAnnouncementsList(annList || []);
      if (jRes?.journals) setJournalsList(jRes.journals);
      setAdminsList(admList || []);
    } catch (e) {
      console.error('Failed to load admin control data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayDateInfo = async () => {
    try {
      const info = await api.getTodayInfo();
      setServerTodayDate(info.todayDate);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadControlPanelData();
    fetchTodayDateInfo();
  }, []);

  // Save Data Collection Period
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPeriodSaving(true);
      await api.saveDataCollectionPeriod(periodForm.start_date, periodForm.end_date);
      showToast('Jadwal pengambilan data berhasil diperbarui!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jadwal pengambilan data');
    } finally {
      setPeriodSaving(false);
    }
  };



  // =========================================================================
  // ADMIN ACCOUNT ACTIONS
  // =========================================================================
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.username.trim()) {
      alert('Nama lengkap dan username admin wajib diisi.');
      return;
    }
    try {
      await api.saveAdminAccount(adminForm);
      setAdminModalOpen(false);
      showToast('Data akun administrator berhasil disimpan!');
      const updated = await api.getAdminAccounts();
      setAdminsList(updated || []);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan akun admin');
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (username === 'admin') {
      alert('Akun Administrator Utama (admin) tidak dapat dihapus.');
      return;
    }
    if (!confirm(`Hapus akun admin '${username}' ini? Tindakan ini permanen.`)) return;
    try {
      setAdminsList((prev) => prev.filter((a) => a.id !== id && a.user_id !== id && a.username !== username));
      await api.deleteAdminAccount(id);
      showToast('Akun admin berhasil dihapus!');
      const updated = await api.getAdminAccounts();
      setAdminsList(updated || []);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin');
      const updated = await api.getAdminAccounts();
      setAdminsList(updated || []);
    }
  };

  // =========================================================================
  // GUI INSTRUMENT EDITOR ACTIONS
  // =========================================================================
  const handleSaveGuiInstrument = async () => {
    try {
      setInstrumentSaving(true);
      await api.saveInstrument({
        habit_code: activeHabitKey,
        habit_name: currentConfig.title,
        subtitle: currentConfig.subtitle,
        category: currentConfig.category,
        max_daily_sessions: currentConfig.max_daily_sessions,
        base_points: currentConfig.base_points,
        rubric_json: JSON.stringify(currentConfig.rubric),
      });
      showToast(`Instrumen ${currentConfig.title} berhasil disimpan ke database!`);
      const updated = await api.getInstruments();
      setInstruments(updated || []);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan instrumen');
    } finally {
      setInstrumentSaving(false);
    }
  };

  const handleAddRubricItem = () => {
    const newItem = {
      id: `${activeHabitKey}-${Date.now()}`,
      label: 'Kriteria / Opsi Pilihan Baru',
      score: 10,
      tag: 'Kriteria',
    };
    setHabitConfigs((prev) => ({
      ...prev,
      [activeHabitKey]: {
        ...prev[activeHabitKey],
        rubric: [...prev[activeHabitKey].rubric, newItem],
      },
    }));
  };

  const handleDeleteRubricItem = (itemId: string) => {
    setHabitConfigs((prev) => ({
      ...prev,
      [activeHabitKey]: {
        ...prev[activeHabitKey],
        rubric: prev[activeHabitKey].rubric.filter((r) => r.id !== itemId),
      },
    }));
  };

  const handleUpdateRubricItem = (itemId: string, field: 'label' | 'score' | 'tag', value: any) => {
    setHabitConfigs((prev) => ({
      ...prev,
      [activeHabitKey]: {
        ...prev[activeHabitKey],
        rubric: prev[activeHabitKey].rubric.map((r) =>
          r.id === itemId ? { ...r, [field]: value } : r
        ),
      },
    }));
  };

  const handleUpdateConfigField = (field: 'title' | 'subtitle' | 'category' | 'base_points' | 'max_daily_sessions', value: any) => {
    setHabitConfigs((prev) => ({
      ...prev,
      [activeHabitKey]: {
        ...prev[activeHabitKey],
        [field]: value,
      },
    }));
  };

  // Student Save & Delete
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveAdminStudent({
        ...studentForm,
        is_demo: 0,
        rombel_name: studentForm.wali_name || studentForm.rombel_name,
      });
      setStudentModalOpen(false);
      showToast('Data akun murid berhasil disimpan!');
      await loadControlPanelData();
      onRefreshStudents?.();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan murid');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Hapus akun murid ini secara permanen?')) return;
    try {
      setAdminStudents((prev) => prev.filter((s) => s.id !== id));
      await api.deleteAdminStudent(id);
      showToast('Akun murid berhasil dihapus');
      await loadControlPanelData();
      onRefreshStudents?.();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus murid');
      await loadControlPanelData();
    }
  };

  // Teacher Save & Delete
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roles: string[] = [];
      if (teacherForm.is_walas) roles.push('WALAS');
      if (teacherForm.is_wali) roles.push('WALI');
      if (teacherForm.is_tim_7_kaih) roles.push('TIM_7_KAIH');

      await api.saveAdminTeacher({
        ...teacherForm,
        username: teacherForm.username?.trim() || teacherForm.nip?.trim(),
        is_walas: teacherForm.is_walas ? 1 : 0,
        is_wali: teacherForm.is_wali ? 1 : 0,
        is_tim_7_kaih: teacherForm.is_tim_7_kaih ? 1 : 0,
        roles_csv: roles.join(','),
        assignment_type: roles[0] || 'WALAS',
        class_name: teacherForm.is_walas ? teacherForm.class_name : '',
        is_demo: 0,
      });
      setTeacherModalOpen(false);
      showToast('Data akun guru berhasil disimpan!');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan guru');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Hapus akun guru ini secara permanen?')) return;
    try {
      setAdminTeachers((prev) => prev.filter((t) => t.id !== id));
      await api.deleteAdminTeacher(id);
      showToast('Akun guru berhasil dihapus');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus guru');
      await loadControlPanelData();
    }
  };

  // Classes & Rombels Save & Delete
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.name.trim()) return;
    try {
      await api.saveAdminClass(newClassForm);
      setNewClassForm({ name: '', cohort_name: '2025/2026' });
      showToast('Kelas berhasil disimpan!');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kelas');
    }
  };

  const handleDeleteClass = async (id: string | number) => {
    if (!confirm('Hapus kelas ini? Murid di kelas ini perlu dipindahkan.')) return;
    try {
      setClassesRombelsData((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => String(c.id) !== String(id) && c.name !== String(id)),
      }));
      await api.deleteClass(id);
      showToast('Kelas berhasil dihapus');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kelas');
      await loadControlPanelData();
    }
  };

  const handleSaveRombel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRombelForm.name.trim() || !newRombelForm.wali_name.trim()) return;
    try {
      await api.saveAdminRombel(newRombelForm);
      setNewRombelForm({ name: '', wali_name: '', cohort_name: '2025/2026' });
      showToast('Guru Wali berhasil disimpan!');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan rombel/guru wali');
    }
  };

  const handleDeleteRombel = async (id: string | number) => {
    if (!confirm('Hapus penugasan Guru Wali ini? Murid yang dibimbing akan keluar dari status anak wali.')) return;
    try {
      setClassesRombelsData((prev) => ({
        ...prev,
        rombels: prev.rombels.filter((r) => String(r.id) !== String(id) && r.name !== String(id)),
      }));
      await api.deleteRombel(id);
      showToast('Guru Wali berhasil dihapus');
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus rombel');
      await loadControlPanelData();
    }
  };

  const handleSaveCohortLabel = async (cohortId: string) => {
    if (!editingCohortName.trim()) return;
    try {
      await api.updateCohort(cohortId, editingCohortName.trim());
      showToast('Label angkatan berhasil diperbarui!');
      setEditingCohortId(null);
      await loadControlPanelData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah label angkatan');
    }
  };

  // Correct Journal
  const handleCorrectJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal || !correctionReason.trim()) return;
    try {
      await api.correctAdminJournal({
        log_id: editingJournal.id,
        new_score: Number(newJournalScore),
        reason: correctionReason.trim(),
        corrected_by: `${admin.name} (Admin)`,
      });
      setEditingJournal(null);
      setCorrectionReason('');
      showToast('Koreksi jurnal berhasil disimpan dan diaudit!');
      await loadControlPanelData();
      onRefreshStudents?.();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan koreksi jurnal');
    }
  };

  // Announcements Save & Delete
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveAnnouncement(announcementForm);
      setAnnouncementModalOpen(false);
      showToast('Pengumuman/Quotes berhasil disimpan!');
      const updated = await api.getAnnouncements();
      setAnnouncementsList(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengumuman');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await api.deleteAnnouncement(id);
      showToast('Pengumuman berhasil dihapus');
      const updated = await api.getAnnouncements();
      setAnnouncementsList(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman');
    }
  };

  // Calculate duration between start and end date
  const periodDurationDays = Math.max(
    1,
    Math.round(
      (new Date(`${periodForm.end_date}T12:00:00Z`).getTime() -
        new Date(`${periodForm.start_date}T12:00:00Z`).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const tabs = [
    { id: 'overview' as const, label: 'Ringkasan Sistem', icon: ShieldCheck },
    { id: 'period' as const, label: 'Jadwal Pengambilan Data', icon: Calendar },
    { id: 'instruments' as const, label: 'Instrumen 7 KAIH', icon: Sliders },
    { id: 'students' as const, label: 'Data Murid', icon: Users },
    { id: 'teachers' as const, label: 'Data Guru & Penugasan', icon: UserCheck },
    { id: 'classes_rombels' as const, label: 'Klasifikasi Murid', icon: Layers },
    { id: 'journals' as const, label: 'Database & Koreksi Jurnal', icon: Database },
    { id: 'admins' as const, label: 'Kelola Akun Admin', icon: ShieldCheck },
    { id: 'announcements' as const, label: 'Pengumuman & Quotes', icon: Quote },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ===================================================================
            LEFT SIDEBAR NAVBAR
        =================================================================== */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs">
                28
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
                  PANEL PENGELOLA ADMIN
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  SMAN 28 Jakarta
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-xs">
                ADM
              </div>
              <div className="overflow-hidden">
                <span className="font-extrabold text-xs text-slate-900 block truncate">
                  {admin.name}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Otoritas: Administrator Sistem
                </span>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
              Menu Otoritas Admin
            </span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sesi Admin</span>
            </button>
          </div>
        </aside>

        {/* ===================================================================
            RIGHT WORKSPACE CONTENT
        =================================================================== */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto max-w-6xl">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Ringkasan &amp; Status Operasional Sistem
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemantauan real-time akun, kebiasaan, partisipasi, dan integritas 7 KAIH SMAN 28 Jakarta.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-xs font-bold text-slate-500 block">Total Murid Terdaftar</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-1">
                    {overviewData?.totalStudents ?? allStudents.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Terdaftar Aktif di SMAN 28 Jakarta
                  </span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <span className="text-xs font-bold text-slate-500 block">Total Dewan Guru</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-1">
                    {adminTeachers.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Walas, Guru Wali, Tim 7 KAIH</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
                  <span className="text-xs font-bold text-emerald-800 block">Rata-rata Sekolah</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-1">
                    {overviewData?.schoolAverage ?? 86.4}
                  </span>
                  <span className="text-[10px] text-emerald-700">Skor Karakter All-Time</span>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
                  <span className="text-xs font-bold text-blue-800 block">Partisipasi Hari Ini</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-700 block mt-1">
                    {overviewData?.participatingToday ?? 0}
                  </span>
                  <span className="text-[10px] text-blue-700">Murid aktif mengisi jurnal</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Panduan Pengelolaan Cepat (Quick Access)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div
                    onClick={() => setActiveTab('period')}
                    className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all"
                  >
                    <Calendar className="w-5 h-5 text-amber-700 mb-2" />
                    <span className="font-extrabold text-slate-900 block">Jadwal Pengambilan Data</span>
                    <span className="text-[11px] text-slate-600 mt-1 block">
                      Atur tanggal mulai dan berakhirnya pengisian jurnal murid.
                    </span>
                  </div>
                  <div
                    onClick={() => setActiveTab('instruments')}
                    className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 hover:border-blue-400 cursor-pointer transition-all"
                  >
                    <Sliders className="w-5 h-5 text-blue-700 mb-2" />
                    <span className="font-extrabold text-slate-900 block">Instrumen 7 KAIH</span>
                    <span className="text-[11px] text-slate-600 mt-1 block">
                      Kelola pertanyaan, opsi jawaban, dan bobot poin tiap kebiasaan.
                    </span>
                  </div>
                  <div
                    onClick={() => setActiveTab('admins')}
                    className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 hover:border-indigo-400 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-700 mb-2" />
                    <span className="font-extrabold text-slate-900 block">Kelola Akun Admin</span>
                    <span className="text-[11px] text-slate-600 mt-1 block">
                      Tambah akun admin baru, ubah hak akses, dan hapus akun pengelola.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JADWAL PENGAMBILAN DATA */}
          {activeTab === 'period' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Pengaturan Jadwal Pengambilan Data 7 KAIH
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan rentang tanggal resmi pengisian instrumen 7 Kebiasaan Anak Indonesia Hebat.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
                <form onSubmit={handleSavePeriod} className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Mulai Pengambilan Data:
                      </label>
                      <input
                        type="date"
                        value={periodForm.start_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Selesai Pengambilan Data:
                      </label>
                      <input
                        type="date"
                        value={periodForm.end_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Ringkasan Periode Aktif:</span>
                    </div>
                    <p className="text-[11px] text-blue-900">
                      Total Durasi: <strong>{periodDurationDays} Hari</strong> ({periodForm.start_date} s.d. {periodForm.end_date}).
                    </p>
                    <p className="text-[11px] text-blue-800">
                      • Seluruh tanggal dalam rentang ini akan muncul di kalender <strong>Riwayat Pengisian</strong> murid.
                    </p>
                    <p className="text-[11px] text-blue-800">
                      • Bila murid membuka aplikasi di luar tanggal periode ini, beranda tidak akan meminta pengisian lagi dan notifikasi pengingat otomatis dinonaktifkan.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={periodSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {periodSaving ? 'Menyimpan...' : 'Simpan Jadwal Pengambilan Data'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: INSTRUMEN 7 KAIH (FULL GUI EDITOR & LIVE INTERACTIVE PREVIEW) */}
          {activeTab === 'instruments' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Editor Instrumen Full GUI &amp; Preview
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Kelola Instrumen &amp; Rubrik Penilaian 7 KAIH
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi parameter, opsi pilihan, dan bobot skor 7 Kebiasaan secara visual tanpa JSON mentah. Lengkap dengan live simulator murid sebelum disimpan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveGuiInstrument}
                  disabled={instrumentSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{instrumentSaving ? 'Menyimpan...' : 'Simpan Instrumen ke Database'}</span>
                </button>
              </div>

              {/* 7 Habits Navigation Ribbon */}
              <div className="bg-white rounded-3xl p-2.5 border border-slate-200 shadow-xs">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'bangun', label: '1. Bangun Pagi', icon: Sunrise },
                    { id: 'beribadah', label: '2. Beribadah', icon: Heart },
                    { id: 'berolahraga', label: '3. Berolahraga', icon: Dumbbell },
                    { id: 'makan', label: '4. Makan Bergizi', icon: Utensils },
                    { id: 'belajar', label: '5. Gemar Belajar', icon: BookOpen },
                    { id: 'bermasyarakat', label: '6. Bermasyarakat', icon: Users },
                    { id: 'tidur', label: '7. Tidur Cepat', icon: Moon },
                  ].map((h) => {
                    const Icon = h.icon;
                    const isSelected = guiHabitCode === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setGuiHabitCode(h.id);
                          if (h.id === 'beribadah') setGuiVariant('islam');
                          if (h.id === 'makan') setGuiVariant('normal');
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{h.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Variant Selector for Beribadah (3 Agama + 1 Berhalangan) */}
                {guiHabitCode === 'beribadah' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                      Pilih Varian Ibadah:
                    </span>
                    {[
                      { id: 'islam', label: '🕌 Islam (5 Waktu & Sunnah)' },
                      { id: 'kristen', label: '⛪ Kristen / Katolik (Doa & Alkitab)' },
                      { id: 'hindu', label: '🕉️ Hindu (Tri Sandhya & Weda)' },
                      { id: 'halangan', label: '🌸 Khusus Berhalangan (Udzur Syar\'i)' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setGuiVariant(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          guiVariant === v.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-Variant Selector for Makan Bergizi (Normal 3 Sesi vs Puasa 2 Sesi) */}
                {guiHabitCode === 'makan' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                      Pola Makan Bergizi:
                    </span>
                    {[
                      { id: 'normal', label: '🍽️ Pola Normal (3 Sesi: Pagi, Siang, Malam)' },
                      { id: 'puasa', label: '🌙 Mode Puasa (2 Sesi: Sahur & Berbuka)' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setGuiVariant(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          guiVariant === v.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Two-Column Layout: Left = Full GUI Editor, Right = Live Student Interactive Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: FULL GUI BUILDER */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Meta Settings Card */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Konfigurasi Dasar Instrumen
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Identitas umum kebiasaan yang dikelola.
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        Kode: {activeHabitKey}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Kebiasaan</label>
                        <input
                          type="text"
                          value={currentConfig.title}
                          onChange={(e) => handleUpdateConfigField('title', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Subjudul / Rentang Waktu</label>
                        <input
                          type="text"
                          value={currentConfig.subtitle}
                          onChange={(e) => handleUpdateConfigField('subtitle', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kategori Karakter</label>
                        <input
                          type="text"
                          value={currentConfig.category}
                          onChange={(e) => handleUpdateConfigField('category', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Maks Poin</label>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={currentConfig.base_points}
                            onChange={(e) => handleUpdateConfigField('base_points', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-blue-700"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Sesi Harian</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={currentConfig.max_daily_sessions}
                            onChange={(e) => handleUpdateConfigField('max_daily_sessions', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rubric Items GUI Builder */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Rubrik Opsi Jawaban &amp; Bobot Skor ({currentConfig.rubric.length} Opsi)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Edit teks pertanyaan/opsi, tag, dan bobot poin secara visual.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddRubricItem}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Opsi</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {currentConfig.rubric.map((r, idx) => (
                        <div
                          key={r.id || idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors hover:border-slate-300"
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 w-full sm:w-auto">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Teks Opsi / Kriteria
                            </label>
                            <input
                              type="text"
                              value={r.label}
                              onChange={(e) => handleUpdateRubricItem(r.id, 'label', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="w-24 shrink-0">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Tag / Kategori
                            </label>
                            <input
                              type="text"
                              value={r.tag}
                              onChange={(e) => handleUpdateRubricItem(r.id, 'tag', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
                            />
                          </div>
                          <div className="w-20 shrink-0">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Skor Poin
                            </label>
                            <input
                              type="number"
                              value={r.score}
                              onChange={(e) => handleUpdateRubricItem(r.id, 'score', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-black text-emerald-700 text-center focus:outline-none"
                            />
                          </div>
                          <div className="self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteRubricItem(r.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Opsi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        Total {currentConfig.rubric.length} kriteria terdaftar untuk <strong>{currentConfig.title}</strong>.
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveGuiInstrument}
                        disabled={instrumentSaving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: LIVE INTERACTIVE STUDENT PREVIEW */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black tracking-wide uppercase text-slate-200">
                          Live Preview Tampilan Murid
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Interaktif
                      </span>
                    </div>

                    {/* Simulated Student Habit Card */}
                    <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-sm space-y-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {currentConfig.category}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                            {currentConfig.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">{currentConfig.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                          Maks {currentConfig.base_points} pt
                        </span>
                      </div>

                      {/* Interactive Simulation Form based on Habit */}
                      <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                        {/* 1. BANGUN PAGI PREVIEW */}
                        {guiHabitCode === 'bangun' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                Jam Berapa Kamu Bangun Pagi Hari Ini?
                              </label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['04.10', '04.30', '04.50', '05.30'].map((timeStr) => (
                                  <button
                                    key={timeStr}
                                    type="button"
                                    onClick={() => setPreviewSelections({ ...previewSelections, wakeTime: timeStr })}
                                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                                      previewSelections.wakeTime === timeStr
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    Pukul {timeStr} WIB
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Kondisi Fisik Saat Bangun:
                              </label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setPreviewSelections({ ...previewSelections, wakeFreshness: star })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                                      previewSelections.wakeFreshness >= star
                                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    ★ {star}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. BERIBADAH PREVIEW */}
                        {guiHabitCode === 'beribadah' && (
                          <div className="space-y-2">
                            {guiVariant === 'islam' && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Checklist Shalat Wajib 5 Waktu:
                                </span>
                                {[
                                  { key: 'islamSubuh', label: 'Shalat Subuh' },
                                  { key: 'islamDzuhur', label: 'Shalat Dzuhur' },
                                  { key: 'islamAshar', label: 'Shalat Ashar' },
                                  { key: 'islamMaghrib', label: 'Shalat Maghrib' },
                                  { key: 'islamIsya', label: 'Shalat Isya' },
                                ].map((s) => (
                                  <label key={s.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer font-bold text-[11px]">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewSelections[s.key])}
                                      onChange={(e) => setPreviewSelections({ ...previewSelections, [s.key]: e.target.checked })}
                                      className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span>{s.label}</span>
                                    <span className="ml-auto text-emerald-600 font-extrabold">+20 pt</span>
                                  </label>
                                ))}
                                <label className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 cursor-pointer font-bold text-[11px] text-emerald-900 mt-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(previewSelections.islamSunnah)}
                                    onChange={(e) => setPreviewSelections({ ...previewSelections, islamSunnah: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                  />
                                  <span>Bonus Ibadah Sunnah (Dhuha / Rawatib)</span>
                                  <span className="ml-auto text-emerald-700 font-extrabold">+5 pt</span>
                                </label>
                              </div>
                            )}

                            {guiVariant === 'kristen' && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Checklist Ibadah &amp; Doa Harian:
                                </span>
                                {[
                                  { key: 'kristenDoaBangun', label: 'Doa Pagi Bangun Tidur' },
                                  { key: 'kristenAlkitab', label: 'Membaca Alkitab & Saat Teduh' },
                                  { key: 'kristenDoaMakan', label: 'Doa Saat Makan' },
                                  { key: 'kristenDoaBelajar', label: 'Doa Sebelum Belajar' },
                                  { key: 'kristenDoaTidur', label: 'Doa Malam Sebelum Tidur' },
                                ].map((s) => (
                                  <label key={s.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer font-bold text-[11px]">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewSelections[s.key])}
                                      onChange={(e) => setPreviewSelections({ ...previewSelections, [s.key]: e.target.checked })}
                                      className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span>{s.label}</span>
                                    <span className="ml-auto text-purple-700 font-extrabold">+20 pt</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {guiVariant === 'hindu' && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Checklist Doa Tri Sandhya:
                                </span>
                                {[
                                  { key: 'hinduTriPagi', label: 'Tri Sandhya Pagi (06.00 WIB)', pt: 35 },
                                  { key: 'hinduTriSiang', label: 'Tri Sandhya Siang (12.00 WIB)', pt: 35 },
                                  { key: 'hinduTriSore', label: 'Tri Sandhya Sore (18.00 WIB)', pt: 30 },
                                ].map((s) => (
                                  <label key={s.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer font-bold text-[11px]">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewSelections[s.key])}
                                      onChange={(e) => setPreviewSelections({ ...previewSelections, [s.key]: e.target.checked })}
                                      className="w-4 h-4 text-amber-600 rounded"
                                    />
                                    <span>{s.label}</span>
                                    <span className="ml-auto text-amber-700 font-extrabold">+{s.pt} pt</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {guiVariant === 'halangan' && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                                  Amalan Pengganti Udzur Syar'i:
                                </span>
                                {[
                                  { key: 'halanganDzikir', label: 'Berdzikir dan Berdoa' },
                                  { key: 'halanganMendengar', label: "Mendengar / Muraja'ah Al-Qur'an" },
                                  { key: 'halanganKebaikan', label: 'Berbuat Baik & Sedekah' },
                                  { key: 'halanganKajian', label: 'Belajar Ilmu Agama / Adab' },
                                  { key: 'halanganKebersihan', label: 'Menjaga Kebersihan & Kebugaran' },
                                ].map((s) => (
                                  <label key={s.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-50/60 border border-rose-100 cursor-pointer font-bold text-[11px] text-rose-900">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewSelections[s.key])}
                                      onChange={(e) => setPreviewSelections({ ...previewSelections, [s.key]: e.target.checked })}
                                      className="w-4 h-4 text-rose-600 rounded"
                                    />
                                    <span>{s.label}</span>
                                    <span className="ml-auto text-rose-700 font-extrabold">+20 pt</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. MAKAN BERGIZI PREVIEW */}
                        {guiHabitCode === 'makan' && (
                          <div className="space-y-2.5">
                            <div className="p-2 bg-slate-50 rounded-xl space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Komposisi Piring Gizi Seimbang:
                              </span>
                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                {[
                                  { key: 'makanKarbo', label: 'Karbohidrat Sehat', score: 17.5 },
                                  { key: 'makanLauk', label: 'Lauk Berprotein', score: 17.5 },
                                  { key: 'makanSayur', label: 'Sayuran Hijau', score: 15 },
                                  { key: 'makanBuah', label: 'Buah Segar', score: 15 },
                                ].map((item) => (
                                  <label key={item.key} className="flex items-center gap-1.5 font-bold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewSelections[item.key])}
                                      onChange={(e) => setPreviewSelections({ ...previewSelections, [item.key]: e.target.checked })}
                                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <label className="flex-1 flex items-center gap-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewSelections.makanKotak)}
                                  onChange={(e) => setPreviewSelections({ ...previewSelections, makanKotak: e.target.checked })}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded"
                                />
                                <span>Kotak Makan Sendiri (+5)</span>
                              </label>
                              <label className="flex-1 flex items-center gap-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewSelections.makanTumbler)}
                                  onChange={(e) => setPreviewSelections({ ...previewSelections, makanTumbler: e.target.checked })}
                                  className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span>Tumbler Air Sendiri (+5)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* 4. BEROLAHRAGA PREVIEW */}
                        {guiHabitCode === 'berolahraga' && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Durasi Olahraga:</label>
                              <div className="grid grid-cols-3 gap-1">
                                {['15', '30', '45'].map((dur) => (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() => setPreviewSelections({ ...previewSelections, olahragaDurasi: dur })}
                                    className={`py-1 rounded-lg text-[11px] font-bold border text-center cursor-pointer ${
                                      previewSelections.olahragaDurasi === dur
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {dur} Menit
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(previewSelections.olahragaAdiwiyata)}
                                onChange={(e) => setPreviewSelections({ ...previewSelections, olahragaAdiwiyata: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded"
                              />
                              <span>Bonus Adiwiyata: Bersepeda/Jalan Kaki (+5 pt)</span>
                            </label>
                          </div>
                        )}

                        {/* 5. GEMAR BELAJAR PREVIEW */}
                        {guiHabitCode === 'belajar' && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Durasi Belajar Mandiri:</label>
                              <div className="grid grid-cols-3 gap-1">
                                {['30', '60', '90'].map((dur) => (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() => setPreviewSelections({ ...previewSelections, belajarDurasi: dur })}
                                    className={`py-1 rounded-lg text-[11px] font-bold border text-center cursor-pointer ${
                                      previewSelections.belajarDurasi === dur
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {dur} Menit
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Hasil Belajar:</label>
                              <input
                                type="text"
                                value={previewSelections.belajarCatatan}
                                onChange={(e) => setPreviewSelections({ ...previewSelections, belajarCatatan: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* 6. BERMASYARAKAT PREVIEW */}
                        {guiHabitCode === 'bermasyarakat' && (
                          <div className="space-y-1.5">
                            {[
                              { key: 'masyarakatOrtu', label: 'Membantu Pekerjaan Rumah Tangga' },
                              { key: 'masyarakat5S', label: 'Menerapkan 5S di Lingkungan' },
                              { key: 'masyarakatAdiwiyata', label: 'Aksi Pilah Sampah / Kerja Bakti' },
                              { key: 'masyarakatTolong', label: 'Tolong Menolong Teman / Sesama' },
                            ].map((m) => (
                              <label key={m.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer font-bold text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewSelections[m.key])}
                                  onChange={(e) => setPreviewSelections({ ...previewSelections, [m.key]: e.target.checked })}
                                  className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <span>{m.label}</span>
                                <span className="ml-auto text-emerald-700 font-extrabold">+25 pt</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* 7. TIDUR CEPAT PREVIEW */}
                        {guiHabitCode === 'tidur' && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Jam Berapa Kamu Mulai Tidur?</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['21.15', '21.45', '22.15', '22.45'].map((timeStr) => (
                                  <button
                                    key={timeStr}
                                    type="button"
                                    onClick={() => setPreviewSelections({ ...previewSelections, tidurWaktu: timeStr })}
                                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                                      previewSelections.tidurWaktu === timeStr
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    Pukul {timeStr} WIB
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewSelections.tidurLayar)}
                                  onChange={(e) => setPreviewSelections({ ...previewSelections, tidurLayar: e.target.checked })}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                                />
                                <span>Matikan Gadget 15m Sebelum Tidur (+10 pt)</span>
                              </label>
                              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewSelections.tidurPersiapan)}
                                  onChange={(e) => setPreviewSelections({ ...previewSelections, tidurPersiapan: e.target.checked })}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                                />
                                <span>Siapkan Seragam &amp; Buku Esok Hari (+10 pt)</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Calculated Score Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Simulasi Skor Murid:
                          </span>
                          <span className="text-xl font-black text-emerald-700">
                            100 / 100 pt
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Status: Sempurna</span>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Tip */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-slate-300 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pratinjau Murid Otomatis:</span>
                      </div>
                      <p>
                        Setiap perubahan pada nama, opsi jawaban, dan skor di panel sebelah kiri langsung tercermin pada formulir interaktif di atas sehingga Anda dapat memverifikasi pengalaman murid sebelum menyimpannya ke database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA MURID (DROPDOWNS FOR KELAS & WALI, DEMO CHECKBOX, CRUD) */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Data Akun Murid (Total: {adminStudents.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Input, edit, dan hapus akun murid. Pilihan kelas dan guru wali menggunakan dropdown data master.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStudentForm({
                      id: '',
                      nisn: '',
                      name: '',
                      password: '123',
                      gender: 'L',
                      religion: 'Islam',
                      class_name: classesRombelsData.classes[0]?.name || 'X-1',
                      rombel_name: classesRombelsData.rombels[0]?.name || 'Rombel A',
                      wali_name: classesRombelsData.rombels[0]?.wali_name || '',
                      angkatan: 'XI',
                      status: 'ACTIVE',
                      is_demo: 0,
                    });
                    setStudentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Murid Baru</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIS murid..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold focus:outline-none"
                  />
                </div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classesRombelsData.classes.map((c) => (
                    <option key={c.id || c.name} value={c.name}>Kelas {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Nama Murid</th>
                      <th className="py-3 px-4">Kelas &amp; Angkatan</th>
                      <th className="py-3 px-4">Guru Wali</th>
                      <th className="py-3 px-4 text-center">Agama</th>
                      <th className="py-3 px-4 text-center">Status Akun</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminStudents
                      .filter((s) => {
                        if (studentSearch) {
                          const q = studentSearch.toLowerCase();
                          if (!s.name.toLowerCase().includes(q) && !s.nisn.includes(q)) return false;
                        }
                        if (filterClass !== 'ALL' && s.class_name !== filterClass) return false;
                        return true;
                      })
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{s.name}</div>
                            <span className="text-[10px] text-slate-400 font-normal">NIS: {s.nisn}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            <div>Kelas {s.class_name}</div>
                            <span className="text-[10px] text-blue-600 font-extrabold">Angkatan {s.angkatan || 'XI'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{s.wali_name || s.rombel_name || '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-700 font-medium">{s.religion || 'Islam'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {s.account_status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setStudentForm({
                                    id: s.id,
                                    nisn: s.nisn,
                                    name: s.name,
                                    password: s.password || '123',
                                    gender: s.gender || 'L',
                                    religion: s.religion || 'Islam',
                                    class_name: s.class_name,
                                    rombel_name: s.rombel_name,
                                    wali_name: s.wali_name || s.rombel_name,
                                    angkatan: s.angkatan || 'XI',
                                    status: s.account_status || 'ACTIVE',
                                    is_demo: s.is_demo ? 1 : 0,
                                  });
                                  setStudentModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                title="Edit Murid"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                                title="Hapus Murid"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Student Create / Edit Modal */}
              {studentModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {studentForm.id ? 'Edit Data Murid' : 'Tambah Murid Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setStudentModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">NIS (Wajib)</label>
                          <input
                            type="text"
                            value={studentForm.nisn}
                            onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Password Login (Dapat Dilihat)</label>
                          <input
                            type="text"
                            value={studentForm.password}
                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Murid</label>
                        <input
                          type="text"
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                          <select
                            value={studentForm.gender}
                            onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Agama</label>
                          <select
                            value={studentForm.religion}
                            onChange={(e) => setStudentForm({ ...studentForm, religion: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          >
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                          </select>
                        </div>
                      </div>

                      {/* Dropdowns for Kelas, Angkatan, & Guru Wali */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Pilih Kelas</label>
                          <select
                            value={studentForm.class_name}
                            onChange={(e) => setStudentForm({ ...studentForm, class_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          >
                            {classesRombelsData.classes.map((c) => (
                              <option key={c.id || c.name} value={c.name}>Kelas {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Angkatan</label>
                          <select
                            value={studentForm.angkatan || 'XI'}
                            onChange={(e) => setStudentForm({ ...studentForm, angkatan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          >
                            <option value="X">Angkatan X (Kelas 10)</option>
                            <option value="XI">Angkatan XI (Kelas 11)</option>
                            <option value="XII">Angkatan XII (Kelas 12)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Guru Wali</label>
                          <select
                            value={studentForm.wali_name || studentForm.rombel_name}
                            onChange={(e) =>
                              setStudentForm({
                                ...studentForm,
                                wali_name: e.target.value,
                                rombel_name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          >
                            <option value="">-- Pilih Guru Wali --</option>
                            {classesRombelsData.rombels.map((r) => (
                              <option key={r.id || r.name} value={r.wali_name || r.name}>
                                {r.wali_name || r.name}
                              </option>
                            ))}
                            {adminTeachers
                              .filter((t) => t.is_wali || t.roles_csv?.includes('WALI'))
                              .map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>



                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                        >
                          Simpan Data Murid
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATA GURU & ROLE CHECKBOXES */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Data Dewan Guru &amp; Penugasan (Total: {adminTeachers.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Penugasan guru berbasis checkbox wewenang ganda (Walas, Guru Wali, Tim 7 KAIH).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherForm({
                      id: '',
                      nip: '',
                      name: '',
                      password: '123',
                      subject: 'Pendidikan Karakter',
                      is_walas: true,
                      is_wali: false,
                      is_tim_7_kaih: false,
                      class_name: classesRombelsData.classes[0]?.name || 'X-1',
                      is_demo: 0,
                    });
                    setTeacherModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Guru Baru</span>
                </button>
              </div>

              {/* Teachers Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Nama Guru</th>
                      <th className="py-3 px-4">Username Login</th>
                      <th className="py-3 px-4">Wewenang / Penugasan</th>
                      <th className="py-3 px-4">Kelas Binaan Walas</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminTeachers.map((t) => {
                      const tWalas = Boolean(t.is_walas || t.roles_csv?.includes('WALAS') || t.assignment_type === 'WALAS');
                      const tWali = Boolean(t.is_wali || t.roles_csv?.includes('WALI') || t.assignment_type === 'WALI');
                      const tTim = Boolean(t.is_tim_7_kaih || t.roles_csv?.includes('TIM_7_KAIH') || t.assignment_type === 'TIM_7_KAIH');

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{t.name}</div>
                            <span className="text-[10px] text-slate-400 font-normal">NIP: {t.nip || '-'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{t.username || t.nip || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {tWalas && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Walas
                                </span>
                              )}
                              {tWali && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800">
                                  Guru Wali
                                </span>
                              )}
                              {tTim && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-100 text-blue-800">
                                  Tim 7 KAIH
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {tWalas ? `Kelas ${t.class_name || '-'}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setTeacherForm({
                                    id: t.id,
                                    nip: t.nip,
                                    username: t.username || t.nip,
                                    name: t.name,
                                    password: t.password || '123',
                                    subject: t.subject || 'Pendidikan Karakter',
                                    is_walas: tWalas,
                                    is_wali: tWali,
                                    is_tim_7_kaih: tTim,
                                    class_name: t.class_name || 'X-1',
                                    is_demo: t.is_demo ? 1 : 0,
                                  });
                                  setTeacherModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                title="Edit Guru"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTeacher(t.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                                title="Hapus Guru"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Teacher Create / Edit Modal */}
              {teacherModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {teacherForm.id ? 'Edit Data Guru & Penugasan' : 'Tambah Guru Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setTeacherModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">NIP Guru</label>
                          <input
                            type="text"
                            value={teacherForm.nip}
                            onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                          <input
                            type="text"
                            value={teacherForm.username || ''}
                            onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                            placeholder={teacherForm.nip ? `guru_${teacherForm.nip}` : 'Opsional (default: NIP)'}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Guru</label>
                          <input
                            type="text"
                            value={teacherForm.name}
                            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Password Login (Dapat Dilihat)</label>
                          <input
                            type="text"
                            value={teacherForm.password}
                            onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                        <input
                          type="text"
                          value={teacherForm.subject}
                          onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      {/* Checkbox Roles (Multi-Role) */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <label className="block font-extrabold text-slate-800">
                          Wewenang / Penugasan Guru (Bisa pilih 2 atau lebih):
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="flex items-center gap-2 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(teacherForm.is_walas)}
                              onChange={(e) =>
                                setTeacherForm({
                                  ...teacherForm,
                                  is_walas: e.target.checked,
                                  class_name: e.target.checked ? teacherForm.class_name || 'X-1' : '',
                                })
                              }
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span>Wali Kelas</span>
                          </label>

                          <label className="flex items-center gap-2 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(teacherForm.is_wali)}
                              onChange={(e) =>
                                setTeacherForm({ ...teacherForm, is_wali: e.target.checked })
                              }
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <span>Guru Wali</span>
                          </label>

                          <label className="flex items-center gap-2 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(teacherForm.is_tim_7_kaih)}
                              onChange={(e) =>
                                setTeacherForm({ ...teacherForm, is_tim_7_kaih: e.target.checked })
                              }
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span>Tim 7 KAIH</span>
                          </label>
                        </div>
                      </div>

                      {/* Kelas Binaan Walas Dropdown (Enabled ONLY when Walas is checked) */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Kelas Binaan Walas: {!teacherForm.is_walas && <span className="text-slate-400 font-normal">(Centang Walas untuk memilih)</span>}
                        </label>
                        <select
                          value={teacherForm.class_name || ''}
                          disabled={!teacherForm.is_walas}
                          onChange={(e) => setTeacherForm({ ...teacherForm, class_name: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${
                            teacherForm.is_walas
                              ? 'bg-white border-emerald-300 text-slate-900 cursor-pointer'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <option value="">-- Pilih Kelas Binaan --</option>
                          {classesRombelsData.classes.map((c) => (
                            <option key={c.id || c.name} value={c.name}>
                              Kelas {c.name} {c.walas_name && c.walas_name !== teacherForm.name ? `(Walas: ${c.walas_name})` : '(Tersedia)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTeacherModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                        >
                          Simpan Data Guru
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: KLASIFIKASI MURID (ANGKATAN, KELAS, & GURU WALI) */}
          {activeTab === 'classes_rombels' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Klasifikasi Murid (Angkatan, Kelas &amp; Guru Wali)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola klasifikasi angkatan (X, XI, XII), pembuatan kelas dan penugasan Walas, serta kelompok bimbingan Guru Wali sekolah.
                </p>
              </div>

              {/* 0. Master Angkatan Murid (Fixed 3 Cohorts: X, XI, XII) */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Master Angkatan Murid (Tingkat X, XI, XII)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tingkat angkatan bersifat tetap (X, XI, XII). Anda dapat mengubah nama label untuk setiap tingkatan di bawah ini.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tingkat Angkatan</th>
                        <th className="py-2.5 px-3">Label / Nama Angkatan</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cohortsList.map((coh) => (
                        <tr key={coh.id}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-black text-xs">
                              Tingkat {coh.grade_level || coh.id.replace('coh-', '')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {editingCohortId === coh.id ? (
                              <input
                                type="text"
                                value={editingCohortName}
                                onChange={(e) => setEditingCohortName(e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl border border-blue-400 font-bold text-xs w-full max-w-sm focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="font-bold text-slate-800">{coh.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {editingCohortId === coh.id ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveCohortLabel(coh.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCohortId(null)}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCohortId(coh.id);
                                  setEditingCohortName(coh.name);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Ubah Label</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Master Kelas */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Master Kelas SMAN 28 ({classesRombelsData.classes.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Ketik nama kelas untuk menambah. Walas ditugaskan langsung lewat tombol di tabel.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveClass} className="flex gap-2 text-xs">
                    <input
                      type="text"
                      value={newClassForm.name}
                      onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                      placeholder="Nama Kelas (mis. X-5)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shrink-0"
                    >
                      + Tambah Kelas
                    </button>
                  </form>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Nama Kelas</th>
                          <th className="py-2.5 px-3">Guru Walas</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classesRombelsData.classes.map((c) => {
                          const hasWalas = Boolean(c.walas_name && c.walas_name !== '-');
                          return (
                            <tr key={c.id || c.name}>
                              <td className="py-2.5 px-3 font-bold text-slate-900">Kelas {c.name}</td>
                              <td className="py-2.5 px-3">
                                {hasWalas ? (
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-slate-800">{c.walas_name}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!confirm(`Copot ${c.walas_name} dari wali kelas ${c.name}?`)) return;
                                        try {
                                          await api.unassignWalasFromClass(c.id);
                                          showToast(`Wali kelas ${c.name} berhasil dicopot`);
                                          await loadControlPanelData();
                                        } catch (err: any) {
                                          alert(err.message || 'Gagal mencopot wali kelas');
                                        }
                                      }}
                                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded cursor-pointer"
                                      title="Copot Wali Kelas"
                                    >
                                      Copot
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetClassForWalas(c);
                                      setSelectedWalasTeacherId('');
                                      setWalasModalOpen(true);
                                    }}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Tambahkan Wali Kelas</span>
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClass(c.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Hapus Kelas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Master Guru Wali */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Master Penugasan Guru Wali ({classesRombelsData.rombels.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pilih guru dari dropdown untuk dijadikan Guru Wali sekolah.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 text-xs">
                    <select
                      value={selectedGuruWaliTeacherId}
                      onChange={(e) => setSelectedGuruWaliTeacherId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    >
                      <option value="">-- Pilih Guru yang belum menjadi Guru Wali --</option>
                      {adminTeachers
                        .filter((t) => !t.is_wali && !t.roles_csv?.includes('WALI'))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (NIP: {t.nip || '-'})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedGuruWaliTeacherId}
                      onClick={async () => {
                        if (!selectedGuruWaliTeacherId) return;
                        try {
                          await api.assignGuruWali(selectedGuruWaliTeacherId);
                          setSelectedGuruWaliTeacherId('');
                          showToast('Guru berhasil ditambahkan sebagai Guru Wali!');
                          await loadControlPanelData();
                        } catch (err: any) {
                          alert(err.message || 'Gagal menambahkan Guru Wali');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      + Tambahkan sebagai Guru Wali
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Kelompok / Guru Wali</th>
                          <th className="py-2.5 px-3">Nama Guru</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classesRombelsData.rombels.map((r) => (
                          <tr key={r.id || r.name}>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{r.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{r.wali_name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRombel(r.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Hapus Guru Wali"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Walas Assignment Modal */}
              {walasModalOpen && targetClassForWalas && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">
                        Tugaskan Wali Kelas {targetClassForWalas.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setWalasModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <p className="text-slate-500">
                        Pilih dewan guru yang memiliki wewenang Walas dan belum ditugaskan di kelas manapun:
                      </p>

                      {(() => {
                        const availableWalas = adminTeachers.filter(
                          (t) =>
                            (t.is_walas || t.roles_csv?.includes('WALAS')) &&
                            (!t.class_name || t.class_name === '-' || t.class_name.trim() === '')
                        );

                        if (availableWalas.length === 0) {
                          return (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-2">
                              <p className="font-bold">
                                Tidak ada guru berwewenang Walas yang sedang kosong / belum bertugas.
                              </p>
                              <p className="text-[11px] text-amber-700">
                                Silakan aktifkan wewenang <strong>Wali Kelas</strong> pada guru di tab <strong>Data Guru &amp; Penugasan</strong> terlebih dahulu.
                              </p>
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setWalasModalOpen(false)}
                                  className="px-3 py-1.5 bg-amber-200 text-amber-900 font-bold rounded-lg cursor-pointer"
                                >
                                  Tutup
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            <select
                              value={selectedWalasTeacherId}
                              onChange={(e) => setSelectedWalasTeacherId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                            >
                              <option value="">-- Pilih Guru Walas --</option>
                              {availableWalas.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} (NIP: {t.nip || '-'})
                                </option>
                              ))}
                            </select>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setWalasModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={!selectedWalasTeacherId}
                                onClick={async () => {
                                  if (!selectedWalasTeacherId) return;
                                  try {
                                    await api.assignWalasToClass(targetClassForWalas.id, selectedWalasTeacherId);
                                    setWalasModalOpen(false);
                                    showToast(`Wali kelas ${targetClassForWalas.name} berhasil ditugaskan!`);
                                    await loadControlPanelData();
                                  } catch (err: any) {
                                    alert(err.message || 'Gagal menugaskan wali kelas');
                                  }
                                }}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                              >
                                Tugaskan Walas
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: DATABASE JURNAL & KOREKSI AUDIT */}
          {activeTab === 'journals' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Database Nilai Jurnal &amp; Koreksi Terkontrol
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit rincian skor, alasan koreksi nilai wajib tercatat secara transparan.
                </p>
              </div>

              {/* Correction Inline Form */}
              {editingJournal && (
                <div className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Formulir Koreksi Nilai Jurnal
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">
                        Koreksi: {editingJournal.student_name} ({editingJournal.habit_title} • {editingJournal.log_date})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Skor Saat Ini: <strong>{editingJournal.final_score}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingJournal(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleCorrectJournal} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nilai Baru (0 - 100):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newJournalScore}
                        onChange={(e) => setNewJournalScore(Number(e.target.value))}
                        className="w-36 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Alasan Koreksi Audit (Wajib Diisi):
                      </label>
                      <textarea
                        rows={2}
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        placeholder="Contoh: Bukti foto dan laporan Guru Wali menunjukkan aktivitas valid."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                      >
                        Simpan Koreksi Nilai
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingJournal(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Journals Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Nama Murid</th>
                      <th className="py-3 px-4">Kebiasaan</th>
                      <th className="py-3 px-4 text-center">Skor Akhir</th>
                      <th className="py-3 px-4">Audit Koreksi</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {journalsList.slice(0, 30).map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{j.log_date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{j.student_name}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{j.class_name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{j.habit_title}</td>
                        <td className="py-3 px-4 text-center font-black text-blue-700">{j.final_score}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {j.correction_reason ? (
                            <span className="text-amber-700 italic">
                              "{j.correction_reason}" oleh {j.corrected_by}
                            </span>
                          ) : (
                            <span className="text-slate-400">Belum ada koreksi</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setInspectJournalAnswers({
                                  studentId: j.student_id,
                                  studentName: j.student_name,
                                  habitCode: j.habit_code,
                                  habitTitle: j.habit_title,
                                  logDate: j.log_date,
                                })
                              }
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1c5ddc] rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 border border-blue-200"
                              title="Lihat seluruh jawaban instrumen murid ini di database"
                            >
                              <Database className="w-3 h-3" />
                              <span>Jawaban</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingJournal(j);
                                setNewJournalScore(j.final_score);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Koreksi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: KELOLA AKUN ADMIN */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Hak Akses Otoritas Tertinggi
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Kelola Akun Administrator (Total: {adminsList.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tambah akun admin baru, ubah kata sandi, status aktif, dan kelola otoritas pengelola sistem 7 KAIH.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminForm({
                      id: '',
                      nip: '',
                      name: '',
                      username: '',
                      password: '123',
                      is_active: true,
                    });
                    setAdminModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Admin Baru</span>
                </button>
              </div>

              {/* Admins Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Nama Lengkap Admin</th>
                      <th className="py-3 px-4">Username Login</th>
                      <th className="py-3 px-4">NIP / Identitas</th>
                      <th className="py-3 px-4 text-center">Status Akun</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminsList.map((adm) => {
                      const isRootAdmin = adm.username === 'admin';
                      return (
                        <tr key={adm.id || adm.user_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{adm.name}</span>
                              {isRootAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                                  Utama
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ID: {adm.id || adm.user_id}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {adm.username}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {adm.nip || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                adm.account_status === 'ACTIVE' || adm.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {adm.account_status === 'ACTIVE' || adm.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminForm({
                                    id: adm.id || adm.user_id,
                                    nip: adm.nip || '',
                                    name: adm.name,
                                    username: adm.username,
                                    password: adm.password || '123',
                                    is_active: adm.account_status === 'ACTIVE' || Boolean(adm.is_active),
                                  });
                                  setAdminModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                title="Edit Akun Admin"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!isRootAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm.id || adm.user_id, adm.username)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                                  title="Hapus Akun Admin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Admin Create / Edit Modal */}
              {adminModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {adminForm.id ? 'Edit Data Akun Admin' : 'Tambah Akun Admin Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setAdminModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveAdmin} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          placeholder="misal: Dr. H. Administrator, M.Pd"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                          <input
                            type="text"
                            value={adminForm.username}
                            onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                            placeholder="misal: admin_tu"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">NIP (Opsional)</label>
                          <input
                            type="text"
                            value={adminForm.nip}
                            onChange={(e) => setAdminForm({ ...adminForm, nip: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200"
                            placeholder="19800101..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Password Login (Dapat Dilihat)</label>
                        <input
                          type="text"
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                          placeholder="123"
                          required
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Default password awal: <strong>123</strong>
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <label className="font-bold text-slate-800 block">Status Akun Aktif</label>
                          <span className="text-[10px] text-slate-500">
                            Hanya akun aktif yang dapat login ke Panel Admin.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(adminForm.is_active)}
                          onChange={(e) => setAdminForm({ ...adminForm, is_active: e.target.checked })}
                          className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAdminModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                        >
                          Simpan Akun Admin
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: PENGUMUMAN & QUOTES */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Pengumuman &amp; Kata Bijak (Quotes) Jawara 28
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola kata mutiara pembangkit semangat karakter dan pengumuman sekolah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementForm({
                      id: '',
                      type: 'QUOTE',
                      title: 'Kata Mutiara 7 KAIH',
                      content: '',
                      author: 'SMAN 28 Jakarta',
                    });
                    setAnnouncementModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengumuman</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcementsList.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                          {ann.type}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAnnouncementForm({
                                id: ann.id,
                                type: ann.type,
                                title: ann.title,
                                content: ann.content,
                                author: ann.author || '',
                              });
                              setAnnouncementModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 text-rose-500 hover:text-rose-800 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-2">{ann.title}</h4>
                      <p className="text-xs text-slate-600 italic mt-1">"{ann.content}"</p>
                    </div>
                    {ann.author && (
                      <span className="text-[10px] font-bold text-slate-400 block text-right pt-2 border-t border-slate-100">
                        Oleh: {ann.author}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Announcement Modal */}
              {announcementModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {announcementForm.id ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setAnnouncementModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipe</label>
                        <select
                          value={announcementForm.type}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              type: e.target.value as 'ANNOUNCEMENT' | 'QUOTE',
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                        >
                          <option value="QUOTE">Kata Bijak (Quote)</option>
                          <option value="ANNOUNCEMENT">Pengumuman Resmi</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Judul</label>
                        <input
                          type="text"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Isi Pesan / Kutipan</label>
                        <textarea
                          rows={4}
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Penulis / Tokoh</label>
                        <input
                          type="text"
                          value={announcementForm.author}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, author: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAnnouncementModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Rapor Murid untuk Administrator */}
      {selectedStudentForReport && (
        <StudentReportModal
          studentId={selectedStudentForReport}
          canEditNotes={true}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Modal Rincian Jawaban Instrumen Murid dari Database SQLite */}
      {inspectJournalAnswers && (
        <HabitAnswersModal
          studentId={inspectJournalAnswers.studentId}
          studentName={inspectJournalAnswers.studentName}
          habitCode={inspectJournalAnswers.habitCode}
          habitTitle={inspectJournalAnswers.habitTitle}
          logDate={inspectJournalAnswers.logDate}
          onClose={() => setInspectJournalAnswers(null)}
        />
      )}
    </ErrorBoundary>
  );
};
