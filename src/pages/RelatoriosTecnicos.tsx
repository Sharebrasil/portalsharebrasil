import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OSDialog } from "@/components/relatorios/OSDialog";

export default function RelatoriosTecnicos() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { fetchManutencoesWithAircraft } = await import("@/services/manutencoes");
        const rows = await fetchManutencoesWithAircraft();
        const mapped = rows.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          aeronave: m.aeronave_registration || "-",
          data: m.data_programada,
          mecanico: m.mecanico,
          status: m.etapa,
          descricao: m.observacoes || "",
        }));
        setRelatorios(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Relatórios Técnicos (O.S)
            </h1>
            <p className="text-muted-foreground">
              Gerencie as Ordens de Serviço e relatórios técnicos de manutenção
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {relatorios.filter(r => r.status === "concluida").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {relatorios.filter(r => r.status === "em_andamento").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {relatorios.filter(r => r.status === "pendente").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{relatorios.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Ordens de Serviço</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar O.S..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorios.map((relatorio) => (
                <div
                  key={relatorio.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-smooth"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{relatorio.tipo}</h3>
                        <Badge variant="outline" className="text-xs">
                          {relatorio.aeronave || "-"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mecânico: {relatorio.mecanico}
                      </p>
                      {relatorio.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {relatorio.descricao}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Data: {new Date(relatorio.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        relatorio.status === "concluida"
                          ? "bg-success text-white"
                          : relatorio.status === "em_andamento"
                          ? "bg-warning text-black"
                          : "bg-primary text-primary-foreground"
                      }
                    >
                      {relatorio.status === "concluida" && "Finalizado"}
                      {relatorio.status === "em_andamento" && "Em Andamento"}
                      {relatorio.status === "aguardando" && "Pendente"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
