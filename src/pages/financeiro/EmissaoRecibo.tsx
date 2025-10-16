import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Download, Eye, Plus } from "lucide-react";

export default function EmissaoRecibo() {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emissão de Recibo</h1>
            <p className="text-muted-foreground mt-2">
              Gere recibos para pagamentos e serviços prestados
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Recibo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Dados do Recibo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número do Recibo</Label>
                  <Input id="numero" placeholder="001/2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data de Emissão</Label>
                  <Input id="data" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input id="valor" type="number" placeholder="0,00" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor-extenso">Valor por Extenso</Label>
                <Input id="valor-extenso" placeholder="Será preenchido automaticamente" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico">Descrição do Serviço</Label>
                <Textarea 
                  id="servico" 
                  placeholder="Descreva os serviços prestados"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pagador-nome">Nome/Razão Social</Label>
                <Input id="pagador-nome" placeholder="Nome do pagador" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagador-documento">CPF/CNPJ</Label>
                <Input id="pagador-documento" placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagador-endereco">Endereço</Label>
                <Input id="pagador-endereco" placeholder="Endereço completo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pagador-cidade">Cidade</Label>
                  <Input id="pagador-cidade" placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagador-uf">UF</Label>
                  <Input id="pagador-uf" placeholder="UF" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recibos Emitidos Recentemente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum recibo emitido ainda</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}