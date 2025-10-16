import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plane, MapPin, Calendar, DollarSign, Plus, FileText } from "lucide-react";

export default function RelatorioViagem() {
  const viagens = [
    {
      id: 1,
      destino: "São Paulo - Rio de Janeiro",
      data: "15/01/2024",
      status: "Concluída",
      valor: 2850.00,
      categoria: "Comercial",
    },
    {
      id: 2,
      destino: "Brasília - Salvador",
      data: "22/01/2024",
      status: "Em andamento",
      valor: 3200.00,
      categoria: "Executiva",
    },
    {
      id: 3,
      destino: "Recife - Fortaleza",
      data: "28/01/2024",
      status: "Planejada",
      valor: 1950.00,
      categoria: "Turismo",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluída":
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case "Em andamento":
        return <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case "Planejada":
        return <Badge className="bg-yellow-100 text-yellow-800">Planejada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
            <h1 className="text-3xl font-bold text-foreground">Relatório de Viagem</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe os relatórios de viagens
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Viagem
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Viagens</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <Plane className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-secondary">3</p>
                </div>
                <Calendar className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gasto Total</p>
                  <p className="text-2xl font-bold text-accent">R$ 24.5K</p>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Destinos</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                </div>
                <MapPin className="h-8 w-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Viagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destino</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viagens.map((viagem) => (
                  <TableRow key={viagem.id}>
                    <TableCell className="font-medium">{viagem.destino}</TableCell>
                    <TableCell>{viagem.data}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{viagem.categoria}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(viagem.valor)}
                    </TableCell>
                    <TableCell>{getStatusBadge(viagem.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button variant="default" size="sm">
                          Relatório
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
    </Layout>
  );
}