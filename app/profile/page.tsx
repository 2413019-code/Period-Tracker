"use client";

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // State untuk melacak apakah sedang dalam mode edit
  const [isEditing, setIsEditing] = useState(false);

  // State untuk foto profil (default menggunakan emoji, bisa diganti file gambar)
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // State Data Profil
  const [profileData, setProfileData] = useState({
    name: 'Amanda Putri',
    email: 'amanda.cycle@email.com',
    dob: '14 Februari 2002',
    bloodType: 'O+',
    height: '162',
    weight: '51'
  });

  // State Data Siklus
  const [cycleData, setCycleData] = useState({
    avgCycle: '28',
    mensLength: '5',
    reminder: 'H-2 Sebelum Siklus'
  });

  // ==========================================
  // TAMBAHAN AMBIL DATA SIKLUS DARI MEMORI HP
  // ==========================================
  useEffect(() => {
    const savedCycle = localStorage.getItem('userCycleLength');
    if (savedCycle) {
      setCycleData(prev => ({ ...prev, avgCycle: savedCycle }));
    }
  }, []);

  // ==========================================
  // TAMBAHAN FUNGSI UNTUK MENYIMPAN SIKLUS
  // ==========================================
  const handleSaveCycleLength = () => {
    if (cycleData && cycleData.avgCycle) {
      localStorage.setItem('userCycleLength', cycleData.avgCycle);
    }
    setIsEditing(false);
  };

  // State Data Privasi (Hanya PIN yang bisa diubah)
  const [privacyData, setPrivacyData] = useState({
    pin: '1234'
  });

  // Fungsi saat foto diklik untuk memicu input file komputer/HP
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Fungsi menangani perubahan file gambar yang diunggah
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  // Fungsi dinamis untuk me-render isi modal
  const renderModalContent = () => {
    const inputStyle = "bg-pink-50 border border-pink-200 rounded px-2 py-0.5 w-28 text-right font-semibold text-gray-700 outline-none focus:border-[#FF5C8A] transition";

    switch (activeModal) {
      case 'PERSONAL INFORMATION':
        return (
          <div className="text-left space-y-3 text-[11px] text-[#333333]">
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Nama Lengkap:</strong>
              {isEditing ? <input type="text" className={inputStyle} value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} /> : <span>{profileData.name}</span>}
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Tanggal Lahir:</strong>
              {isEditing ? <input type="text" className={inputStyle} value={profileData.dob} onChange={(e) => setProfileData({...profileData, dob: e.target.value})} /> : <span>{profileData.dob}</span>}
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Golongan Darah:</strong>
              {isEditing ? <input type="text" className={inputStyle} value={profileData.bloodType} onChange={(e) => setProfileData({...profileData, bloodType: e.target.value})} /> : <span>{profileData.bloodType}</span>}
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Tinggi Badan:</strong>
              {isEditing ? <div className="flex items-center gap-1"><input type="number" className="bg-pink-50 border border-pink-200 rounded px-1 py-0.5 w-14 text-center font-semibold text-gray-700 outline-none focus:border-[#FF5C8A]" value={profileData.height} onChange={(e) => setProfileData({...profileData, height: e.target.value})} /> cm</div> : <span>{profileData.height} cm</span>}
            </div>
            <div className="flex justify-between items-center pb-1">
              <strong>Berat Badan:</strong>
              {isEditing ? <div className="flex items-center gap-1"><input type="number" className="bg-pink-50 border border-pink-200 rounded px-1 py-0.5 w-14 text-center font-semibold text-gray-700 outline-none focus:border-[#FF5C8A]" value={profileData.weight} onChange={(e) => setProfileData({...profileData, weight: e.target.value})} /> kg</div> : <span>{profileData.weight} kg</span>}
            </div>
          </div>
        );
      case 'CYCLE SETTINGS':
        return (
          <div className="text-left space-y-3 text-[11px] text-[#333333]">
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Rata-rata Siklus:</strong>
              {isEditing ? <div className="flex items-center gap-1"><input type="number" className="bg-pink-50 border border-pink-200 rounded px-1 py-0.5 w-14 text-center font-semibold text-gray-700 outline-none focus:border-[#FF5C8A]" value={cycleData.avgCycle} onChange={(e) => setCycleData({...cycleData, avgCycle: e.target.value})} /> Hari</div> : <span>{cycleData.avgCycle} Hari</span>}
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Lama Menstruasi:</strong>
              {isEditing ? <div className="flex items-center gap-1"><input type="number" className="bg-pink-50 border border-pink-200 rounded px-1 py-0.5 w-14 text-center font-semibold text-gray-700 outline-none focus:border-[#FF5C8A]" value={cycleData.mensLength} onChange={(e) => setCycleData({...cycleData, mensLength: e.target.value})} /> Hari</div> : <span>{cycleData.mensLength} Hari</span>}
            </div>
            <div className="flex justify-between items-center pb-1">
              <strong>Notifikasi Pengingat:</strong>
              {isEditing ? <input type="text" className={inputStyle} value={cycleData.reminder} onChange={(e) => setCycleData({...cycleData, reminder: e.target.value})} /> : <span>{cycleData.reminder}</span>}
            </div>
          </div>
        );
      case 'PRIVACY & SECURITY':
        return (
          <div className="text-left space-y-3 text-[11px] text-[#333333]">
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Kunci PIN Aplikasi:</strong>
              {isEditing ? (
                <input 
                  type="password" 
                  maxLength={6} 
                  className={inputStyle} 
                  value={privacyData.pin} 
                  onChange={(e) => setPrivacyData({ pin: e.target.value })} 
                />
              ) : (
                <span className="text-emerald-600 font-bold">Aktif ({privacyData.pin.replace(/./g, '*')})</span>
              )}
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <strong>Autentikasi Biometrik:</strong>
              <span className="text-emerald-600">Aktif</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <strong>Enkripsi Data Cloud:</strong>
              <span>Amandemen AES-256</span>
            </div>
          </div>
        );
      case 'HELP & SUPPORT':
        return (
          <div className="text-left space-y-2 text-[11px] text-[#333333]">
            <p className="font-semibold text-[#FF5C8A]">Butuh bantuan medis atau teknis?</p>
            <div className="bg-gray-50 p-2 rounded-lg text-[10px] text-gray-500">
              Hubungi Customer Service kami di support@periodtracker.com atau akses menu Live Chat 24/7.
            </div>
          </div>
        );
      case 'ABOUT US':
        return (
          <div className="text-left space-y-1 text-[11px] text-[#333333]">
            <p><strong>Period Tracker App</strong></p>
            <p className="text-gray-400 text-[10px]">Versi Aplikasi: v2.4.1 (Stable Build)</p>
            <p className="text-gray-500 mt-2">Aplikasi asisten pelacak kesuburan dan siklus bulanan wanita modern paling akurat.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { name: 'PERSONAL INFORMATION', editable: true },
    { name: 'CYCLE SETTINGS', editable: true },
    { name: 'PRIVACY & SECURITY', editable: true },
    { name: 'HELP & SUPPORT', editable: false },
    { name: 'ABOUT US', editable: false },
  ];

  const handleCloseModal = () => {
    setActiveModal(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      {/* Ubah bg disini menjadi bg-[#FFFDFE] */}
      <div className="bg-[#FFFDFE] w-full max-w-[390px] h-[844px] max-h-screen relative shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:rounded-[40px]">
        
        {/* Header Profile - Sekarang Foto Bisa Diklik */}
        <div className="pt-4 flex flex-col items-center">
          {/* Input File Tersembunyi */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          {/* Lingkaran Foto Profil yang bisa di klik */}
          <button 
            type="button"
            onClick={handlePhotoClick}
            className="w-16 h-16 rounded-full bg-pink-100 border-2 border-white shadow-md flex items-center justify-center text-2xl mb-2 overflow-hidden relative group"
            title="Klik untuk ubah foto"
          >
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>👩‍🦰</span>
            )}
            {/* Lapisan Hover Efek Transparan */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">
              Ubah
            </div>
          </button>

          <h2 className="text-sm font-extrabold text-[#333333]">{profileData.name}</h2>
          <p className="text-[10px] text-gray-400 font-medium">{profileData.email}</p>
        </div>

        {/* Clean Menu Container */}
        <div className="flex-1 my-6 flex flex-col justify-center space-y-3 px-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveModal(item.name)}
              className="w-full bg-pink-50 text-[#FF5C8A] font-extrabold italic text-[11px] tracking-wide py-3 px-5 rounded-full text-center transition transform active:scale-95 shadow-[3px_3px_0px_#FBCFE8] border border-pink-200"
            >
              {item.name}
            </button>
          ))}

          {/* Tombol Log Out */}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full bg-red-50 text-red-500 font-extrabold italic text-[11px] tracking-wide py-3 px-5 rounded-full text-center transition transform active:scale-95 shadow-[3px_3px_0px_#FFC1C1] border border-red-100 mt-4"
          >
            LOG OUT FROM ACCOUNT
          </button>
        </div>

        {/* Pop-up Modal Detail Data Dinamis */}
        {activeModal && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white w-full rounded-2xl p-5 shadow-xl text-center max-w-[300px]">
              
              {/* Header Modal & Tombol Edit */}
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xs font-black text-[#FF5C8A] tracking-wide">{activeModal}</h3>
                {menuItems.find(m => m.name === activeModal)?.editable && (
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="text-[10px] font-extrabold text-[#FF5C8A] bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-full transition"
                  >
                    {isEditing ? 'Batal' : '✏️ Edit'}
                  </button>
                )}
              </div>
              
              {/* Konten Modal */}
              <div className="mb-5">
                {renderModalContent()}
              </div>

              {/* Tombol Aksi Bawah - SUDAH TERPASANG FUNGSINYA */}
              {isEditing ? (
                <button 
                  onClick={activeModal === 'CYCLE SETTINGS' ? handleSaveCycleLength : () => setIsEditing(false)}
                  className="w-full bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition"
                >
                  ✓ Simpan Perubahan
                </button>
              ) : (
                <button 
                  onClick={handleCloseModal}
                  className="w-full bg-[#FF5C8A] text-white py-2 rounded-xl text-[10px] font-bold shadow-md hover:bg-[#e04b75] active:scale-95 transition"
                >
                  Kembali
                </button>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        <div className="bg-white h-14 rounded-[20px] shadow-lg flex items-center justify-between px-4 relative">
          <button type="button" onClick={() => router.push('/')} className="flex flex-col items-center justify-center flex-1 py-1 text-[#9CA3AF]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            <span className="text-[8px] font-medium mt-0.5">Home</span>
          </button>
          <button type="button" onClick={() => router.push('/calendar')} className="flex flex-col items-center justify-center flex-1 py-1 text-[#9CA3AF]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-4.75m18 4.75v-4.75m-18-3.5h18" /></svg>
            <span className="text-[8px] font-medium mt-0.5">Calendar</span>
          </button>
          <div className="flex-1 flex justify-center -mt-6 relative z-20">
            <button type="button" onClick={() => router.push('/')} className="w-10 h-10 bg-[#FF5C8A] rounded-full flex items-center justify-center shadow-xl text-white font-bold text-xl">+</button>
          </div>
          <button type="button" onClick={() => router.push('/stats')} className="flex flex-col items-center justify-center flex-1 py-1 text-[#9CA3AF]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            <span className="text-[8px] font-medium mt-0.5">Stats</span>
          </button>
          <button type="button" className="flex flex-col items-center justify-center flex-1 py-1 text-[#FF5C8A]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
            <span className="text-[8px] font-bold mt-0.5">Profile</span>
          </button>
        </div>

      </div>
    </div>
  );
}