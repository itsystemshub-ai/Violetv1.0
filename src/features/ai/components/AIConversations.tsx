/**
 * AIConversations - Gestión de conversaciones de IA
 */

import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useAIStore } from '@/services/ai/AIService';
import { AIChat } from '@/shared/components/ai/AIChat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

export const AIConversations: React.FC = () => {
  const { conversations, activeConversationId, createConversation, deleteConversation, setActiveConversation } = useAIStore();
  const [newConvTitle, setNewConvTitle] = useState('');
  const [showNewConvInput, setShowNewConvInput] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateConversation = () => {
    if (newConvTitle.trim()) {
      createConversation(newConvTitle.trim());
      setNewConvTitle('');
      setShowNewConvInput(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    setDeleteConfirm(null);
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversaciones</CardTitle>
              <CardDescription>Historial de chats con IA</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowNewConvInput(!showNewConvInput)}
              className="bg-linear-to-br from-cyan-500 to-magenta-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewConvInput && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Título de la conversación"
                value={newConvTitle}
                onChange={(e) => setNewConvTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateConversation()}
              />
              <Button onClick={handleCreateConversation} size="sm">
                Crear
              </Button>
            </div>
          )}

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay conversaciones</p>
                  <p className="text-sm">Crea una nueva para empezar</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      activeConversationId === conv.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card hover:bg-accent border-border'
                    }`}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(conv.updatedAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conv.messages.length} mensajes
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(conv.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Active Conversation */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {activeConversation ? activeConversation.title : 'Selecciona una conversación'}
          </CardTitle>
          {activeConversation && (
            <CardDescription>{activeConversation.context || 'Chat general'}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {activeConversation ? (
            <div className="h-[500px]">
              <AIChat conversationId={activeConversation.id} />
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecciona o crea una conversación para empezar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteConversation(deleteConfirm)}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
