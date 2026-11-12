import { useTheme as useThemeContext } from './ThemeContext';

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider.
 */
export const useTheme = useThemeContext;