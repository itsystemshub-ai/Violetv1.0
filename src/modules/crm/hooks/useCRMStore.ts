import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  sender: "customer" | "user";
  text: string;
  timestamp: string;
  type: "text" | "image" | "document";
  fileUrl?: string;
  fileName?: string;
}

export interface Chat {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  status: "online" | "offline" | "away";
}

export type CRMTab = "pipeline" | "clientes" | "tickets" | "comunicaciones" | "analytics" | "automatizacion";

interface CRMState {
  activeTab: CRMTab;
  setTab: (tab: CRMTab) => void;
  chats: Chat[];
  activeChatId: string | null;
  setActiveChat: (id: string) => void;
  sendMessage: (chatId: string, text: string, type?: Message["type"], fileUrl?: string, fileName?: string) => void;
  addChat: (chat: Chat) => void;
}

const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "Empresa ABC",
    lastMessage: "Hola, ¿tienen disponibilidad de mangueras?",
    lastMessageTime: "10:30 AM",
    unreadCount: 2,
    status: "online",
    messages: [
      { id: "m1", sender: "customer", text: "Hola, ¿tienen disponibilidad de mangueras?", timestamp: "10:30 AM", type: "text" },
      { id: "m2", sender: "user", text: "Hola! Sí, ¿qué medida buscas?", timestamp: "10:32 AM", type: "text" },
    ],
  },
  {
    id: "2",
    customerId: "2",
    customerName: "Consultora Pro",
    lastMessage: "Muchas gracias por la cotización",
    lastMessageTime: "Ayer",
    unreadCount: 0,
    status: "offline",
    messages: [
      { id: "m3", sender: "user", text: "Le adjunto la cotización #123", timestamp: "Ayer", type: "text" },
      { id: "m4", sender: "customer", text: "Muchas gracias por la cotización", timestamp: "Ayer", type: "text" },
    ],
  },
];

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      activeTab: "pipeline",
      setTab: (tab) => set({ activeTab: tab }),
      chats: MOCK_CHATS,
      activeChatId: "1",
      setActiveChat: (id) => set({ activeChatId: id }),
      sendMessage: (chatId, text, type = "text", fileUrl, fileName) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: text,
                  lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  messages: [
                    ...chat.messages,
                    {
                      id: crypto.randomUUID(),
                      sender: "user",
                      text,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      type,
                      fileUrl,
                      fileName,
                    },
                  ],
                }
              : chat
          ),
        })),
      addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
    }),
    {
      name: "violet-crm-chats",
    }
  )
);
