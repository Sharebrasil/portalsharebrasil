import { LogOut, MapPin, User, UserPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { UserFormDialog, type UserFormSubmitValues } from "@/components/admin/UserFormDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createManagedUser } from "@/services/adminUsers";
import type { AppRole } from "@/lib/roles"; // Import AppRole

const getInitials = (input: string | null | undefined) => {
  if (!input) {
    return "";
  }

  const parts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return input.slice(0, 2).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, roles } = useAuth();
  const { profile } = useUserProfile(user);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const canManageUsers = useMemo(
    () => roles.includes("admin" as AppRole) || roles.includes("financeiro_master" as AppRole),
    [roles]
  );

  const displayName = useMemo(
    () => profile?.display_name ?? profile?.full_name ?? user?.email ?? "Usuário",
    [profile?.display_name, profile?.full_name, user?.email]
  );

  const email = profile?.email ?? user?.email ?? "";
  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);

  const handleCreateManagedUser = useCallback(
    async (values: UserFormSubmitValues) => {
      const password = values.password ?? "";

      if (!password) {
        toast({
          title: "Erro ao criar usuário",
          description: "Informe uma senha válida para o novo usuário.",
          variant: "destructive",
        });
        return;
      }

      setIsCreatingUser(true);
      try {
        await createManagedUser({
          email: values.email,
          password,
          fullName: values.fullName,
          roles: values.roles,
          tipo: values.tipo,
        });

        toast({
          title: "Usuário criado",
          description: `O usuário ${values.fullName} foi cadastrado com sucesso.`,
        });

        setIsUserDialogOpen(false);
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Não foi possível criar o usuário.";

        toast({
          title: "Erro ao criar usuário",
          description,
          variant: "destructive",
        });
      } finally {
        setIsCreatingUser(false);
      }
    },
    [toast]
  );

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível encerrar a sessão. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sessão encerrada",
      description: "Você saiu do portal com sucesso.",
    });

    navigate("/login", { replace: true });
  }, [navigate, toast]);

  return (
    <header className="h-16 bg-gradient-card border-b border-border px-4 lg:px-6 flex items-center justify-between shadow-card">
      <div className="flex items-center space-x-2 lg:space-x-4">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fc800a4ee1bbb404a92b07d7f3888df82%2Fbfc4d2f155334c849630cbcdfa5ac038?format=webp&width=800"
          alt="Gestão Share Brasil"
          className="w-8 h-8 lg:w-10 lg:h-10"
        />
        <div className="hidden sm:block">
          <h1 className="text-lg lg:text-xl font-bold text-foreground">Gestão Share Brasil</h1>
          <p className="text-xs lg:text-sm text-muted-foreground">Portal do Colaborador</p>
        </div>
      </div>

      <GlobalSearch />

      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">São Paulo</span>
          <span className="text-foreground font-medium">24°C</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full">
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="Perfil" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {avatarInitials || <User className="h-4 w-4 lg:h-5 lg:w-5" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-card border-border shadow-elevated" align="end">
            <DropdownMenuLabel className="space-y-1 text-foreground">
              <p className="text-sm font-semibold leading-tight">{displayName}</p>
              {email && <p className="text-xs text-muted-foreground leading-tight">{email}</p>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-foreground hover:bg-accent cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                navigate("/perfil");
              }}
            >
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            {canManageUsers && (
              <DropdownMenuItem
                className="text-foreground hover:bg-accent cursor-pointer"
                onSelect={(event) => {
                  event.preventDefault();
                  setIsUserDialogOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Gestão de Usuários
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Informações Pessoais
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Dados Bancários
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Gestão de Salário
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Férias
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Anexos de Documentos
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Holerites
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              Atestados
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-destructive hover:bg-destructive/10 cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                void handleLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {canManageUsers && (
        <UserFormDialog
          open={isUserDialogOpen}
          onOpenChange={(nextOpen) => {
            if (isCreatingUser && !nextOpen) {
              return;
            }
            setIsUserDialogOpen(nextOpen);
          }}
          mode="create"
          isSubmitting={isCreatingUser}
          onSubmit={handleCreateManagedUser}
        />
      )}
    </header>
  );
}
