import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plane, MapPin, Calendar, DollarSign, Plus, FileText, Download, Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDF, CATEGORIAS_DESPESA, PAGADORES, formatDateBR, type TravelReport, type TravelExpense } from "@/lib/travelReportPDF";
import { useClientes, useAeronaves, useTripulantes } from "@/hooks/useData";


interface DBTravelReport {
  id: string;
  numero: string;
  cliente: string;
  aeronave: string;
  tripulante: string;
  tripulante2: string | null;
  destino: string;
  data_inicio: string;
  data_fim: string;
  observacoes: string | null;
  total_combustivel: number;
  total_hospedagem: number;
  total_alimentacao: number;
  total_transporte: number;
  total_outros: number;
  total_tripulante: number;
  total_cliente: number;
  total_share_brasil: number;
  valor_total: number;
  created_at: string;
}

export default function RelatorioViagem() {
  const [reports, setReports] = useState<DBTravelReport[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<DBTravelReport | null>(null);
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [uploading, setUploading] = useState(false);

  // Chamada dos hooks para buscar dados
  const { clientes, isLoadingClientes } = useClientes();
  const { aeronaves, isLoadingAeronaves } = useAeronaves();
  const { tripulantes, isLoadingTripulantes } = useTripulantes();
  
  const [formData, setFormData] = useState({
    numero: "",
    cliente: "",
    aeronave: "",
    tripulante: "",
    tripulante2: "",
    destino: "",
    data_inicio: "",
    data_fim: "",
    observacoes: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    categoria: CATEGORIAS_DESPESA[0],
    descricao: "",
    valor: "",
    pago_por: PAGADORES[0],
    comprovante: null as File | null
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('travel_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar relatórios');
      return;
    }

    setReports(data || []);
  };

  const loadExpenses = async (reportId: string) => {
    const { data, error } = await supabase
      .from('travel_expenses')
      .select('*')
      .eq('travel_report_id', reportId);

    if (error) {
      toast.error('Erro ao carregar despesas');
      return;
    }

    const expensesWithUrls = await Promise.all((data || []).map(async (expense) => {
      if (expense.comprovante_url) {
        const { data: urlData } = await supabase.storage
          .from('travel-receipts')
          .createSignedUrl(expense.comprovante_url, 3600);
        
        return {
          ...expense,
          comprovante_url: urlData?.signedUrl || expense.comprovante_url
        };
      }
      return expense;
    }));

    setExpenses(expensesWithUrls);
  };

  const calculateTotals = (expensesList: TravelExpense[]) => {
    const totals = {
      total_combustivel: 0,
      total_hospedagem: 0,
      total_alimentacao: 0,
      total_transporte: 0,
      total_outros: 0,
      total_tripulante: 0,
      total_cliente: 0,
      total_share_brasil: 0,
      valor_total: 0
    };

    expensesList.forEach(expense => {
      const valor = Number(expense.valor) || 0;
      totals.valor_total += valor;

      switch (expense.categoria) {
        case 'Combustível': totals.total_combustivel += valor; break;
        case 'Hospedagem': totals.total_hospedagem += valor; break;
        case 'Alimentação': totals.total_alimentacao += valor; break;
        case 'Transporte': totals.total_transporte += valor; break;
        default: totals.total_outros += valor;
      }

      switch (expense.pago_por) {
        case 'Tripulante': totals.total_tripulante += valor; break;
        case 'Cliente': totals.total_cliente += valor; break;
        case 'ShareBrasil': totals.total_share_brasil += valor; break;
      }
    });

    return totals;
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const reportData = {
      ...formData,
      total_combustivel: 0,
      total_hospedagem: 0,
      total_alimentacao: 0,
      total_transporte: 0,
      total_outros: 0,
      total_tripulante: 0,
      total_cliente: 0,
      total_share_brasil: 0,
      valor_total: 0
    };

    // Normalize optional tripulante2 value coming from the Select (we use "none" as placeholder)
    if ((reportData as any).tripulante2 === 'none') {
      (reportData as any).tripulante2 = null;
    }

    // If cliente was selected as an id in the Select, turn it back into the company_name
    if ((reportData as any).cliente) {
      const sel = clientes.find(c => c.id === (reportData as any).cliente);
      if (sel) {
        (reportData as any).cliente = sel.company_name || '';
      }
    }

    if (currentReport) {
      const { error } = await supabase
        .from('travel_reports')
        .update(reportData)
        .eq('id', currentReport.id);

      if (error) {
        toast.error('Erro ao atualizar relatório');
        return;
      }
      toast.success('Relatório atualizado com sucesso');
    } else {
      const { data, error } = await supabase
        .from('travel_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar relatório');
        return;
      }
      toast.success('Relatório criado com sucesso');
      setCurrentReport(data);
    }

    setIsDialogOpen(false);
    loadReports();
    resetForm();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentReport) {
      toast.error('Selecione um relatório primeiro');
      return;
    }

    let comprovanteUrl = null;

    if (expenseForm.comprovante) {
      setUploading(true);
      const fileName = `${currentReport.id}/${Date.now()}_${expenseForm.comprovante.name}`;
      const { error: uploadError } = await supabase.storage
        .from('travel-receipts')
        .upload(fileName, expenseForm.comprovante);

      if (uploadError) {
        toast.error('Erro ao fazer upload do comprovante');
        setUploading(false);
        return;
      }

      comprovanteUrl = fileName;
      setUploading(false);
    }

    const { error } = await supabase
      .from('travel_expenses')
      .insert({
        travel_report_id: currentReport.id,
        categoria: expenseForm.categoria,
        descricao: expenseForm.descricao,
        valor: parseFloat(expenseForm.valor),
        pago_por: expenseForm.pago_por,
        comprovante_url: comprovanteUrl
      });

    if (error) {
      toast.error('Erro ao adicionar despesa');
      return;
    }

    toast.success('Despesa adicionada com sucesso');
    await loadExpenses(currentReport.id);
    
    const totals = calculateTotals([...expenses, {
      categoria: expenseForm.categoria,
      descricao: expenseForm.descricao,
      valor: parseFloat(expenseForm.valor),
      pago_por: expenseForm.pago_por,
      comprovante_url: comprovanteUrl || undefined
    }]);

    await supabase
      .from('travel_reports')
      .update(totals)
      .eq('id', currentReport.id);

    loadReports();
    resetExpenseForm();
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Deseja excluir este relatório?')) return;

    const { error } = await supabase
      .from('travel_reports')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir relatório');
      return;
    }

    toast.success('Relatório excluído com sucesso');
    loadReports();
  };

  const handleGeneratePDF = async (report: DBTravelReport) => {
    try {
      await loadExpenses(report.id);
      
      const { data: expensesData } = await supabase
        .from('travel_expenses')
        .select('*')
        .eq('travel_report_id', report.id);

      const expensesWithUrls = await Promise.all((expensesData || []).map(async (expense) => {
        if (expense.comprovante_url) {
          const { data: urlData } = await supabase.storage
            .from('travel-receipts')
            .createSignedUrl(expense.comprovante_url, 3600);
          
          return {
            categoria: expense.categoria,
            descricao: expense.descricao,
            valor: expense.valor,
            pago_por: expense.pago_por,
            comprovante_url: urlData?.signedUrl || undefined
          };
        }
        return {
          categoria: expense.categoria,
          descricao: expense.descricao,
          valor: expense.valor,
          pago_por: expense.pago_por
        };
      }));

      const pdfReport: TravelReport = {
        ...report,
        despesas: expensesWithUrls
      };

      await generatePDF(pdfReport);
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const openExpenseDialog = (report: DBTravelReport) => {
    setCurrentReport(report);
    loadExpenses(report.id);
    setIsExpenseDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      numero: "",
      cliente: "",
      aeronave: "",
      tripulante: "",
      tripulante2: "",
      destino: "",
      data_inicio: "",
      data_fim: "",
      observacoes: ""
    });
    setCurrentReport(null);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      categoria: CATEGORIAS_DESPESA[0],
      descricao: "",
      valor: "",
      pago_por: PAGADORES[0],
      comprovante: null
    });
  };

  const getStatusBadge = (report: DBTravelReport) => {
    const hasExpenses = expenses.length > 0;
    if (report.valor_total > 0) {
      return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Em andamento</Badge>;
  };

  // Mostrar estado de carregamento
  if (isLoadingClientes || isLoadingAeronaves || isLoadingTripulantes) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Carregando dados necessários...</p>
          </div>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Nova Viagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentReport ? 'Editar Viagem' : 'Nova Viagem'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="REL001/24"
                      required
                    />
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <Select
                      value={formData.cliente}
                      onValueChange={(value) => setFormData({ ...formData, cliente: value })}
                      disabled={isLoadingClientes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClientes ? "Carregando..." : "Selecione o cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(client => (
                          // use client.id as the Select value to guarantee a non-empty value
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Aeronave</Label>
                    <Select
                      value={formData.aeronave}
                      onValueChange={(value) => setFormData({ ...formData, aeronave: value })}
                      disabled={isLoadingAeronaves}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingAeronaves ? "Carregando..." : "Selecione a aeronave"} />
                      </SelectTrigger>
                      <SelectContent>
                        {aeronaves.map(ac => (
                          <SelectItem key={ac.id} value={ac.registration}>
                            {ac.registration} - {ac.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Destino/Trecho</Label>
                    <Input
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                      placeholder="Ex: SBSP - SBRJ"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tripulante 1</Label>
                    <Select
                      value={formData.tripulante}
                      onValueChange={(value) => setFormData({ ...formData, tripulante: value })}
                      disabled={isLoadingTripulantes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingTripulantes ? "Carregando..." : "Selecione o tripulante"} />
                      </SelectTrigger>
                      <SelectContent>
                        {tripulantes.map(crew => (
                          <SelectItem key={crew.id} value={crew.full_name}>
                            {crew.full_name} - {crew.canac}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tripulante 2 (Opcional)</Label>
                    <Select
                      value={formData.tripulante2}
                      onValueChange={(value) => setFormData({ ...formData, tripulante2: value })}
                      disabled={isLoadingTripulantes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingTripulantes ? "Carregando..." : "Selecione o tripulante"} />
                      </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {tripulantes.map(crew => (
                            <SelectItem key={crew.id} value={crew.full_name}>
                              {crew.full_name} - {crew.canac}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {currentReport ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    {reports.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
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
                    R$ {(reports.reduce((sum, r) => sum + r.valor_total, 0) / 1000).toFixed(1)}K
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
                  <p className="text-sm text-muted-foreground">Destinos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(reports.map(r => r.destino)).size}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Viagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.numero}</TableCell>
                    <TableCell>{report.cliente}</TableCell>
                    <TableCell>{report.destino}</TableCell>
                    <TableCell>
                      {formatDateBR(report.data_inicio)} - {formatDateBR(report.data_fim)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {report.valor_total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openExpenseDialog(report)}
                        >
                          Ver Despesas
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGeneratePDF(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Despesas - {currentReport?.numero}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddExpense} className="space-y-4 border-b pb-4">
              <h3 className="font-semibold">Adicionar Despesa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={expenseForm.categoria}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_DESPESA.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pago Por</Label>
                  <Select
                    value={expenseForm.pago_por}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, pago_por: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGADORES.map(pag => (
                        <SelectItem key={pag} value={pag}>{pag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={expenseForm.descricao}
                  onChange={(e) => setExpenseForm({ ...expenseForm, descricao: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={expenseForm.valor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, valor: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Comprovante (Opcional)</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setExpenseForm({ ...expenseForm, comprovante: e.target.files?.[0] || null })}
                />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Adicionar Despesa'}
              </Button>
            </form>

            <div>
              <h3 className="font-semibold mb-4">Despesas Cadastradas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pago Por</TableHead>
                    <TableHead>Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{expense.categoria}</TableCell>
                      <TableCell>{expense.descricao}</TableCell>
                      <TableCell>R$ {Number(expense.valor).toFixed(2)}</TableCell>
                      <TableCell>{expense.pago_por}</TableCell>
                      <TableCell>
                        {expense.comprovante_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(expense.comprovante_url, '_blank')}
                          >
                            Ver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
