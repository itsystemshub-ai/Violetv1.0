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
import { localDb } from "@/core/database/localDb";

interface CRMState {
  activeTab: CRMTab;
  setTab: (tab: CRMTab) => void;
  chats: Chat[];
  isLoading: boolean;
  activeChatId: string | null;
  setActiveChat: (id: string) => void;
  fetchChats: (tenantId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, tenantId: string, type?: Message["type"], fileUrl?: string, fileName?: string) => Promise<void>;
  addChat: (chat: Chat, tenantId: string) => Promise<void>;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      activeTab: "pipeline",
      setTab: (tab) => set({ activeTab: tab }),
      chats: [],
      isLoading: false,
      activeChatId: null,
      setActiveChat: (id) => set({ activeChatId: id }),

      fetchChats: async (tenantId) => {
        if (!tenantId || tenantId === 'none') {
          set({ chats: [], activeChatId: null });
          return;
        }

        set({ isLoading: true });
        try {
          const localChats = await localDb.crm_chats
            .where("tenant_id")
            .equals(tenantId)
            .toArray();
          
          const fullChats = await Promise.all(
            localChats.map(async (c) => {
              const messages = await localDb.crm_messages
                .where("chat_id")
                .equals(c.id)
                .toArray();
              
              return {
                id: c.id,
                customerId: c.customer_id,
                customerName: c.customer_name,
                lastMessage: c.last_message,
                lastMessageTime: c.last_message_time,
                unreadCount: c.unread_count || 0,
                status: c.status || "offline",
                messages: messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(m => ({
                  id: m.id,
                  sender: m.sender,
                  text: m.text,
                  timestamp: m.timestamp_label || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: m.type,
                  fileUrl: m.file_url,
                  fileName: m.file_name
                }))
              };
            })
          );

          set({ chats: fullChats, isLoading: false });
          if (fullChats.length > 0 && !get().activeChatId) {
            set({ activeChatId: fullChats[0].id });
          }
        } catch (error) {
          console.error("[useCRMStore] Error fetching chats:", error);
          set({ isLoading: false });
        }
      },

      sendMessage: async (chatId, text, tenantId, type = "text", fileUrl, fileName) => {
        const now = new Date();
        const timestampLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMessage: Message = {
          id: crypto.randomUUID(),
          sender: "user",
          text,
          timestamp: timestampLabel,
          type,
          fileUrl,
          fileName,
        };

        // UI Optimistic Update
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: text,
                  lastMessageTime: timestampLabel,
                  messages: [...chat.messages, newMessage],
                }
              : chat
          ),
        }));

        try {
          await localDb.crm_messages.add({
            id: newMessage.id,
            chat_id: chatId,
            tenant_id: tenantId,
            sender: "user",
            text,
            type,
            file_url: fileUrl,
            file_name: fileName,
            timestamp: now.toISOString(),
            timestamp_label: timestampLabel
          });

          await localDb.crm_chats.update(chatId, {
            last_message: text,
            last_message_time: timestampLabel,
            updated_at: now.toISOString()
          });
        } catch (error) {
          console.error("[useCRMStore] Error saving message:", error);
        }
      },

      addChat: async (chat, tenantId) => {
        try {
          await localDb.crm_chats.add({
            id: chat.id,
            customer_id: chat.customerId,
            customer_name: chat.customerName,
            tenant_id: tenantId,
            status: chat.status,
            last_message: chat.lastMessage,
            last_message_time: chat.lastMessageTime,
            unread_count: chat.unreadCount,
            created_at: new Date().toISOString()
          });

          // Add initial messages if any
          if (chat.messages.length > 0) {
            await localDb.crm_messages.bulkAdd(chat.messages.map(m => ({
              id: m.id,
              chat_id: chat.id,
              tenant_id: tenantId,
              sender: m.sender,
              text: m.text,
              type: m.type,
              file_url: m.fileUrl,
              file_name: m.fileName,
              timestamp: new Date().toISOString(),
              timestamp_label: m.timestamp
            })));
          }

          set((state) => ({ chats: [chat, ...state.chats] }));
        } catch (error) {
          console.error("[useCRMStore] Error adding chat:", error);
        }
      },
    }),
    {
      name: "violet-crm-chats-v2",
    }
  )
);
