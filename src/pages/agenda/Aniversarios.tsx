import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Cake, Users, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import {
  addYears,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  setYear,
  startOfDay,
} from "date-fns";
import { useNavigate } from "react-router-dom";

type BirthdayRow = Database["public"]["Tables"]["birthdays"]["Row"];

type ProcessedBirthday = BirthdayRow & {
  displayDate: string;
  parsedDate: Date | null;
  currentYearDate: Date | null;
  nextOccurrence: Date | null;
};

const parseBirthdayDate = (value: string): Date | null => {
  if (!value) return null;

  const isoCandidate = parseISO(value);
  if (isValid(isoCandidate)) {
    return isoCandidate;
  }

  const parsedWithYear = parse(value, "dd/MM/yyyy", new Date());
  if (isValid(parsedWithYear)) {
    return parsedWithYear;
  }

  const parsedWithoutYear = parse(value, "dd/MM", new Date());
  if (isValid(parsedWithoutYear)) {
    return parsedWithoutYear;
  }

  return null;
};

const getBirthdayCategoryLabel = (category: string | null) => {
  switch (category) {
    case "clientes":
    case "cliente":
      return "Cliente";
    case "colaboradores":
    case "colaborador":
    case "funcionario":
      return "Colaborador";
    case "fornecedores":
    case "fornecedor":
      return "Fornecedor";
    case "hoteis":
    case "hotel":
      return "Hotel";
    default:
      return "";
  }
};

