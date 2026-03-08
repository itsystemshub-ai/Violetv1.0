/**
 * AIStats - Estadísticas de uso de IA (Modular)
 */

import React from "react";
import { MessageSquare, Zap, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useAIStore } from "@/services/ai/AIService";

export const AIStats: React.FC = () => {
  const { conversations, capabilities } = useAIStore();

  const totalMessages = conversations.reduce(
    (acc, conv) => acc + conv.messages.length,
    0,
  );
  const enabledCapabilities = capabilities.filter((c) => c.enabled).length;
  const recentConversations = conversations.filter((conv) => {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return new Date(conv.updatedAt) > dayAgo;
  }).length;

  const stats = [
    {
      label: "Conversaciones",
      value: conversations.length,
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Mensajes Totales",
      value: totalMessages,
      icon: TrendingUp,
      color: "text-magenta-500",
      bgColor: "bg-magenta-500/10",
    },
    {
      label: "Skills Activas",
      value: `${enabledCapabilities}/${capabilities.length}`,
      icon: Zap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Últimas 24h",
      value: recentConversations,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border-border/50 bg-card/50 backdrop-blur-sm"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div
                className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
