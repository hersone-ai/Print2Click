'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('brochure2campaign-theme');
    if (stored === 'dark' || stored === 'light') setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('brochure2campaign-theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
