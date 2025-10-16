import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  logoSrc: string;
}

// Create a context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  logoSrc: '/black-logo.png',
});

// Custom hook for easy consumption of the context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the provider component
export const ThemeProvider = ThemeContext.Provider;
