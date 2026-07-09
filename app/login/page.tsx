"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State untuk interaksi UI (Show/Hide Password)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [notif, setNotif] = useState({ type: '', message: '' });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif({ type: '', message: '' }), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && (!fullName || !confirmPassword))) {
      showNotification('error', 'Semua kolom wajib diisi!');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      showNotification('error', 'Password dan Confirm Password tidak cocok!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (isLogin) {
        // ==========================================
        // KODE INTEGRASI: Simpan email & nama otomatis saat login biasa
        // ==========================================
        localStorage.setItem('userEmail', email.trim());
        
        // Jika belum ada nama yang tersimpan, buat nama instan dari email (contoh: amanda@email.com -> amanda)
        if (!localStorage.getItem('userName')) {
          const defaultName = email.split('@')[0];
          const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
          localStorage.setItem('userName', capitalizedName);
        }

        router.push('/'); 
      } else {
        // ==========================================
        // KODE INTEGRASI: Simpan nama dan email saat register
        // ==========================================
        localStorage.setItem('userName', fullName.trim());
        localStorage.setItem('userEmail', email.trim());

        showNotification('success', 'Akun berhasil dibuat! Silakan Login.');
        setIsLogin(true); 
        setPassword('');
        setConfirmPassword('');
      }
    }, 1500);
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      // ==========================================
      // KODE INTEGRASI: Simpan data akun Google
      // ==========================================
      localStorage.setItem('userName', 'Vivian');
      localStorage.setItem('userEmail', 'vivian@google.com');

      setIsGoogleLoading(false);
      router.push('/');
    }, 2000);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      showNotification('error', 'Ketik email Anda dulu di kolom Email untuk mereset password.');
      return;
    }
    showNotification('success', `Link reset password telah dikirim ke ${email}`);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setNotif({ type: '', message: '' }); 
    setPassword('');
    setConfirmPassword('');
  };

  // Komponen SVG Icon Mata (Terbuka)
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // Komponen SVG Icon Mata (Tertutup)
  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-[#FFF0F3] w-full max-w-[390px] h-[844px] max-h-screen relative shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:rounded-[40px] transition-all">
        
        {notif.message && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-[90%] px-4 py-3 rounded-2xl text-xs font-medium text-center z-50 shadow-md transition-all animate-bounce
            ${notif.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            {notif.message}
          </div>
        )}

        <div className="flex flex-col items-center mt-12 w-full">
          <div className="w-24 h-24 bg-white rounded-full mb-4 flex items-center justify-center shadow-lg border-4 border-pink-100 relative p-4">
            <img 
              src="logo-period.png" 
              alt="Period Tracker Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-[#FF5C8A]">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            {isLogin ? 'Track your cycle.' : "Let's get started!"} <span className="text-[#FF5C8A] font-semibold">Love your body.</span>
          </p>

          <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
            
            {!isLogin && (
              <div className="animate-fade-in">
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name" 
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#FF5C8A] shadow-sm text-[#333333]" 
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
            )}

            <div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="w-full px-4 py-3 bg-white border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#FF5C8A] shadow-sm text-[#333333]" 
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            <div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" 
                  className="w-full pl-4 pr-10 py-3 bg-white border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#FF5C8A] shadow-sm text-[#333333]" 
                  disabled={isLoading || isGoogleLoading}
                />
                
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF] hover:text-[#FF5C8A] z-10"
                  disabled={isLoading || isGoogleLoading}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {isLogin && (
                <div className="text-right mt-2">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#FF5C8A] font-medium hover:underline"
                    disabled={isLoading || isGoogleLoading}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password" 
                    className="w-full pl-4 pr-10 py-3 bg-white border border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#FF5C8A] shadow-sm text-[#333333]" 
                    disabled={isLoading || isGoogleLoading}
                  />
                  
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF] hover:text-[#FF5C8A] z-10"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-md transition mt-4 text-sm flex items-center justify-center gap-2 
                ${isLoading ? 'bg-pink-300 cursor-not-allowed' : 'bg-[#FF5C8A] hover:bg-[#e04b75]'}`}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="flex items-center my-5 w-full text-center">
            <div className="flex-1 border-t border-gray-300 opacity-50"></div>
            <span className="px-3 text-[11px] text-[#9CA3AF]">or continue with</span>
            <div className="flex-1 border-t border-gray-300 opacity-50"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleAuth}
            disabled={isLoading || isGoogleLoading}
            className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-100 py-2.5 rounded-xl text-xs font-bold shadow-sm transition 
              ${isGoogleLoading ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#333333] hover:bg-gray-50 active:scale-95'}`}
          >
            {isGoogleLoading ? 'Connecting...' : 'Google'}
          </button>
        </div>

        <div className="text-center text-xs mb-4 text-[#333333]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={toggleAuthMode}
            className="text-[#FF5C8A] font-bold hover:underline"
            disabled={isLoading || isGoogleLoading}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>

      </div>
    </div>
  );
}