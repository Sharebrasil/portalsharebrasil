import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Loader2, Mail, Phone, Folder } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { TripulanteFormDialog } from "@/components/tripulacao/TripulanteFormDialog";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/lib/utils";

type CrewMemberRow = Database["public"]["Tables"]["crew_members"]["Row"];

export default function GestaoTripulacao() {
  const [crewMembers, setCrewMembers] = useState<CrewMemberRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrewMemberRow | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const navigate = useNavigate();

  const loadCrew = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("list-crew-members", { body: {} });
      if (error) throw new Error(error.message ?? "Erro ao carregar tripulantes");
      const list = (data as { crew_members?: CrewMemberRow[] })?.crew_members ?? [];
      setCrewMembers(list);
    } catch (err) {
      console.error(`Erro ao buscar tripulantes: ${getErrorMessage(err)}`);
      toast.error(`Não foi possível carregar os tripulantes: ${getErrorMessage(err)}`);
      setCrewMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCrew();
  }, []);

  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const userIds = (crewMembers || []).map(c => c.user_id).filter(Boolean) as string[];
        if (userIds.length === 0) { setRolesByUser({}); return; }
        const { data, error } = await supabase.functions.invoke("list-user-roles", {
          body: { userIds },
        });
        if (error) throw new Error(error.message ?? "Erro ao carregar papéis de usuários");
        const map = (data as { rolesByUser?: Record<string, string[]> })?.rolesByUser ?? {};
        setRolesByUser(map);
      } catch (e) {
        console.error(`Erro ao carregar papéis de usuários: ${getErrorMessage(e)}`);
      }
    };
    loadRoles();
  }, [crewMembers]);

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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCrewMembers.map((m) => {
                  const initials = (m.full_name || "?")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  const role = m.user_id && (rolesByUser[m.user_id]?.includes("piloto_chefe") ? "PILOTO CHEFE" : rolesByUser[m.user_id]?.includes("tripulante") ? "TRIPULANTE" : null);
                  return (
                    <Card key={m.id} className="bg-[#0E2138] text-white border-border shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={m.photo_url || undefined} />
                              <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold leading-tight uppercase">{m.full_name}</div>
                            </div>
                          </div>
                          {role && (
                            <Badge className="bg-emerald-700/80 text-white border-emerald-500">{role}</Badge>
                          )}
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-white/90">
                          {m.email && (
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 opacity-70" />{m.email}</div>
                          )}
                          {m.phone && (
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 opacity-70" />{m.phone}</div>
                          )}
                          <div>
                            <Badge variant="secondary" className="bg-amber-500/20 border-amber-400 text-amber-200">ANAC: {m.canac || "—"}</Badge>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button variant="secondary" onClick={() => navigate(`/tripulacao/${m.id}`)} className="w-40 bg-black/30">
                            Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {(crewMembers ?? []).some((m) => (m.status ?? 'active') !== 'active') && (
          <Card>
            <CardHeader>
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setShowInactive((v) => !v)}
                aria-expanded={showInactive}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Tripulação Inativa</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {(crewMembers ?? []).filter((m) => (m.status ?? 'active') !== 'active').length}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">{showInactive ? 'Ocultar' : 'Abrir pasta'}</span>
              </button>
            </CardHeader>
            {showInactive && (
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(crewMembers ?? [])
                    .filter((m) => (m.status ?? 'active') !== 'active')
                    .map((m) => {
                      const initials = (m.full_name || "?")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")
                        .toUpperCase();
                      const role = m.user_id && (rolesByUser[m.user_id]?.includes("piloto_chefe") ? "PILOTO CHEFE" : rolesByUser[m.user_id]?.includes("tripulante") ? "TRIPULANTE" : null);
                      return (
                        <Card key={m.id} className="bg-[#121826] text-white border-border shadow-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={m.photo_url || undefined} />
                                  <AvatarFallback className="bg-muted text-foreground">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold leading-tight uppercase">{m.full_name}</div>
                                  <Badge variant="secondary" className="mt-1">INATIVO</Badge>
                                </div>
                              </div>
                              {role && (
                                <Badge className="bg-emerald-700/80 text-white border-emerald-500">{role}</Badge>
                              )}
                            </div>
                            <div className="mt-4">
                              <Button variant="secondary" onClick={() => navigate(`/tripulacao/${m.id}`)} className="w-40 bg-black/30">
                                Detalhes
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <TripulanteFormDialog open={dialogOpen} onOpenChange={handleDialogChange} crewMember={editing as any} />
      </div>
    </Layout>
  );
}
