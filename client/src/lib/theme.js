import { createContext, useContext } from 'react';
export const ThemeContext = createContext({ theme: 'dark', toggle() {} });
export const useTheme = () => useContext(ThemeContext);
