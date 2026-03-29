/**
 * AIPage - Página principal de IA (Modular)
 */

import React, { useState } from "react";
import {
  Bot,
  MessageSquare,
  Settings,
  Zap,
  Code,
  TrendingUp,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { AIConversations } from "../components/AIConversations";
import { AICapabilities } from "../components/AICapabilities";
import { AIConfiguration } from "../components/AIConfiguration";
import { AITools } from "../components/AITools";
import { AIStats } from "../components/AIStats";
import { useAI } from "../hooks/useAI";

export const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const { analytics, performance, exportConversations } = useAI();

  return (
    <>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-magenta-500/10 dark:bg-magenta-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-500 -z-10" />

      <div className="flex flex-col gap-8 p-4 md:p-8 relative z-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-linear-to-r from-cyan-500 to-magenta-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Violet AI
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Asistente inteligente con {analytics.activeSkills} de{" "}
              {analytics.totalSkills} skills activas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl h-12 px-6 font-black uppercase italic tracking-widest text-xs gap-2"
              onClick={exportConversations}
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <div className="h-12 w-12 bg-linear-to-br from-cyan-500 to-magenta-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <AIStats />

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Tiempo de Respuesta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.responseTime}s
              </div>
              <p className="text-xs text-muted-foreground mt-1">Promedio</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Tasa de Éxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {performance.successRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Respuestas exitosas
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Promedio Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.averageMessagesPerConversation}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por conversación
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.recentActivity}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg">
            <TabsTrigger value="chat" className="rounded-full px-6 gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="capabilities"
              className="rounded-full px-6 gap-2"
            >
              <Zap className="h-4 w-4" />
              Capacidades
            </TabsTrigger>
            <TabsTrigger value="tools" className="rounded-full px-6 gap-2">
              <Code className="h-4 w-4" />
              Herramientas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full px-6 gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="config" className="rounded-full px-6 gap-2">
              <Settings className="h-4 w-4" />
              Configuración
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Skills */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Skills Más Usadas</CardTitle>
                  <CardDescription>
                    Top 5 capacidades más utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.mostUsedSkills.map((skill, index) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <Badge>{skill.count} usos</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversations by Day */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Actividad Semanal</CardTitle>
                  <CardDescription>
                    Conversaciones por día (últimos 7 días)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.conversationsByDay.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString("es-VE", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-cyan-500 to-magenta-600"
                              style={{
                                width: `${(day.count / Math.max(...analytics.conversationsByDay.map((d) => d.count))) * 100}%`,
                              }}
                            />
                          </div>
                          <Badge variant="outline">{day.count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <AIConfiguration />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AIPage;
