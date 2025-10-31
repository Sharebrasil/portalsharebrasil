import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, Loader2 } from "lucide-react";

type Role = 'admin' | 'tripulante' | 'financeiro' | 'financeiro_master' | 'operacoes' | 'piloto_chefe' | 'cotista' | 'gestor_master' ;

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: Role[];
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  tripulante: 'Tripulante',
  financeiro: 'Financeiro',
  financeiro_master: 'Financeiro Master',
  operacoes: 'Operações',
 
  piloto_chefe: 'Piloto Chefe',
  cotista: 'Cotista',
  gestor_master: 'Gestor Master',
 
};

export default function GerenciarUsuarios() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>('tripulante');
  const [loading, setLoading] = useState(false);

  const { isAdmin: isAdminRole, isGestorMaster, isLoading: isRolesLoading } = useUserRole();
  const isAllowed = isAdminRole || isGestorMaster;

  useEffect(() => {
    if (isAllowed) {
      void loadUsers();
    }
  }, [isAllowed]);

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*');

    if (!profiles) return;

    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);

        return {
          ...profile,
          roles: roleData?.map(r => r.role) || []
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use server endpoint to create user + profile + roles to avoid RLS issues
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const resp = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          roles: [selectedRole],
        }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.error || JSON.stringify(result));
      }

      toast.success('Usuário criado com sucesso! (autenticado pelo servidor)');
      setEmail("");
      setPassword("");
      setFullName("");
      setSelectedRole('tripulante');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário');
    }
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie usuários do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Criar Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar Usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Usuários Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-smooth"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-2">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
