import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VencimentoDialog } from "@/components/vencimentos/VencimentoDialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ControleVencimentos() {
  const { toast } = useToast();
  const [vencimentos, setVencimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { fetchManutencoesWithAircraft } = await import("@/services/manutencoes");
        const rows = await fetchManutencoesWithAircraft();
        const today = new Date().getTime();
        const mapped = rows.map((m) => {
          const dt = new Date(m.data_programada).getTime();
          const diasRestantes = Math.ceil((dt - today) / (1000 * 60 * 60 * 24));
          return {
            id: m.id,
            item: m.tipo,
            aeronave: m.aeronave_registration || "-",
            dataVencimento: m.data_programada,
            diasRestantes,
            diasAlerta: 30,
            status: m.etapa === "concluida" ? "concluido" : m.etapa === "em_andamento" ? "programado" : "pendente",
            periodoTipo: "dias",
            periodoValor: null,
          };
        });
        setVencimentos(mapped);
      } catch (e) {
        console.error(e);
        toast({ title: "Erro ao carregar", description: "Falha ao buscar vencimentos.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const getStatusInfo = (diasRestantes: number, diasAlerta: number, status: string) => {
    if (status === "concluido") {
      return { label: "Concluído", color: "bg-success text-white", severity: "normal" };
    }
    if (status === "programado") {
      return { label: "Programado", color: "bg-warning text-black", severity: "atencao" };
    }
    if (diasRestantes < 0) {
      return { label: "Vencido", color: "bg-destructive text-destructive-foreground", severity: "urgente" };
    }
    if (diasRestantes <= diasAlerta) {
      return { label: "Vencimento Próximo", color: "bg-warning text-black", severity: "urgente" };
    }
    return { label: "Normal", color: "bg-success text-white", severity: "normal" };
  };

  const handleAddVencimento = (_novoVencimento: any) => {
    // Integração de criação via Supabase pode ser adicionada depois.
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setVencimentos(vencimentos.map((v: any) =>
      v.id === id ? { ...v, status: newStatus } : v
    ));

    const statusLabels: Record<string, string> = {
      pendente: "Pendente",
      programado: "Programado",
      concluido: "Concluído"
    };

    toast({
      title: "Status atualizado",
      description: `Manutenção marcada como ${statusLabels[newStatus]}`
    });
  };

  const getCountByStatus = (severity: string) => {
    return vencimentos.filter(v => {
      const info = getStatusInfo(v.diasRestantes, v.diasAlerta, v.status);
      return info.severity === severity;
    }).length;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Controle de Vencimentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie os vencimentos de certificados, inspeções e documentos
            </p>
          </div>
          <VencimentoDialog onAdd={handleAddVencimento} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vencimentos Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{getCountByStatus("urgente")}</div>
              <p className="text-sm text-muted-foreground mt-1">Vencidos ou próximos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Requer Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{getCountByStatus("atencao")}</div>
              <p className="text-sm text-muted-foreground mt-1">Programados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Itens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{vencimentos.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Itens monitorados</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Vencimentos</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vencimentos..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vencimentos.map((vencimento: any) => {
                const statusInfo = getStatusInfo(vencimento.diasRestantes, vencimento.diasAlerta, vencimento.status);
                
                return (
                  <div
                    key={vencimento.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-smooth"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        {vencimento.status === "concluido" ? (
                          <CheckCircle className="h-6 w-6 text-success" />
                        ) : (
                          <Clock className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{vencimento.item}</h3>
                          {statusInfo.severity === "urgente" && vencimento.status !== "concluido" && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Aeronave: {vencimento.aeronave}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {new Date(vencimento.dataVencimento).toLocaleDateString('pt-BR')}
                          </p>
                          {vencimento.periodoValor && (
                            <p className="text-sm text-muted-foreground">
                              • Periodicidade: {vencimento.periodoValor} {vencimento.periodoTipo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          vencimento.diasRestantes < 0 
                            ? "text-destructive" 
                            : vencimento.diasRestantes <= vencimento.diasAlerta
                            ? "text-warning"
                            : "text-success"
                        }`}>
                          {vencimento.diasRestantes < 0 ? "Vencido" : `${vencimento.diasRestantes} dias`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vencimento.diasRestantes < 0 ? "" : "restantes"}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(vencimento.id, "pendente")}>
                            Marcar como Pendente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(vencimento.id, "programado")}>
                            Marcar como Programado
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(vencimento.id, "concluido")}>
                            Marcar como Concluído
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