export default function Aniversarios() {
  const [birthdays, setBirthdays] = useState<BirthdayRow[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<BirthdayRow | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"month" | "next7" | "all">("month");

  const [formData, setFormData] = useState({
    nome: "",
    data_aniversario: "",
    empresa: "",
    category: "cliente" as string,
  });

  const loadBirthdays = useCallback(async () => {
    try {
      setLoading(true);

      const [{ data, error }, { count, error: countError }] = await Promise.all([
        supabase
          .from("birthdays")
          .select("id,nome,data_aniversario,empresa,category,created_at,updated_at")
          .order("data_aniversario", { ascending: true }),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
      ]);

      if (error) throw error;
      if (countError) throw countError;

      setBirthdays(data ?? []);
      setContactsCount(count ?? 0);
    } catch (error) {
      console.error("Erro ao carregar aniversários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os aniversários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBirthdays();
  }, [loadBirthdays]);

  const processedBirthdays = useMemo<ProcessedBirthday[]>(() => {
    const today = new Date();

    return birthdays.map((birthday) => {
      const parsedDate = parseBirthdayDate(birthday.data_aniversario);
      const currentYearDate = parsedDate ? setYear(parsedDate, today.getFullYear()) : null;
      let nextOccurrence = currentYearDate;

      if (nextOccurrence && differenceInCalendarDays(nextOccurrence, today) < 0) {
        nextOccurrence = addYears(nextOccurrence, 1);
      }

      return {
        ...birthday,
        parsedDate,
        currentYearDate,
        nextOccurrence,
        displayDate: parsedDate ? format(parsedDate, "dd/MM") : birthday.data_aniversario,
      };
    });
  }, [birthdays]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const listThisMonth = useMemo(() => {
    return processedBirthdays.filter((birthday) => {
      if (!birthday.currentYearDate) return false;
      return isSameMonth(birthday.currentYearDate, today);
    });
  }, [processedBirthdays, today]);

  const listNextSevenDays = useMemo(() => {
    return processedBirthdays.filter((birthday) => {
      if (!birthday.nextOccurrence) return false;
      const diff = differenceInCalendarDays(startOfDay(birthday.nextOccurrence), today);
      return diff >= 0 && diff <= 7;
    });
  }, [processedBirthdays, today]);

  const sortedBirthdays = useMemo(() => {
    return [...processedBirthdays].sort((a, b) => {
      if (a.nextOccurrence && b.nextOccurrence) {
        return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
      }
      if (a.nextOccurrence) return -1;
      if (b.nextOccurrence) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [processedBirthdays]);

  const birthdaysThisMonth = listThisMonth.length;
  const birthdaysNextSevenDays = listNextSevenDays.length;

  const filteredBirthdays = useMemo(() => {
    switch (filter) {
      case "next7":
        return sortedBirthdays.filter((b) => listNextSevenDays.includes(b));
      case "all":
        return sortedBirthdays;
      case "month":
      default:
        return sortedBirthdays.filter((b) => listThisMonth.includes(b));
    }
  }, [filter, sortedBirthdays, listNextSevenDays, listThisMonth]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Aniversários</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe os aniversários dos seus contatos
            </p>
          </div>
          <Button onClick={() => {
            setEditingBirthday(null);
            setFormData({ nome: "", data_aniversario: "", empresa: "", category: "cliente" });
            setIsDialogOpen(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Aniversário
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card onClick={() => setFilter("month")} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-primary">{birthdaysThisMonth}</p>
                </div>
                <Cake className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setFilter("next7")} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próximos 7 dias</p>
                  <p className="text-2xl font-bold text-secondary">{birthdaysNextSevenDays}</p>
                </div>
                <Calendar className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate("/agenda/contatos")} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contatos</p>
                  <p className="text-2xl font-bold text-accent">{contactsCount}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5" />
              {filter === "next7" ? "Aniversários - Próximos 7 dias" : filter === "all" ? "Todos os Aniversários" : "Aniversariantes deste Mês"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Carregando aniversários...
              </div>
            ) : filteredBirthdays.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Nenhum aniversário registrado.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBirthdays.map((birthday) => (
                  <div
                    key={birthday.id}
                    className="group relative flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Cake className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{birthday.nome}</h3>
                        {birthday.empresa && (
                          <p className="text-sm text-muted-foreground">{birthday.empresa}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{birthday.displayDate}</div>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant="outline">{getBirthdayCategoryLabel(birthday.category)}</Badge>
                      </div>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingBirthday(birthday);
                          setFormData({
                            nome: birthday.nome,
                            data_aniversario: (birthday.data_aniversario || "").slice(0, 10),
                            empresa: birthday.empresa || "",
                            category: birthday.category || "cliente",
                          });
                          setIsDialogOpen(true);
                        }}
                        aria-label="Editar aniversário"
                        title="Editar aniversário"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={async () => {
                          const confirmed = window.confirm(`Excluir aniversário de ${birthday.nome}?`);
                          if (!confirmed) return;
                          try {
                            const { error } = await supabase.from("birthdays").delete().eq("id", birthday.id);
                            if (error) throw error;
                            toast({ title: "Excluído", description: "Aniversário excluído com sucesso" });
                            loadBirthdays();
                          } catch (err) {
                            console.error("Erro ao excluir aniversário:", err);
                            toast({ title: "Erro", description: "Não foi possível excluir", variant: "destructive" });
                          }
                        }}
                        aria-label="Excluir aniversário"
                        title="Excluir aniversário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBirthday ? "Editar Aniversário" : "Novo Aniversário"}
              </DialogTitle>
              <DialogDescription>
                Adicione ou edite um aniversário
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="data_aniversario">Data de Aniversário *</Label>
                <Input
                  id="data_aniversario"
                  type="date"
                  value={formData.data_aniversario}
                  onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={async () => {
                try {
                  if (!formData.nome || !formData.data_aniversario) {
                    toast({
                      title: "Campos obrigatórios",
                      description: "Nome e data são obrigatórios",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (editingBirthday) {
                    const { error } = await supabase
                      .from("birthdays")
                      .update({
                        nome: formData.nome,
                        data_aniversario: formData.data_aniversario,
                        empresa: formData.empresa,
                        category: formData.category,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", editingBirthday.id);
                    if (error) throw error;
                    toast({ title: "Atualizado", description: "Aniversário atualizado com sucesso" });
                  } else {
                    const { error } = await supabase
                      .from("birthdays")
                      .insert([formData]);
                    if (error) throw error;
                    toast({ title: "Sucesso", description: "Aniversário cadastrado com sucesso" });
                  }

                  setIsDialogOpen(false);
                  setEditingBirthday(null);
                  loadBirthdays();
                } catch (error) {
                  console.error("Erro ao salvar aniversário:", error);
                  toast({
                    title: "Erro",
                    description: "Erro ao salvar aniversário",
                    variant: "destructive",
                  });
                }
              }}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
