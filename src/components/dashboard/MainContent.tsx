import { useState, useEffect } from "react";
import { Calendar, CheckSquare, Plane, Clock, Users, FileText, ArrowRight, User, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import aviationHero from "@/assets/aviation-hero.jpg";
import TaskDialog from "@/components/tasks/TaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function MainContent() {
  const navigate = useNavigate();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`assigned_to.eq.${user.id},requested_by.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar tarefas:", error);
    } else {
      setTasks(data || []);
    }
  };

  const quickAccess = [
    {
      title: "Agenda",
      description: "Visualizar compromissos e contatos",
      icon: Calendar,
      action: () => navigate("/agenda"),
      gradient: "from-primary to-primary-dark",
    },
    {
      title: "Minhas Tarefas",
      description: "Gerenciar atividades e pendências",
      icon: CheckSquare,
      action: () => setTaskDialogOpen(true),
      gradient: "from-secondary to-accent",
    },
    {
      title: "Meu Perfil",
      description: "Informações pessoais e documentos",
      icon: User,
      action: () => navigate("/perfil"),
      gradient: "from-primary-dark to-primary",
    },
  ];

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date === today && task.status !== 'concluida';
  });

  const scheduledFlights: any[] = [];

  return (
    <main className="flex-1 p-6 space-y-6 bg-gradient-subtle">
      {/* Hero Section com Mensagem de Boas-vindas */}
      <div className="relative mb-8 rounded-2xl overflow-hidden shadow-elevated">
        <div
          className="h-64 bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: `url(${aviationHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
          <div className="relative h-full flex items-center px-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Bem-vindo ao Portal Share Brasil
              </h1>
              <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                Acesse rapidamente as principais funcionalidades do sistema de gestão para aviação
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acessos Rápidos */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Acessos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickAccess.map((item, index) => (
            <Card
              key={index}
              className="group bg-gradient-card border-border shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer overflow-hidden hover-scale"
              onClick={item.action}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 shadow-primary`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border hover:bg-primary hover:text-primary-foreground hover:border-primary group"
                >
                  Acessar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarefas do Dia */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-foreground">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Tarefas do Dia
            </CardTitle>
            <Badge className="bg-primary text-primary-foreground">
              {todayTasks.length} pendentes
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma tarefa programada para hoje</p>
              </div>
            ) : (
              todayTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Checkbox />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Prioridade: {task.priority}
                    </p>
                  </div>
                  <Badge variant={task.status === 'pendente' ? 'secondary' : 'default'}>
                    {task.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Voos Agendados */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-foreground">
              <Plane className="mr-2 h-5 w-5 text-primary" />
              Voos Agendados
            </CardTitle>
            <Button variant="outline" size="sm" className="border-border hover:bg-accent">
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum voo agendado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSave={fetchTasks}
      />
    </main>
  );
}