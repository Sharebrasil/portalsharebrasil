import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MessageSquare, Pin, Plus, Search, Send } from "lucide-react";

export default function Recados() {
  const recados = [
    {
      id: 1,
      autor: "João Silva",
      cargo: "Gerente Operacional",
      mensagem:
        "Reunião de planejamento de voo agendada para amanhã às 14h na sala de briefing.",
      data: "há 2 horas",
      fixado: true,
      lido: false,
    },
    {
      id: 2,
      autor: "Maria Santos",
      cargo: "Coordenadora de Manutenção",
      mensagem:
        "Aeronave PR-ABC liberada para operação após inspeção de rotina. Todos os sistemas operacionais.",
      data: "há 4 horas",
      fixado: false,
      lido: true,
    },
    {
      id: 3,
      autor: "Carlos Oliveira",
      cargo: "Piloto Comandante",
      mensagem:
        "Condições meteorológicas favoráveis para voos na região Sul. Visibilidade boa até as 18h.",
      data: "há 6 horas",
      fixado: false,
      lido: true,
    },
    {
      id: 4,
      autor: "Ana Costa",
      cargo: "Supervisora de Ground Handling",
      mensagem:
        "Novo protocolo de segurança implementado no hangar. Favor consultar manual atualizado.",
      data: "ontem",
      fixado: true,
      lido: false,
    },
  ];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((segment) => segment[0])
      .join("")
      .toUpperCase();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recados</h1>
            <p className="mt-2 text-muted-foreground">
              Central de comunicação interna da equipe
            </p>
          </div>
          <Button className="flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" />
            Novo Recado
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recados da Equipe
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar recados..." className="w-full pl-10 sm:w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recados.map((recado) => (
                <div
                  key={recado.id}
                  className={`rounded-lg border border-border p-4 transition-colors hover:bg-accent ${
                    recado.lido ? "" : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={recado.autor} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(recado.autor)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">{recado.autor}</h4>
                        <Badge variant="outline" className="text-xs">
                          {recado.cargo}
                        </Badge>
                        {recado.fixado && <Pin className="h-3 w-3 text-yellow-600" />}
                        {!recado.lido && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 text-foreground">{recado.mensagem}</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {recado.data}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">
                            Responder
                          </Button>
                          <Button variant="outline" size="sm">
                            {recado.fixado ? "Desafixar" : "Fixar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Recado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="mensagem">
                    Mensagem
                  </label>
                  <Textarea id="mensagem" placeholder="Digite sua mensagem..." rows={4} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fixar" className="rounded border" />
                  <label htmlFor="fixar" className="text-sm text-foreground">
                    Fixar recado
                  </label>
                </div>
                <Button className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Recado
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Recados</span>
                    <span className="font-semibold">28</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Não Lidos</span>
                    <Badge className="bg-red-100 text-red-800">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fixados</span>
                    <Badge className="bg-yellow-100 text-yellow-800">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Esta Semana</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
