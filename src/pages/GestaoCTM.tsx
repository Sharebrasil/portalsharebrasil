import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plane, Calendar, ChevronDown, ChevronRight, Plus } from "lucide-react";

interface Aircraft {
  id: string;
  registration: string;
  model: string;
  status?: string | null;
}

interface CTMData {
  id: string;
  month: number;
  year: number;
  control_type: string;
  item_name: string;
  left_value: string | null;
  right_value: string | null;
  last_change_date: string | null;
  last_change_hours: number | null;
  service_order_number: string | null;
  invoice_number: string | null;
  hours_after: number | null;
  remaining_hours: number | null;
}

export default function GestaoCTM() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [ctmData, setCtmData] = useState<CTMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1);
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadAircraft();
  }, []);

  useEffect(() => {
    if (selectedAircraft) {
      loadCTMData();
    } else {
      setCtmData([]);
    }
  }, [selectedAircraft]);

  const loadAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, registration, model, status")
        .order("registration");

      if (error) throw error;
      setAircraft(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar aeronaves: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCTMData = async () => {
    try {
      const { data, error } = await supabase
        .from("ctm_tracking")
        .select("*")
        .eq("aircraft_id", selectedAircraft)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      setCtmData(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados CTM: " + error.message);
    }
  };

  const groupedData = ctmData.reduce((acc, item) => {
    const key = `${item.year}-${item.month}`;
    if (!acc[key]) {
      acc[key] = {};
    }
    if (!acc[key][item.control_type]) {
      acc[key][item.control_type] = [];
    }
    acc[key][item.control_type].push(item);
    return acc;
  }, {} as Record<string, Record<string, CTMData[]>>);

  const groupedKeys = Object.keys(groupedData);
  const activeAircraft = aircraft.filter((a) => (a.status ?? "ativo").toLowerCase() === "ativo");
  const inactiveAircraft = aircraft.filter((a) => (a.status ?? "ativo").toLowerCase() !== "ativo");

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestão CTM - Controle Técnico de Manutenção
          </h1>
          <p className="text-muted-foreground">
            Controle mensal de pneus, câmaras, velas, pastilhas e consumíveis por aeronave
          </p>
        </div>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Aeronaves Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {activeAircraft.map((ac) => (
                <Button
                  key={ac.id}
                  variant={selectedAircraft === ac.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedAircraft(ac.id);
                    setCreateOpen(true);
                  }}
                  className="uppercase"
                >
                  {ac.registration} - {ac.model}
                </Button>
              ))}
              {activeAircraft.length === 0 && (
                <span className="text-muted-foreground">Nenhuma aeronave ativa.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {showInactive ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              Aeronaves Inativas
              <span className="text-sm text-muted-foreground">({inactiveAircraft.length})</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowInactive((s) => !s)}>
              {showInactive ? "Ocultar" : "Mostrar"}
            </Button>
          </CardHeader>
          {showInactive && (
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {inactiveAircraft.map((ac) => (
                  <Button
                    key={ac.id}
                    variant={selectedAircraft === ac.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedAircraft(ac.id);
                      setCreateOpen(true);
                    }}
                    className="uppercase"
                  >
                    {ac.registration} - {ac.model}
                  </Button>
                ))}
                {inactiveAircraft.length === 0 && (
                  <span className="text-muted-foreground">Nenhuma aeronave inativa.</span>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {selectedAircraft && groupedKeys.length > 0 ? (
          <Tabs defaultValue={groupedKeys[0]} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {groupedKeys.map((key) => {
                const [year, month] = key.split("-");
                const monthNames = [
                  "Jan",
                  "Fev",
                  "Mar",
                  "Abr",
                  "Mai",
                  "Jun",
                  "Jul",
                  "Ago",
                  "Set",
                  "Out",
                  "Nov",
                  "Dez",
                ];
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {monthNames[parseInt(month) - 1]} {year}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(groupedData).map(([key, controlTypes]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                {Object.entries(controlTypes).map(([controlType, items]) => (
                  <Card key={controlType} className="bg-gradient-card border-border shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">{controlType}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2 font-medium">Item</th>
                              <th className="text-left p-2 font-medium">Esquerdo</th>
                              <th className="text-left p-2 font-medium">Direito</th>
                              <th className="text-left p-2 font-medium">Data Última Troca</th>
                              <th className="text-left p-2 font-medium">Horas Última Troca</th>
                              <th className="text-left p-2 font-medium">O.S.</th>
                              <th className="text-left p-2 font-medium">NF</th>
                              <th className="text-left p-2 font-medium">Horas Após</th>
                              <th className="text-left p-2 font-medium">Horas Restantes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id} className="border-b border-border hover:bg-accent">
                                <td className="p-2">{item.item_name}</td>
                                <td className="p-2">{item.left_value || "-"}</td>
                                <td className="p-2">{item.right_value || "-"}</td>
                                <td className="p-2">
                                  {item.last_change_date
                                    ? new Date(item.last_change_date).toLocaleDateString("pt-BR")
                                    : "-"}
                                </td>
                                <td className="p-2">{item.last_change_hours || "-"}</td>
                                <td className="p-2">{item.service_order_number || "-"}</td>
                                <td className="p-2">{item.invoice_number || "-"}</td>
                                <td className="p-2">{item.hours_after || "-"}</td>
                                <td className="p-2">{item.remaining_hours || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        ) : selectedAircraft ? (
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Nenhum controle CTM encontrado para esta aeronave</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Criar Controle
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <CTMCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={async () => {
            await loadCTMData();
          }}
          aircraft={aircraft.find((a) => a.id === selectedAircraft) || null}
          month={createMonth}
          year={createYear}
          setMonth={setCreateMonth}
          setYear={setCreateYear}
        />
      </div>
    </Layout>
  );
}

function CTMCreateDialog({
  open,
  onOpenChange,
  onCreated,
  aircraft,
  month,
  year,
  setMonth,
  setYear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  aircraft: Aircraft | null;
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
}) {
  const handleCreate = async () => {
    if (!aircraft) return;
    try {
      const { data: exists, error: existsErr } = await supabase
        .from("ctm_tracking")
        .select("id")
        .eq("aircraft_id", aircraft.id)
        .eq("month", month)
        .eq("year", year)
        .limit(1);
      if (existsErr) throw existsErr;
      if (exists && exists.length > 0) {
        toast("Já existe controle CTM para este período.")
        onOpenChange(false);
        return;
      }

      const items: Array<{ control_type: string; item_name: string }> = [
        { control_type: "Pneus", item_name: "Principal Esquerdo" },
        { control_type: "Pneus", item_name: "Principal Direito" },
        { control_type: "Pneus", item_name: "Dianteiro" },
        { control_type: "Câmaras", item_name: "Principal Esquerdo" },
        { control_type: "Câmaras", item_name: "Principal Direito" },
        { control_type: "Câmaras", item_name: "Dianteiro" },
        { control_type: "Velas", item_name: "Velas do Motor" },
        { control_type: "Pastilhas", item_name: "Freio Esquerdo" },
        { control_type: "Pastilhas", item_name: "Freio Direito" },
        { control_type: "Consumíveis", item_name: "Óleo do Motor" },
        { control_type: "Consumíveis", item_name: "Filtro de Óleo" },
        { control_type: "Consumíveis", item_name: "Filtro de Ar" },
      ];

      const rows = items.map((it) => ({
        aircraft_id: aircraft.id,
        month,
        year,
        control_type: it.control_type,
        item_name: it.item_name,
        left_value: null,
        right_value: null,
        last_change_date: null,
        last_change_hours: null,
        service_order_number: null,
        invoice_number: null,
        hours_after: null,
        remaining_hours: null,
      }));

      const { error } = await supabase.from("ctm_tracking").insert(rows);
      if (error) throw error;
      toast("Controle CTM criado.");
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error("Erro ao criar CTM: " + e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Criar Controle CTM {aircraft ? `- ${aircraft.registration}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Mês</label>
              <select
                className="mt-1 w-full border rounded px-2 py-1 bg-background"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Ano</label>
              <input
                type="number"
                className="mt-1 w-full border rounded px-2 py-1 bg-background"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2000}
                max={2100}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Criar Controle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
