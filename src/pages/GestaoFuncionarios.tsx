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
  User as UserIcon,
  Edit,
  Save,
  X
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

// Tipo para o formulário de edição
type EditEmployeeForm = Omit<Employee, 'id' | 'is_authenticated_user' | 'bank_data' | 'roles'> & {
  role: AppRole;
};

// -----------------------------------------------------------
// Definição das roles que DEVEM ser exibidas na lista de gestão
// -----------------------------------------------------------
const ROLES_TO_DISPLAY: AppRole[] = [
    'financeiro',
    'financeiro_master',
    'tripulante',
    'piloto_chefe',
    'operacoes',
];

export default function GestaoFuncionarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isFinanceiroMaster, isGestorMaster } = useUserRole();
  // Condição para Acesso à Página: Somente esses perfis
  const canManage = isAdmin || isFinanceiroMaster || isGestorMaster;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editEmployeeForm, setEditEmployeeForm] = useState<EditEmployeeForm | null>(null);
  const [showAuthUserSelection, setShowAuthUserSelection] = useState(false);
  const [authenticatedUsers, setAuthenticatedUsers] = useState<any[]>([]);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
  const [selectedAuthUser, setSelectedAuthUser] = useState<any | null>(null);

  // Resetar o estado de edição ao selecionar um novo funcionário
  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsCreating(false);
    setIsEditing(false); // Sempre desativa a edição ao selecionar
  };

  // Buscar usuários autenticados do Supabase (menos admin)
  const fetchAuthenticatedUsers = async () => {
    setLoadingAuthUsers(true);
    try {
      const { data: users, error } = await supabase.auth.admin.listUsers();

      if (error) throw error;

      // Filtrar usuários: remover admins e aqueles que já têm perfil de funcionário
      const filteredUsers = users?.users?.filter((user: any) => {
        const isAdmin = user.user_metadata?.roles?.includes('admin');
        return !isAdmin;
      }) || [];

      setAuthenticatedUsers(filteredUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários autenticados:", error);
      toast({
        title: "Erro ao buscar usuários",
        description: "Não foi possível carregar a lista de usuários autenticados",
        variant: "destructive",
      });
    } finally {
      setLoadingAuthUsers(false);
    }
  };

  // Criar funcionário a partir de usuário autenticado
  const createEmployeeFromAuthUser = async (authUser: any, role: AppRole) => {
    try {
      // Buscar dados do perfil do usuário no Supabase se existir
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      let userId = authUser.id;

      if (!existingProfile) {
        // Criar novo perfil se não existir
        const { data: newProfile, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
            display_name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
            employment_status: "ativo",
            is_authenticated_user: true,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        userId = newProfile.id;
      }

      // Verificar se já tem role
      const { data: existingRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!existingRoles || existingRoles.length === 0) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (roleError) throw roleError;
      }

      toast({
        title: "Funcionário criado com sucesso!",
        description: `Perfil criado para ${authUser.email}`,
      });

      setShowAuthUserSelection(false);
      setSelectedAuthUser(null);
      setAuthenticatedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (error: any) {
      toast({
        title: "Erro ao criar funcionário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Preencher o formulário de edição ao iniciar
  const startEditing = () => {
    if (selectedEmployee) {
      setIsEditing(true);
      // Cria o estado do formulário de edição a partir do funcionário selecionado
      setEditEmployeeForm({
        full_name: selectedEmployee.full_name,
        email: selectedEmployee.email,
        cpf: selectedEmployee.cpf || "",
        rg: selectedEmployee.rg || "",
        birth_date: selectedEmployee.birth_date || "",
        phone: selectedEmployee.phone || "",
        address: selectedEmployee.address || "",
        admission_date: selectedEmployee.admission_date || "",
        salary: selectedEmployee.salary ? String(selectedEmployee.salary) : "",
        benefits: selectedEmployee.benefits || "",
        employment_status: selectedEmployee.employment_status,
        role: selectedEmployee.roles.length > 0 ? selectedEmployee.roles[0] : 'tripulante', // Assume a primeira função
      });
    }
  };

  // Form state for creating new employee (mantido)
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

  // -----------------------------------------------------------
  // Fetch employees (COM FILTRO AJUSTADO)
  // -----------------------------------------------------------
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

          // Lógica para determinar a função principal
          const roles = rolesData?.map((r) => r.role).filter(Boolean) || [];

          return {
            ...profile,
            roles: roles,
          } as Employee;
        })
      );

      // NOVO FILTRO: Retorna SOMENTE os usuários que possuem uma das ROLES_TO_DISPLAY.
      return employeesWithRoles.filter(employee => 
        employee.roles.some(role => ROLES_TO_DISPLAY.includes(role))
      );
    },
    enabled: canManage,
  });
  // -----------------------------------------------------------


  // Create employee mutation (mantido)
  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: typeof newEmployee) => {
      // ... (lógica de criação de funcionário - MANTIDA)
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
            // Adicionar app_role se for um campo na tabela profiles
            // app_role: employee.role, 
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
            // Adicionar app_role se for um campo na tabela profiles
            // app_role: employee.role,
          })
          .eq("id", userId);

        if (updateError) throw updateError;
      }

      return userId;
    },
    onSuccess: () => {
      // ... (lógica de sucesso - MANTIDA)
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
      // ... (lógica de erro - MANTIDA)
      toast({
        title: "Erro ao criar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 3. MUTATION DE EDIÇÃO DE FUNCIONÁRIO (mantido)
  const updateEmployeeMutation = useMutation({
    mutationFn: async (updatedData: EditEmployeeForm) => {
      if (!selectedEmployee) throw new Error("Nenhum funcionário selecionado para edição.");

      // 1. Atualizar user_profiles
      const { error: profileUpdateError } = await supabase
        .from("user_profiles")
        .update({
          full_name: updatedData.full_name,
          display_name: updatedData.full_name, // Mantendo display_name igual a full_name por simplicidade
          email: updatedData.email,
          cpf: updatedData.cpf || null,
          rg: updatedData.rg || null,
          birth_date: updatedData.birth_date || null,
          phone: updatedData.phone || null,
          address: updatedData.address || null,
          admission_date: updatedData.admission_date || null,
          salary: updatedData.salary ? parseFloat(updatedData.salary) : null,
          benefits: updatedData.benefits || null,
          employment_status: updatedData.employment_status,
          // app_role: updatedData.role, // Adicionar se 'app_role' for um campo na tabela profiles
        })
        .eq("id", selectedEmployee.id);

      if (profileUpdateError) throw profileUpdateError;

      // 2. Atualizar user_roles
      // Lógica simplificada: Assume que só há uma função e a substitui, ou atualiza a primeira
      const currentRole = selectedEmployee.roles[0];
      if (currentRole !== updatedData.role) {
        // Exclui todas as funções existentes (ou apenas a principal se tiver mais lógica)
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedEmployee.id);

        if (deleteError) throw deleteError;

        // Insere a nova função
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: selectedEmployee.id, role: updatedData.role });

        if (insertError) throw insertError;
      }

      return selectedEmployee.id;
    },
    onSuccess: () => {
      toast({ title: "Perfil de funcionário atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!canManage) {
    // Permissão negada (Mantido: só admin, gestor master e financeiro master passam)
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

  // Componente de Formulário de Edição (Mantido)
  const EditEmployeeFormContent = () => {
    if (!editEmployeeForm || !selectedEmployee) return null;

    const handleChange = (field: keyof EditEmployeeForm, value: string) => {
      setEditEmployeeForm(prev => {
        if (!prev) return null;
        return { ...prev, [field]: value };
      });
    };

    const handleSave = () => {
      if (!editEmployeeForm) return;
      updateEmployeeMutation.mutate(editEmployeeForm);
    };

    return (
      <ScrollArea className="h-[calc(100vh-280px)] pr-4">
        <div className="space-y-4">
          <h3 className="text-xl font-bold border-b pb-2">Editar: {selectedEmployee.full_name}</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="col-span-2">
              <Label htmlFor="edit_full_name">Nome Completo *</Label>
              <Input
                id="edit_full_name"
                value={editEmployeeForm.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
            </div>
            {/* Email */}
            <div className="col-span-2">
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={editEmployeeForm.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            {/* CPF */}
            <div>
              <Label htmlFor="edit_cpf">CPF</Label>
              <Input
                id="edit_cpf"
                value={editEmployeeForm.cpf || ""}
                onChange={(e) => handleChange("cpf", e.target.value)}
              />
            </div>
            {/* RG */}
            <div>
              <Label htmlFor="edit_rg">RG</Label>
              <Input
                id="edit_rg"
                value={editEmployeeForm.rg || ""}
                onChange={(e) => handleChange("rg", e.target.value)}
              />
            </div>
            {/* Data de Nascimento */}
            <div>
              <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
              <Input
                id="edit_birth_date"
                type="date"
                value={editEmployeeForm.birth_date || ""}
                onChange={(e) => handleChange("birth_date", e.target.value)}
              />
            </div>
            {/* Telefone */}
            <div>
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={editEmployeeForm.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            {/* Endereço */}
            <div className="col-span-2">
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                value={editEmployeeForm.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            {/* Data de Admissão */}
            <div>
              <Label htmlFor="edit_admission_date">Data de Admissão</Label>
              <Input
                id="edit_admission_date"
                type="date"
                value={editEmployeeForm.admission_date || ""}
                onChange={(e) => handleChange("admission_date", e.target.value)}
              />
            </div>
            {/* Salário */}
            <div>
              <Label htmlFor="edit_salary">Salário</Label>
              <Input
                id="edit_salary"
                type="number"
                step="0.01"
                value={editEmployeeForm.salary || ""}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
            {/* Benefícios */}
            <div className="col-span-2">
              <Label htmlFor="edit_benefits">Benefícios</Label>
              <Input
                id="edit_benefits"
                value={editEmployeeForm.benefits || ""}
                onChange={(e) => handleChange("benefits", e.target.value)}
              />
            </div>
            {/* Função (Role) */}
            <div>
              <Label htmlFor="edit_role">Função</Label>
              <Select
                value={editEmployeeForm.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Exibe todas as roles, incluindo as que não aparecem na lista (para permitir a edição) */}
                  {APP_ROLE_VALUES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status de Emprego */}
            <div>
              <Label htmlFor="edit_employment_status">Status</Label>
              <Select
                value={editEmployeeForm.employment_status}
                onValueChange={(value) => handleChange("employment_status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateEmployeeMutation.isPending || !editEmployeeForm.full_name || !editEmployeeForm.email}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateEmployeeMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  };
    
  // Refatoração do Detalhe do Funcionário para suportar edição e visualização (Mantido)
  const EmployeeDetails = () => {
    if (!selectedEmployee) return null;

    if (isEditing) {
      return (
        <>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <EditEmployeeFormContent />
          </CardContent>
        </>
      );
    }

    // Modo de Visualização
    return (
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
            <div className="flex gap-2">
                <Badge
                variant={
                    selectedEmployee.employment_status === "ativo" ? "default" : "destructive"
                }
                >
                {selectedEmployee.employment_status}
                </Badge>
                <Button variant="outline" size="icon" onClick={startEditing} title="Editar Perfil">
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
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
    );
  };

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
          <Button onClick={() => { setIsCreating(true); setSelectedEmployee(null); setIsEditing(false); }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {employees.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground">Nenhum funcionário encontrado com os perfis permitidos.</p>
                  )}
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-smooth ${
                        selectedEmployee?.id === employee.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent border-border"
                      }`}
                      onClick={() => handleSelectEmployee(employee)}
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
                          {/* Exibir a primeira função como a principal */}
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

          {/* Detalhes do funcionário ou formulário de criação/edição */}
          <Card className="lg:col-span-2">
            {isCreating ? (
              // Formulário de Criação (Mantido)
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
                            onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={newEmployee.cpf}
                            onChange={(e) => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rg">RG</Label>
                          <Input
                            id="rg"
                            value={newEmployee.rg}
                            onChange={(e) => setNewEmployee({ ...newEmployee, rg: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={newEmployee.birth_date}
                            onChange={(e) => setNewEmployee({ ...newEmployee, birth_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={newEmployee.phone}
                            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="address">Endereço</Label>
                          <Input
                            id="address"
                            value={newEmployee.address}
                            onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="admission_date">Data de Admissão</Label>
                          <Input
                            id="admission_date"
                            type="date"
                            value={newEmployee.admission_date}
                            onChange={(e) => setNewEmployee({ ...newEmployee, admission_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary">Salário</Label>
                          <Input
                            id="salary"
                            type="number"
                            step="0.01"
                            value={newEmployee.salary}
                            onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="benefits">Benefícios</Label>
                          <Input
                            id="benefits"
                            value={newEmployee.benefits}
                            onChange={(e) => setNewEmployee({ ...newEmployee, benefits: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="role">Função *</Label>
                          <Select
                            value={newEmployee.role}
                            onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value as AppRole })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Exibe APENAS as roles que você quer que sejam ATRIBUÍDAS */}
                              {APP_ROLE_VALUES.filter((role) => ROLES_TO_DISPLAY.includes(role) || role === 'admin' || role === 'gestor_master').map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2 pt-2">
                            <input
                              id="is_authenticated_user"
                              type="checkbox"
                              checked={newEmployee.is_authenticated_user}
                              onChange={(e) => setNewEmployee({ ...newEmployee, is_authenticated_user: e.target.checked })}
                              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/50"
                            />
                            <Label htmlFor="is_authenticated_user" className="text-sm font-medium leading-none">
                              Criar como usuário autenticado (Enviar email de convite/reset)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => createEmployeeMutation.mutate(newEmployee)}
                          disabled={
                            createEmployeeMutation.isPending ||
                            !newEmployee.full_name ||
                            !newEmployee.email ||
                            !newEmployee.role
                          }
                        >
                          {createEmployeeMutation.isPending ? "Criando..." : "Criar Funcionário"}
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
              <EmployeeDetails />
            ) : (
              <CardContent className="pt-6 h-full flex items-center justify-center">
                <p className="text-muted-foreground">Selecione um funcionário para ver detalhes ou use o botão "Novo Funcionário" acima.</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
