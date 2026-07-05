"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State untuk panjang siklus haid
  const [cycleLength, setCycleLength] = useState<number>(28);

  // Rentang masa Haid (Period)
  const [periodStart, setPeriodStart] = useState<Date | null>(null); 
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null); 

  // Menggunakan object record untuk menyimpan flow darah per tanggal spesifik
  const [flowLevels, setFlowLevels] = useState<Record<string, number>>({});

  // ==========================================
  // STATE BARU: Untuk Mengontrol Tampilan Modal Pengisian Data (+)
  // ==========================================
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  useEffect(() => {
    // 1. Mengambil data panjang siklus
    const savedCycle = localStorage.getItem('userCycleLength');
    if (savedCycle) {
      setCycleLength(parseInt(savedCycle, 10));
    }

    // 2. Mengambil tanggal haid yang di-log dari halaman utama
    const savedStart = localStorage.getItem('periodStart');
    const savedEnd = localStorage.getItem('periodEnd');
    if (savedStart) setPeriodStart(new Date(savedStart));
    if (savedEnd) setPeriodEnd(new Date(savedEnd));

    // 3. Mengambil data flow level per tanggal
    const savedFlows = localStorage.getItem('userFlowLevels');
    if (savedFlows) {
      setFlowLevels(JSON.parse(savedFlows));
    }

    // Load data mood dan symptoms dari localStorage berdasarkan tanggal terpilih jika ada
    const dateKey = formatDateKey(selectedDate);
    const savedDailyLogs = localStorage.getItem(`daily_log_${dateKey}`);
    if (savedDailyLogs) {
      const parsed = JSON.parse(savedDailyLogs);
      setSelectedMood(parsed.mood || "");
      setSelectedSymptoms(parsed.symptoms || []);
    } else {
      setSelectedMood("");
      setSelectedSymptoms([]);
    }
  }, [selectedDate]);

  // Fungsi pembantu format key "YYYY-MM-DD"
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Mengubah & menyimpan tingkat flow data darah ke localStorage
  const handleFlowChange = (level: number) => {
    const dateKey = formatDateKey(selectedDate);
    const updatedFlows = {
      ...flowLevels,
      [dateKey]: level
    };
    setFlowLevels(updatedFlows);
    localStorage.setItem('userFlowLevels', JSON.stringify(updatedFlows));
  };

  // Menyimpan Log Data Harian (Mood & Gejala Sakit)
  const handleSaveDailyLog = () => {
    const dateKey = formatDateKey(selectedDate);
    const logData = {
      mood: selectedMood,
      symptoms: selectedSymptoms
    };
    localStorage.setItem(`daily_log_${dateKey}`, JSON.stringify(logData));
    setIsLogModalOpen(false); // Tutup modal setelah disimpan
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.getTime();
  };

  // Membuat struktur grid kalender
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

  const formatSelectedDate = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}, ${selectedDate.toLocaleDateString('en-US', options)}`;
  };

  const getFlowText = () => {
    const currentFlow = flowLevels[formatDateKey(selectedDate)] || 0;
    if (currentFlow === 1) return "Light Flow";
    if (currentFlow === 2) return "Medium Flow";
    if (currentFlow === 3) return "Heavy Flow";
    return "No Flow Logged";
  };

  const currentSelectedFlow = flowLevels[formatDateKey(selectedDate)] || 0;

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans">
      <div className="bg-[#FFFDFD] w-full max-w-[390px] h-[844px] max-h-screen relative shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:rounded-[40px]">
        
        {/* TOP BAR HEADER */}
        <div className="pt-4 flex justify-between items-center text-[#FF5C8A]">
          <button onClick={() => router.push('/')} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <h1 className="font-extrabold text-[#FF5C8A] text-base tracking-wide mr-6">Calendar</h1>
          <div className="w-5"></div>
        </div>

        {/* CALENDAR BODY */}
        <div className="flex-1 flex flex-col justify-start mt-4">
          
          {/* Navigasi Bulan */}
          <div className="flex justify-center items-center gap-4 mb-4 text-[#333333]">
            <button onClick={handlePrevMonth} className="text-[#FF5C8A] p-0.5 hover:bg-pink-50 rounded-full transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <h4 className="text-sm font-black tracking-tight w-28 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <button onClick={handleNextMonth} className="text-[#FF5C8A] p-0.5 hover:bg-pink-50 rounded-full transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center mb-4">
            {daysHeader.map((day, idx) => (
              <span key={day} className={`text-[10px] font-bold ${idx === 0 ? 'text-[#FF5C8A]' : 'text-gray-400'}`}>{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-4 text-center text-[11px] font-bold">
            {calendarDays.map((item, index) => {
              const itemTime = item.date.getTime();
              const startTime = periodStart?.getTime();
              const endTime = periodEnd?.getTime();
              
              const isSelected = item.date.getDate() === selectedDate.getDate() && 
                                 item.date.getMonth() === selectedDate.getMonth() &&
                                 item.date.getFullYear() === selectedDate.getFullYear();

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
                      w-7 h-7 flex items-center justify-center rounded-full transition-all relative z-10 cursor-pointer text-xs
                      ${!item.isCurrentMonth ? 'text-gray-300 font-medium' : 'text-gray-700'}
                      ${isPeriod ? 'bg-[#FF769E] text-white shadow-sm' : ''}
                      ${isNextPeriodPredict && !isPeriod ? 'bg-[#FFF0F3] text-[#FF769E] border border-pink-200/60 font-bold' : ''}
                      ${isOvulation ? 'bg-[#B19CFF] text-white shadow-sm' : ''}
                      ${isFertile ? 'bg-[#C1E0FF] text-gray-700' : ''}
                      ${isSelected ? 'ring-2 ring-[#FF5C8A] ring-offset-1 scale-105 font-black' : ''}
                    `}
                  >
                    {item.date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          {/* LEGEND STATUS */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-8 text-[10px] font-bold text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FF769E] rounded-full shadow-sm"></div>Period</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FFF0F3] border border-pink-200 rounded-full"></div>Next Period</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#B19CFF] rounded-full shadow-sm"></div>Ovulation</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#C1E0FF] rounded-full shadow-sm"></div>Fertile</div>
          </div>

          {/* INTERACTIVE FLOW CARD */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex justify-between items-center">
              <div className="text-left w-full">
                <h4 className="text-xs font-black text-[#333333] mb-2">{formatSelectedDate()}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-gray-400 w-24">{getFlowText()}</span>
                  
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleFlowChange(1)} className={`text-sm transition transform active:scale-95 ${currentSelectedFlow >= 1 ? 'opacity-100' : 'opacity-20'}`}>🩸</button>
                    <button type="button" onClick={() => handleFlowChange(2)} className={`text-sm transition transform active:scale-95 ${currentSelectedFlow >= 2 ? 'opacity-100' : 'opacity-20'}`}>🩸</button>
                    <button type="button" onClick={() => handleFlowChange(3)} className={`text-sm transition transform active:scale-95 ${currentSelectedFlow >= 3 ? 'opacity-100' : 'opacity-20'}`}>🩸</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT PERIOD BUTTON -> REVISI: Sekarang membuka modal fungsionalitas tambah data harian */}
          <div className="mt-5">
            <button 
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="w-full bg-[#FF5C8A] text-white py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition-transform tracking-wide"
            >
              Edit Period (Add Symptoms)
            </button>
          </div>

        </div>

        {/* BOTTOM NAVBAR FLOATING */}
        <div className="px-0 mt-4">
          <div className="bg-white h-[54px] rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-between px-6">
            <button type="button" onClick={() => router.push('/')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Home</span>
            </button>
            
            <button type="button" className="flex flex-col items-center justify-center py-1 text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9h-16.5v8.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V11.25z" clipRule="evenodd" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Calendar</span>
            </button>
            
            {/* ICON PLUS NAVBAR (Memicu pembukaan modal yang sama) */}
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
        {/* MODAL BOTTOM SHEET: UNTUK INPUT MOOD & BAGIAN YANG SAKIT */}
        {/* ======================================================== */}
        {isLogModalOpen && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-end justify-center transition-opacity animate-fadeIn">
            {/* Latar Belakang Klik untuk Menutup */}
            <div className="absolute inset-0" onClick={() => setIsLogModalOpen(false)}></div>
            
            {/* Konten Sheet Kontainer */}
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-8 relative z-10 animate-slideUp shadow-2xl border-t border-gray-100 flex flex-col gap-5">
              
              {/* Handle Bar dekorasi modal */}
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1"></div>

              {/* Judul & Detail Tanggal */}
              <div>
                <h3 className="text-sm font-black text-[#333333]">Daily Log Symptoms</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{formatSelectedDate()}</p>
              </div>

              {/* SECTION 1: MOOD HARI INI */}
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
                    <button 
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedMood(item.label)}
                      className={`flex flex-col items-center p-2 rounded-xl transition gap-1 ${selectedMood === item.label ? 'bg-pink-50 scale-110 ring-1 ring-pink-200' : 'opacity-60'}`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-[9px] font-bold text-gray-600">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: GEJALA / BAGIAN YANG SAKIT */}
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
                      <button
                        key={symptom.name}
                        type="button"
                        onClick={() => toggleSymptom(symptom.name)}
                        className={`px-3 py-2 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5 ${isSelected ? 'bg-[#FF5C8A] border-[#FF5C8A] text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      >
                        <span>{symptom.icon}</span>
                        {symptom.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOMBOL AKSI MODAL */}
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 border border-gray-200 py-3 rounded-full text-xs font-black text-gray-500 bg-gray-50 active:scale-95 transition"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveDailyLog}
                  className="flex-1 bg-[#FF5C8A] text-white py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition"
                >
                  Save Log
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}