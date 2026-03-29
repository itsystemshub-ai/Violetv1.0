import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem("violet-theme") as Theme;
    return savedTheme || "light"; // Modo claro por defecto
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover ambas clases primero
    root.classList.remove("light", "dark");
    
    // Agregar la clase del tema actual
    root.classList.add(theme);
    
    // Guardar en localStorage
    localStorage.setItem("violet-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
