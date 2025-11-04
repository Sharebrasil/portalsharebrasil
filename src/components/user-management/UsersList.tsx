import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UsersList() {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      return data.users || [];
    },
  });

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeletingUserId(selectedUser.id);
      const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);

      if (error) throw error;

      toast.success(`Usuário ${selectedUser.email} removido com sucesso`);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      await refetch();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast.error("Erro ao remover usuário");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeactivateUser = async (user: any) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { status: "inactive" },
      });

      if (error) throw error;

      toast.success(`Usuário ${user.email} desativado com sucesso`);
      await refetch();
    } catch (error) {
      console.error("Erro ao desativar usuário:", error);
      toast.error("Erro ao desativar usuário");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'gestor_master':
        return 'bg-purple-100 text-purple-800';
      case 'financeiro_master':
        return 'bg-blue-100 text-blue-800';
      case 'financeiro':
        return 'bg-cyan-100 text-cyan-800';
      case 'tripulante':
        return 'bg-green-100 text-green-800';
      case 'piloto_chefe':
        return 'bg-orange-100 text-orange-800';
      case 'operacoes':
        return 'bg-yellow-100 text-yellow-800';
      case 'coordenador_de_voo':
        return 'bg-indigo-100 text-indigo-800';
      case 'cliente':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      admin: 'Admin',
      gestor_master: 'Gestor Master',
      financeiro_master: 'Financeiro Master',
      financeiro: 'Financeiro',
      tripulante: 'Tripulante',
      piloto_chefe: 'Piloto Chefe',
      operacoes: 'Operações',
      coordenador_de_voo: 'Coordenador de Voo',
      cliente: 'Cliente',
      adm: 'Administrativo',
    };
    return labels[role] || role;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role: string) => (
                            <Badge
                              key={role}
                              className={`${getRoleColor(role)} text-xs`}
                              variant="outline"
                            >
                              {getRoleLabel(role)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem departamento</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDeactivateUser(user)}
                          className="p-1 text-muted-foreground hover:text-warning transition-colors"
                          title="Desativar usuário"
                          aria-label="Desativar usuário"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Excluir usuário"
                          aria-label="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover permanentemente o usuário {selectedUser?.email}? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingUserId === selectedUser?.id}
            >
              {deletingUserId === selectedUser?.id ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
