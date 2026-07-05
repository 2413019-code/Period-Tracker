"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CycleHistory {
  id: string;
  month: string;
  days: number;
}

export default function StatsPage() {
  const router = useRouter();
  
  // State Utama Real-Time
  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [avgPeriodLength, setAvgPeriodLength] = useState<number>(5);
  const [nextPeriodDate, setNextPeriodDate] = useState<string>("Calculating...");
  const [loggedFlow, setLoggedFlow] = useState<string>("No data");
  const [trackedSymptoms, setTrackedSymptoms] = useState<string[]>([]);
  
  // State Interaksi Grafik Batang (Default elemen indeks ke-5 / Paling Kanan untuk Bulan Ini)
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(5);
  
  // State untuk Tips Harian Dinamis
  const [dailyTip, setDailyTip] = useState<string>("Memuat tips hari ini...");
  
  // State Grafik Batang (Akan di-generate otomatis sesuai memori lokal)
  const [historyData, setHistoryData] = useState<CycleHistory[]>([]);

  useEffect(() => {
    // 1. Tarik parameter siklus ter-update dari halaman Settings/Home
    const savedCycle = localStorage.getItem('userCycleLength'); 
    const savedPeriod = localStorage.getItem('userPeriodLength'); 
    const periodStartStr = localStorage.getItem('periodStart') || new Date().toISOString().split('T')[0]; 
    
    let currentCycleInput = 28;
    let currentPeriodInput = 5;

    if (savedCycle) currentCycleInput = Number(savedCycle);
    if (savedPeriod) currentPeriodInput = Number(savedPeriod);

    setAvgPeriodLength(currentPeriodInput);

    // 2. MODUL PENYIMPANAN MEMORI: Mengingat Riwayat 6 Bulan Terakhir
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    
    // Coba ambil memori riwayat dari localStorage
    let storedHistory: CycleHistory[] = JSON.parse(localStorage.getItem('cycle_history_data') || 'null');

    // Jika user baru pertama kali buka aplikasi, buatkan data simulasi mundur 5 bulan
    if (!storedHistory) {
      storedHistory = [];
      const pastDaysPattern = [27, 29, 28, 30, 27]; // Dummy data masa lalu
      for (let i = 5; i >= 1; i--) {
        const pastDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        storedHistory.push({
          id: `${pastDate.getFullYear()}-${pastDate.getMonth()}`,
          month: monthNames[pastDate.getMonth()],
          days: pastDaysPattern[5 - i]
        });
      }
    }

    // ID unik untuk bulan dan tahun saat ini (contoh: "2026-5" untuk Juni 2026)
    const currentMonthId = `${today.getFullYear()}-${today.getMonth()}`;
    const currentMonthLabel = monthNames[today.getMonth()];

    // Cek apakah bulan INI sudah ada di dalam memori
    const existingCurrentMonthIndex = storedHistory.findIndex(h => h.id === currentMonthId);

    if (existingCurrentMonthIndex !== -1) {
      // Jika sudah ada (masih di bulan yang sama), update angka siklusnya dengan data terbaru
      storedHistory[existingCurrentMonthIndex].days = currentCycleInput;
    } else {
      // Jika masuk BULAN BARU, tambahkan batang bulan baru ke sebelah kanan
      storedHistory.push({
        id: currentMonthId,
        month: currentMonthLabel,
        days: currentCycleInput
      });
    }

    // Pastikan grafik hanya menampilkan maksimal 6 bulan terakhir agar tidak kepanjangan
    if (storedHistory.length > 6) {
      storedHistory = storedHistory.slice(storedHistory.length - 6);
    }

    // Simpan kembali data yang sudah diperbarui ke dalam memori HP
    localStorage.setItem('cycle_history_data', JSON.stringify(storedHistory));
    setHistoryData(storedHistory);

    // Hitung rerata dari 6 bulan tersebut (dari memori asli)
    const totalDays = storedHistory.reduce((sum, item) => sum + item.days, 0);
    const realTimeAverage = Math.round(totalDays / storedHistory.length);
    setAvgCycleLength(realTimeAverage);

    // 3. MODUL REAL-TIME PREDIKSI
    if (periodStartStr) {
      const startDate = new Date(periodStartStr);
      startDate.setDate(startDate.getDate() + realTimeAverage);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const formattedDate = startDate.toLocaleDateString('en-US', options);
      setNextPeriodDate(formattedDate);
    }

    // 4. MODUL REAL-TIME LOG
    const todayStr = today.toISOString().split('T')[0];
    const savedLog = localStorage.getItem(`daily_log_${todayStr}`) || localStorage.getItem('daily_log_2024-01-15');
    
    if (savedLog) {
      const parsedLog = JSON.parse(savedLog);
      if (parsedLog.flow) setLoggedFlow(parsedLog.flow);
      if (parsedLog.symptoms) setTrackedSymptoms(parsedLog.symptoms);
    }

    // 5. MODUL TIPS HARIAN DINAMIS
    const tipsList = [
      "Tetap penuhi kebutuhan hidrasi harian untuk menjaga kestabilan energi menjelang masa prediksi siklus berikutnya.",
      "Sempatkan waktu 15-20 menit untuk peregangan atau yoga ringan guna melancarkan sirkulasi darah.",
      "Perbanyak konsumsi makanan kaya zat besi seperti bayam atau daging merah tanpa lemak untuk persiapan tubuh.",
      "Pastikan Anda mendapat tidur yang cukup (7-8 jam) agar hormon, tubuh, dan pikiran lebih rileks.",
      "Kurangi asupan kafein dan garam hari ini jika Anda mulai merasakan perut kembung atau kram ringan.",
      "Kelola stres dengan meditasi pernapasan singkat atau sekadar mendengarkan musik favorit Anda.",
      "Catat perubahan suasana hati (mood) Anda hari ini di kalender agar pola siklus semakin akurat terbaca oleh sistem."
    ];
    
    const dayOfMonth = today.getDate();
    const tipIndex = dayOfMonth % tipsList.length;
    setDailyTip(tipsList[tipIndex]);
  }, []);

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans antialiased">
      {/* Handphone Frame Mockup */}
      <div className="bg-[#FFFDFE] w-full max-w-[390px] h-[844px] relative shadow-2xl overflow-hidden p-5 flex flex-col justify-between md:rounded-[40px]">
        
        {/* Konten Utama */}
        <div className="overflow-y-auto pb-24 hide-scrollbar flex-1 space-y-6 px-1">
          
          {/* Top Header */}
          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => router.back()} 
              className="text-[#FF5C8A] hover:text-[#ff477b] text-2xl font-black p-1 transition transform active:scale-75 stroke-[3]"
              style={{ WebkitTextStroke: '1.5px #FF5C8A' }}
            >
              ⟨
            </button>
            <h2 className="text-[#FF5C8A] font-extrabold text-lg tracking-wide">Stats</h2>
            <div className="w-6"></div>
          </div>

          {/* SECTION 1: KARTU RANGKUMAN SIKLUS */}
          <div>
            <h3 className="text-gray-800 text-xs font-black tracking-wide mb-3 uppercase opacity-80">Your Cycle Summary</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#FFF6F8] rounded-2xl p-3.5 text-center border border-pink-100/20 shadow-2xs">
                <span className="text-xl font-black text-[#FF5C8A] block">{avgCycleLength}</span>
                <span className="text-[10px] font-bold text-gray-500 block mt-1">Avg Cycle</span>
                <span className="text-[9px] text-gray-400 block">days</span>
              </div>
              <div className="bg-[#FFF6F8] rounded-2xl p-3.5 text-center border border-pink-100/20 shadow-2xs">
                <span className="text-xl font-black text-[#FF5C8A] block">{avgPeriodLength}</span>
                <span className="text-[10px] font-bold text-gray-500 block mt-1">Avg Period</span>
                <span className="text-[9px] text-gray-400 block">days</span>
              </div>
              <div className="bg-[#FFF6F8] rounded-2xl p-3.5 text-center border border-pink-100/20 shadow-2xs">
                <span className="text-base font-black text-[#FF5C8A] block pt-1">{nextPeriodDate}</span>
                <span className="text-[10px] font-bold text-gray-500 block mt-1.5">Next Period</span>
                <span className="text-[9px] text-gray-400 block">predicted</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: GRAFIK BATANG HISTORIS (MEMORI PENYIMPANAN) */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-gray-800 text-xs font-black tracking-wide uppercase opacity-80">Cycle Length</h3>
                <p className="text-[9px] font-bold text-gray-400 mt-0.5">(Calculated from history)</p>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-pink-50/80 px-2 py-0.5 rounded-md border border-pink-100/30">
                Rerata: <strong className="text-[#FF5C8A]">{avgCycleLength} hari</strong>
              </span>
            </div>

            <div className="bg-white/50 rounded-2xl p-4 border border-gray-50 pt-6 pb-2">
              
              {/* AREA GRAFIK GRID */}
              <div className="relative h-[160px]">
                
                {/* Garis Grid Y-Axis */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[40, 30, 20, 10, 0].map((val) => (
                    <div key={val} className="w-full border-t border-gray-100 flex items-center relative">
                      <span className="text-[10px] font-extrabold text-gray-300 absolute left-0 -top-2.5 bg-[#FFFDFE] pr-2">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Wrapper Batang Bar Data */}
                <div className="absolute inset-0 left-8 right-2 flex items-end justify-between pb-[1px] z-10">
                  {historyData.map((item, index) => {
                    const isSelected = selectedBarIndex === index;
                    const barHeightPercentage = (item.days / 40) * 100;
                    
                    return (
                      <button 
                        key={index} 
                        onClick={() => setSelectedBarIndex(index)}
                        className="flex flex-col items-center justify-end h-full w-10 focus:outline-none group"
                      >
                        <div className="flex flex-col items-center justify-end w-full relative">
                          <span className={`text-[12px] font-black tracking-tight mb-1.5 transition-colors ${
                            isSelected ? 'text-[#FF5C8A]' : 'text-gray-400'
                          }`}>
                            {item.days}
                          </span>
                          
                          <div 
                            style={{ height: `${(160 * (barHeightPercentage/100))}px` }} 
                            className={`w-[14px] rounded-full transition-all duration-300 ${
                              isSelected 
                                ? 'bg-[#FF5C8A] shadow-md shadow-pink-200' 
                                : 'bg-[#FFC0D3]'
                            }`}
                          ></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AREA LABEL X-AXIS */}
              <div className="flex justify-between items-center pl-8 pr-2 mt-4">
                {historyData.map((item, index) => {
                  const isSelected = selectedBarIndex === index;
                  // Asumsikan elemen terakhir di array adalah bulan saat ini (karena dibatasi maksimal 6 di slice)
                  const isCurrentMonth = index === historyData.length - 1;
                  return (
                    <div key={index} className="w-10 text-center flex flex-col items-center">
                      <span className={`text-[11px] transition-all ${
                        isSelected ? 'font-black text-gray-800' : 'font-extrabold text-gray-400'
                      }`}>
                        {item.month}
                      </span>
                      {isCurrentMonth && (
                        <span className={`text-[8px] mt-0.5 ${isSelected ? 'text-[#FF5C8A] font-bold' : 'text-gray-300'}`}>Now</span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* SECTION 3: DATA GEJALA */}
          <div className="space-y-3">
            <h3 className="text-gray-800 text-xs font-black tracking-wide uppercase opacity-80">Logged Symptoms</h3>
            <div className="bg-white border border-pink-50 rounded-2xl p-4 shadow-2xs flex justify-between items-center">
              <span className="text-[11px] font-bold text-gray-600">Aliran Darah Terakhir</span>
              <span className="text-[11px] font-black text-[#FF5C8A] bg-pink-50 px-2.5 py-1 rounded-md">
                {loggedFlow}
              </span>
            </div>
            <div className="bg-white border border-pink-50 rounded-2xl p-4 shadow-2xs">
              <h4 className="text-[11px] font-bold text-gray-600 mb-2">Gejala Terdeteksi Hari Ini</h4>
              {trackedSymptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trackedSymptoms.map((symptom, i) => (
                    <span key={i} className="bg-gray-50 text-gray-600 border border-gray-100 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ⚠️ {symptom}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-medium text-gray-400">
                  Belum ada catatan gejala aktif dari halaman log utama.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 4: INSIGHTS KESEHATAN & TIPS HARIAN */}
          <div>
            <h3 className="text-gray-800 text-xs font-black tracking-wide mb-2 uppercase opacity-80">Health Insights</h3>
            <div className="bg-white border border-pink-50 rounded-2xl p-4 shadow-2xs space-y-3">
              <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                Berdasarkan kalkulasi matematika terpadu, siklus bulanan Anda berada di angka <span className="text-[#FF5C8A] font-bold">{avgCycleLength} hari</span>. Sistem memprediksi ritme tubuh Anda berjalan dengan stabil.
              </p>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-[10px] font-semibold text-amber-700 leading-relaxed">
                <strong>Tips Hari Ini:</strong> {dailyTip}
              </div>
            </div>
          </div>

        </div>

        {/* Floating Bottom Navigation Bar */}
        <div className="px-4 absolute bottom-4 left-0 w-full z-50">
          <div className="bg-white h-[54px] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center justify-between px-6">
            
            <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center text-gray-400 hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Home</span>
            </button>
            
            <button onClick={() => router.push('/calendar')} className="flex flex-col items-center justify-center text-gray-400 hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-4.75m18 4.75v-4.75m-18-3.5h18" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Calendar</span>
            </button>
            
            <div className="flex justify-center -mt-5 relative z-50">
              <button 
                onClick={() => router.push('/')} 
                className="w-10 h-10 bg-[#FF5C8A] rounded-full flex items-center justify-center shadow-md text-white font-light text-2xl transform active:scale-95 transition"
              >
                +
              </button>
            </div>
            
            <button className="flex flex-col items-center justify-center text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/2000/xl" fill="currentColor" viewBox="0 0 24 24" className="w-[18px] h-[18px]"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Stats</span>
            </button>
            
            {/* Bagian ini telah diupdate dengan onClick={() => router.push('/profile')} */}
            <button onClick={() => router.push('/profile')} className="flex flex-col items-center justify-center text-gray-400 hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Profile</span>
            </button>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}