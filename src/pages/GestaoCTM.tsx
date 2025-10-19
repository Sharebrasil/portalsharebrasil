import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plane, Calendar } from "lucide-react";

interface Aircraft {
  id: string;
  registration: string;
  model: string;
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

  useEffect(() => {
    loadAircraft();
  }, []);

  useEffect(() => {
    if (selectedAircraft) {
      loadCTMData();
    }
  }, [selectedAircraft]);

  const loadAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, registration, model")
        .order("registration");

      if (error) throw error;
      setAircraft(data || []);
      if (data && data.length > 0) {
        setSelectedAircraft(data[0].id);
      }
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
              Selecionar Aeronave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {aircraft.map((ac) => (
                <Button
                  key={ac.id}
                  variant={selectedAircraft === ac.id ? "default" : "outline"}
                  onClick={() => setSelectedAircraft(ac.id)}
                >
                  {ac.registration} - {ac.model}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={Object.keys(groupedData)[0]} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {Object.keys(groupedData).map((key) => {
              const [year, month] = key.split("-");
              const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
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
      </div>
    </Layout>
  );
}
