import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Save, Loader2, DollarSign } from "lucide-react";

const GestaoSalarios = () => {
  const queryClient = useQueryClient();
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCrewMember, setSelectedCrewMember] = useState<string>("");
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState({
    user_id: "",
    position: "",
    department: "",
    gross_salary: "",
    net_salary: "",
    benefits: "",
  });

  const { isAdmin, isFinanceiroMaster, isGestorMaster, isLoading: isRolesLoading } = useUserRole();
  const isAllowed = isAdmin || isFinanceiroMaster || isGestorMaster;

  const { data: salaries = [] } = useQuery({
    queryKey: ["employee_salaries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_salaries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("*")
        .order("full_name");
      if (error) throw new Error(error.message ?? "Erro ao carregar tripulantes");
      return data as any[];
    },
  });

  const { data: aircraftRates = [] } = useQuery({
    queryKey: ["aircraft_hourly_rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft_hourly_rates")
        .select(`*, aircraft:aircraft_id ( registration, model )`);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: flightPayments = [] } = useQuery({
    queryKey: ["flight_payments", selectedCrewMember, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!selectedCrewMember) return [];
      const { data, error } = await supabase
        .from("flight_payments")
        .select(`*, crew_member:crew_member_id ( full_name, canac )`)
        .eq("crew_member_id", selectedCrewMember)
        .eq("month", selectedMonth)
        .eq("year", selectedYear);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedCrewMember,
  });

  const { data: crewFlightHours = [] } = useQuery({
    queryKey: ["crew_flight_hours", selectedCrewMember],
    queryFn: async () => {
      if (!selectedCrewMember) return [];
      const { data, error } = await supabase
        .from("crew_flight_hours")
        .select(`*, aircraft:aircraft_id ( registration )`)
        .eq("crew_member_id", selectedCrewMember);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedCrewMember,
  });

  const saveSalaryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSalaryId) {
        const { error } = await supabase.from("employee_salaries").update(data).eq("id", editingSalaryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employee_salaries").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_salaries"] });
      toast.success("Salário salvo com sucesso!");
      setEditingSalaryId(null);
      setIsSalaryDialogOpen(false);
      setSalaryForm({
        user_id: "",
        position: "",
        department: "",
        gross_salary: "",
        net_salary: "",
        benefits: "",
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar salário:", error);
      toast.error("Erro ao salvar salário");
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_salaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_salaries"] });
      toast.success("Salário deletado com sucesso!");
      setDeleteId(null);
    },
    onError: (error) => {
      console.error("Erro ao deletar salário:", error);
      toast.error("Erro ao deletar salário");
    },
  });

  const saveRateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingRateId) {
        const { error } = await supabase
          .from("aircraft_hourly_rates")
          .update(data)
          .eq("id", editingRateId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aircraft_hourly_rates").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aircraft_hourly_rates"] });
      toast.success("Valor salvo com sucesso!");
      setEditingRateId(null);
    },
    onError: () => {
      toast.error("Erro ao salvar valor");
    },
  });

  const calculatePaymentMutation = useMutation({
    mutationFn: async () => {
      let totalHours = 0;
      let calculatedAmount = 0;

      for (const hours of crewFlightHours as any[]) {
        const rate = (aircraftRates as any[]).find((r) => r.aircraft_id === hours.aircraft_id);
        if (rate) {
          totalHours += Number(hours.total_hours);
          calculatedAmount += Number(hours.total_hours) * Number(rate.hourly_rate);
        }
      }

      const paymentData = {
        crew_member_id: selectedCrewMember,
        month: selectedMonth,
        year: selectedYear,
        total_hours: totalHours,
        calculated_amount: calculatedAmount,
        final_amount: calculatedAmount,
      } as any;

      const { error } = await supabase.from("flight_payments").upsert(paymentData, {
        onConflict: "crew_member_id,month,year",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight_payments"] });
      toast.success("Pagamento calculado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao calcular pagamento");
    },
  });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handleOpenSalaryDialog = (salary?: any) => {
    if (salary) {
      setEditingSalaryId(salary.id);
      setSalaryForm({
        user_id: salary.user_id || "",
        position: salary.position || "",
        department: salary.department || "",
        gross_salary: salary.gross_salary || "",
        net_salary: salary.net_salary || "",
        benefits: salary.benefits || "",
      });
    } else {
      setEditingSalaryId(null);
      setSalaryForm({
        user_id: "",
        position: "",
        department: "",
        gross_salary: "",
        net_salary: "",
        benefits: "",
      });
    }
    setIsSalaryDialogOpen(true);
  };

  const handleSaveSalary = async () => {
    if (!salaryForm.user_id || !salaryForm.gross_salary) {
      toast.error("Preencha os campos obrigatórios (Funcionário e Salário Bruto)");
      return;
    }

    const data = {
      user_id: salaryForm.user_id,
      position: salaryForm.position,
      department: salaryForm.department,
      gross_salary: parseFloat(salaryForm.gross_salary),
      net_salary: parseFloat(salaryForm.net_salary || salaryForm.gross_salary),
      benefits: salaryForm.benefits,
    };

    saveSalaryMutation.mutate(data);
  };

  if (isRolesLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAllowed) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="bg-gradient-primary p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-primary-foreground">Gestão de Salários</h1>
          <p className="text-primary-foreground/80">Gerencie salários fixos e pagamentos por horas de voo</p>
        </div>

        <Tabs defaultValue="salaries" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="salaries">Salários Fixos</TabsTrigger>
            <TabsTrigger value="flights">Pagamentos por Voo</TabsTrigger>
            <TabsTrigger value="aircraft">Aeronaves</TabsTrigger>
          </TabsList>

          <TabsContent value="salaries" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Salários Vigentes</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie salários, benefícios e informações de funcionários</p>
                  </div>
                  <Button onClick={() => handleOpenSalaryDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Salário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(salaries as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum salário cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Salário Bruto</TableHead>
                        <TableHead>Salário Líquido</TableHead>
                        <TableHead>Benefícios</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(salaries as any[]).map((salary) => {
                        const crewMember = (crewMembers as any[]).find((c) => c.user_id === salary.user_id);
                        return (
                          <TableRow key={salary.id}>
                            <TableCell>
                              <div className="font-semibold">{crewMember?.full_name || "N/A"}</div>
                            </TableCell>
                            <TableCell>{salary.position || "-"}</TableCell>
                            <TableCell>
                              <span className="font-semibold">R$ {parseFloat(salary.gross_salary || 0).toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-primary font-semibold">R$ {parseFloat(salary.net_salary || 0).toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{salary.benefits ? `✓ Sim` : "Não"}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenSalaryDialog(salary)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(salary.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Pagamento por Horas de Voo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Funcionário</Label>
                    <Select value={selectedCrewMember} onValueChange={setSelectedCrewMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {(crewMembers as any[]).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mês</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} />
                  </div>
                </div>

                {selectedCrewMember && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Horas de Voo por Aeronave</h3>
                        <Button onClick={() => calculatePaymentMutation.mutate()} disabled={calculatePaymentMutation.isPending}>
                          <Plus className="h-4 w-4 mr-2" />
                          Calcular e Salvar Pagamento
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aeronave</TableHead>
                            <TableHead>Horas Totais</TableHead>
                            <TableHead>Valor/Hora</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(crewFlightHours as any[]).map((hours) => {
                            const rate = (aircraftRates as any[]).find((r) => r.aircraft_id === hours.aircraft_id);
                            const subtotal = Number(hours.total_hours) * (rate?.hourly_rate || 0);
                            return (
                              <TableRow key={hours.id}>
                                <TableCell>{hours.aircraft?.registration}</TableCell>
                                <TableCell>{Number(hours.total_hours).toFixed(2)}h</TableCell>
                                <TableCell>R$ {rate?.hourly_rate || 0}</TableCell>
                                <TableCell>R$ {subtotal.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {((flightPayments as any[]).length > 0) && (
                      <Card className="bg-primary/5">
                        <CardHeader>
                          <CardTitle>Resumo do Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(flightPayments as any[]).map((payment) => (
                            <div key={payment.id} className="space-y-2">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-sm text-muted-foreground">Total de Horas</Label>
                                  <p className="text-2xl font-bold">{Number(payment.total_hours).toFixed(2)}h</p>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Pagamento por Voo</Label>
                                  <p className="text-2xl font-bold text-primary">R$ {Number(payment.calculated_amount).toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Total Geral</Label>
                                  <Input type="number" defaultValue={payment.final_amount} className="text-2xl font-bold" />
                                </div>
                              </div>
                              <div>
                                <Label>Observações</Label>
                                <Textarea defaultValue={payment.observations || ""} />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aircraft" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tabela de Valores por Aeronave</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Aeronave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aeronave</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Valor/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(aircraftRates as any[]).map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-semibold">{rate.aircraft?.registration}</TableCell>
                        <TableCell>{rate.aircraft?.model}</TableCell>
                        <TableCell className="text-primary font-bold">R$ {Number(rate.hourly_rate).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">{rate.status}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
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
          </TabsContent>
        </Tabs>

        {/* Dialog para Criar/Editar Salário */}
        <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSalaryId ? "Editar Salário" : "Adicionar Novo Salário"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="user_id">Funcionário *</Label>
                <Select
                  value={salaryForm.user_id}
                  onValueChange={(value) => setSalaryForm({ ...salaryForm, user_id: value })}
                >
                  <SelectTrigger id="user_id">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {(crewMembers as any[])
                      .filter((member) => member.user_id)
                      .map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    placeholder="Ex: Piloto, Tripulante"
                    value={salaryForm.position}
                    onChange={(e) => setSalaryForm({ ...salaryForm, position: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    placeholder="Ex: Operações"
                    value={salaryForm.department}
                    onChange={(e) => setSalaryForm({ ...salaryForm, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gross_salary">Salário Bruto (R$) *</Label>
                  <Input
                    id="gross_salary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={salaryForm.gross_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, gross_salary: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="net_salary">Salário Líquido (R$)</Label>
                  <Input
                    id="net_salary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={salaryForm.net_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, net_salary: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  placeholder="Ex: Vale alimentação, Vale transporte, Plano de saúde..."
                  value={salaryForm.benefits}
                  onChange={(e) => setSalaryForm({ ...salaryForm, benefits: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSalaryDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveSalary}
                disabled={saveSalaryMutation.isPending}
              >
                {saveSalaryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Deletar Salário */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Salário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este registro de salário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    deleteSalaryMutation.mutate(deleteId);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default GestaoSalarios;
