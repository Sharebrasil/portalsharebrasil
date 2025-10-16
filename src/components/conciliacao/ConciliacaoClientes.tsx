import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Clock, Send, FileText, Users } from "lucide-react";

export function ConciliacaoClientes() {
  const conciliacaoClientes = [
    {
      id: 1,
      data: "14/01/2024",
      descricao: "Material de construção - cimento e areia",
      cliente: "João Silva Ltda",
      aeronave: "PT-ABC",
      categoria: "material",
      valor: 1500.00,
      status: "Enviado",
      acoes: "Aguardando pagamento",
    },
    {
      id: 2,
      data: "19/01/2024",
      descricao: "Hospedagem - Hotel Central",
      cliente: "Maria Fernanda ME",
      aeronave: "PP-XYZ",
      categoria: "hospedagem",
      valor: 600.00,
      status: "Pago",
      acoes: "Concluído",
    },
    {
      id: 3,
      data: "24/01/2024",
      descricao: "Transporte - combustível e pedágio",
      cliente: "Empresa ABC S.A.",
      aeronave: "PT-DEF",
      categoria: "transporte",
      valor: 350.00,
      status: "Pendente",
      acoes: "Enviar para cliente",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "Enviado":
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>;
      case "Pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pago":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Enviado":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "Pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
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

  const resumoClientes = {
    totalPago: 600.00,
    totalEnviado: 1500.00,
    totalPendente: 350.00,
  };

  return (
    <div className="space-y-6">
      {/* Resumo Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(resumoClientes.totalPago)}
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
                <p className="text-sm text-muted-foreground">Total Enviado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(resumoClientes.totalEnviado)}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(resumoClientes.totalPendente)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Conciliação Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conciliação com Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aeronave</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conciliacaoClientes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="truncate">{item.descricao}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.aeronave}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-medium">
                        {formatCurrency(item.valor)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {item.acoes}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}