"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PeriodRecord {
  start: string; // Format "YYYY-MM-DD"
  end: string;   // Format "YYYY-MM-DD"
}

export default function CalendarPage() {
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodHistory, setPeriodHistory] = useState<PeriodRecord[]>([]);
  const [flowLevels, setFlowLevels] = useState<Record<string, number>>({});

  // STATE UNTUK MODAL LOG HARIAN
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState<string>(""); 

  // State temporary untuk input tanggal di dalam modal
  const [modalPeriodStart, setModalPeriodStart] = useState<string>("");
  const [modalPeriodEnd, setModalPeriodEnd] = useState<string>("");

  // Helper format key "YYYY-MM-DD"
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Menambah hari pada string "YYYY-MM-DD" dan mengembalikan string "YYYY-MM-DD" baru
  const addDaysAndFormat = (dateStr: string, days: number): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    targetDate.setDate(targetDate.getDate() + days);
    
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getLocalTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  const addDaysToStringDate = (dateStr: string, days: number) => {
    if (!dateStr) return 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate.getTime();
  };

  useEffect(() => {
    const savedCycle = localStorage.getItem('userCycleLength');
    if (savedCycle) setCycleLength(parseInt(savedCycle, 10));

    const savedHistory = localStorage.getItem('userPeriodHistory');
    if (savedHistory) setPeriodHistory(JSON.parse(savedHistory));

    const savedFlows = localStorage.getItem('userFlowLevels');
    if (savedFlows) setFlowLevels(JSON.parse(savedFlows));

    const dateKey = formatDateKey(selectedDate);
    const savedDailyLogs = localStorage.getItem(`daily_log_${dateKey}`);
    if (savedDailyLogs) {
      const parsed = JSON.parse(savedDailyLogs);
      setSelectedMood(parsed.mood || "");
      setSelectedSymptoms(parsed.symptoms || []);
      setNote(parsed.note || ""); 
    } else {
      setSelectedMood("");
      setSelectedSymptoms([]);
      setNote("");
    }
  }, [selectedDate]);

  // Sinkronisasi deteksi bulan otomatis agar Akhir Haid tidak lari ke bulan lain
  useEffect(() => {
    if (isLogModalOpen) {
      const targetYear = selectedDate.getFullYear();
      const targetMonth = selectedDate.getMonth();

      const existingRecord = periodHistory.find(record => {
        const [pYear, pMonth] = record.start.split('-').map(Number);
        return pYear === targetYear && (pMonth - 1) === targetMonth;
      });

      if (existingRecord) {
        setModalPeriodStart(existingRecord.start);
        setModalPeriodEnd(existingRecord.end || addDaysAndFormat(existingRecord.start, 4));
      } else {
        const defaultStart = formatDateKey(selectedDate);
        setModalPeriodStart(defaultStart);
        setModalPeriodEnd(addDaysAndFormat(defaultStart, 4)); 
      }
    }
  }, [isLogModalOpen, periodHistory, selectedDate]);

  const handleStartCalendarChange = (newStartDate: string) => {
    setModalPeriodStart(newStartDate);
    if (newStartDate) {
      setModalPeriodEnd(addDaysAndFormat(newStartDate, 4));
    }
  };

  // FITUR UNDO DI PASANG PADA FLOW
  const handleFlowChange = (level: number) => {
    const dateKey = formatDateKey(selectedDate);
    const currentLevel = flowLevels[dateKey] || 0;
    
    // Jika level yang diklik sama dengan yang sudah ada, set menjadi 0 (Undo)
    const newLevel = currentLevel === level ? 0 : level;
    
    const updatedFlows = { ...flowLevels, [dateKey]: newLevel };
    setFlowLevels(updatedFlows);
    localStorage.setItem('userFlowLevels', JSON.stringify(updatedFlows));
  };

  const handleSaveDailyLog = () => {
    const dateKey = formatDateKey(selectedDate);
    const logData = { mood: selectedMood, symptoms: selectedSymptoms, note: note };
    localStorage.setItem(`daily_log_${dateKey}`, JSON.stringify(logData));

    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();

    let updatedHistory = periodHistory.filter(record => {
      const [pYear, pMonth] = record.start.split('-').map(Number);
      return !(pYear === targetYear && (pMonth - 1) === targetMonth);
    });

    if (modalPeriodStart) {
      updatedHistory.push({
        start: modalPeriodStart,
        end: modalPeriodEnd
      });
    }

    setPeriodHistory(updatedHistory);
    localStorage.setItem('userPeriodHistory', JSON.stringify(updatedHistory));
    setIsLogModalOpen(false); 
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newMonth);
    setSelectedDate(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newMonth);
    setSelectedDate(newMonth);
  };

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
    return `${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}, ${selectedDate.toLocaleDateString('en-US', options)}`;
  };

  const currentSelectedFlow = flowLevels[formatDateKey(selectedDate)] || 0;

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans">
      <div className="bg-[#FFFDFD] w-full max-w-[390px] h-[844px] max-h-screen relative shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:rounded-[40px]">
        
        {/* HEADER */}
        <div className="pt-4 flex justify-between items-center text-[#FF5C8A]">
          <button onClick={() => router.push('/')} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <h1 className="font-extrabold text-[#FF5C8A] text-base tracking-wide mr-6">Calendar</h1>
          <div className="w-5"></div>
        </div>

        {/* CALENDAR BODY */}
        <div className="flex-1 flex flex-col justify-start mt-4 overflow-y-auto no-scrollbar pb-6 hide-scrollbar">
          
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
              const isSelected = item.date.getDate() === selectedDate.getDate() && 
                                 item.date.getMonth() === selectedDate.getMonth() &&
                                 item.date.getFullYear() === selectedDate.getFullYear();

              let isPeriod = false;
              let isNextPeriodPredict = false;
              let isOvulation = false;
              let isFertile = false;

              periodHistory.forEach(record => {
                const startTime = getLocalTimestamp(record.start);
                const endTime = record.end ? getLocalTimestamp(record.end) : 0;

                if (startTime) {
                  const computedEndTime = endTime ? endTime : addDaysToStringDate(record.start, 4);
                  if (itemTime >= startTime && itemTime <= computedEndTime) {
                    isPeriod = true;
                  }
                }

                if (startTime) {
                  const nextPeriodStartPredict = addDaysToStringDate(record.start, cycleLength);
                  const durationDays = (startTime && endTime) ? Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)) : 4;
                  const nextPeriodEndPredict = addDaysToStringDate(record.start, cycleLength + durationDays);

                  if (itemTime >= nextPeriodStartPredict && itemTime <= nextPeriodEndPredict) {
                    isNextPeriodPredict = true;
                  }
                }

                if (startTime) {
                  const ovulationDayOffset = cycleLength - 14; 
                  const ovulationTime = addDaysToStringDate(record.start, ovulationDayOffset);
                  const fertileStart = addDaysToStringDate(record.start, ovulationDayOffset - 4);
                  const fertileEnd = addDaysToStringDate(record.start, ovulationDayOffset + 1);

                  const nextOvulationTime = addDaysToStringDate(record.start, cycleLength + ovulationDayOffset);
                  const nextFertileStart = addDaysToStringDate(record.start, cycleLength + ovulationDayOffset - 4);
                  const nextFertileEnd = addDaysToStringDate(record.start, cycleLength + ovulationDayOffset + 1);

                  if (itemTime === ovulationTime || itemTime === nextOvulationTime) {
                    isOvulation = true;
                  } else if ((itemTime >= fertileStart && itemTime <= fertileEnd) || (itemTime >= nextFertileStart && itemTime <= nextFertileEnd)) {
                    isFertile = true;
                  }
                }
              });

              if (isPeriod || isNextPeriodPredict) isFertile = false;

              return (
                <div key={index} className="flex justify-center items-center h-7 relative">
                  {isPeriod && <div className="absolute w-full h-7 bg-pink-100 z-0"></div>}
                  <button 
                    onClick={() => setSelectedDate(item.date)}
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
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FF769E] rounded-full"></div>Period</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FFF0F3] border border-pink-200 rounded-full"></div>Next Period</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#B19CFF] rounded-full"></div>Ovulation</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#C1E0FF] rounded-full"></div>Fertile</div>
          </div>

          {/* FLOW CARD */}
          <div className="mt-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex justify-between items-center">
              <div className="text-left w-full">
                <h4 className="text-xs font-black text-[#333333] mb-2">{formatSelectedDate()}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-gray-400 w-24">
                    {currentSelectedFlow === 1 ? "Light Flow" : currentSelectedFlow === 2 ? "Medium Flow" : currentSelectedFlow === 3 ? "Heavy Flow" : "No Flow Logged"}
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((level) => (
                      <button key={level} type="button" onClick={() => handleFlowChange(level)} className={`text-sm transition ${currentSelectedFlow >= level ? 'opacity-100' : 'opacity-20'}`}>🩸</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DAILY LOG SUMMARY (Muncul otomatis jika ada data yang diisi) */}
          {(selectedMood || selectedSymptoms.length > 0 || note) && (
            <div className="mt-4 animate-fadeIn">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
                <h4 className="text-xs font-black text-[#333333]">Today's Log Summary</h4>
                
                {selectedMood && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 mb-1.5 uppercase tracking-wide">Mood</p>
                    <span className="inline-block px-3 py-1 bg-pink-50 text-[#FF5C8A] rounded-full text-[10px] font-bold">
                      {selectedMood}
                    </span>
                  </div>
                )}

                {selectedSymptoms.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 mb-1.5 uppercase tracking-wide">Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSymptoms.map((symp, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full text-[9px] font-bold">
                          {symp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {note && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 mb-1.5 uppercase tracking-wide">Notes</p>
                    <div className="text-[10px] font-medium text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 break-words">
                      {note}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 mb-2">
            <button 
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="w-full bg-[#FF5C8A] text-white py-3 rounded-full text-xs font-black shadow-md active:scale-95 transition-transform tracking-wide"
            >
              Edit Period & Daily Log
            </button>
          </div>
        </div>

        {/* BOTTOM NAVBAR */}
        <div className="px-0 mt-2">
          <div className="bg-white h-[54px] rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-between px-6">
           <button type="button" className="flex flex-col items-center justify-center py-1 text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.99a.75.75 0 01-1.06 1.06l-1.06-1.06V20.25A1.75 1.75 0 0117.65 22H14.25v-5.25a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V22H6.35a1.75 1.75 0 01-1.75-1.75v-7.43L3.54 13.89a.75.75 0 01-1.06-1.06l8.99-8.99z" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Home</span>
            </button>
            
            <button type="button" className="flex flex-col items-center justify-center py-1 text-[#FF5C8A]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9h-16.5v8.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V11.25z" clipRule="evenodd" /></svg>
              <span className="text-[8px] font-bold mt-0.5">Calendar</span>
            </button>
            
            <button type="button" onClick={() => router.push('/stats')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Stats</span>
            </button>
            
            <button type="button" onClick={() => router.push('/profile')} className="flex flex-col items-center justify-center py-1 text-[#9CA3AF] hover:text-[#FF5C8A] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="text-[8px] font-medium mt-0.5">Profile</span>
            </button>
          </div>
        </div>

        {/* MODAL SHEET */}
        {isLogModalOpen && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-end justify-center animate-fadeIn">
            <div className="absolute inset-0" onClick={() => setIsLogModalOpen(false)}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-8 relative z-10 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-slideUp">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1"></div>
              <div>
                <h3 className="text-sm font-black text-[#333333]">Daily Log & Period Editor</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{formatSelectedDate()}</p>
              </div>

              {/* SET RENTANG TANGGAL */}
              <div className="bg-pink-50/50 border border-pink-100/80 rounded-2xl p-3.5">
                <h4 className="text-[11px] font-black text-[#FF5C8A] mb-2.5 uppercase tracking-wider">Set Period Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Awal Haid</label>
                    <input 
                      type="date" 
                      value={modalPeriodStart}
                      onChange={(e) => handleStartCalendarChange(e.target.value)}
                      className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2 text-gray-700 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Akhir Haid</label>
                    <input 
                      type="date" 
                      value={modalPeriodEnd}
                      onChange={(e) => setModalPeriodEnd(e.target.value)}
                      className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2 text-gray-700 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MOOD DENGAN FITUR UNDO */}
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
                      onClick={() => setSelectedMood(selectedMood === item.label ? "" : item.label)}
                      className={`flex flex-col items-center p-2 rounded-xl transition gap-1 ${selectedMood === item.label ? 'bg-pink-50 scale-110 ring-1 ring-pink-200' : 'opacity-60'}`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-[9px] font-bold text-gray-600">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GEJALA LENGKAP */}
              <div>
                <h4 className="text-[11px] font-black text-gray-500 mb-2 uppercase tracking-wider">What hurts or aches today?</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Cramps (Kram Perut)", icon: "⚡" },
                    { name: "Headache (Pusing)", icon: "🤕" },
                    { name: "Backache (Sakit Punggung)", icon: "🧍" },
                    { name: "Tender Breasts (Nyeri Payudara)", icon: "👚" },
                    { name: "Fatigue (Lelah)", icon: "🥱" },
                    { name: "Nausea (Mual)", icon: "🤢" },
                    { name: "Acne (Jerawat)", icon: "🧼" },
                    { name: "Food Craving", icon: "🍕" },
                    { name: "Sleepy (Mengantuk)", icon: "😴" },
                    { name: "Stressed (Stres)", icon: "🤯" }
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

              {/* CATATAN */}
              <div>
                <h4 className="text-[11px] font-black text-gray-500 mb-2 uppercase tracking-wider">Notes / Catatan</h4>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis catatan kesehatan Anda hari ini di sini..."
                  className="w-full text-xs font-medium border border-gray-200 rounded-xl p-3 text-gray-700 bg-gray-50 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-pink-200"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 border border-gray-200 py-3 rounded-full text-xs font-black text-gray-500 bg-gray-50">Cancel</button>
                <button type="button" onClick={handleSaveDailyLog} className="flex-1 bg-[#FF5C8A] text-white py-3 rounded-full text-xs font-black shadow-md">Save Log</button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Helper CSS agar hide-scrollbar tetap bekerja jika belum ada di global css Anda */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}