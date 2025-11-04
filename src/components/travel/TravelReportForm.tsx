import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Expense {
  category: string;
  description: string;
  amount: string;
  paid_by: string;
  receipt_url?: string;
  receipt_file?: File;
}

interface TravelReportFormProps {
  onSave: () => void;
  onCancel: () => void;
}

interface CrewMember {
  id: string;
  full_name: string;
  canac: string;
}

export function TravelReportForm({ onSave, onCancel }: TravelReportFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [filteredCrew, setFilteredCrew] = useState<CrewMember[]>([]);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cotista: "",
    aeronave: "",
    tripulante: "",
    destination: "",
    route: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const [expenses, setExpenses] = useState<Expense[]>([
    { category: "", description: "", amount: "", paid_by: "" }
  ]);

  const [totals, setTotals] = useState({
    total_fuel: 0,
    total_lodging: 0,
    total_food: 0,
    total_transport: 0,
    total_other: 0,
    total_crew: 0,
    total_client: 0,
    total_sharebrasil: 0,
    total_amount: 0
  });

  useEffect(() => {
    loadClients();
    loadAircraft();
    loadCrewMembers();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [expenses]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').eq('status', 'ativo').order('company_name');
    if (data) setClients(data);
  };

  const loadAircraft = async () => {
    const { data } = await supabase.from('aircraft').select('*').order('registration');
    if (data) setAircraft(data);
  };

  const loadCrewMembers = async () => {
    const { data } = await supabase
      .from('crew_members')
      .select('id, full_name, canac')
      .eq('status', 'active')
      .order('full_name');
    if (data) {
      setCrewMembers(data);
      setFilteredCrew(data);
    }
  };

  const handleCrewSearch = (value: string) => {
    setFormData(prev => ({ ...prev, tripulante: value }));
    
    if (value.trim()) {
      const filtered = crewMembers.filter(crew =>
        crew.full_name.toLowerCase().includes(value.toLowerCase()) ||
        crew.canac.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCrew(filtered);
      setShowCrewDropdown(true);
    } else {
      setFilteredCrew(crewMembers);
      setShowCrewDropdown(false);
    }
  };

  const selectCrewMember = (crew: CrewMember) => {
    setFormData(prev => ({ ...prev, tripulante: crew.full_name }));
    setShowCrewDropdown(false);
  };

  const addExpense = () => {
    setExpenses([...expenses, { category: "", description: "", amount: "", paid_by: "" }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof Expense, value: string | File) => {
    const newExpenses = [...expenses];
    if (field === 'receipt_file' && value instanceof File) {
      newExpenses[index] = { ...newExpenses[index], receipt_file: value };
    } else if (typeof value === 'string') {
      newExpenses[index] = { ...newExpenses[index], [field]: value } as Expense;
    }
    setExpenses(newExpenses);
  };

  const handleFileUpload = async (file: File, expenseIndex: number): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('travel-reports')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('travel-reports')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do comprovante');
      return null;
    }
  };

  const calculateTotals = () => {
    const newTotals = {
      total_fuel: 0,
      total_lodging: 0,
      total_food: 0,
      total_transport: 0,
      total_other: 0,
      total_crew: 0,
      total_client: 0,
      total_sharebrasil: 0,
      total_amount: 0
    };

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0;

      switch (expense.category) {
        case 'Combustível':
          newTotals.total_fuel += amount;
          break;
        case 'Hospedagem':
          newTotals.total_lodging += amount;
          break;
        case 'Alimentação':
          newTotals.total_food += amount;
          break;
        case 'Transporte':
          newTotals.total_transport += amount;
          break;
        default:
          newTotals.total_other += amount;
      }

      switch (expense.paid_by) {
        case 'Tripulante':
          newTotals.total_crew += amount;
          break;
        case 'Cliente':
          newTotals.total_client += amount;
          break;
        case 'ShareBrasil':
          newTotals.total_sharebrasil += amount;
          break;
      }
    });

    newTotals.total_amount = newTotals.total_crew + newTotals.total_client + newTotals.total_sharebrasil;
    setTotals(newTotals);
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  const handleSave = async () => {
    if (!formData.cotista || !formData.aeronave || !formData.tripulante) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const expensesWithReceipts = await Promise.all(
        expenses.map(async (expense) => {
          if (expense.receipt_file) {
            const url = await handleFileUpload(expense.receipt_file, 0);
            return { ...expense, receipt_url: url || undefined, receipt_file: undefined };
          }
          return expense;
        })
      );

      const year = new Date().getFullYear();
      const currentClient = clients.find(c => c.id === formData.cotista);
      
      const { data: existingReports } = await supabase
        .from('travel_reports')
        .select('numero_relatorio')
        .ilike('numero_relatorio', `%${currentClient?.company_name || ''}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingReports && existingReports.length > 0) {
        const lastNumber = existingReports[0].numero_relatorio?.match(/REL (\d+)/);
        if (lastNumber) {
          nextNumber = parseInt(lastNumber[1]) + 1;
        }
      }

      const reportNumber = `REL ${String(nextNumber).padStart(3, '0')}/${String(year).slice(-2)} - ${formData.aeronave} - ${currentClient?.company_name || formData.cotista}`;

      const { data: report, error: reportError } = await supabase
        .from('travel_reports')
        .insert([{
          numero_relatorio: reportNumber,
          cotista: formData.cotista,
          aeronave: formData.aeronave,
          tripulante: formData.tripulante,
          destination: formData.destination,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description,
          total_amount: totals.total_amount,
          status: 'draft',
          type: 'company'
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      const expensesData = expensesWithReceipts
        .filter(e => e.description && e.amount)
        .map(e => ({
          travel_report_id: report.id,
          category: e.category,
          description: e.description,
          amount: parseFloat(e.amount),
          paid_by: e.paid_by,
          receipt_url: e.receipt_url
        }));

      if (expensesData.length > 0) {
        const { error: expensesError } = await supabase
          .from('travel_expenses')
          .insert(expensesData);

        if (expensesError) throw expensesError;
      }

      const clientReimbursementAmount = totals.total_crew + totals.total_sharebrasil;
      
      if (clientReimbursementAmount > 0) {
        const { error: clientReconcError } = await supabase
          .from('client_reconciliations')
          .insert({
            travel_report_id: report.id,
            client_id: formData.cotista,
            aircraft_registration: formData.aeronave,
            description: reportNumber,
            amount: clientReimbursementAmount,
            category: 'Despesa de Viagem',
            status: 'pendente'
          });

        if (clientReconcError) {
          console.error('Erro ao criar conciliação com cliente:', clientReconcError);
        }
      }

      if (totals.total_crew > 0) {
        const { error: crewReconcError } = await supabase
          .from('crew_reconciliations')
          .insert({
            travel_report_id: report.id,
            crew_member_name: formData.tripulante,
            client_id: formData.cotista,
            aircraft_registration: formData.aeronave,
            description: reportNumber,
            amount: totals.total_crew,
            category: 'Reembolso de Viagem',
            status: 'pendente'
          });

        if (crewReconcError) {
          console.error('Erro ao criar conciliação colaborador:', crewReconcError);
        }
      }

      toast.success("Relatório e conciliações criados com sucesso!");
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || "Erro ao salvar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Relatório de Viagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.cotista} onValueChange={(value) => setFormData({...formData, cotista: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraft">Aeronave *</Label>
              <Select value={formData.aeronave} onValueChange={(value) => setFormData({...formData, aeronave: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aeronave" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map(ac => (
                    <SelectItem key={ac.id} value={ac.registration}>
                      {ac.registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="crew1">Tripulante 1 *</Label>
              <Input
                id="crew1"
                value={formData.tripulante}
                onChange={(e) => handleCrewSearch(e.target.value)}
                onFocus={() => setShowCrewDropdown(true)}
                placeholder="Digite para buscar..."
                autoComplete="off"
              />
              {showCrewDropdown && filteredCrew.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCrew.map((crew) => (
                    <div
                      key={crew.id}
                      className="px-4 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => selectCrewMember(crew)}
                    >
                      <div className="font-medium">{crew.full_name}</div>
                      <div className="text-sm text-muted-foreground">CANAC: {crew.canac}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">Trecho</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({...formData, route: e.target.value})}
                placeholder="Ex: Cuiabá x Campo Novo do Parecis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destino *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Período: {calculateDays()} dia(s)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Despesas</CardTitle>
            <Button onClick={addExpense} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead>Pago Por</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={expense.category}
                      onValueChange={(value) => updateExpense(index, 'category', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Combustível">Combustível</SelectItem>
                        <SelectItem value="Hospedagem">Hospedagem</SelectItem>
                        <SelectItem value="Alimentação">Alimentação</SelectItem>
                        <SelectItem value="Transporte">Transporte</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      placeholder="Descrição"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={expense.paid_by}
                      onValueChange={(value) => updateExpense(index, 'paid_by', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pago por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tripulante">Tripulante</SelectItem>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="ShareBrasil">ShareBrasil</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) updateExpense(index, 'receipt_file', file);
                        }}
                        className="hidden"
                        id={`file-${index}`}
                      />
                      <Label htmlFor={`file-${index}`} className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <div>
                            <Upload className="h-4 w-4 mr-1" />
                            {expense.receipt_file ? 'Arquivo anexado' : 'Anexar'}
                          </div>
                        </Button>
                      </Label>
                      {expense.receipt_file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateExpense(index, 'receipt_file', '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(index)}
                      disabled={expenses.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Totais por Categoria</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Combustível:</span>
                  <span>R$ {totals.total_fuel.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hospedagem:</span>
                  <span>R$ {totals.total_lodging.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alimentação:</span>
                  <span>R$ {totals.total_food.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transporte:</span>
                  <span>R$ {totals.total_transport.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outros:</span>
                  <span>R$ {totals.total_other.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>TOTAL:</span>
                  <span>R$ {totals.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Totais por Pagador</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tripulante:</span>
                  <span>R$ {totals.total_crew.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>R$ {totals.total_client.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ShareBrasil:</span>
                  <span>R$ {totals.total_sharebrasil.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>TOTAL:</span>
                  <span>R$ {totals.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Relatório"}
        </Button>
      </div>
    </div>
  );
}
