import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import TaskDialog from "@/components/tasks/TaskDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "baixa" | "media" | "alta";
  status: "pendente" | "em_progresso" | "concluida";
  assigned_to: string | null;
  requested_by: string | null;
  created_at: string;
}

interface TaskNotification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function MinhasTarefas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    void fetchTasks();
    void fetchNotifications();
  }, []);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Erro ao carregar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
      setLoadingTasks(false);
      return;
    }

    setTasks((data ?? []) as Task[]);
    setLoadingTasks(false);
  };

  const fetchNotifications = async () => {
    // Task notifications table doesn't exist yet - skip for now
    setNotifications([]);
  };

  const markNotificationAsRead = async (id: string) => {
    const { error } = await supabase
      .from("task_notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast.error("Não foi possível marcar a notificação");
      return;
    }

    void fetchNotifications();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const toggleTask = async (task: Task, checked: boolean) => {
    const nextStatus: Task["status"] = checked ? "concluida" : "pendente";
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", task.id);
    if (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
  };

  const handleSave = () => {
    void fetchTasks();
    void fetchNotifications();
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "alta":
        return "bg-red-500";
      case "media":
        return "bg-yellow-500";
      case "baixa":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "concluida":
        return "bg-green-600";
      case "em_progresso":
        return "bg-blue-600";
      case "pendente":
        return "bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "concluida":
        return "Concluída";
      case "em_progresso":
        return "Em Progresso";
      case "pendente":
        return "Pendente";
      default:
        return status;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Minhas Tarefas</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {showNotifications && notifications.length > 0 ? (
          <Card className="mb-6 p-4">
            <h3 className="mb-3 font-semibold">Notificações</h3>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="flex w-full items-start justify-between rounded bg-muted p-2 text-left transition hover:bg-muted/80"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4">
          {loadingTasks ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Carregando tarefas...</p>
            </Card>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'concluida'}
                    onCheckedChange={(v) => toggleTask(task, Boolean(v))}
                  />
                  <div className="flex-1 cursor-pointer" onClick={() => handleEdit(task)}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className={`text-base font-semibold ${task.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                    {task.description ? (
                      <p className="mb-1 text-sm text-muted-foreground">{task.description}</p>
                    ) : null}
                    {task.due_date ? (
                      <p className="text-xs text-muted-foreground">
                        Prazo: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <TaskDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTask(null);
            }
          }}
          task={editingTask ?? undefined}
          onSave={handleSave}
        />
      </div>
    </Layout>
  );
}
