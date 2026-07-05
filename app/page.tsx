"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Komponen Pembantu Internal untuk mendeteksi trigger dari halaman lain (?action=log)
function SearchParamsHandler({ onTrigger }: { onTrigger: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('action') === 'log') {
      onTrigger();
    }
  }, [searchParams, onTrigger]);
  return null;
}

export default function HomePage() {
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLogged, setIsLogged] = useState(false);

  // State untuk panjang siklus haid (diambil dari Cycle Settings, default 28)
  const [cycleLength, setCycleLength] = useState<number>(28);

  // TAMBAHAN: State untuk ucapan salam otomatis berdasarkan waktu
  const [greeting, setGreeting] = useState("Good morning! 🌸");

  // Rentang masa Haid (Period) saat ini
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  // ========================================================
  // KODE TAMBAHAN LOGIKA: State untuk Mengontrol Modal (+) 
  // ========================================================
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [todayDate] = useState(new Date());

  const dateKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    // 1. Mengambil data panjang siklus dari localStorage
    const savedCycle = localStorage.getItem('userCycleLength');
    if (savedCycle) {
      setCycleLength(parseInt(savedCycle, 10));
    }

    // ==========================================
    // TAMBAHAN PENGIKAT HUBUNGAN KEDUA HALAMAN
    // ==========================================
    const savedStart = localStorage.getItem('periodStart');
    const savedEnd = localStorage.getItem('periodEnd');
    if (savedStart) {
      setPeriodStart(new Date(savedStart));
    }
    if (savedEnd) {
      setPeriodEnd(new Date(savedEnd));
      setIsLogged(true); // Jika ada tanggal akhir, tandai status sebagai sudah di-log
    }

    // 2. TAMBAHAN: Logika menentukan ucapan salam otomatis berdasarkan Jam
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting("Good morning! 🌸");
    } else if (currentHour >= 12 && currentHour < 17) {
      setGreeting("Good afternoon! ☀️");
    } else if (currentHour >= 17 && currentHour < 21) {
      setGreeting("Good evening! 🌆");
    } else {
      setGreeting("Good night! 🌙");
    }

    // Mengambil data log hari ini jika sebelumnya sudah pernah disimpan
    const savedDailyLogs = localStorage.getItem(`daily_log_${dateKey}`);
    if (savedDailyLogs) {
      const parsed = JSON.parse(savedDailyLogs);
      setSelectedMood(parsed.mood || "");
      setSelectedSymptoms(parsed.symptoms || []);
    }
  }, [dateKey]);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fungsi saat tanggal di kalender diklik
  const handleDateClick = (clickedDate: Date) => {
    const normalizedDate = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate());

    let start: Date | null = periodStart;
    let end: Date | null = periodEnd;

    if (periodStart && periodEnd) {
      start = normalizedDate;
      end = null;
      setIsLogged(false);
    } else if (periodStart && !periodEnd) {
      if (normalizedDate.getTime() >= periodStart.getTime()) {
        end = normalizedDate;
        setIsLogged(true);
      } else {
        start = normalizedDate;
      }
    } else {
      start = normalizedDate;
    }

    setPeriodStart(start);
    setPeriodEnd(end);

    // ==========================================
    // TAMBAHAN MENYIMPAN HUBUNGAN KE LOCALSTORAGE
    // ==========================================
    if (start) {
      localStorage.setItem('periodStart', start.toISOString());
    } else {
      localStorage.removeItem('periodStart');
    }

    if (end) {
      localStorage.setItem('periodEnd', end.toISOString());
    } else {
      localStorage.removeItem('periodEnd');
    }
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.getTime();
  };

  // Menghitung info "Next Period" dinamis menggunakan state `cycleLength`
  const getNextPeriodInfo = () => {
    if (!periodStart) {
      return { daysLeft: "--", dateString: "Select period on calendar" };
    }

    const nextPeriodDate = new Date(periodStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = nextPeriodDate.getTime() - todayNormalized.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const dayName = nextPeriodDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = `${nextPeriodDate.toLocaleDateString('en-US', options)} (${dayName})`;

    return {
      daysLeft: diffDays > 0 ? diffDays : 0,
      dateString: formattedDate
    };
  };

  const nextPeriodInfo = getNextPeriodInfo();

  const generateCalendarDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      calendarGrid.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      calendarGrid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remainingDays = 42 - calendarGrid.length; 
    for (let i = 1; i <= remainingDays; i++) {
      if (calendarGrid.length < 35 || (calendarGrid.length >= 35 && i <= 7 && remainingDays > 7)) {
         calendarGrid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return calendarGrid.slice(0, 35); 
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysHeader = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = generateCalendarDates();

  // ========================================================
  // KODE TAMBAHAN LOGIKA: Fungsi Aksi Modal Internal
  // ========================================================
  const handleSaveDailyLog = () => {
    const logData = { mood: selectedMood, symptoms: selectedSymptoms };
    localStorage.setItem(`daily_log_${dateKey}`, JSON.stringify(logData));
    setIsLogModalOpen(false);
    router.replace('/'); // Bersihkan URL query
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleCloseModal = () => {
    setIsLogModalOpen(false);
    router.replace('/');
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans">
      
      {/* Detektor URL Query Parameter */}
      <Suspense fallback={null}>
        <SearchParamsHandler onTrigger={() => setIsLogModalOpen(true)} />
      </Suspense>

      <div className="bg-[#FFFDFD] w-full max-w-[390px] h-[844px] max-h-screen relative shadow-2xl overflow-hidden flex flex-col md:rounded-[40px]">
        
        {/* SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
          
          {/* HEADER (SUDAH OTOMATIS) */}
          <div className="flex justify-between items-center p-6 pt-10 mb-2">
            <div>
              <h1 className="font-extrabold text-[#333333] text-lg leading-tight">Hi, Amanda</h1>
              {/* Teks di bawah ini akan berubah sesuai waktu */}
              <p className="text-gray-400 text-[11px] font-medium">{greeting}</p>
            </div>
            <div className="w-10 h-10"></div>
          </div>

          {/* PINK HERO CARD */}
          <div className="px-6 relative">
            <div className="bg-gradient-to-r from-[#FF769E] to-[#FFA2BB] rounded-[24px] p-6 text-white shadow-[0_8px_20px_rgba(255,92,138,0.25)] relative overflow-hidden">
              <div className="absolute right-[-10px] top-4 opacity-90 pointer-events-none">
                <div className="w-28 h-28 bg-white/20 rounded-2xl flex flex-col pt-3 px-3 shadow-inner relative z-10 backdrop-blur-sm">
                  <div className="flex justify-between w-full mb-2">
                    <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                  </div>
                  <div className="flex gap-1 mb-1"><div className="w-4 h-4 bg-white/30 rounded-full"></div><div className="w-4 h-4 bg-[#FF5C8A] rounded-full"></div><div className="w-4 h-4 bg-[#FF5C8A] rounded-full"></div></div>
                  <div className="flex gap-1 mb-1"><div className="w-4 h-4 bg-[#FF5C8A] rounded-full"></div><div className="w-4 h-4 bg-white/30 rounded-full"></div><div className="w-4 h-4 bg-white/30 rounded-full"></div></div>
                </div>
                <div className="absolute -bottom-2 -right-2 text-5xl">🌸</div>
              </div>

              <h2 className="text-sm font-semibold mb-1 relative z-20">Next Period</h2>
              <div className="flex items-baseline gap-1 relative z-20">
                <span className="text-4xl font-extrabold tracking-tight">{nextPeriodInfo.daysLeft}</span>
                <span className="text-sm font-semibold">Days Left</span>
              </div>
              <p className="text-[11px] font-medium mt-1 mb-5 opacity-90 relative z-20">{nextPeriodInfo.dateString}</p>
              
              <button 
                onClick={() => setIsLogged(!isLogged)}
                className={`relative z-20 py-2.5 px-6 rounded-full text-xs font-bold transition transform active:scale-95 shadow-md ${isLogged ? 'bg-emerald-400 text-white' : 'bg-white text-[#FF5C8A]'}`}
              >
                {isLogged ? '✓ Period Logged' : 'Log Period'}
              </button>
            </div>
          </div>

          {/* CALENDAR SECTION */}
          <div className="mt-8 px-6">
            <h3 className="text-sm font-extrabold text-[#333333] mb-4">Calendar</h3>
            
            <p className="text-[10px] text-gray-400 mb-2 italic">
              *Estimasi haid berikutnya otomatis menyesuaikan siklus Anda ({cycleLength} hari).
            </p>

            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-pink-50">
              {/* Calendar Nav */}
              <div className="flex justify-between items-center mb-4 text-[#FF5C8A]">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-pink-50 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
                <h4 className="text-xs font-extrabold text-[#333333]">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h4>
                <button onClick={handleNextMonth} className="p-1 hover:bg-pink-50 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 text-center mb-3">
                {daysHeader.map((day, idx) => (
                  <span key={day} className={`text-[9px] font-bold ${idx === 0 ? 'text-[#FF5C8A]' : 'text-[#333333]'}`}>{day}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-3 text-center text-[11px] font-semibold">
                {calendarDays.map((item, index) => {
                  const itemTime = item.date.getTime();
                  const startTime = periodStart?.getTime();
                  const endTime = periodEnd?.getTime();

                  let isPeriod = false;
                  if (startTime && !endTime) isPeriod = itemTime === startTime;
                  if (startTime && endTime) isPeriod = itemTime >= startTime && itemTime <= endTime;

                  let isNextPeriodPredict = false;
                  if (periodStart) {
                    const nextPeriodStartPredict = addDays(periodStart, cycleLength);
                    const currentDuration = (endTime && startTime) ? Math.round((endTime - startTime) / (1000*60*60*24)) : 4;
                    const nextPeriodEndPredict = addDays(new Date(nextPeriodStartPredict), currentDuration);

                    if (itemTime >= nextPeriodStartPredict && itemTime <= nextPeriodEndPredict) {
                      isNextPeriodPredict = true;
                    }
                  }

                  let isOvulation = false;
                  let isFertile = false;

                  if (periodStart && !isPeriod && !isNextPeriodPredict) {
                    const ovulationDayOffset = cycleLength - 14; 
                    const ovulationTime = addDays(periodStart, ovulationDayOffset);
                    const fertileStart = addDays(periodStart, ovulationDayOffset - 4);
                    const fertileEnd = addDays(periodStart, ovulationDayOffset + 1);

                    if (itemTime === ovulationTime) {
                      isOvulation = true;
                    } else if (itemTime >= fertileStart && itemTime <= fertileEnd) {
                      isFertile = true;
                    }
                  }

                  return (
                    <div key={index} className="flex justify-center items-center h-7 relative">
                      {isPeriod && periodEnd && itemTime > startTime! && itemTime < endTime! && (
                        <div className="absolute w-full h-7 bg-pink-100 z-0"></div>
                      )}
                      {isPeriod && periodEnd && itemTime === startTime! && startTime! !== endTime! && (
                        <div className="absolute right-0 w-1/2 h-7 bg-pink-100 z-0 rounded-l-full"></div>
                      )}
                      {isPeriod && periodEnd && itemTime === endTime! && startTime! !== endTime! && (
                        <div className="absolute left-0 w-1/2 h-7 bg-pink-100 z-0 rounded-r-full"></div>
                      )}

                      <button 
                        onClick={() => handleDateClick(item.date)}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-full transition-all relative z-10 hover:scale-110 cursor-pointer
                          ${!item.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}
                          ${isPeriod ? 'bg-[#FF769E] text-white shadow-md' : ''}
                          ${isNextPeriodPredict && !isPeriod ? 'bg-[#FFF0F3] text-[#FF769E] border border-pink-200/60 font-bold' : ''}
                          ${isOvulation ? 'bg-[#B19CFF] text-white shadow-md' : ''}
                          ${isFertile ? 'bg-[#87C2FF] text-white' : ''}
                        `}
                      >
                        {item.date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-6 text-[9px] font-semibold text-gray-500">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FF769E] rounded-full shadow-sm"></div>Current Period</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FFF0F3] border border-pink-200 rounded-full"></div>Next Period (Prediction)</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#B19CFF] rounded-full shadow-sm"></div>Ovulation</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#87C2FF] rounded-full shadow-sm"></div>Fertile</div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM NAVBAR FLOATING */}
        <div className="px-4 absolute bottom-4 w-full z-40">
          <div className="bg-white h-[54px] rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-between px-6">
            <button type="button" className="flex flex-col items-center justify-center py-1 text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.99a.75.75 0 01-1.06 1.06l-1.06-1.06V20.25A1.75 1.75 0 0117.65 22H14.25v-5.25a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V22H6.35a1.75 1.75 0 01-1.75-1.75v-7.43L3.54 13.89a.75.75 0 01-1.06-1.06l8.99-8.99z" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Home</span>
            </button>
            
            <button type="button" onClick={() => router.push('/calendar')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-4.75m18 4.75v-4.75m-18-3.5h18" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Calendar</span>
            </button>
            
            {/* LOGIKA TAMBAHAN: Memicu pembukaan modal di halaman utama */}
            <div className="flex justify-center -mt-5 relative z-20">
              <button 
                type="button" 
                onClick={() => setIsLogModalOpen(true)}
                className="w-10 h-10 bg-gradient-to-br from-[#FF5C8A] to-[#FF769E] rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(255,92,138,0.3)] text-white font-light text-2xl transform active:scale-95 transition-transform"
              >
                +
              </button>
            </div>
            
            <button type="button" onClick={() => router.push('/stats')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/xl" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Stats</span>
            </button>
            
            <button type="button" onClick={() => router.push('/profile')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Profile</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL BOTTOM SHEET: INPUT MOOD & GEJALA SAKIT HARI INI */}
        {/* ======================================================== */}
        {isLogModalOpen && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-end justify-center animate-fadeIn">
            <div className="absolute inset-0" onClick={handleCloseModal}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-8 relative z-10 shadow-2xl flex flex-col gap-5 max-w-[390px] animate-slideUp border-t border-gray-100">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1"></div>
              <div>
                <h3 className="text-sm font-black text-[#333333]">Daily Log Symptoms</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Today, {todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>

              {/* SEKSI MOOD */}
              <div>
                <h4 className="text-[11px] font-black text-gray-500 mb-2 uppercase tracking-wider">How is your mood today?</h4>
                <div className="flex justify-between px-2">
                  {[
                    { emoji: "😊", label: "Happy" }, 
                    { emoji: "🥰", label: "Loving" }, 
                    { emoji: "😐", label: "Calm" }, 
                    { emoji: "😢", label: "Sad" }, 
                    { emoji: "😡", label: "Angry" }
                  ].map((item) => (
                    <button key={item.label} type="button" onClick={() => setSelectedMood(item.label)} className={`flex flex-col items-center p-2 rounded-xl transition gap-1 ${selectedMood === item.label ? 'bg-pink-50 scale-110 ring-1 ring-pink-200' : 'opacity-60'}`}>
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-[9px] font-bold text-gray-600">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SEKSI GEJALA SAKIT */}
              <div>
                <h4 className="text-[11px] font-black text-gray-500 mb-2 uppercase tracking-wider">What hurts or aches today?</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Cramps (Kram Perut)", icon: "⚡" }, 
                    { name: "Headache (Pusing)", icon: "🤕" }, 
                    { name: "Backache (Sakit Punggung)", icon: "🧍" }, 
                    { name: "Tender Breasts (Nyeri Payudara)", icon: "👚" }, 
                    { name: "Fatigue (Lelah)", icon: "🥱" }
                  ].map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom.name);
                    return (
                      <button key={symptom.name} type="button" onClick={() => toggleSymptom(symptom.name)} className={`px-3 py-2 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5 ${isSelected ? 'bg-[#FF5C8A] border-[#FF5C8A] text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <span>{symptom.icon}</span>{symptom.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOMBOL AKSI */}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 border border-gray-200 py-3 rounded-full text-xs font-black text-gray-500 bg-gray-50 active:scale-95 transition-transform">Cancel</button>
                <button type="button" onClick={handleSaveDailyLog} className="flex-1 bg-[#FF5C8A] text-white py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition-transform">Save Log</button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}