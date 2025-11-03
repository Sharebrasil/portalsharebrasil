import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Clock, AlertCircle, CheckCircle, Filter, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_by: string | null;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
}

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    getCurrentUser();

    // Subscribe to task changes
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        creator:user_profiles!tasks_created_by_fkey(full_name),
        assignee:user_profiles!tasks_assigned_to_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar tarefas");
      console.error(error);
    } else {
      const tasksWithNames = data.map((task: any) => ({
        ...task,
        creator_name: task.creator?.full_name || "Sistema",
        assignee_name: task.assignee?.full_name || "Não atribuída"
      }));
      setTasks(tasksWithNames);
    }
    setLoading(false);
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir tarefa");
    } else {
      toast.success("Tarefa excluída com sucesso");
      loadTasks();
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "concluido" ? "aberto" : "concluido";

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
    } else {
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === "todas") return true;
    return task.status === statusFilter;
  });

  const stats = {
    total: tasks.length,
    aberto: tasks.filter(t => t.status === "aberto").length,
    em_andamento: tasks.filter(t => t.status === "em_andamento").length,
    concluido: tasks.filter(t => t.status === "concluido").length
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Alta</Badge>;
      case "media":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Média</Badge>;
      case "baixa":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Baixa</Badge>;
      default:
        return <Badge variant="secondary">{prioridade}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Concluída</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Em Andamento</Badge>;
      case "aberto":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Aberto</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "em_andamento":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "aberto":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minhas Tarefas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas atividades e acompanhe o progresso
            </p>
          </div>
          <TaskFormDialog onSuccess={loadTasks} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.aberto}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.em_andamento}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.concluido}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Lista de Tarefas
              </CardTitle>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="aberto">Abertas</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando tarefas...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa encontrada
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.status === "concluido"}
                        onCheckedChange={() => toggleTaskStatus(task)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{task.title}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Prioridade:</span>
                              {getPrioridadeBadge(task.priority)}
                            </div>
                          </div>
                          {task.due_date && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Vencimento</div>
                              <div className="text-sm font-medium">{formatDate(task.due_date)}</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Criado por: <strong className="text-foreground">{task.creator_name}</strong></span>
                            <span>Atribuído para: <strong className="text-foreground">{task.assignee_name}</strong></span>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <TaskFormDialog taskId={task.id} onSuccess={loadTasks}>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </TaskFormDialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}