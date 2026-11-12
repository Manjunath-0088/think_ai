import { createContext, useContext } from 'react';

export const ThemeContext = createContext();

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}