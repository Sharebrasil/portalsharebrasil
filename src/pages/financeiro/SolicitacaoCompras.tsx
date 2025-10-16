import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default function SolicitacaoCompras() {
  const solicitacoes = [
    {
      id: 1,
      produto: "Combustível Aviação",
      quantidade: "1000L",
      valor: 8500.00,
      data: "15/01/2024",
      status: "Aprovada",
      solicitante: "João Silva",
    },
    {
      id: 2,
      produto: "Peças de Reposição",
      quantidade: "5 unidades",
      valor: 2300.00,
      data: "12/01/2024",
      status: "Pendente",
      solicitante: "Maria Santos",
    },
    {
      id: 3,
      produto: "Serviço de Manutenção",
      quantidade: "1 serviço",
      valor: 4500.00,
      data: "10/01/2024",
      status: "Rejeitada",
      solicitante: "Carlos Oliveira",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprovada":
        return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>;
      case "Pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "Rejeitada":
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aprovada":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Rejeitada":
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
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nova Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produto">Produto/Serviço</Label>
                  <Input id="produto" placeholder="Nome do produto ou serviço" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combustivel">Combustível</SelectItem>
                      <SelectItem value="pecas">Peças e Componentes</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input id="quantidade" placeholder="Ex: 10 unidades, 500L" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor-estimado">Valor Estimado (R$)</Label>
                  <Input id="valor-estimado" type="number" placeholder="0,00" step="0.01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor Sugerido</Label>
                <Input id="fornecedor" placeholder="Nome do fornecedor (opcional)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea 
                  id="justificativa" 
                  placeholder="Descreva a necessidade e justificativa para esta compra"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgencia">Nível de Urgência</Label>
                <Select>
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
              <Button className="w-full">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </Button>
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
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <Badge className="bg-yellow-100 text-yellow-800">5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aprovadas</span>
                  <Badge className="bg-green-100 text-green-800">8</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejeitadas</span>
                  <Badge className="bg-red-100 text-red-800">2</Badge>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Total Mês</span>
                  <span className="font-bold text-primary">R$ 45.200,00</span>
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
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(solicitacao.status)}
                        {solicitacao.produto}
                      </div>
                    </TableCell>
                    <TableCell>{solicitacao.quantidade}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(solicitacao.valor)}
                    </TableCell>
                    <TableCell>{solicitacao.solicitante}</TableCell>
                    <TableCell>{solicitacao.data}</TableCell>
                    <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
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