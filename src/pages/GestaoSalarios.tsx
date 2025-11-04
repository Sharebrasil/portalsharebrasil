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
    queryKey: ["salaries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salaries").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew_members"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-crew-members", { body: { status: "active" } });
      if (error) throw new Error(error.message ?? "Erro ao carregar tripulantes");
      return ((data as { crew_members?: any[] })?.crew_members ?? []) as any[];
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
        const { error } = await supabase.from("salaries").update(data).eq("id", editingSalaryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("salaries").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
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
    onError: () => {
      toast.error("Erro ao salvar salário");
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("Salário deletado com sucesso!");
      setDeleteId(null);
    },
    onError: () => {
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
                <CardTitle>Salários Vigentes (Funcionários Ativos)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button variant="default">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Salário Bruto (R$)</TableHead>
                      <TableHead>Salário Líquido (R$)</TableHead>
                      <TableHead>Benefícios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(salaries as any[]).map((salary) => {
                      const crewMember = (crewMembers as any[]).find((c) => c.user_id === salary.user_id);
                      return (
                        <TableRow key={salary.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold">{crewMember?.full_name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{salary.position || "N/A"}</div>
                              <div className="text-xs text-muted-foreground">{salary.department || "N/A"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue={salary.gross_salary} className="w-32" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue={salary.net_salary} className="w-32" />
                          </TableCell>
                          <TableCell>
                            <Textarea defaultValue={salary.benefits || ""} className="min-h-[60px]" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                                <Label>Observa��ões</Label>
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
      </div>
    </Layout>
  );
};

export default GestaoSalarios;
