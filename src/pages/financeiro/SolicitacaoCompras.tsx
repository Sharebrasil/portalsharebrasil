import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, FileText, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseRequest {
  id: string;
  product_service: string;
  category: string;
  quantity: number;
  estimated_value: number;
  suggested_supplier: string | null;
  justification: string;
  urgency: string;
  status: string;
  requester_id: string;
  requester_name: string;
  created_at: string;
}

type Role = 'admin' | 'financeiro_master' | 'gestor_master';

export default function SolicitacaoCompras() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [productService, setProductService] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [suggestedSupplier, setSuggestedSupplier] = useState("");
  const [justification, setJustification] = useState("");
  const [urgency, setUrgency] = useState("");

  // Edit dialog states
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    loadCurrentUser();
    loadRequests();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setCurrentUserName(profile.full_name || user.email || '');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roles) {
      setUserRoles(roles.map(r => r.role));
    }
  };

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      return;
    }

    setRequests(data || []);
  };

  const canEditRequests = userRoles.some(role =>
    ['admin', 'financeiro_master', 'gestor_master'].includes(role)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId || !currentUserName) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    if (!productService || !category || !quantity || !estimatedValue || !justification || !urgency) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: newRequest, error: insertError } = await supabase
        .from('purchase_requests')
        .insert({
          product_service: productService,
          category,
          quantity: parseInt(quantity),
          estimated_value: parseFloat(estimatedValue),
          suggested_supplier: suggestedSupplier || null,
          justification,
          urgency,
          requester_id: currentUserId,
          requester_name: currentUserName
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send notifications to financeiro_master and gestor_master
      const { data: targetUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['financeiro_master', 'gestor_master']);

      if (targetUsers && targetUsers.length > 0) {
        const notifications = targetUsers.map(user => ({
          purchase_request_id: newRequest.id,
          user_id: user.user_id,
          message: `Nova solicitação de compra: ${productService} - ${currentUserName}`
        }));

        await supabase
          .from('purchase_request_notifications')
          .insert(notifications);
      }

      toast({
        title: "Sucesso",
        description: "Solicitação enviada com sucesso!"
      });

      // Reset form
      setProductService("");
      setCategory("");
      setQuantity("");
      setEstimatedValue("");
      setSuggestedSupplier("");
      setJustification("");
      setUrgency("");

      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingRequest) return;

    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: editStatus })
        .eq('id', editingRequest.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso!"
      });

      setEditingRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
      aprovado: { label: 'Aprovado', className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
      rejeitado: { label: 'Rejeitado', className: 'bg-red-500/20 text-red-700 dark:text-red-400' },
      'in process': { label: 'Em Processo', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
      concluido: { label: 'Concluído', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' }
    };

    const config = statusMap[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
      case "concluido":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pendente":
      case "in process":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejeitado":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === 'pendente').length,
    aprovadas: requests.filter(r => r.status === 'aprovado').length,
    rejeitadas: requests.filter(r => r.status === 'rejeitado').length,
    valorTotal: requests.reduce((sum, r) => sum + parseFloat(r.estimated_value.toString()), 0)
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Solicitação de Compras/Serviços</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe as solicitações de compras e serviços
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nova Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto/Serviço *</Label>
                    <Input
                      id="produto"
                      placeholder="Nome do produto ou serviço"
                      value={productService}
                      onChange={(e) => setProductService(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="combustivel">Combustível</SelectItem>
                        <SelectItem value="pecas">Peças e Componentes</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="servicos_ti">Serviços de T.I</SelectItem>
                        <SelectItem value="servicos_infraestrutura">Serviços Infraestrutura</SelectItem>
                        <SelectItem value="supermercado">Supermercado</SelectItem>
                        <SelectItem value="papelaria">Papelaria</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      placeholder="Ex: 10"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor-estimado">Valor Estimado (R$) *</Label>
                    <Input
                      id="valor-estimado"
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor Sugerido</Label>
                  <Input
                    id="fornecedor"
                    placeholder="Nome do fornecedor (opcional)"
                    value={suggestedSupplier}
                    onChange={(e) => setSuggestedSupplier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justificativa">Justificativa *</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Descreva a necessidade e justificativa para esta compra"
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgencia">Nível de Urgência *</Label>
                  <Select value={urgency} onValueChange={setUrgency} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Solicitações</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <Badge className="bg-yellow-500/20 text-yellow-700">{stats.pendentes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aprovadas</span>
                  <Badge className="bg-green-500/20 text-green-700">{stats.aprovadas}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejeitadas</span>
                  <Badge className="bg-red-500/20 text-red-700">{stats.rejeitadas}</Badge>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Total</span>
                  <span className="font-bold text-primary">{formatCurrency(stats.valorTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Solicitações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto/Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  {canEditRequests && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {request.product_service}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{request.category.replace('_', ' ')}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(parseFloat(request.estimated_value.toString()))}
                    </TableCell>
                    <TableCell>{request.requester_name}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    {canEditRequests && (
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRequest(request);
                                setEditStatus(request.status);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Status da Solicitação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Produto/Serviço</Label>
                                <p className="text-sm text-muted-foreground">{request.product_service}</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Solicitante</Label>
                                <p className="text-sm text-muted-foreground">{request.requester_name}</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="aprovado">Aprovado</SelectItem>
                                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                    <SelectItem value="in process">Em Processo</SelectItem>
                                    <SelectItem value="concluido">Concluído</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleUpdateStatus} className="w-full">
                                Salvar Alterações
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
