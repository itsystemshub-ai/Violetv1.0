import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { usePasswordRequests } from '../../hooks/usePasswordRequests';
import { ShieldAlert, Check, X, Clock, User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PasswordRequestsPanel: React.FC = () => {
  const { requests, isLoading, fetchRequests, approveRequest, rejectRequest } = usePasswordRequests();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card className="border-violet-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-violet-500" />
            <CardTitle>Solicitudes de Cambio de Contraseña</CardTitle>
          </div>
          <CardDescription>
            Como administrador, debes aprobar o rechazar manualmente las solicitudes de cambio de contraseña enviadas desde la pantalla de login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted/20">
                <Check className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-violet-500/30 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-foreground flex items-center gap-2">
                          {request.username}
                          <Badge variant="outline" className="text-[10px] font-black uppercase">
                            Pendiente
                          </Badge>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(request.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            ID: {request.user_id || 'Usuario no encontrado'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 sm:flex-none border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => rejectRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-2" /> Rechazar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700"
                        onClick={() => approveRequest(request.id)}
                      >
                        <Check className="h-4 w-4 mr-2" /> Aprobar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {historyRequests.length > 0 && (
        <Card className="border-border/30 bg-muted/5 font-mono text-[10px]">
          <CardHeader className="py-3">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {historyRequests.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-1 border-b border-border/10 last:border-0 opacity-60">
                  <span className="flex items-center gap-2">
                    {r.status === 'approved' ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                    {r.username} - {r.status === 'approved' ? 'APROBADA' : 'RECHAZADA'}
                  </span>
                  <span>{format(new Date(r.created_at), "dd/MM HH:mm")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PasswordRequestsPanel;
