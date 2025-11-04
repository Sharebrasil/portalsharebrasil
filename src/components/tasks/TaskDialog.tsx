import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  priority: "baixa" | "media" | "alta";
  status: "pendente" | "em_progresso" | "concluida";
  assigned_to: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSave: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: "baixa" | "media" | "alta";
  status: "pendente" | "em_progresso" | "concluida";
  assigned_to: string | null;
  requested_by: string | null;
}

interface UserProfile {
  id: string;
  full_name: string;
}

export default function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: "",
    priority: "media",
    status: "pendente",
    assigned_to: "",
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [canAssignToOthers, setCanAssignToOthers] = useState(false);
  const [loading, setLoading] = useState(false);
  const { roles } = useAuth();

  const fetchCurrentUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao obter usuário atual:", error);
      toast.error("Não foi possível obter o usuário atual");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setCurrentUserId(user.id);

    const allowedRoles = new Set(["admin", "piloto_chefe", "financeiro_master"]);
    setCanAssignToOthers(roles.some((role) => allowedRoles.has(role)));
  }, [roles]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, tipo")
      .order("full_name", { ascending: true });

    if (error) {
      const errorMsg = error?.message || JSON.stringify(error);
      console.error("Erro ao carregar usuários - Detalhes:", errorMsg, error);
      toast.error("Não foi possível carregar a lista de usuários");
      return;
    }

    setUsers((data ?? []) as UserProfile[]);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetchCurrentUser();
    void fetchUsers();
  }, [fetchCurrentUser, fetchUsers, open]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title ?? "",
        description: task.description ?? "",
        due_date: task.due_date ?? "",
        priority: task.priority ?? "media",
        status: task.status ?? "pendente",
        assigned_to: task.assigned_to ?? currentUserId,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "media",
        status: "pendente",
        assigned_to: currentUserId,
      });
    }
  }, [task, currentUserId, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Por favor, preencha o título da tarefa");
      return;
    }

    if (canAssignToOthers && !formData.assigned_to) {
      toast.error("Selecione um responsável pela tarefa");
      return;
    }

    setLoading(true);

    const taskPayload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      due_date: formData.due_date ? formData.due_date : null,
      priority: formData.priority,
      status: formData.status,
      assigned_to: canAssignToOthers ? formData.assigned_to : currentUserId,
      requested_by: currentUserId,
    };

    if (task) {
      const { error } = await supabase
        .from("tasks")
        .update(taskPayload)
        .eq("id", task.id);

      if (error) {
        console.error("Erro ao atualizar tarefa:", error);
        toast.error("Erro ao atualizar tarefa");
        setLoading(false);
        return;
      }

      toast.success("Tarefa atualizada com sucesso!");
    } else {
      const { error } = await supabase.from("tasks").insert([taskPayload]);

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        toast.error("Erro ao criar tarefa");
        setLoading(false);
        return;
      }

      toast.success("Tarefa criada com sucesso!");
    }

    setLoading(false);
    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={formData.title}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, title: event.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Prazo</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formData.due_date}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, due_date: event.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskFormData["priority"]) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
                disabled={loading}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: TaskFormData["status"]) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              disabled={loading}
            >
              <SelectTrigger id="task-status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_progresso">Em Progresso</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canAssignToOthers ? (
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Atribuir para</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assigned_to: value }))
                }
                disabled={loading}
              >
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} {user.tipo ? `(${user.tipo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
