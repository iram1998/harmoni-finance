import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n';

export type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (key: keyof typeof translations['id']) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('harmoni_language');
    return (saved === 'id' || saved === 'en') ? saved : 'id';
  });

  // Theme State
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('harmoni_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply Theme class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('harmoni_theme', theme);
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('harmoni_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const setTheme = (th: Theme) => {
    setThemeState(th);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const t = (key: keyof typeof translations['id']): string => {
    const langDict = translations[language] || translations['id'];
    return langDict[key] || translations['id'][key] || key;
  };

  return (
    <ThemeLanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      theme,
      setTheme,
      toggleTheme,
      t
    }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
}
