import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, Eye, ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  company_name: string;
}

interface TravelReport {
  id: string;
  numero_relatorio: string;
  cotista: string;
  aeronave: string;
  tripulante: string;
  destination: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export function TravelReportsFolder() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [reports, setReports] = useState<TravelReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (error) {
      toast.error("Erro ao carregar clientes");
      console.error(error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const loadReportsByClient = async (clientId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('travel_reports')
      .select('*')
      .eq('cotista', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar relatórios");
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    loadReportsByClient(client.id);
  };

  const handleBack = () => {
    setSelectedClient(null);
    setReports([]);
  };

  const handleViewPDF = async (reportId: string) => {
    try {
      toast.info("Gerando relatório...");
      
      const { data, error } = await supabase.functions.invoke('generate-travel-pdf', {
        body: { reportId }
      });

      if (error) throw error;

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data as string);
        newWindow.document.close();
      }
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao gerar relatório");
    }
  };

  const handleDownloadPDF = async (reportId: string, reportNumber: string) => {
    try {
      toast.info("Preparando download...");
      
      const { data, error } = await supabase.functions.invoke('generate-travel-pdf', {
        body: { reportId }
      });

      if (error) throw error;

      const blob = new Blob([data as string], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportNumber.replace(/\//g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Arquivo baixado! Abra no navegador e use Ctrl+P para imprimir como PDF");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao baixar arquivo");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (selectedClient) {
    return (
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {selectedClient.company_name}
              </CardTitle>
            </div>
            <Badge variant="outline">
              {reports.length} {reports.length === 1 ? 'relatório' : 'relatórios'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : reports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum relatório encontrado para este cliente
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-smooth"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{report.numero_relatorio}</h4>
                        <Badge variant="outline" className="text-xs">
                          {report.aeronave}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.tripulante} • {report.destination}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(report.start_date)} - {formatDate(report.end_date)} • {formatCurrency(report.total_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPDF(report.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(report.id, report.numero_relatorio)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Pastas por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : clients.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhum cliente cadastrado
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientClick(client)}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary transition-smooth text-left group"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-smooth">
                    {client.company_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Clique para ver relatórios
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
