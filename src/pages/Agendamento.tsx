import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, List, Plane, Clock, Users, CheckCircle, XCircle } from "lucide-react";
import { FlightScheduleDialog } from "@/components/agendamento/AgendamentoDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function StatusUpdateButtons({ scheduleId, currentStatus, onUpdate }: { scheduleId: string; currentStatus: string; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("flight_schedules")
        .update({ status: newStatus })
        .eq("id", scheduleId);

      if (error) throw error;

      toast.success(`Status alterado para ${newStatus}`);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "confirmado") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => updateStatus("pendente")}
        disabled={loading}
        className="gap-2"
      >
        <XCircle className="h-4 w-4" />
        Cancelar Confirmação
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => updateStatus("confirmado")}
      disabled={loading}
      className="gap-2 bg-green-600 hover:bg-green-700"
    >
      <CheckCircle className="h-4 w-4" />
      Confirmar
    </Button>
  );
}

export default function Agendamentos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState("all");
  const [statusTab, setStatusTab] = useState<"pendentes" | "todos">("todos");

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["flight-schedules", selectedAircraft],
    queryFn: async () => {
      let query = supabase
        .from("flight_schedules")
        .select(`
          *,
          aircraft:aircraft_id(registration, model),
          client:client_id(company_name),
          crew:crew_member_id(full_name)
        `)
        .order("flight_date", { ascending: false })
        .order("flight_time", { ascending: false });

      if (selectedAircraft !== "all") {
        query = query.eq("aircraft_id", selectedAircraft);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: aircraft } = useQuery({
    queryKey: ["aircraft"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, registration, model");
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: schedules?.length || 0,
    confirmed: schedules?.filter(s => s.status === "confirmado").length || 0,
    pending: schedules?.filter(s => s.status === "pendente").length || 0,
    today: schedules?.filter(s => s.flight_date === new Date().toISOString().split('T')[0]).length || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pendente: { label: "pendente", className: "bg-warning/20 text-warning border-warning" },
      confirmado: { label: "confirmado", className: "bg-success/20 text-success border-success" },
      cancelado: { label: "cancelado", className: "bg-destructive/20 text-destructive border-destructive" },
    };
    return variants[status] || variants.pendente;
  };

  const getFlightTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      
      treinamento: "treinamento",
      manutencao: "manutenção",
      particular: "particular",
    };
    return types[type] || type;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agendamento de Aeronaves</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os voos e reservas das aeronaves
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon">
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Voos</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Plane className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmados</p>
                  <p className="text-3xl font-bold text-foreground">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                  <p className="text-3xl font-bold text-foreground">{stats.today}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por aeronave:</span>
              <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Todas as aeronaves" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Todas as aeronaves</SelectItem>
                  {aircraft?.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={statusTab} onValueChange={(v)=>setStatusTab(v as any)}>
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Schedules List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Lista de Agendamentos ({(schedules || []).filter((s: any) => statusTab === 'pendentes' ? s.status === 'pendente' : true).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                Carregando agendamentos...
              </div>
            ) : schedules && schedules.length > 0 ? (
              <div className="space-y-4">
                {(schedules || [])
                  .filter((s: any) => statusTab === 'pendentes' ? s.status === 'pendente' : true)
                  .map((schedule: any) => (
                  <Card key={schedule.id} className="hover:shadow-primary transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Plane className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg">{schedule.aircraft?.registration || "N/A"}</h3>
                              <Badge variant="outline" className={getStatusBadge(schedule.status).className}>
                                {getStatusBadge(schedule.status).label}
                              </Badge>
                              <Badge variant="outline">{getFlightTypeBadge(schedule.flight_type)}</Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-6 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Data</p>
                                <p className="font-medium">{new Date(schedule.flight_date).toLocaleDateString("pt-BR")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Horário</p>
                                <p className="font-medium">{schedule.flight_time} {schedule.estimated_duration && `(${schedule.estimated_duration})`}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Rota</p>
                                <p className="font-medium">{schedule.origin} → {schedule.destination}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Passageiros</p>
                                <p className="font-medium">{schedule.passengers}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Tripulação</p>
                                <p className="font-medium">{schedule.crew?.full_name || "Não atribuído"}</p>
                              </div>
                              {schedule.contact && (
                                <div>
                                  <p className="text-muted-foreground mb-1">Contato</p>
                                  <p className="font-medium">{schedule.contact}</p>
                                </div>
                              )}
                            </div>

                            {schedule.observations && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">Observações</p>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">{schedule.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <StatusUpdateButtons scheduleId={schedule.id} currentStatus={schedule.status} onUpdate={refetch} />
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum agendamento encontrado
                </p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Agendamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <FlightScheduleDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSuccess={refetch}
        />
      </div>
    </Layout>
  );
}
