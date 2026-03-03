import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Loader2 } from "lucide-react";

const Todos = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const { data, error } = await supabase.from("todos").select("*");

        if (error) {
          // Si la tabla no existe, mostramos un aviso amigable
          if (
            error.code === "PGRST116" ||
            error.message.includes("not found")
          ) {
            console.warn("La tabla 'todos' no existe en Supabase.");
            return;
          }
          throw error;
        }

        setTodos(data || []);
      } catch (error: any) {
        console.error("Error fetching todos:", error);
        toast.error("Error al cargar la lista de tareas.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Tareas (Todos)
          </h1>
          <p className="text-muted-foreground mt-1">
            Demostración de conexión directa con la base de datos Supabase.
          </p>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <ListTodo className="h-6 w-6" />
        </div>
      </div>

      <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Pendientes y Completadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Conectando con Supabase...</p>
            </div>
          ) : todos.length > 0 ? (
            <ul className="space-y-3">
              {todos.map((todo, idx) => (
                <li
                  key={todo.id || idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 hover:border-primary/20 transition-all hover:shadow-sm"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${todo.completed ? "bg-green-500" : "bg-amber-500"}`}
                  />
                  <span
                    className={
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {todo.title || todo.name || JSON.stringify(todo)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm">
                <ListTodo className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                No hay tareas encontradas.
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Para ver datos aquí, asegúrate de tener una tabla 'todos' en tu
                base de datos de Supabase.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <h3 className="font-semibold text-primary mb-1 text-sm">
            Prueba de Conector Vite
          </h3>
          <p className="text-xs text-muted-foreground">
            A diferencia de Next.js, aquí usamos `createClient` desde el cliente
            directamente, aprovechando el SDK de Supabase optimizado para el
            navegador.
          </p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <h3 className="font-semibold text-indigo-700 mb-1 text-sm">
            Estado Reactivo
          </h3>
          <p className="text-xs text-muted-foreground">
            Los datos se manejan con `useState` y `useEffect`, manteniendo la UI
            siempre sincronizada con la respuesta del servidor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Todos;
