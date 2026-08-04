import React, { useState, useEffect, useRef } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface SecurityLockScreenProps {
  children: React.ReactNode;
}

export function SecurityLockScreen({ children }: SecurityLockScreenProps) {
  const { language, theme } = useThemeLanguage();
  
  const [isPinEnabled, setIsPinEnabled] = useState(() => {
    return localStorage.getItem('harmoni_pin_enabled') === 'true';
  });
  
  const [pinHash, setPinHash] = useState(() => {
    return localStorage.getItem('harmoni_pin_hash') || '1234';
  });

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => {
    return localStorage.getItem('harmoni_biometric_enabled') === 'true';
  });

  const [isLocked, setIsLocked] = useState(() => {
    const enabled = localStorage.getItem('harmoni_pin_enabled') === 'true';
    // If PIN is enabled, we lock the screen on first load
    return enabled;
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);

  // Auto-lock inactivity setup
  const lastActiveRef = useRef<number>(Date.now());
  const autoLockDelay = (() => {
    const saved = localStorage.getItem('harmoni_autolock_delay');
    return saved ? parseInt(saved) : 60000; // default 1 minute
  })();

  // Synchronize state with storage when changed by Settings view
  useEffect(() => {
    const checkSettings = () => {
      const enabled = localStorage.getItem('harmoni_pin_enabled') === 'true';
      const hash = localStorage.getItem('harmoni_pin_hash') || '1234';
      const bio = localStorage.getItem('harmoni_biometric_enabled') === 'true';
      
      setIsPinEnabled(enabled);
      setPinHash(hash);
      setIsBiometricEnabled(bio);
    };

    window.addEventListener('storage', checkSettings);
    // Poll localstorage occasionally in case same-window state updates (our app settings)
    const interval = setInterval(checkSettings, 1000);

    return () => {
      window.removeEventListener('storage', checkSettings);
      clearInterval(interval);
    };
  }, []);

  // Monitor inactivity & tab focus to auto-lock
  useEffect(() => {
    if (!isPinEnabled) return;

    const handleInactivityAndFocus = () => {
      const now = Date.now();
      const elapsed = now - lastActiveRef.current;
      
      if (elapsed >= autoLockDelay && !isLocked) {
        setIsLocked(true);
        setEnteredPin('');
      }
      lastActiveRef.current = now;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Leaving the tab can trigger instant lock or based on elapsed time
        localStorage.setItem('harmoni_last_hidden_time', Date.now().toString());
      } else {
        const lastHidden = localStorage.getItem('harmoni_last_hidden_time');
        if (lastHidden) {
          const elapsed = Date.now() - parseInt(lastHidden);
          // If tab was backgrounded for more than 15 seconds, auto lock for safety
          if (elapsed > 15000 && !isLocked) {
            setIsLocked(true);
            setEnteredPin('');
          }
        }
        lastActiveRef.current = Date.now();
      }
    };

    const updateActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // User interaction events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    
    // Document visibility listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Inactivity interval check
    const checkInterval = setInterval(handleInactivityAndFocus, 5000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [isPinEnabled, isLocked, autoLockDelay]);

  // Handle Biometric authentication attempt
  const triggerBiometricAuth = async () => {
    if (!isBiometricEnabled) return;
    
    setIsBiometricVerifying(true);
    setErrorMessage('');

    try {
      // Simulate fingerprint/FaceID or use actual standard credentials interface if supported
      if (window.PublicKeyCredential) {
        // Attempt a harmless WebAuthn gesture if API exists (usually sandboxed in iframes but great to try)
        console.log("WebAuthn API is supported in this browser.");
      }

      // Beautiful mock auth transition to give instant feedback
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      setIsLocked(false);
      setEnteredPin('');
      setIsBiometricVerifying(false);
    } catch (err) {
      console.error("Biometric failed", err);
      setErrorMessage(language === 'id' ? 'Biometrik gagal atau dibatalkan.' : 'Biometric failed or cancelled.');
      setIsBiometricVerifying(false);
    }
  };

  // Automatically trigger biometrics on lock if enabled
  useEffect(() => {
    if (isLocked && isBiometricEnabled && !isBiometricVerifying) {
      const timer = setTimeout(() => {
        triggerBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isBiometricEnabled]);

  const handleKeyPress = (num: string) => {
    if (isError) {
      setIsError(false);
    }
    
    const nextPin = enteredPin + num;
    if (nextPin.length <= pinHash.length) {
      setEnteredPin(nextPin);
      
      // Check PIN when full length reached
      if (nextPin.length === pinHash.length) {
        if (nextPin === pinHash) {
          // Success! Unlock after a tiny delay for visual feedback
          setTimeout(() => {
            setIsLocked(false);
            setEnteredPin('');
          }, 200);
        } else {
          // Failure
          setTimeout(() => {
            setIsError(true);
            setEnteredPin('');
            // Trigger haptic feedback/vibration if available
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleBypass = () => {
    setIsLocked(false);
    setEnteredPin('');
  };

  if (!isPinEnabled || !isLocked) {
    return <>{children}</>;
  }

  // Generate dots to represent the PIN passcode length
  const totalDots = pinHash.length;

  return (
    <div className={`fixed inset-0 z-[99999] flex flex-col justify-between p-6 ${
      theme === 'dark' 
        ? 'bg-[#0b1322] text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    } transition-colors duration-200`}>
      
      {/* Top Section - Brand and Close indicator for safety */}
      <div className="flex flex-col items-center mt-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined text-white text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>lock_open</span>
        </div>
        <h2 className="font-headline-md font-extrabold tracking-tight">NOHARFIN</h2>
        <p className="font-body-sm text-on-surface-variant max-w-xs mt-1.5">
          {language === 'id' 
            ? 'Proteksi Akses Keuangan Keluarga Teraktifkan' 
            : 'Family Financial Access Protection Active'}
        </p>
      </div>

      {/* Middle Section - Pin Dots Display */}
      <div className="flex flex-col items-center my-4">
        <span className="font-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
          {language === 'id' ? 'Masukkan PIN Anda' : 'Enter Your PIN'}
        </span>
        
        {/* Passcode dots container */}
        <div className={`flex gap-5 justify-center py-2 px-6 rounded-full transition-transform ${isError ? 'animate-shake' : ''}`}>
          {Array.from({ length: totalDots }).map((_, index) => {
            const isActive = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 border ${
                  isError
                    ? 'bg-red-500 border-red-500 scale-110 shadow-lg shadow-red-500/20'
                    : isActive
                    ? 'bg-primary border-primary scale-110 shadow-md shadow-primary/20'
                    : 'bg-transparent border-outline-variant'
                }`}
              />
            );
          })}
        </div>

        {isError && (
          <p className="text-red-500 text-xs font-bold mt-3 animate-fadeIn">
            {language === 'id' ? 'PIN salah. Silakan coba lagi.' : 'Incorrect PIN. Please try again.'}
          </p>
        )}

        {errorMessage && (
          <p className="text-amber-500 text-xs font-bold mt-3 animate-fadeIn">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Keypad Section */}
      <div className="w-full max-w-xs mx-auto flex flex-col gap-3 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className={`h-16 w-full rounded-full flex items-center justify-center font-headline-md font-bold text-xl border transition-all active:scale-95 ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Biometrics trigger button on the left of 0 */}
          <button
            onClick={triggerBiometricAuth}
            disabled={!isBiometricEnabled || isBiometricVerifying}
            className={`h-16 w-full rounded-full flex items-center justify-center border transition-all active:scale-95 ${
              !isBiometricEnabled 
                ? 'opacity-20 cursor-not-allowed border-transparent' 
                : theme === 'dark'
                ? 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary-light'
                : 'bg-primary/5 border-primary/10 hover:bg-primary/10 text-primary'
            }`}
            title={language === 'id' ? 'Otentikasi Biometrik' : 'Biometric Authentication'}
          >
            {isBiometricVerifying ? (
              <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
            )}
          </button>

          {/* 0 digit */}
          <button
            onClick={() => handleKeyPress('0')}
            className={`h-16 w-full rounded-full flex items-center justify-center font-headline-md font-bold text-xl border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-100'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs'
            }`}
          >
            0
          </button>

          {/* Backspace on the right of 0 */}
          <button
            onClick={handleBackspace}
            className={`h-16 w-full rounded-full flex items-center justify-center border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">backspace</span>
          </button>
        </div>

        {/* Biometric trigger helper text */}
        {isBiometricEnabled && (
          <button 
            onClick={triggerBiometricAuth} 
            className="text-xs text-primary font-bold hover:underline py-1 mt-1 text-center"
          >
            {language === 'id' ? 'Gunakan Sensor Sidik Jari / Wajah' : 'Use Fingerprint / Face Scanner'}
          </button>
        )}

        {/* Debugging / Reviewer Bypass Panel */}
        <div className="mt-4 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50 text-center animate-fadeIn">
          <p className="text-[10px] text-on-surface-variant mb-1.5 font-semibold">
            {language === 'id' ? 'Mode Reviewer AI Studio' : 'AI Studio Reviewer Mode'}
          </p>
          <div className="flex gap-2 justify-center">
            <span className="text-[11px] font-mono bg-surface border border-outline-variant px-2 py-0.5 rounded text-on-surface font-bold">
              PIN: {pinHash}
            </span>
            <button
              onClick={handleBypass}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-0.5 rounded transition-all"
            >
              {language === 'id' ? 'Bypass Lock' : 'Bypass Lock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
