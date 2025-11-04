import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Clock, Send, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type BankReconciliation = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  status: string;
  reference_type: string;
  reference_id: string;
  cliente?: string;
  aeronave?: string;
  categoria?: string;
};

export function ConciliacaoClientes() {
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      // Buscar relatórios de viagem
      const { data: reports, error: reportsError } = await supabase
        .from("travel_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Buscar recibos
      const { data: receipts, error: receiptsError } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });

      if (receiptsError) throw receiptsError;

      // Buscar conciliações existentes
      const { data: existingRecs, error: recsError } = await supabase
        .from("bank_reconciliations")
        .select("*")
        .in("reference_type", ["travel_report", "receipt"])
        .order("transaction_date", { ascending: false });

      if (recsError) throw recsError;

      // Combinar dados
      const combined: BankReconciliation[] = [];

      // Adicionar relatórios de viagem
      reports?.forEach((report) => {
        const existing = existingRecs?.find(
          (r) => r.reference_type === "travel_report" && r.reference_id === report.id
        );
        
        combined.push({
          id: existing?.id || report.id,
          transaction_date: report.data_inicio,
          description: `Relatório ${report.numero} - ${report.destino}`,
          amount: Number(report.valor_total),
          status: existing?.status || "pending",
          reference_type: "travel_report",
          reference_id: report.id,
          cliente: report.cliente,
          aeronave: report.aeronave,
          categoria: "relatório",
        });
      });

      // Adicionar recibos
      receipts?.forEach((receipt) => {
        const existing = existingRecs?.find(
          (r) => r.reference_type === "receipt" && r.reference_id === receipt.id
        );
        
        combined.push({
          id: existing?.id || receipt.id,
          transaction_date: receipt.issue_date,
          description: receipt.service_description,
          amount: Number(receipt.amount),
          status: existing?.status || "pending",
          reference_type: "receipt",
          reference_id: receipt.id,
          cliente: receipt.payer_name,
          categoria: "recibo",
        });
      });

      setReconciliations(combined);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reconciliation: BankReconciliation, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já existe uma conciliação
      const { data: existing } = await supabase
        .from("bank_reconciliations")
        .select("id")
        .eq("reference_type", reconciliation.reference_type)
        .eq("reference_id", reconciliation.reference_id)
        .single();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from("bank_reconciliations")
          .update({ 
            status: newStatus,
            approved_by: newStatus === "paid" || newStatus === "completed" ? user.id : null,
            approved_at: newStatus === "paid" || newStatus === "completed" ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Criar nova
        const { error } = await supabase
          .from("bank_reconciliations")
          .insert({
            reference_type: reconciliation.reference_type,
            reference_id: reconciliation.reference_id,
            transaction_date: reconciliation.transaction_date,
            description: reconciliation.description,
            amount: reconciliation.amount,
            status: newStatus,
            created_by: user.id,
            approved_by: newStatus === "paid" || newStatus === "completed" ? user.id : null,
            approved_at: newStatus === "paid" || newStatus === "completed" ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      toast({
        title: "Status atualizado",
        description: "Conciliação atualizada com sucesso",
      });

      fetchReconciliations();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const resumoClientes = {
    totalPago: reconciliations.filter(r => r.status === "paid").reduce((acc, r) => acc + r.amount, 0),
    totalConcluido: reconciliations.filter(r => r.status === "completed").reduce((acc, r) => acc + r.amount, 0),
    totalPendente: reconciliations.filter(r => r.status === "pending").reduce((acc, r) => acc + r.amount, 0),
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(resumoClientes.totalPago)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Concluído</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(resumoClientes.totalConcluido)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(resumoClientes.totalPendente)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Conciliação Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conciliação com Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aeronave</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.transaction_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="truncate">{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.cliente || "N/A"}</TableCell>
                    <TableCell>
                      {item.aeronave ? (
                        <Badge variant="outline">{item.aeronave}</Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.status === "pending" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(item, "paid")}
                          >
                            Marcar Pago
                          </Button>
                        )}
                        {item.status === "paid" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(item, "completed")}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}