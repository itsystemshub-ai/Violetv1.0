/**
 * AIFloatingButton - Botón flotante para abrir el chat de IA
 * 
 * Skills aplicadas:
 * - web-design-guidelines: Diseño accesible
 * - tailwind-design-system: Estilos consistentes
 */

import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { AIChat } from './AIChat';
import { useAIStore } from '@/services/ai/AIService';

export const AIFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useAIStore();

  // Don't render if AI is disabled
  if (!config.enabled) {
    return null;
  }

  if (isOpen) {
    return <AIChat onClose={() => setIsOpen(false)} />;
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Abrir asistente de IA"
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-300" />
        
        {/* Button */}
        <div className="relative h-14 w-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110">
          <Bot className="h-6 w-6 text-primary-foreground" />
          <Sparkles className="h-3 w-3 text-primary-foreground absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-popover text-popover-foreground text-sm px-3 py-2 rounded-md shadow-md whitespace-nowrap">
            Asistente IA
            <div className="text-xs text-muted-foreground">21 skills activas</div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default AIFloatingButton;
