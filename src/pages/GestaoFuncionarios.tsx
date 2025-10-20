import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserPlus, 
  Users, 
  FileText, 
  Calendar, 
  Building, 
  Phone, 
  Mail,
  CreditCard,
  DollarSign,
  User as UserIcon
} from "lucide-react";
import { APP_ROLE_VALUES, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { formatRoleLabel } from "@/lib/roles";

interface Employee {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  admission_date: string | null;
  salary: number | null;
  benefits: string | null;
  employment_status: string;
  is_authenticated_user: boolean;
  bank_data: any;
  roles: AppRole[];
}

export default function GestaoFuncionarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isFinanceiroMaster, isGestorMaster } = useUserRole();
  const canManage = isAdmin || isFinanceiroMaster || isGestorMaster;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating new employee
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    email: "",
    cpf: "",
    rg: "",
    birth_date: "",
    phone: "",
    address: "",
    admission_date: "",
    salary: "",
    benefits: "",
    role: "tripulante" as AppRole,
    is_authenticated_user: false,
  });

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch roles for each profile
      const employeesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            roles: rolesData?.map((r) => r.role).filter(Boolean) || [],
          } as Employee;
        })
      );

      // Filter out admin users from employee list
      return employeesWithRoles.filter(employee => !employee.roles.includes('admin'));
    },
    enabled: canManage,
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: typeof newEmployee) => {
      let userId: string;

      if (employee.is_authenticated_user) {
        // Create authenticated user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: employee.email,
          email_confirm: true,
        });

        if (authError) throw authError;
        userId = authData.user.id;
      } else {
        // Create profile without authentication
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            email: employee.email,
            full_name: employee.full_name,
            display_name: employee.full_name,
            cpf: employee.cpf || null,
            rg: employee.rg || null,
            birth_date: employee.birth_date || null,
            phone: employee.phone || null,
            address: employee.address || null,
            admission_date: employee.admission_date || null,
            salary: employee.salary ? parseFloat(employee.salary) : null,
            benefits: employee.benefits || null,
            employment_status: "ativo",
            is_authenticated_user: false,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        userId = profileData.id;
      }

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: employee.role });

      if (roleError) throw roleError;

      // Update profile if authenticated user
      if (employee.is_authenticated_user) {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            cpf: employee.cpf || null,
            rg: employee.rg || null,
            birth_date: employee.birth_date || null,
            phone: employee.phone || null,
            address: employee.address || null,
            admission_date: employee.admission_date || null,
            salary: employee.salary ? parseFloat(employee.salary) : null,
            benefits: employee.benefits || null,
          })
          .eq("id", userId);

        if (updateError) throw updateError;
      }

      return userId;
    },
    onSuccess: () => {
      toast({ title: "Funcionário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsCreating(false);
      setNewEmployee({
        full_name: "",
        email: "",
        cpf: "",
        rg: "",
        birth_date: "",
        phone: "",
        address: "",
        admission_date: "",
        salary: "",
        benefits: "",
        role: "tripulante",
        is_authenticated_user: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!canManage) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Funcionários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie perfis, documentos e informações dos colaboradores
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de funcionários */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Funcionários ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-smooth ${
                        selectedEmployee?.id === employee.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent border-border"
                      }`}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={employee.full_name} />
                          <AvatarFallback>
                            {employee.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                          {employee.roles.length > 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {formatRoleLabel(employee.roles[0])}
                            </Badge>
                          )}
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            employee.employment_status === "ativo"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detalhes do funcionário ou formulário de criação */}
          <Card className="lg:col-span-2">
            {isCreating ? (
              <>
                <CardHeader>
                  <CardTitle>Novo Funcionário</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="full_name">Nome Completo *</Label>
                          <Input
                            id="full_name"
                            value={newEmployee.full_name}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, full_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, email: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={newEmployee.cpf}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, cpf: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="rg">RG</Label>
                          <Input
                            id="rg"
                            value={newEmployee.rg}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, rg: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={newEmployee.birth_date}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, birth_date: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={newEmployee.phone}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, phone: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="address">Endereço</Label>
                          <Input
                            id="address"
                            value={newEmployee.address}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, address: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="admission_date">Data de Admissão</Label>
                          <Input
                            id="admission_date"
                            type="date"
                            value={newEmployee.admission_date}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, admission_date: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary">Salário</Label>
                          <Input
                            id="salary"
                            type="number"
                            step="0.01"
                            value={newEmployee.salary}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, salary: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="benefits">Benefícios</Label>
                          <Input
                            id="benefits"
                            value={newEmployee.benefits}
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, benefits: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Função</Label>
                          <Select
                            value={newEmployee.role}
                            onValueChange={(value) =>
                              setNewEmployee({ ...newEmployee, role: value as AppRole })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APP_ROLE_VALUES.filter((role) => role !== "admin").map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_authenticated_user"
                            checked={newEmployee.is_authenticated_user}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                is_authenticated_user: e.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                          <Label htmlFor="is_authenticated_user">
                            Criar usuário com acesso ao sistema
                          </Label>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => createEmployeeMutation.mutate(newEmployee)}
                          disabled={
                            createEmployeeMutation.isPending ||
                            !newEmployee.full_name ||
                            !newEmployee.email
                          }
                        >
                          Criar Funcionário
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreating(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </>
            ) : selectedEmployee ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="" alt={selectedEmployee.full_name} />
                        <AvatarFallback className="text-xl">
                          {selectedEmployee.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedEmployee.full_name}</h2>
                        <p className="text-muted-foreground">{selectedEmployee.email}</p>
                        {selectedEmployee.roles.length > 0 && (
                          <Badge variant="secondary" className="mt-1">
                            {formatRoleLabel(selectedEmployee.roles[0])}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        selectedEmployee.employment_status === "ativo" ? "default" : "destructive"
                      }
                    >
                      {selectedEmployee.employment_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="info">Informações</TabsTrigger>
                      <TabsTrigger value="documents">Documentos</TabsTrigger>
                      <TabsTrigger value="vacation">Férias</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      <ScrollArea className="h-[calc(100vh-420px)]">
                        <div className="space-y-4 pr-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <UserIcon className="h-5 w-5" />
                              Dados Pessoais
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">CPF</Label>
                                <p className="font-medium">{selectedEmployee.cpf || "—"}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">RG</Label>
                                <p className="font-medium">{selectedEmployee.rg || "—"}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Data de Nascimento</Label>
                                <p className="font-medium">
                                  {selectedEmployee.birth_date
                                    ? new Date(selectedEmployee.birth_date).toLocaleDateString(
                                        "pt-BR"
                                      )
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Telefone</Label>
                                <p className="font-medium flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {selectedEmployee.phone || "—"}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-muted-foreground">Endereço</Label>
                                <p className="font-medium flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  {selectedEmployee.address || "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <Building className="h-5 w-5" />
                              Informações Profissionais
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Data de Admissão</Label>
                                <p className="font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {selectedEmployee.admission_date
                                    ? new Date(selectedEmployee.admission_date).toLocaleDateString(
                                        "pt-BR"
                                      )
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Salário</Label>
                                <p className="font-medium flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  {selectedEmployee.salary
                                    ? `R$ ${selectedEmployee.salary.toLocaleString("pt-BR", {
                                        minimumFractionDigits: 2,
                                      })}`
                                    : "—"}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-muted-foreground">Benefícios</Label>
                                <p className="font-medium">{selectedEmployee.benefits || "—"}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              Dados Bancários
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Banco</Label>
                                <p className="font-medium">
                                  {selectedEmployee.bank_data?.bank || "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Agência</Label>
                                <p className="font-medium">
                                  {selectedEmployee.bank_data?.agency || "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Conta</Label>
                                <p className="font-medium">
                                  {selectedEmployee.bank_data?.account || "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">PIX</Label>
                                <p className="font-medium">
                                  {selectedEmployee.bank_data?.pix || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="documents">
                      <div className="flex items-center justify-center h-[calc(100vh-420px)]">
                        <div className="text-center space-y-2">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Funcionalidade de documentos em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="vacation">
                      <div className="flex items-center justify-center h-[calc(100vh-420px)]">
                        <div className="text-center space-y-2">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Funcionalidade de férias em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione um funcionário para ver os detalhes
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
