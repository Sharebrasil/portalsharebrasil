import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripulacaoCard } from "@/components/tripulacao/TripulacaoCard";
import { fetchCrewMembers, type CrewMember, CREW_ROLE_LABELS } from "@/services/crew";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/lib/roles";

export default function GestaoTripulacao() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCrew = async () => {
      try {
        setLoading(true);
        const data = await fetchCrewMembers();
        setCrewMembers(data);
      } catch (err) {
        console.error("Erro ao buscar tripulantes:", err);
        toast.error("Não foi possível carregar os tripulantes");
        setCrewMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCrew();
  }, []);

  const filteredCrewMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return crewMembers;

    return crewMembers.filter((member) => {
      const matchesName = member.full_name?.toLowerCase().includes(term);
      const matchesEmail = member.email?.toLowerCase().includes(term);
      const matchesRole = member.roles?.some((role: AppRole) => CREW_ROLE_LABELS[role].toLowerCase().includes(term));
      return Boolean(matchesName || matchesEmail || matchesRole);
    });
  }, [crewMembers, searchTerm]);

  const totalPilotoChefes = useMemo(() => crewMembers.filter((m) => m.roles.includes("piloto_chefe" as AppRole)).length, [crewMembers]);
  const totalTripulantes = useMemo(() => crewMembers.filter((m) => m.roles.includes("tripulante" as AppRole)).length, [crewMembers]);
  const totalComTelefone = useMemo(() => crewMembers.filter((m) => Boolean(m.phone)).length, [crewMembers]);

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
                  <div>Total Piloto Chefes: {totalPilotoChefes}</div>
                  <div>Total Tripulantes: {totalTripulantes}</div>
                  <div>Com telefone: {totalComTelefone}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Pesquisar tripulante, e-mail ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  aria-label="Pesquisar tripulante"
                />
                <Button variant="default" className="flex items-center gap-2">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredCrewMembers.map((member) => (
                  <TripulacaoCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}