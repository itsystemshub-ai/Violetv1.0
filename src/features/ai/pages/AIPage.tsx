/**
 * AIPage - Página principal de IA
 * 
 * Centraliza todas las funcionalidades de IA:
 * - Conversaciones y chat
 * - Capacidades y skills
 * - Configuración de IA
 * - Historial y análisis
 * - Herramientas especializadas
 */

import React, { useState } from 'react';
import { Bot, MessageSquare, Settings, Zap, Code, Database, Palette, TestTube, Bug, FileCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AIConversations } from '../components/AIConversations';
import { AICapabilities } from '../components/AICapabilities';
import { AIConfiguration } from '../components/AIConfiguration';
import { AITools } from '../components/AITools';
import { AIStats } from '../components/AIStats';

export const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-magenta-500/10 dark:bg-magenta-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-500 -z-10" />

      <main className="container mx-auto px-4 sm:px-6 pt-6 space-y-6 relative z-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-linear-to-r from-cyan-500 to-magenta-600 bg-clip-text text-transparent">
              Violet AI
            </h1>
            <p className="text-muted-foreground mt-1">
              Asistente inteligente con 21 skills activas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-linear-to-br from-cyan-500 to-magenta-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <AIStats />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Capacidades</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Herramientas</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <AIConversations />
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-4">
            <AICapabilities />
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <AITools />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <AIConfiguration />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AIPage;
