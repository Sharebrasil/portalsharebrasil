import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, User, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusUpdateDialog } from "./StatusUpdateDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface CrewReconciliation {
  id: string;
  travel_report_id: string | null;
  crew_member_name: string;
  client_id: string | null;
  aircraft_registration: string | null;
  description: string;
  amount: number;
  category: string;
  status: string;
  paid_date: string | null;
  created_at: string;
  clients: { company_name: string } | null;
}

export function ConciliacaoColaborador() {
  const [reconciliations, setReconciliations] = useState<CrewReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const { hasAnyRole } = useUserRole();
  const canEditStatus = hasAnyRole(['admin', 'financeiro_master', 'financeiro', 'gestor_master']);
  const canDelete = hasAnyRole(['admin', 'financeiro_master', 'gestor_master']);

  useEffect(() => {
    loadReconciliations();
  }, []);

  const loadReconciliations = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('crew_reconciliations')
      .select(`
        *,
        clients:client_id(company_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const errorMessage = error.message || 'Falha ao carregar conciliações. Tente novamente.';
      console.error('Erro ao carregar conciliações:', error);
      setError(errorMessage);
      toast.error('Erro', {
        description: errorMessage
      });
    } else {
      setReconciliations(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500 text-white">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500 text-white">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleStatusClick = (id: string, currentStatus: string) => {
    if (!canEditStatus) {
      return;
    }
    setSelectedId(id);
    setSelectedStatus(currentStatus);
    setStatusDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    const confirmed = window.confirm('Deseja realmente excluir esta conciliação?');
    if (!confirmed) return;
    const { error } = await supabase.from('crew_reconciliations').delete().eq('id', id);
    if (error) {
      const errorMessage = error.message || 'Falha ao excluir conciliação.';
      console.error('Erro ao excluir conciliação:', error);
      toast.error('Erro', {
        description: errorMessage
      });
      return;
    }
    toast.success('Conciliação excluída com sucesso');
    await loadReconciliations();
  };

  const totals = {
    totalPago: reconciliations.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.amount), 0),
    totalPendente: reconciliations.filter(r => r.status === 'pendente').reduce((sum, r) => sum + Number(r.amount), 0),
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalPago)}
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
                  {formatCurrency(totals.totalPendente)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Conciliação Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aeronave</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Nenhuma conciliação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="truncate">{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.crew_member_name}</TableCell>
                    <TableCell>{item.clients?.company_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.aircraft_registration}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(Number(item.amount))}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatDate(item.paid_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canEditStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusClick(item.id, item.status)}
                          >
                            Alterar Status
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        )}
                        {!canEditStatus && !canDelete && (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedId && (
        <StatusUpdateDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          reconciliationId={selectedId}
          currentStatus={selectedStatus}
          type="crew"
          onUpdate={loadReconciliations}
        />
      )}
    </div>
  );
}
