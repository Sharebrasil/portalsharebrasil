import { Layout } from "@/components/layout/Layout";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddAircraftDialog } from "@/components/diario/AddAircraftDialog";
import { useMemo, useState } from "react";
import { ArrowLeft, Edit, Plus, Trash2, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Aeronaves() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);

  const { data: aircraft, isLoading, refetch } = useQuery({
    queryKey: ["aircraft"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .order("registration", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-for-aircraft"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, aircraft_id");
      if (error) throw error;
      return data as Array<{ id: string; company_name: string | null; aircraft_id: string | null }>;
    },
  });

  const clientsByAircraft = useMemo(() => {
    const map = new Map<string, string[]>();
    (clients || []).forEach((c) => {
      if (!c.aircraft_id) return;
      const arr = map.get(c.aircraft_id) || [];
      arr.push(c.company_name || "-");
      map.set(c.aircraft_id, arr);
    });
    return map;
  }, [clients]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta aeronave?")) return;
    const { error } = await supabase.from("aircraft").delete().eq("id", id);
    if (!error) refetch();
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/diario-bordo")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Diário de Bordo
            </Button>
          </div>
          <Button className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Adicionar Aeronave
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aeronaves</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando...</div>
            ) : !aircraft || aircraft.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Nenhuma aeronave cadastrada.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aircraft.map((a: any) => {
                  const clientList = clientsByAircraft.get(a.id) || [];
                  return (
                    <div key={a.id} className="relative rounded-xl border border-border bg-card shadow-card overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                              <Plane className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <div className="text-xl font-semibold text-foreground uppercase tracking-wide">{a.registration}</div>
                              <div className="text-sm text-muted-foreground">{a.model} {a.year ? `• ${a.year}` : ""}</div>
                            </div>
                          </div>
                          {a.status && (
                            <Badge variant="outline" className="bg-success/20 text-success border-success">{a.status}</Badge>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 text-sm">
                          {clientList.length > 0 ? (
                            clientList.map((cn, idx) => (
                              <div key={idx} className="text-foreground">Cliente: {cn}</div>
                            ))
                          ) : (
                            <div className="text-muted-foreground">Cliente: -</div>
                          )}
                          {a.base && (
                            <div className="font-semibold">base: <span className="uppercase">{a.base}</span></div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Button variant="secondary" onClick={() => setViewing(a)} className="w-full">
                            Ver Detalhes
                          </Button>
                          <div className="absolute right-3 top-3 flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(a); setDialogOpen(true); }} aria-label="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(a.id)} aria-label="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
          <DialogContent className="sm:max-w-lg">
            {viewing && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span className="uppercase">{viewing.registration}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(viewing); setDialogOpen(true); }} aria-label="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(viewing.id)} aria-label="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Modelo:</span> {viewing.model}</div>
                  <div><span className="text-muted-foreground">Ano:</span> {viewing.year || "-"}</div>
                  <div><span className="text-muted-foreground">Fabricante:</span> {viewing.manufacturer || "-"}</div>
                  <div><span className="text-muted-foreground">Nº Série:</span> {viewing.serial_number || "-"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Proprietário:</span> {viewing.owner_name || "-"}</div>
                  <div><span className="text-muted-foreground">Base:</span> {viewing.base || "-"}</div>
                  <div><span className="text-muted-foreground">Consumo (L/H):</span> {viewing.fuel_consumption || "-"}</div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Clientes vinculados</div>
                  <div className="space-y-1 text-sm">
                    {(clientsByAircraft.get(viewing.id) || ["-"]).map((cn, i) => (
                      <div key={i}>• {cn}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AddAircraftDialog open={dialogOpen} onOpenChange={setDialogOpen} aircraft={editing} />
      </div>
    </Layout>
  );
}
