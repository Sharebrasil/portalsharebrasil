import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Clock, DollarSign, User } from "lucide-react";
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
  categoria: string;
  pago_por?: string;
};

export function ConciliacaoColaborador() {
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      // Buscar despesas de viagem
      const { data: expenses, error: expensesError } = await supabase
        .from("travel_expenses")
        .select("*, travel_report_id")
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;

      // Buscar conciliações existentes
      const { data: existingRecs, error: recsError } = await supabase
        .from("bank_reconciliations")
        .select("*")
        .eq("reference_type", "expense")
        .order("transaction_date", { ascending: false });

      if (recsError) throw recsError;

      // Combinar dados
      const combined: BankReconciliation[] = [];

      expenses?.forEach((expense) => {
        const existing = existingRecs?.find(
          (r) => r.reference_type === "expense" && r.reference_id === expense.id
        );
        
        combined.push({
          id: existing?.id || expense.id,
          transaction_date: existing?.transaction_date || new Date().toISOString().split("T")[0],
          description: expense.descricao,
          amount: Number(expense.valor),
          status: existing?.status || "pending",
          reference_type: "expense",
          reference_id: expense.id,
          categoria: expense.categoria,
          pago_por: expense.pago_por,
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
      // use any cast to avoid generated types mismatch for this table
      const { data: existing, error: existingError } = await (supabase as any)
        .from("bank_reconciliations")
        .select("id, status")
        .eq("reference_type", reconciliation.reference_type)
        .eq("reference_id", reconciliation.reference_id)
        .single();

      // .single() returns an error when no row exists (406). Ignore not-found.
      if (existingError && (existingError as any).status !== 406 && (existingError as any).status !== 404) {
        throw existingError;
      }

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
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Conciliado</Badge>;
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800">Pago</Badge>;
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
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "paid":
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

  const resumoColaborador = {
    totalConciliado: reconciliations.filter(r => r.status === "completed").reduce((acc, r) => acc + r.amount, 0),
    totalPendente: reconciliations.filter(r => r.status === "pending").reduce((acc, r) => acc + r.amount, 0),
    totalPago: reconciliations.filter(r => r.status === "paid").reduce((acc, r) => acc + r.amount, 0),
    saldoFinal: reconciliations.reduce((acc, r) => acc + r.amount, 0),
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo Colaborador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conciliado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(resumoColaborador.totalConciliado)}
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
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(resumoColaborador.totalPendente)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(resumoColaborador.totalPago)}
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
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(resumoColaborador.saldoFinal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Movimentações do Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Banco</TableHead>
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
                  <TableCell>
                    <Badge variant="secondary">{item.pago_por || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={item.amount > 0 ? "text-green-600" : "text-red-600"}>
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
        </CardContent>
      </Card>
    </div>
  );
}