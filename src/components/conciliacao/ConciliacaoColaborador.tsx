import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Clock, DollarSign, User, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ConciliacaoColaborador() {
  const [colaboradorData, setColaboradorData] = useState([
    {
      id: 1,
      data: "2024-01-15",
      descricao: "Transferência PIX - Salário",
      valor: 2500.00,
      status: "conciliado",
      banco: "Banco do Brasil",
      categoria: "salário",
    },
    {
      id: 2,
      data: "2024-01-14",
      descricao: "Reembolso - Despesas de viagem",
      valor: 450.00,
      status: "pendente",
      banco: "Itaú",
      categoria: "reembolso",
    },
    {
      id: 3,
      data: "2024-01-13",
      descricao: "Vale Alimentação",
      valor: 300.00,
      status: "conciliado",
      banco: "Santander",
      categoria: "benefício",
    },
    {
      id: 4,
      data: "2024-01-12",
      descricao: "Desconto - Plano de Saúde",
      valor: -120.00,
      status: "divergente",
      categoria: "desconto",
    },
  ]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setColaboradorData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "conciliado":
        return <Badge className="bg-green-100 text-green-800">Conciliado</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "divergente":
        return <Badge className="bg-red-100 text-red-800">Divergente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "conciliado":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "divergente":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
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

  const resumoColaborador = {
    totalConciliado: 2800.00,
    totalPendente: 450.00,
    totalDivergente: 120.00,
    saldoFinal: 3130.00,
  };

  return (
    <div className="space-y-6">
      {/* Resumo Colaborador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conciliado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(resumoColaborador.totalConciliado)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(resumoColaborador.totalPendente)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Divergente</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(resumoColaborador.totalDivergente)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(resumoColaborador.saldoFinal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Movimentações do Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradorData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="truncate">{item.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={item.valor > 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(item.valor)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="conciliado">Conciliado</SelectItem>
                        <SelectItem value="divergente">Divergente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="default" size="sm">
                        Conciliar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}