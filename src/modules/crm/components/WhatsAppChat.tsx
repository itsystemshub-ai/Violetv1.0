import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  Mic,
  CheckCheck,
  Phone,
  Video,
  FileText,
  Image as ImageIcon,
  Receipt,
} from "lucide-react";
import { cn } from "@/core/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { useCRMStore, Message } from "../hooks/useCRMStore";
import { useTenant } from "@/shared/hooks/useTenant";
import { Loader2 } from "lucide-react";

export const WhatsAppChat = () => {
  const { tenant } = useTenant();
  const {
    chats,
    activeChatId,
    setActiveChat,
    sendMessage,
    fetchChats,
    isLoading,
  } = useCRMStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tenant?.id) {
      fetchChats(tenant.id);
    }
  }, [tenant?.id, fetchChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeChat || !tenant?.id) return;
    sendMessage(activeChat.id, inputText, tenant.id);
    setInputText("");
  };

  return (
    <div className="flex h-[70vh] bg-card rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Sidebar - Chat List */}
      <div className="w-[350px] border-r flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="p-4 border-b flex items-center justify-between bg-white/40 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                V
              </AvatarFallback>
            </Avatar>
            <h2 className="font-black text-lg">Chats</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
            >
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chat..."
              className="pl-10 h-10 rounded-full bg-white/50 dark:bg-black/30 border-none shrink-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-xs font-bold text-muted-foreground">
                Cargando chats...
              </p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground/40">
              <MessageSquare size={48} className="mb-4" />
              <p className="font-bold text-sm">No hay chats reales</p>
              <p className="text-[10px]">
                Las conversaciones operativas se mostrarán aquí.
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-white/60 dark:hover:bg-black/40 border-b border-border/10",
                  activeChatId === chat.id &&
                    "bg-primary/5 border-l-4 border-l-primary",
                )}
              >
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold">
                    {chat.customerName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-sm truncate">
                      {chat.customerName}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {chat.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate italic">
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white/30 dark:bg-black/10">
        {/* Chat Header */}
        <div className="p-3 border-b flex items-center justify-between bg-white/50 dark:bg-black/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {activeChat?.customerName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-black text-sm">{activeChat?.customerName}</h4>
              <p className="text-[10px] text-lime-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                En línea
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <Phone size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <Video size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <Search size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://whatsapp-clone-nextjs.vercel.app/images/whatsapp-bg-light.png')] dark:bg-[url('https://whatsapp-clone-nextjs.vercel.app/images/whatsapp-bg-dark.png')] bg-repeat bg-center">
          {activeChat?.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full mb-1 bounce-in",
                m.sender === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2 rounded-2xl shadow-sm relative",
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-white dark:bg-slate-800 text-foreground rounded-tl-none border border-border/20 shadow-lg",
                )}
              >
                {m.type === "text" && (
                  <p className="text-sm font-medium leading-relaxed">
                    {m.text}
                  </p>
                )}
                {m.type === "document" && (
                  <div className="flex items-center gap-3 bg-black/5 p-2 rounded-lg border border-black/10">
                    <FileText className="w-8 h-8 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{m.fileName}</p>
                      <p className="text-[10px] opacity-70">PDF Document</p>
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1 opacity-60",
                    m.sender === "user"
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="text-[9px] font-bold">{m.timestamp}</span>
                  {m.sender === "user" && (
                    <CheckCheck size={10} className="text-cyan-300" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border-t flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary rounded-full"
          >
            <Smile size={22} />
          </Button>
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary rounded-full"
            >
              <Paperclip size={22} />
            </Button>

            {/* Attachment Menu */}
            <div className="absolute bottom-14 left-0 w-48 bg-card border rounded-2xl shadow-2xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-600"
                onClick={() =>
                  sendMessage(
                    activeChat.id,
                    "Factura_V_1205.pdf",
                    tenant?.id || "",
                    "document",
                    "#",
                    "Factura_V_1205.pdf",
                  )
                }
              >
                <Receipt size={16} className="text-emerald-500" />
                Enviar Factura
              </Button>
              <div className="h-px bg-border my-1" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl text-xs font-medium"
              >
                <ImageIcon size={16} className="text-purple-500" />
                Imagen
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl text-xs font-medium"
              >
                <FileText size={16} className="text-blue-500" />
                Documento
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <Input
              placeholder="Escribe un mensaje..."
              className="rounded-full bg-white dark:bg-slate-800 border-border/20 h-11 px-6 text-sm focus-visible:ring-primary shadow-inner"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
          {inputText.trim() ? (
            <Button
              size="icon"
              className="rounded-full h-11 w-11 bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
              onClick={handleSend}
            >
              <Send size={20} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary rounded-full h-11 w-11"
            >
              <Mic size={22} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
