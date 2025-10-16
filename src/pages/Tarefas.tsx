import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Filter } from "lucide-react";

export default function Tarefas() {
  const tarefas = [
    {
      id: 1,
      titulo: "Revisão semanal da aeronave PR-ABC",
      descricao: "Inspeção completa dos sistemas de navegação e comunicação",
      prioridade: "Alta",
      status: "Pendente",
      vencimento: "2024-01-20",
      responsavel: "Carlos Silva",
      categoria: "Manutenção",
    },
    {
      id: 2,
      titulo: "Atualização do plano de voo SP-RJ",
      descricao: "Revisar rota e condições meteorológicas para voo executivo",
      prioridade: "Média",
      status: "Em andamento",
      vencimento: "2024-01-18",
      responsavel: "Ana Costa",
      categoria: "Operacional",
    },
    {
      id: 3,
      titulo: "Relatório mensal de combustível",
      descricao: "Compilar dados de consumo e custos de combustível do mês",
      prioridade: "Baixa",
      status: "Concluída",
      vencimento: "2024-01-15",
      responsavel: "João Santos",
      categoria: "Financeiro",
    },
    {
      id: 4,
      titulo: "Treinamento de segurança da equipe",
      descricao: "Sessão obrigatória sobre novos protocolos de segurança",
      prioridade: "Alta",
      status: "Pendente",
      vencimento: "2024-01-25",
      responsavel: "Maria Oliveira",
      categoria: "Treinamento",
    },
  ];

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "Alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case "Média":
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case "Baixa":
        return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return <Badge variant="secondary">{prioridade}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluída":
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case "Em andamento":
        return <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case "Pendente":
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluída":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Em andamento":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Pendente":
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
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-600">4</p>
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
                  <p className="text-2xl font-bold text-blue-600">3</p>
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
                  <p className="text-2xl font-bold text-green-600">5</p>
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
                <Select defaultValue="todas">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={tarefa.status === "Concluída"}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{tarefa.titulo}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tarefa.status)}
                          {getStatusBadge(tarefa.status)}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{tarefa.descricao}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Prioridade:</span>
                            {getPrioridadeBadge(tarefa.prioridade)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Categoria:</span>
                            <Badge variant="outline">{tarefa.categoria}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Vencimento</div>
                          <div className="text-sm font-medium">{formatDate(tarefa.vencimento)}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Responsável: {tarefa.responsavel}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                            <Button variant="default" size="sm">
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}