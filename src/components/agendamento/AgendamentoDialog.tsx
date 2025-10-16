import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface AgendamentoDialogProps {
  open: boolean;
  onClose: () => void;
  agendamento?: Tables<'flight_schedules'>;
}

interface AgendamentoFormData {
  aircraft_id: string;
  crew_member_id: string;
  client_id: string;
  flight_date: string;
  flight_time: string;
  origin: string;
  destination: string;
  estimated_duration: string;
  passengers: number;
  flight_type: string;
  contact: string;
  observations: string;
  status: string;
}

interface AircraftOption {
  id: string;
  registration: string;
  model: string | null;
}

interface CrewMemberOption {
  id: string;
  full_name: string | null;
}

interface ClientOption {
  id: string;
  company_name: string | null;
}

export function AgendamentoDialog({ open, onClose, agendamento }: AgendamentoDialogProps) {
  const [aircraft, setAircraft] = useState<AircraftOption[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMemberOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [formData, setFormData] = useState<AgendamentoFormData>({
    aircraft_id: "",
    crew_member_id: "",
    client_id: "",
    flight_date: "",
    flight_time: "",
    origin: "",
    destination: "",
    estimated_duration: "",
    passengers: 1,
    flight_type: "executivo",
    contact: "",
    observations: "",
    status: "pendente",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetchData();

    if (agendamento) {
      setFormData({
        aircraft_id: agendamento.aircraft_id || "",
        crew_member_id: agendamento.crew_member_id || "",
        client_id: agendamento.client_id || "",
        flight_date: agendamento.flight_date || "",
        flight_time: agendamento.flight_time || "",
        origin: agendamento.origin || "",
        destination: agendamento.destination || "",
        estimated_duration: agendamento.estimated_duration || "",
        passengers: agendamento.passengers || 1,
        flight_type: agendamento.flight_type || "executivo",
        contact: agendamento.contact || "",
        observations: agendamento.observations || "",
        status: agendamento.status || "pendente",
      });
    } else {
      resetForm();
    }
  }, [open, agendamento]);

  const fetchData = async () => {
    try {
      const [aircraftRes, crewRes, clientsRes] = await Promise.all([
        supabase.from("aircraft").select("id, registration, model").eq("status", "Ativa"),
        supabase.from("crew_members").select("id, full_name").eq("status", "active"),
        supabase.from("clients").select("id, company_name"),
      ]);

      setAircraft(aircraftRes.data ?? []);
      setCrewMembers(crewRes.data ?? []);
      setClients(clientsRes.data ?? []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      aircraft_id: "",
      crew_member_id: "",
      client_id: "",
      flight_date: "",
      flight_time: "",
      origin: "",
      destination: "",
      estimated_duration: "",
      passengers: 1,
      flight_type: "executivo",
      contact: "",
      observations: "",
      status: "pendente",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (agendamento) {
        const { error } = await supabase
          .from("flight_schedules")
          .update(formData)
          .eq("id", agendamento.id);

        if (error) {
          throw error;
        }

        toast.success("Agendamento atualizado com sucesso");
      } else {
        const { error } = await supabase.from("flight_schedules").insert([formData]);

        if (error) {
          throw error;
        }

        toast.success("Agendamento criado com sucesso");
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      toast.error("Erro ao salvar agendamento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agendamento ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aircraft_id">Aeronave *</Label>
              <Select
                value={formData.aircraft_id}
                onValueChange={(value) => setFormData({ ...formData, aircraft_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aeronave" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.registration} - {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_date">Data do Voo *</Label>
              <Input
                type="date"
                value={formData.flight_date}
                onChange={(event) => setFormData({ ...formData, flight_date: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_time">Horário</Label>
              <Input
                type="time"
                value={formData.flight_time}
                onChange={(event) => setFormData({ ...formData, flight_time: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Duração Estimada</Label>
              <Input
                placeholder="Ex: 2h 30min"
                value={formData.estimated_duration}
                onChange={(event) => setFormData({ ...formData, estimated_duration: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origem *</Label>
              <Input
                placeholder="Ex: SBGL (Guarulhos)"
                value={formData.origin}
                onChange={(event) => setFormData({ ...formData, origin: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input
                placeholder="Ex: SBRJ (Santos Dumont)"
                value={formData.destination}
                onChange={(event) => setFormData({ ...formData, destination: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crew_member_id">Tripulante *</Label>
              <Select
                value={formData.crew_member_id}
                onValueChange={(value) => setFormData({ ...formData, crew_member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tripulante" />
                </SelectTrigger>
                <SelectContent>
                  {crewMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente / Cotista *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers">Número de Passageiros</Label>
              <Input
                type="number"
                min="1"
                value={formData.passengers}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    passengers: Number.parseInt(event.target.value, 10) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_type">Tipo de Voo</Label>
              <Select
                value={formData.flight_type}
                onValueChange={(value) => setFormData({ ...formData, flight_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executivo">Executivo</SelectItem>
                  <SelectItem value="charter">Charter</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contato</Label>
              <Input
                placeholder="Telefone ou email"
                value={formData.contact}
                onChange={(event) => setFormData({ ...formData, contact: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              placeholder="Grupo executivo, necessário catering especial..."
              value={formData.observations}
              onChange={(event) => setFormData({ ...formData, observations: event.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{agendamento ? "Atualizar" : "Criar"} Agendamento</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}