import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { TripulanteFormDialog } from "@/components/tripulacao/TripulanteFormDialog";

 type CrewMemberRow = Database["public"]["Tables"]["crew_members"]["Row"];

export default function GestaoTripulacao() {
  const [crewMembers, setCrewMembers] = useState<CrewMemberRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrewMemberRow | null>(null);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("crew_members")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      setCrewMembers(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar tripulantes:", err);
      toast.error("Não foi possível carregar os tripulantes");
      setCrewMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCrew();
  }, []);

  const filteredCrewMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return crewMembers;

    return crewMembers.filter((m) => {
      const name = m.full_name?.toLowerCase() ?? "";
      const email = m.email?.toLowerCase() ?? "";
      const canac = m.canac?.toLowerCase() ?? "";
      const status = m.status?.toLowerCase() ?? "";
      return (
        name.includes(term) || email.includes(term) || canac.includes(term) || status.includes(term)
      );
    });
  }, [crewMembers, searchTerm]);

  const totals = useMemo(() => {
    const total = crewMembers.length;
    const ativos = crewMembers.filter((m) => (m.status ?? "active") === "active").length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [crewMembers]);

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (member: CrewMemberRow) => {
    setEditing(member);
    setDialogOpen(true);
  };

  const handleDialogChange = (refresh: boolean) => {
    setDialogOpen(false);
    setEditing(null);
    if (refresh) {
      void loadCrew();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Tripulação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <div>Total: {totals.total}</div>
                  <div>Ativos: {totals.ativos}</div>
                  <div>Inativos: {totals.inativos}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Pesquisar por nome, e-mail, CANAC, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  aria-label="Pesquisar tripulante"
                />
                <Button onClick={handleNew} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : filteredCrewMembers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhum tripulante encontrado.</div>
            ) : (
              <Table>
                <TableCaption>Lista de tripulantes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>CANAC</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="w-[1%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrewMembers.map((m) => (
                    <TableRow key={m.id} className="cursor-pointer group" onClick={() => navigate(`/tripulacao/${m.id}`)}>
                      <TableCell>{m.canac}</TableCell>
                      <TableCell>{m.full_name}</TableCell>
                      <TableCell>{m.email ?? ""}</TableCell>
                      <TableCell>{m.phone ?? ""}</TableCell>
                      <TableCell className={m.status === "active" ? "text-green-600" : "text-muted-foreground"}>
                        {m.status ?? ""}
                      </TableCell>
                      <TableCell>{m.updated_at ? new Date(m.updated_at).toLocaleDateString() : ""}</TableCell>
                      <TableCell onClick={(e)=>e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(m)} className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit className="h-4 w-4" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TripulanteFormDialog open={dialogOpen} onOpenChange={handleDialogChange} crewMember={editing as any} />
      </div>
    </Layout>
  );
}
