import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null) ?? 'light';
    setThemeState(stored);
    document.documentElement.classList.toggle('dark', stored === 'dark');
  }, []);

  const apply = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: apply,
        toggleTheme: () => apply(theme === 'light' ? 'dark' : 'light'),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
