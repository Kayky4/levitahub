
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  storageKey = 'levitahub-ui-theme',
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check if HTML already has class (applied by blocking script)
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) return 'dark';
      if (document.documentElement.classList.contains('light')) return 'light';
    }
    // 2. Fallback to storage or default
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clean up classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to local storage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}
