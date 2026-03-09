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

    // Skills más usadas (simulado - en producción vendría del backend)
    const mostUsedSkills = store.capabilities
      .filter((c: any) => c.enabled)
      .slice(0, 5)
      .map((c: any) => ({ name: c.name, count: Math.floor(Math.random() * 50) + 10 }))
      .sort((a: any, b: any) => b.count - a.count);

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

  // Performance metrics (simulado)
  const performance = useMemo<AIPerformance>(() => ({
    responseTime: 1.2, // segundos
    successRate: 98.5, // porcentaje
    errorRate: 1.5, // porcentaje
    totalRequests: analytics.totalMessages,
  }), [analytics.totalMessages]);

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

  const getSkillUsage = (_skillId: string) => {
    // En producción, esto vendría del backend
    return {
      timesUsed: Math.floor(Math.random() * 100),
      lastUsed: new Date().toISOString(),
      successRate: 95 + Math.random() * 5,
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
