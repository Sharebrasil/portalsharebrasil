import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Plane, Calendar, Clock, MapPin, User, Users, FileText, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgendamentoDialog } from "@/components/agendamento/AgendamentoDialog";
import { fetchFlightSchedulesWithDetails, type FlightScheduleWithDetails } from "@/services/flightSchedules";
import type { Tables } from "@/integrations/supabase/types";

export default function Agendamento() {
  const [agendamentos, setAgendamentos] = useState<FlightScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Tables<'flight_schedules'> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async () => {
    try {
      const data = await fetchFlightSchedulesWithDetails();
      setAgendamentos(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

    try {
      const { error } = await supabase
        .from("flight_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Agendamento excluído com sucesso");
      fetchAgendamentos();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento");
    }
  };

  const handleEdit = (agendamento: Tables<'flight_schedules'>) => {
    setSelectedAgendamento(agendamento);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAgendamento(null);
    fetchAgendamentos();
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { label: "Pendente", color: "bg-warning text-black" },
      agendado: { label: "Agendado", color: "bg-primary text-primary-foreground" },
      confirmado: { label: "Confirmado", color: "bg-success text-white" },
      cancelado: { label: "Cancelado", color: "bg-destructive text-destructive-foreground" },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Agendamento de Voo</h1>
            <p className="text-muted-foreground">Gerencie os agendamentos de voo</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="bg-gradient-card border-border shadow-card hover:shadow-lg transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {agendamento.aircraft?.registration || "N/A"}
                      </h3>
                      <p className="text-sm text-muted-foreground">{agendamento.flight_type}</p>
                    </div>
                  </div>
                  {getStatusBadge(agendamento.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(agendamento.flight_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{agendamento.flight_time}</span>
                    {agendamento.estimated_duration && (
                      <span className="text-muted-foreground">({agendamento.estimated_duration})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {agendamento.origin} → {agendamento.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {agendamento.crew_members?.full_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {agendamento.clients?.company_name || "N/A"}
                    </span>
                  </div>
                </div>

                {agendamento.observations && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground text-xs">{agendamento.observations}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(agendamento)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(agendamento.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {agendamentos.length === 0 && (
          <div className="text-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        )}
      </div>

      <AgendamentoDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        agendamento={selectedAgendamento}
      />
    </Layout>
  );
}