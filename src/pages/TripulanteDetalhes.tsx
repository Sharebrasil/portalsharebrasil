import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Phone, Calendar, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
export default function TripulanteDetalhes() {
  const location = useLocation();
  const navigate = useNavigate();
  const tripulante = (location.state as any)?.tripulante;
  if (!tripulante) {
    return <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhum tripulante selecionado.</p>
              <div className="mt-4">
                <Button onClick={() => navigate('/tripulacao')}>Voltar à lista</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>;
  }
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
  return <Layout>
      <div className="p-6 space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/80">
          <CardContent className="p-6 bg-[#86c1d8]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={tripulante.foto} />
                  <AvatarFallback className="bg-background text-primary text-xl">
                    {tripulante.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-primary-foreground">
                  <h1 className="text-3xl font-bold">{tripulante.nome}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-sm bg-[#059936]">
                      Código ANAC: {tripulante.canac || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Nascimento: {tripulante.data_nascimento ? formatDate(tripulante.data_nascimento) : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate('/tripulacao')} className="bg-[#00050a]/[0.21] text-slate-950 px-[8px] py-[16px] my-0 mx-0">
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Card */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="dados">
                  <User className="h-4 w-4 mr-2" />
                  Dados Principais
                </TabsTrigger>
                <TabsTrigger value="anexos">
                  <Calendar className="h-4 w-4 mr-2" />
                  Anexos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-8 mt-6">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nome Completo</Label>
                      <Input value={tripulante.nome} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Data de Nascimento</Label>
                      <Input value={tripulante.data_nascimento || '—'} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email</Label>
                      <Input value={tripulante.email} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Telefone</Label>
                      <Input value={tripulante.telefone} readOnly className="bg-muted/50" />
                    </div>
                  </div>
                </div>

                {/* Habilitações CHT */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Habilitações CHT</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* MNTE */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">MNTE</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vencimento</Label>
                          <Input type="date" defaultValue={tripulante.cht?.mnte_vencimento || ''} className="h-9" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* MLTE */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">MLTE</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vencimento</Label>
                          <Input type="date" defaultValue={tripulante.cht?.mlte_vencimento || ''} className="h-9" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* IFR */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">IFR</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vencimento</Label>
                          <Input type="date" defaultValue={tripulante.cht?.ifr_vencimento || ''} className="h-9" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tipo */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Tipo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Tipo de Aeronave</Label>
                          <Input placeholder="Ex: CE-525" defaultValue={tripulante.cht?.tipo || ''} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vencimento</Label>
                          <Input type="date" defaultValue={tripulante.cht?.tipo_vencimento || ''} className="h-9" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* CMA */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">CMA - Certificado Médico Aeronáutico</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Número</Label>
                      <Input value={tripulante.cma?.numero || '—'} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Vencimento</Label>
                      <Input type="date" defaultValue={tripulante.cma?.vencimento || ''} className="bg-muted/50" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anexos" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de anexos em desenvolvimento</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>;
}