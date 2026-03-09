/**
 * useAI - Hook personalizado para gestión avanzada de IA (Modular)
 * Extiende las capacidades del AIStore con funcionalidades adicionales
 */

import { useState, useMemo } from 'react';
import { useAIStore } from '@/services/ai/AIService';

export interface AIAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  activeSkills: number;
  totalSkills: number;
  recentActivity: number;
  mostUsedSkills: Array<{ name: string; count: number }>;
  conversationsByDay: Array<{ date: string; count: number }>;
  messagesByHour: Array<{ hour: number; count: number }>;
}

export interface AIPerformance {
  responseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
}

export const useAI = () => {
  const store = useAIStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Analytics calculadas
  const analytics = useMemo<AIAnalytics>(() => {
    const totalConversations = store.conversations.length;
    const totalMessages = store.conversations.reduce((acc, conv) => acc + conv.messages.length, 0);
    const averageMessagesPerConversation = totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0;
    
    const activeSkills = store.capabilities.filter((c: any) => c.enabled).length;
    const totalSkills = store.capabilities.length;

    // Actividad reciente (últimas 24 horas)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const recentActivity = store.conversations.filter(conv => 
      new Date(conv.updatedAt) > dayAgo
    ).length;

    // Skills más usadas - datos reales del historial
    const skillUsage = new Map<string, number>();
    store.conversations.forEach((conv: any) => {
      conv.messages?.forEach((msg: any) => {
        if (msg.metadata?.skillsUsed) {
          msg.metadata.skillsUsed.forEach((skill: string) => {
            skillUsage.set(skill, (skillUsage.get(skill) || 0) + 1);
          });
        }
      });
    });
    
    const mostUsedSkills = Array.from(skillUsage.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Conversaciones por día (últimos 7 días)
    const conversationsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = store.conversations.filter(conv => 
        String(conv.createdAt).startsWith(dateStr)
      ).length;
      return { date: dateStr, count };
    }).reverse();

    // Mensajes por hora (últimas 24 horas) - datos reales
    const messagesByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourMessages = store.conversations.flatMap((c: any) => c.messages || []).filter((m: any) => {
        const msgDate = new Date(m.timestamp);
        return msgDate.getHours() === hour;
      });
      return { hour, count: hourMessages.length };
    });

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      activeSkills,
      totalSkills,
      recentActivity,
      mostUsedSkills,
      conversationsByDay,
      messagesByHour,
    };
  }, [store.conversations, store.capabilities]);

  // Performance metrics - datos reales
  const performance = useMemo<AIPerformance>(() => {
    let totalResponseTime = 0;
    let responseCount = 0;
    let errorCount = 0;
    
    store.conversations.forEach((conv: any) => {
      const messages = conv.messages || [];
      for (let i = 0; i < messages.length - 1; i++) {
        const userMsg = messages[i];
        const assistantMsg = messages[i + 1];
        
        if (userMsg.role === 'user' && assistantMsg.role === 'assistant') {
          const userTime = new Date(userMsg.timestamp).getTime();
          const assistantTime = new Date(assistantMsg.timestamp).getTime();
          const responseTime = assistantTime - userTime;
          
          if (responseTime > 0 && responseTime < 300000) { // Max 5 minutos
            totalResponseTime += responseTime;
            responseCount++;
          }
          
          if (assistantMsg.metadata?.error || assistantMsg.content?.includes('error')) {
            errorCount++;
          }
        }
      }
    });
    
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const totalRequests = analytics.totalMessages;
    const successRate = totalRequests > 0 ? Math.round(((totalRequests - errorCount) / totalRequests) * 100) : 100;
    const errorRate = totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0;
    
    return {
      responseTime: avgResponseTime,
      successRate,
      errorRate,
      totalRequests,
    };
  }, [store.conversations, analytics.totalMessages]);

  // Conversaciones filtradas
  const filteredConversations = useMemo(() => {
    let filtered = store.conversations;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.context?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(conv => 
        new Date(conv.updatedAt) >= filterDate
      );
    }

    return filtered;
  }, [store.conversations, searchQuery, dateFilter]);

  // Skills filtradas
  const filteredSkills = useMemo(() => {
    if (skillFilter === 'all') return store.capabilities;
    if (skillFilter === 'enabled') return store.capabilities.filter((c: any) => c.enabled);
    if (skillFilter === 'disabled') return store.capabilities.filter((c: any) => !c.enabled);
    return store.capabilities.filter((c: any) => c.category === skillFilter);
  }, [store.capabilities, skillFilter]);

  // Funciones auxiliares
  const exportConversations = () => {
    const data = JSON.stringify(store.conversations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllConversations = () => {
    store.conversations.forEach(conv => store.deleteConversation(conv.id));
  };

  const toggleAllSkills = (enabled: boolean) => {
    store.capabilities.forEach((cap: any) => {
      if (cap.enabled !== enabled) {
        store.toggleCapability(cap.id);
      }
    });
  };

  const getConversationStats = (conversationId: string) => {
    const conversation = store.conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    return {
      messageCount: conversation.messages.length,
      userMessages: conversation.messages.filter((m: any) => m.role === 'user').length,
      assistantMessages: conversation.messages.filter((m: any) => m.role === 'assistant').length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      duration: new Date(conversation.updatedAt).getTime() - new Date(conversation.createdAt).getTime(),
    };
  };

  const getSkillUsage = (skillId: string) => {
    let timesUsed = 0;
    let lastUsed: string | null = null;
    let successCount = 0;
    
    store.conversations.forEach((conv: any) => {
      conv.messages?.forEach((msg: any) => {
        if (msg.metadata?.skillsUsed?.includes(skillId)) {
          timesUsed++;
          const msgTime = new Date(msg.timestamp).toISOString();
          if (!lastUsed || msgTime > lastUsed) {
            lastUsed = msgTime;
          }
          if (!msg.metadata?.error) {
            successCount++;
          }
        }
      });
    });
    
    const successRate = timesUsed > 0 ? Math.round((successCount / timesUsed) * 100) : 0;
    
    return {
      timesUsed,
      lastUsed: lastUsed || new Date().toISOString(),
      successRate,
    };
  };

  return {
    // Estado del store
    ...store,
    
    // Estado local
    loading,
    setLoading,
    searchQuery,
    setSearchQuery,
    skillFilter,
    setSkillFilter,
    dateFilter,
    setDateFilter,
    
    // Datos filtrados
    filteredConversations,
    filteredSkills,
    
    // Analytics
    analytics,
    performance,
    
    // Funciones auxiliares
    exportConversations,
    clearAllConversations,
    toggleAllSkills,
    getConversationStats,
    getSkillUsage,
  };
};
