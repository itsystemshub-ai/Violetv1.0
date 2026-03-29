/**
 * AICapabilities - Gestión de capacidades y skills de IA (Modular)
 */

import React from "react";
import {
  Zap,
  Code,
  Palette,
  Database,
  TestTube,
  Bug,
  FileCode,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import { useAIStore } from "@/services/ai/AIService";

const categoryIcons = {
  analysis: Code,
  automation: Zap,
  suggestion: Palette,
  chat: FileCode,
};

const categoryColors = {
  analysis: "text-cyan-500 bg-cyan-500/10",
  automation: "text-magenta-500 bg-magenta-500/10",
  suggestion: "text-purple-500 bg-purple-500/10",
  chat: "text-blue-500 bg-blue-500/10",
};

const categoryLabels = {
  analysis: "Análisis",
  automation: "Automatización",
  suggestion: "Sugerencias",
  chat: "Chat",
};

export const AICapabilities: React.FC = () => {
  const { capabilities, toggleCapability } = useAIStore();

  const groupedCapabilities = capabilities.reduce(
    (acc, cap) => {
      if (!acc[cap.category]) {
        acc[cap.category] = [];
      }
      acc[cap.category].push(cap);
      return acc;
    },
    {} as Record<string, typeof capabilities>,
  );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Capacidades de IA
          </CardTitle>
          <CardDescription>
            Gestiona las skills y capacidades disponibles para el asistente de
            IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(groupedCapabilities).map(([category, caps]) => {
              const Icon =
                categoryIcons[category as keyof typeof categoryIcons];
              const enabled = caps.filter((c) => c.enabled).length;
              return (
                <div
                  key={category}
                  className={`p-4 rounded-lg border ${categoryColors[category as keyof typeof categoryColors]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {enabled}/{caps.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">activas</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities by Category */}
      {Object.entries(groupedCapabilities).map(([category, caps]) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons];
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </CardTitle>
              <CardDescription>
                {caps.length} capacidades disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caps.map((capability) => (
                  <div
                    key={capability.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{capability.name}</h4>
                        <Badge
                          variant={capability.enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {capability.enabled ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                    <Switch
                      checked={capability.enabled}
                      onCheckedChange={() => toggleCapability(capability.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
