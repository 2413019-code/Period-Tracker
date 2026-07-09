"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CycleHistory {
  id: string;
  month: string;
  days: number;
}

interface SymptomStat {
  name: string;
  count: number;
}

interface FlowStat {
  name: string;
  count: number;
}

export default function StatsPage() {
  const router = useRouter();
  
  // State Utama Real-Time
  const [avgCycleLength, setAvgCycleLength] = useState<number>(28);
  const [avgPeriodLength, setAvgPeriodLength] = useState<number>(5);
  const [nextPeriodDate, setNextPeriodDate] = useState<string>("Calculating...");
  
  // State Grafik Batang Horizontal Flow (Sesuai Request: Mirip Grafik Gejala)
  const [trackedFlows, setTrackedFlows] = useState<FlowStat[]>([]);
  
  // State Grafik Batang Horizontal Gejala (Top 5)
  const [trackedSymptoms, setTrackedSymptoms] = useState<SymptomStat[]>([]);
  
  // State Interaksi Grafik Batang Siklus
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  // State Tips Harian
  const [dailyTip, setDailyTip] = useState<string>("Memuat tips hari ini...");
  
  // State Grafik Batang Siklus (Dinamis Murni dari Kalender)
  const [historyData, setHistoryData] = useState<CycleHistory[]>([]);

  useEffect(() => {
    // 1. Tarik parameter default cadangan dari settings
    const savedCycle = localStorage.getItem('userCycleLength'); 
    const savedPeriod = localStorage.getItem('userPeriodLength'); 
    const periodStartStr = localStorage.getItem('periodStart') || new Date().toISOString().split('T')[0]; 
    
    let currentCycleInput = 28;
    let currentPeriodInput = 5;

    if (savedCycle) currentCycleInput = Number(savedCycle);
    if (savedPeriod) currentPeriodInput = Number(savedPeriod);

    setAvgPeriodLength(currentPeriodInput);

    // 2. INITIALIZE COUNTERS
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();

    const symptomCounts: { [key: string]: number } = {};
    const flowCounts: { [key: string]: number } = {
      "Heavy Flow": 0,
      "Medium Flow": 0,
      "Light Flow": 0,
      "Spotting": 0
    };
    
    const flowTimestamps = new Set<number>();
    const activeMonths = new Set<string>(); 
    const processedDates = new Set<string>(); // Mencegah double-counting data kalender

    // Fungsi ekstraksi data internal super sensitif (Mendeteksi segala jenis format objek kalender)
    const extractLogData = (yearStr: string, monthStr: string, dayStr: string, rawJson: string) => {
      try {
        const logData = JSON.parse(rawJson);
        if (!logData || typeof logData !== 'object') return;

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // Konversi ke indeks 0-11
        const day = parseInt(dayStr, 10);

        // FILTER KETAT BULAN: Hanya memproses dari bulan Juli (indeks 6) ke atas
        if (month < 6) return;

        const normalizedKey = `${year}-${month}-${day}`;
        if (processedDates.has(normalizedKey)) return;
        processedDates.add(normalizedKey);

        let hasValidInput = false;

        // Deteksi cerdas properti Flow (fleksibel jika kalender pakai nama field berbeda)
        const flowValue = logData.flow || logData.bloodFlow || logData.blood_flow || logData.intensity || logData.volume;
        if (flowValue && flowValue !== 'No data' && flowValue !== 'None' && flowValue !== 'null') {
          const midnightTs = new Date(year, month, day).getTime();
          flowTimestamps.add(midnightTs);
          hasValidInput = true;

          const txt = flowValue.toString().toLowerCase().trim();
          // Pemetaan bahasa & kata kunci dari input kalender ke Grafik Bar
          if (txt.includes('heavy') || txt.includes('banyak') || txt.includes('deras')) {
            flowCounts["Heavy Flow"] += 1;
          } else if (txt.includes('medium') || txt.includes('normal') || txt.includes('sedang')) {
            flowCounts["Medium Flow"] += 1;
          } else if (txt.includes('light') || txt.includes('sedikit') || txt.includes('ringan')) {
            flowCounts["Light Flow"] += 1;
          } else if (txt.includes('spot') || txt.includes('flek')) {
            flowCounts["Spotting"] += 1;
          }
        }

        // Deteksi log input gejala
        const symptomsValue = logData.symptoms || logData.symptom || logData.keluhan || [];
        const symptomsArray = Array.isArray(symptomsValue) ? symptomsValue : (symptomsValue ? [symptomsValue] : []);
        if (symptomsArray.length > 0) {
          symptomsArray.forEach((s: any) => {
            if (s) {
              const sName = s.toString().trim();
              symptomCounts[sName] = (symptomCounts[sName] || 0) + 1;
            }
          });
          hasValidInput = true;
        }

        // Daftarkan bulan ke dalam grafik jika terbukti ada data aktif terisi
        if (hasValidInput) {
          activeMonths.add(`${year}-${month}`);
        }
      } catch (e) {
        // Gagal parse JSON dilewati dengan aman
      }
    };

    // 3. UNIVERSAL STORAGE SCANNER LOOP (Membongkar seluruh tipe penyimpanan kalender)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      const valueStr = localStorage.getItem(key) || '';

      // Tipe 1: Kalender menyimpan data flat per tanggal (e.g., daily_log_2026-07-09 atau log_2026-07-09 atau langsung 2026-07-09)
      const dateMatch = key.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (dateMatch) {
        extractLogData(dateMatch[1], dateMatch[2], dateMatch[3], valueStr);
      } else {
        // Tipe 2: Kalender menyimpan semua data di dalam satu Objek Induk Besar (Nested Store)
        try {
          const parsedObject = JSON.parse(valueStr);
          if (parsedObject && typeof parsedObject === 'object' && !Array.isArray(parsedObject)) {
            Object.keys(parsedObject).forEach(subKey => {
              const subDateMatch = subKey.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
              if (subDateMatch) {
                extractLogData(subDateMatch[1], subDateMatch[2], subDateMatch[3], JSON.stringify(parsedObject[subKey]));
              }
            });
          }
        } catch (e) {}
      }
    }

    // 4. HITUNG SIKLUS DAN DETEKSI HARI PERTAMA MENSTRUASI
    const sortedTimestamps = Array.from(flowTimestamps).sort((a, b) => a - b);
    const periodStarts: number[] = [];
    
    sortedTimestamps.forEach(ts => {
      const oneDayBefore = ts - 24 * 60 * 60 * 1000;
      if (!flowTimestamps.has(oneDayBefore)) {
        periodStarts.push(ts);
      }
    });

    const cycleLengthsByMonth: { [key: string]: number[] } = {};
    for (let i = 0; i < periodStarts.length - 1; i++) {
      const currentStart = periodStarts[i];
      const nextStart = periodStarts[i + 1];
      const diffDays = Math.round((nextStart - currentStart) / (24 * 60 * 60 * 1000));
      
      const d = new Date(currentStart);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!cycleLengthsByMonth[monthKey]) {
        cycleLengthsByMonth[monthKey] = [];
      }
      cycleLengthsByMonth[monthKey].push(diffDays);
    }

    // 5. GENERASI GRAFIK BATANG SIKLUS BULANAN
    const sortedMonths = Array.from(activeMonths).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number);
      const [yB, mB] = b.split('-').map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    });

    const generatedHistory: CycleHistory[] = sortedMonths.map(mKey => {
      const [_, m] = mKey.split('-').map(Number);
      let days = currentCycleInput; 

      if (cycleLengthsByMonth[mKey] && cycleLengthsByMonth[mKey].length > 0) {
        const sum = cycleLengthsByMonth[mKey].reduce((a, b) => a + b, 0);
        days = Math.round(sum / cycleLengthsByMonth[mKey].length);
      }

      return {
        id: mKey,
        month: monthNames[m],
        days: days
      };
    });

    setHistoryData(generatedHistory);
    setSelectedBarIndex(generatedHistory.length > 0 ? generatedHistory.length - 1 : null);

    if (generatedHistory.length > 0) {
      const totalDays = generatedHistory.reduce((sum, item) => sum + item.days, 0);
      setAvgCycleLength(Math.round(totalDays / generatedHistory.length));
    } else {
      setAvgCycleLength(currentCycleInput);
    }

    // PREDIKSI JADWAL BULAN DEPAN
    const finalAvg = generatedHistory.length > 0 
      ? Math.round(generatedHistory.reduce((sum, item) => sum + item.days, 0) / generatedHistory.length) 
      : currentCycleInput;

    if (periodStartStr) {
      const startDate = new Date(periodStartStr);
      startDate.setDate(startDate.getDate() + finalAvg);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      setNextPeriodDate(startDate.toLocaleDateString('en-US', options));
    }

    // 6. MATRIKS GRAFIK BAR HORIZONTAL UNTUK FLOW (Hanya memunculkan yang count > 0 agar auto-hapus sinkron)
    const finalFlowStats = Object.entries(flowCounts)
      .filter(([_, count]) => count > 0) 
      .map(([name, count]) => ({ name, count }));
    setTrackedFlows(finalFlowStats);

    // 7. MATRIKS GRAFIK BAR HORIZONTAL UNTUK GEJALA (TOP 5)
    const sortedSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    setTrackedSymptoms(sortedSymptoms);

    // 8. INSIGHT TIPS HARIAN
    const tipsList = [
      "Tetap penuhi kebutuhan hidrasi harian untuk menjaga kestabilan energi menjelang masa prediksi siklus berikutnya.",
      "Sempatkan waktu 15-20 menit untuk peregangan atau yoga ringan guna melancarkan sirkulasi darah.",
      "Perbanyak konsumsi makanan kaya zat besi seperti bayam atau daging merah tanpa lemak untuk persiapan tubuh.",
      "Pastikan Anda mendapat tidur yang cukup (7-8 jam) agar hormon, tubuh, dan pikiran lebih rileks."
    ];
    setDailyTip(tipsList[today.getDate() % tipsList.length]);
  }, []);

  const maxFlowCount = trackedFlows.length > 0 ? Math.max(...trackedFlows.map(f => f.count)) : 1;
  const maxSymptomCount = trackedSymptoms.length > 0 ? Math.max(...trackedSymptoms.map(s => s.count)) : 1;

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans antialiased">
      {/* Handphone Frame Mockup */}
      <div className="bg-[#FFFDFE] w-full max-w-[390px] h-[844px] relative shadow-2xl overflow-hidden p-5 flex flex-col justify-between md:rounded-[40px]">
        
        {/* Konten Utama Scrollable */}
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

          {/* SECTION 1: KARTU RANGKUMAN SIKLUS REAL-TIME */}
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

          {/* SECTION 2: GRAFIK BATANG DINAMIS SIKLUS (JULI - SEPTEMBER) */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-gray-800 text-xs font-black tracking-wide uppercase opacity-80">Cycle Length</h3>
                <p className="text-[9px] font-bold text-gray-400 mt-0.5">(Purely tracked from calendar)</p>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-pink-50/80 px-2 py-0.5 rounded-md border border-pink-100/30">
                Rerata: <strong className="text-[#FF5C8A]">{avgCycleLength} hari</strong>
              </span>
            </div>

            <div className="bg-white/50 rounded-2xl p-4 border border-gray-50 pt-6 pb-2">
              {historyData.length > 0 ? (
                <>
                  <div className="relative h-[160px]">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[40, 30, 20, 10, 0].map((val) => (
                        <div key={val} className="w-full border-t border-gray-100 flex items-center relative">
                          <span className="text-[10px] font-extrabold text-gray-300 absolute left-0 -top-2.5 bg-[#FFFDFE] pr-2">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="absolute inset-0 left-8 right-2 flex items-end justify-around pb-[1px] z-10">
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
                                className={`w-[16px] rounded-full transition-all duration-300 ${
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

                  <div className="flex justify-around items-center pl-8 pr-2 mt-4">
                    {historyData.map((item, index) => {
                      const isSelected = selectedBarIndex === index;
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
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-center p-4">
                  <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                    Belum ada data input aktif yang diisi di kalender kamu sejak bulan Juli.<br/>
                    <span className="text-[10px] text-pink-400 font-bold">Silakan log kalender kamu terlebih dahulu.</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: GRAFIK BAR HORIZONTAL DATA FLOW & GEJALA (KEMBAR & RESPONSIF) */}
          <div className="space-y-4">
            <h3 className="text-gray-800 text-xs font-black tracking-wide uppercase opacity-80">Calendar Analytics</h3>

            {/* 2. GRAFIK BATANG HORIZONTAL: TOP 5 GEJALA */}
            <div className="bg-white border border-pink-50 rounded-2xl p-4 shadow-2xs space-y-3.5">
              <h4 className="text-[11px] font-black text-gray-700 tracking-wide uppercase opacity-80 flex items-center gap-1">
                ⚠️ Top Logged Symptoms Track
              </h4>
              
              {trackedSymptoms.length > 0 ? (
                <div className="space-y-3">
                  {trackedSymptoms.map((symptom, i) => {
                    const barWidth = (symptom.count / maxSymptomCount) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-extrabold text-gray-600">
                          <span>{symptom.name}</span>
                          <span className="text-pink-500 font-black">{symptom.count}x terdeteksi</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${barWidth}%` }} 
                            className="bg-pink-400 h-full rounded-full transition-all duration-500 shadow-3xs"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] font-medium text-gray-400 py-1">
                  Belum ada log catatan gejala aktif dari kalender utama saat ini.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 4: INSIGHTS KESEHATAN */}
          <div>
            <h3 className="text-gray-800 text-xs font-black tracking-wide mb-2 uppercase opacity-80">Health Insights</h3>
            <div className="bg-white border border-pink-50 rounded-2xl p-4 shadow-2xs space-y-3">
              <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                Rata-rata panjang siklus kamu dihitung murni dari jarak antar log hari pertama haid yang kamu isi, yaitu berada di kisaran <span className="text-[#FF5C8A] font-bold">{avgCycleLength} hari</span>. Seluruh visualisasi grafik di atas terikat real-time dengan modifikasi kalender kamu.
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
            
            <button className="flex flex-col items-center justify-center text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/200xl" fill="currentColor" viewBox="0 0 24 24" className="w-[18px] h-[18px]"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Stats</span>
            </button>
            
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