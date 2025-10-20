import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, X, Trash2, Loader2 } from "lucide-react";

const preVooChecklist = [
  "Verificar CHT (Certificado de Habilitação Técnica da Aeronave)",
  "Verificar CIV (Certificado de Identificação da Aeronave)",
  "Verificar apólice designando as aeronaves",
  "Verificar CHT do piloto",
  "Verificar CMA (Certificado Médico Aeronáutico)",
];

const comissariaChecklist = [
  "Água mineral",
  "Café",
  "Refrigerantes",
  "Lanches",
  "Utensílios descartáveis",
];

interface FlightPlanFormProps {
  scheduleId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface FlightPlanFormData {
  aircraft_registration: string;
  aircraft_type: string;
  flight_rule: string;
  flight_type: string;
  route: string;
  distance_km: number;
  estimated_flight_time: string;
  required_fuel: number;
  payload_weight: number;
  zero_fuel_weight: number;
  takeoff_weight: number;
  landing_weight: number;
}

interface FlightScheduleData {
  id: string;
  origin: string;
  destination: string;
  aircraft: {
    registration: string;
    model: string;
  };
  flight_plans?: Array<{
    id: string;
    aircraft_registration: string;
    aircraft_type: string;
    flight_rule: string;
    flight_type: string;
    route: string;
    distance_km: number;
    estimated_flight_time: string;
    required_fuel: number;
    payload_weight: number;
    zero_fuel_weight: number;
    takeoff_weight: number;
    landing_weight: number;
  }>;
}

interface FlightChecklistEntry {
  id: string;
  checklist_type: "pre_voo" | "comissaria";
  items: boolean[];
}

const defaultFormData: FlightPlanFormData = {
  aircraft_registration: "",
  aircraft_type: "",
  flight_rule: "VFR",
  flight_type: "N",
  route: "",
  distance_km: 0,
  estimated_flight_time: "",
  required_fuel: 0,
  payload_weight: 0,
  zero_fuel_weight: 0,
  takeoff_weight: 0,
  landing_weight: 0,
};

export function FlightPlanForm({ scheduleId, onCancel, onSuccess }: FlightPlanFormProps) {
  const [schedule, setSchedule] = useState<FlightScheduleData | null>(null);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlightPlanFormData>(defaultFormData);
  const [preVooItems, setPreVooItems] = useState<boolean[]>(() => new Array(preVooChecklist.length).fill(false));
  const [comissariaItems, setComissariaItems] = useState<boolean[]>(() => new Array(comissariaChecklist.length).fill(false));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchScheduleData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("flight_schedules")
          .select(
            `*,
            aircraft:aircraft_id(registration, model),
            flight_plans(*)`
          )
          .eq("id", scheduleId)
          .single();

        if (error) throw error;
        if (!isMounted) return;

        const scheduleData = data as FlightScheduleData;
        setSchedule(scheduleData);

        if (scheduleData.flight_plans && scheduleData.flight_plans.length > 0) {
          const plan = scheduleData.flight_plans[0];
          setExistingPlanId(plan.id);
          setFormData({
            aircraft_registration: plan.aircraft_registration || scheduleData.aircraft.registration,
            aircraft_type: plan.aircraft_type || scheduleData.aircraft.model,
            flight_rule: plan.flight_rule || "VFR",
            flight_type: plan.flight_type || "N",
            route: plan.route || "",
            distance_km: plan.distance_km || 0,
            estimated_flight_time: plan.estimated_flight_time || "",
            required_fuel: plan.required_fuel || 0,
            payload_weight: plan.payload_weight || 0,
            zero_fuel_weight: plan.zero_fuel_weight || 0,
            takeoff_weight: plan.takeoff_weight || 0,
            landing_weight: plan.landing_weight || 0,
          });

          const { data: checklists, error: checklistError } = await supabase
            .from("flight_checklists")
            .select("id, checklist_type, items")
            .eq("flight_plan_id", plan.id);

          if (checklistError) throw checklistError;
          if (!isMounted) return;

          if (checklists) {
            const preVoo = checklists.find((c) => c.checklist_type === "pre_voo") as FlightChecklistEntry | undefined;
            const comissaria = checklists.find((c) => c.checklist_type === "comissaria") as FlightChecklistEntry | undefined;

            if (preVoo?.items) setPreVooItems(preVoo.items as boolean[]);
            if (comissaria?.items) setComissariaItems(comissaria.items as boolean[]);
          }
        } else {
          setExistingPlanId(null);
          setFormData({
            ...defaultFormData,
            aircraft_registration: scheduleData.aircraft.registration,
            aircraft_type: scheduleData.aircraft.model,
          });
          setPreVooItems(new Array(preVooChecklist.length).fill(false));
          setComissariaItems(new Array(comissariaChecklist.length).fill(false));
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar dados do plano de voo");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchScheduleData();

    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schedule) return;

    setSaving(true);
    try {
      let planId = existingPlanId;

      if (existingPlanId) {
        const { error } = await supabase
          .from("flight_plans")
          .update({
            ...formData,
            departure_airport: schedule.origin,
            destination_airport: schedule.destination,
          })
          .eq("id", existingPlanId);

        if (error) throw error;
      } else {
        const { data: newPlan, error } = await supabase
          .from("flight_plans")
          .insert([
            {
              flight_schedule_id: scheduleId,
              ...formData,
              departure_airport: schedule.origin,
              destination_airport: schedule.destination,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        planId = newPlan.id;
        setExistingPlanId(planId);
      }

      if (planId) {
        await supabase.from("flight_checklists").delete().eq("flight_plan_id", planId);

        await supabase.from("flight_checklists").insert([
          {
            flight_plan_id: planId,
            checklist_type: "pre_voo",
            items: preVooItems,
            completed: preVooItems.every(Boolean),
          },
          {
            flight_plan_id: planId,
            checklist_type: "comissaria",
            items: comissariaItems,
            completed: comissariaItems.every(Boolean),
          },
        ]);
      }

      toast.success("Plano de voo salvo com sucesso");
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar plano de voo:", error);
      toast.error("Erro ao salvar plano de voo");
    } finally {
      setSaving(false);
    }
  };

  const scheduleTitle = useMemo(() => {
    if (!schedule) return "Plano de Voo";
    return `${schedule.origin} → ${schedule.destination}`;
  }, [schedule]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">Carregando formulário...</div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">Agendamento não encontrado.</div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={onCancel}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{existingPlanId ? "Editar Plano de Voo" : "Criar Plano de Voo"}</CardTitle>
              <p className="text-sm text-muted-foreground">{scheduleTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {existingPlanId && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!existingPlanId) return;
                    const confirmed = window.confirm("Tem certeza que deseja excluir este plano de voo?");
                    if (!confirmed) return;
                    setDeleting(true);
                    try {
                      await supabase.from("flight_checklists").delete().eq("flight_plan_id", existingPlanId);
                      const { error } = await supabase.from("flight_plans").delete().eq("id", existingPlanId);
                      if (error) throw error;
                      setExistingPlanId(null);
                      setFormData({
                        ...defaultFormData,
                        aircraft_registration: schedule?.aircraft.registration || "",
                        aircraft_type: schedule?.aircraft.model || "",
                      });
                      setPreVooItems(new Array(preVooChecklist.length).fill(false));
                      setComissariaItems(new Array(comissariaChecklist.length).fill(false));
                      toast.success("Plano de voo excluído com sucesso");
                      onSuccess?.();
                      onCancel?.();
                    } catch (error) {
                      console.error("Erro ao excluir plano de voo:", error);
                      toast.error("Erro ao excluir plano de voo");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Excluir
                </Button>
              )}
              {onCancel && (
                <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Fechar formulário">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Identificação da Aeronave *</Label>
              <Input
                value={formData.aircraft_registration}
                onChange={(event) => setFormData({ ...formData, aircraft_registration: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Aeronave *</Label>
              <Input
                value={formData.aircraft_type}
                onChange={(event) => setFormData({ ...formData, aircraft_type: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Regras de Voo</Label>
              <Select
                value={formData.flight_rule}
                onValueChange={(value) => setFormData({ ...formData, flight_rule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VFR">VFR</SelectItem>
                  <SelectItem value="IFR">IFR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Voo</Label>
              <Select
                value={formData.flight_type}
                onValueChange={(value) => setFormData({ ...formData, flight_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">N - Não Programado</SelectItem>
                  <SelectItem value="S">S - Programado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Rota</Label>
            <Textarea
              value={formData.route}
              onChange={(event) => setFormData({ ...formData, route: event.target.value })}
              rows={3}
              placeholder="Ex: DCT SBGL DCT"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <Label className="text-primary">Distância</Label>
              <Input
                type="number"
                value={formData.distance_km}
                onChange={(event) => setFormData({ ...formData, distance_km: parseFloat(event.target.value) })}
                className="mt-2"
                placeholder="km"
              />
            </div>
            <div className="p-4 bg-success/5 rounded-lg">
              <Label className="text-success">Tempo de Voo</Label>
              <Input
                value={formData.estimated_flight_time}
                onChange={(event) => setFormData({ ...formData, estimated_flight_time: event.target.value })}
                className="mt-2"
                placeholder="Ex: 2h 38m"
              />
            </div>
            <div className="p-4 bg-purple-500/5 rounded-lg">
              <Label className="text-purple-500">Combustível</Label>
              <Input
                type="number"
                value={formData.required_fuel}
                onChange={(event) => setFormData({ ...formData, required_fuel: parseFloat(event.target.value) })}
                className="mt-2"
                placeholder="L"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Carga Paga (Passageiros + Bagagem) em kg</Label>
            <Input
              type="number"
              value={formData.payload_weight}
              onChange={(event) => setFormData({ ...formData, payload_weight: parseFloat(event.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Peso Zero Combustível</Label>
              <Input
                type="number"
                value={formData.zero_fuel_weight}
                onChange={(event) => setFormData({ ...formData, zero_fuel_weight: parseFloat(event.target.value) })}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso de Decolagem</Label>
              <Input
                type="number"
                value={formData.takeoff_weight}
                onChange={(event) => setFormData({ ...formData, takeoff_weight: parseFloat(event.target.value) })}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso de Pouso</Label>
              <Input
                type="number"
                value={formData.landing_weight}
                onChange={(event) => setFormData({ ...formData, landing_weight: parseFloat(event.target.value) })}
                placeholder="kg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Pré-Voo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preVooChecklist.map((item, index) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                checked={preVooItems[index]}
                onCheckedChange={(checked) => {
                  const value = Boolean(checked);
                  setPreVooItems((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
              />
              <Label className="font-normal cursor-pointer">{item}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Comissaria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {comissariaChecklist.map((item, index) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                checked={comissariaItems[index]}
                onCheckedChange={(checked) => {
                  const value = Boolean(checked);
                  setComissariaItems((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
              />
              <Label className="font-normal cursor-pointer">{item}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Plano de Voo"}
        </Button>
      </div>
    </form>
  );
}
