import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, FileText, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchFlightSchedulesWithDetails, type FlightScheduleWithDetails } from "@/services/flightSchedules";
import { FlightPlanForm } from "@/components/plano-voo/FlightPlanForm";
import { FlightPlanDialog } from "@/components/plano-voo/FlightPlanDialog";
import { cn } from "@/lib/utils";

export default function PlanoVoo() {
  const [schedules, setSchedules] = useState<FlightScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchConfirmedSchedules();
  }, []);

  const fetchConfirmedSchedules = async (withLoading = true) => {
    if (withLoading) {
      setLoading(true);
    }

    try {
      const data = await fetchFlightSchedulesWithDetails({
        status: "confirmado",
        includeFlightPlans: true,
      });
      setSchedules(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos confirmados:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId]
  );

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
  };

  useEffect(() => {
    if (selectedScheduleId) {
      const element = document.getElementById("flight-plan-form-section");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedScheduleId]);

  const handleFormCancel = () => {
    setSelectedScheduleId(null);
  };

  const handleFormSuccess = () => {
    void fetchConfirmedSchedules(false);
    setSelectedScheduleId(null);
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Plano de Voo</h1>
            <p className="text-muted-foreground">Agendamentos confirmados disponíveis para criar plano de voo</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Plano de Voo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={cn(
                "bg-gradient-card border border-border shadow-card hover:shadow-lg transition-all",
                selectedScheduleId === schedule.id && "border-primary ring-2 ring-primary/20"
              )}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {schedule.aircraft?.registration || "N/A"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {schedule.origin} → {schedule.destination}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-success text-white">Confirmado</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Data:</span>{" "}
                    <span className="text-foreground font-medium">
                      {new Date(schedule.flight_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Horário:</span>{" "}
                    <span className="text-foreground font-medium">{schedule.flight_time}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tripulante:</span>{" "}
                    <span className="text-foreground">{schedule.crew_members?.full_name || "N/A"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Cliente:</span>{" "}
                    <span className="text-foreground">{schedule.clients?.company_name || "N/A"}</span>
                  </div>
                </div>

                {schedule.flight_plans && schedule.flight_plans.length > 0 ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSelectSchedule(schedule.id)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Plano de Voo
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSelectSchedule(schedule.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Criar Plano de Voo
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedScheduleId && (
          <div id="flight-plan-form-section" className="space-y-4">
            {selectedSchedule && (
              <Card className="bg-gradient-card border border-border shadow-card">
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold text-foreground">Plano de voo selecionado</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSchedule.aircraft?.registration || "N/A"} — {selectedSchedule.origin} → {selectedSchedule.destination}
                  </p>
                </CardContent>
              </Card>
            )}
            <FlightPlanForm
              scheduleId={selectedScheduleId}
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        )}

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento confirmado encontrado</p>
          </div>
        )}

        <FlightPlanDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
}
