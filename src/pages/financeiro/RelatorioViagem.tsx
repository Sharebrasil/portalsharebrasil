import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, DollarSign, Plus, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TravelReportForm } from "@/components/travel/TravelReportForm";
import { TravelReportsFolder } from "@/components/travel/TravelReportsFolder";

interface TravelReport {
  aeronave: string | null;
  cotista: string | null;
  created_at: string | null;
  description: string | null;
  destination: string;
  end_date: string | null;
  expense_count: number | null;
  has_receipts: boolean | null;
  id: string;
  numero_relatorio: string | null;
  start_date: string;
  status: string | null;
  total_amount: number | null;
  tripulante: string | null;
  type: string | null;
  updated_at: string | null;
  user_id: string | null;
}

export default function RelatorioViagem() {
  const [reports, setReports] = useState<TravelReport[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('travel_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar relatórios");
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalized':
        return <Badge className="bg-green-500">Finalizado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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


  if (isCreating) {
    return (
      <Layout>
        <div className="p-6">
          <TravelReportForm
            onSave={() => {
              setIsCreating(false);
              loadReports();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatório de Viagem</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe os relatórios de viagens
            </p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" />
            Nova Viagem
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Viagens</p>
                  <p className="text-2xl font-bold text-primary">{reports.length}</p>
                </div>
                <Plane className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-secondary">
                    {reports.filter(r => {
                      const reportDate = new Date(r.created_at);
                      const now = new Date();
                      return reportDate.getMonth() === now.getMonth() &&
                        reportDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gasto Total</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency(reports.reduce((sum, r) => sum + (r.total_amount || 0), 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Relatórios</p>
                  <p className="text-2xl font-bold text-success">
                    {reports.filter(r => r.status === 'finalized').length}
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <TravelReportsFolder />
      </div>
    </Layout>
  );
}
