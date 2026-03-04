import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Info,
  RefreshCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAI } from "@/core/ai/hooks/useAI";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { springPresets } from "@/lib/motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  className?: string;
  contextData?: string;
  onClose?: () => void;
}

export function AIChat({ className, contextData, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy Violet AI. ¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { askViolet, isLoading, error, aiConfig } = useAI();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Verificar API key antes de enviar
    if (!aiConfig?.apiKey) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "⚠️ No has configurado tu API key de Groq.\n\nPor favor ve a Configuración > IA y guarda tu API key para usar el asistente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");

    try {
      const response = await askViolet(query, contextData);

      if (response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (error) {
        // Mostrar el error al usuario
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `❌ ${error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, ocurrió un error. Verifica tu conexión y que el servidor proxy esté corriendo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat reiniciado. ¿En qué puedo ayudarte?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Card
      className={cn(
        "flex flex-col border-border shadow-xl transition-all duration-300 overflow-hidden",
        isExpanded
          ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]"
          : "h-full w-full",
        className,
      )}
    >
      <CardHeader className="border-b bg-muted/30 py-2 px-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="bg-primary p-1.5 rounded-lg">
              <BrainCircuit className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              Violet AI
              <Sparkles className="h-3 w-3 text-primary" />
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Asistente Activo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={clearChat}
            title="Reiniciar chat"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative bg-background/50 backdrop-blur-sm">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springPresets.gentle}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-6 w-6 border shadow-sm",
                      msg.role === "assistant"
                        ? "bg-primary/10 border-primary/20"
                        : "bg-secondary",
                    )}
                  >
                    <AvatarFallback className="text-[10px]">
                      {msg.role === "assistant" ? (
                        <Bot className="h-3 w-3 text-primary" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-0.5">
                    <div
                      className={cn(
                        "p-2 rounded-xl text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                          : "bg-muted/80 text-foreground border border-border rounded-tl-none",
                      )}
                    >
                      {msg.content}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] text-muted-foreground",
                        msg.role === "user" ? "text-right" : "text-left",
                      )}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 max-w-[85%]"
                >
                  <Avatar className="h-6 w-6 bg-primary/10 border border-primary/20">
                    <AvatarFallback>
                      <Bot className="h-3 w-3 text-primary animate-pulse" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-[200px] bg-muted" />
                    <Skeleton className="h-3 w-[150px] bg-muted" />
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start text-xs text-destructive">
                  <Info className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-2 border-t bg-muted/20">
        <div className="flex w-full items-end gap-1.5">
          <div className="relative flex-1">
            <Input
              placeholder="Escribe tu pregunta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8 bg-background border-border/60 focus-visible:ring-primary h-9 text-xs resize-none py-2"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Sparkles
                className={cn(
                  "h-3 w-3 text-primary/40",
                  isLoading && "animate-pulse text-primary",
                )}
              />
            </div>
          </div>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-9 w-9 rounded-xl shadow-lg shadow-primary/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>

      <div className="absolute bottom-20 right-4 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1694903089438-bf28d4697d9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTk0NTh8MHwxfHNlYXJjaHwzfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwdGVjaG5vbG9neXxlbnwwfDB8fHwxNzcxMTAwNDc5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="AI Visual Context"
          className="w-24 h-24 object-cover rounded-full opacity-10 grayscale mix-blend-overlay"
        />
      </div>
    </Card>
  );
}
