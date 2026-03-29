import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/core/shared/utils/utils";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 rounded-xl transition-all duration-300",
        theme === "dark"
          ? "bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
      )}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </Button>
  );
};
