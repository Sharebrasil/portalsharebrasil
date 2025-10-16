import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, UserPlus } from "lucide-react";
import {
  APP_ROLE_VALUES,
  ROLE_LABELS,
  createManagedUser,
  deleteManagedUser,
  fetchManagedUsers,
  type AppRole,
} from "@/services/adminUsers";
import { selectPrimaryRole } from "@/lib/roles";

export default function GestaoUsuarios() {
  const { roles: myRoles, user } = useAuth();
  const canManage = useMemo(
    () => myRoles.includes("admin" as AppRole) || myRoles.includes("financeiro_master" as AppRole),
    [myRoles]
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users"],
    queryFn: fetchManagedUsers,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("tripulante");

  const createMutation = useMutation({
    mutationFn: async () =>
      createManagedUser({
        fullName,
        email,
        password,
        roles: [role],
        tipo: "colaboradores",
      }),
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPassword("");
      void queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast({ title: "Usuário criado" });
    },
    onError: (err: any) => toast({ title: "Falha ao criar usuário", description: String(err?.message || err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManagedUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast({ title: "Usuário removido" });
    },
    onError: (err: any) => toast({ title: "Falha ao remover usuário", description: String(err?.message || err), variant: "destructive" }),
  });

  if (!canManage) {
    return (
      <Layout>
        <div className="p-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Você não tem permissão para gerenciar usuários.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Criar Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input placeholder="Nome e sobrenome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="seu@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLE_VALUES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={createMutation.isPending || !fullName || !email || !password} onClick={() => createMutation.mutate()}>Criar Usuário</Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-3">
                {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!isLoading && users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
                {users.map((u) => {
                  const primary = selectPrimaryRole(u.roles) ?? null;
                  const isSelf = user?.id === u.id;
                  return (
                    <div key={u.id} className="flex items-center justify-between rounded-md bg-card-secondary border border-border px-4 py-3">
                      <div>
                        <div className="font-medium">{u.displayName || u.fullName || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        {primary && <Badge variant="secondary" className="mt-1">{ROLE_LABELS[primary]}</Badge>}
                      </div>
                      <Button size="icon" variant="destructive" disabled={deleteMutation.isPending || isSelf} onClick={() => deleteMutation.mutate(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
