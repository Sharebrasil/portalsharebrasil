import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddAircraftDialog } from "@/components/diario/AddAircraftDialog";
import { AddAerodromeDialog } from "@/components/diario/AddAerodromeDialog";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateDiaryDialog } from "@/components/diario/CreateDiaryDialog";

export default function DiarioBordo() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addAerodromeOpen, setAddAerodromeOpen] = useState(false);
  const [createDiaryOpen, setCreateDiaryOpen] = useState(false);
  const navigate = useNavigate();

  const { data: aircraft, isLoading } = useQuery({
    queryKey: ['aircraft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .order('registration');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: aerodromes } = useQuery({
    queryKey: ['aerodromes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aerodromes')
        .select('*')
        .order('icao_code');
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Diários de Bordo</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os diários de bordo digitais das aeronaves.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreateDiaryOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Diário
            </Button>
            <Button onClick={() => setAddAerodromeOpen(true)} variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Adicionar Aeródromo
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-3">
                  <div className="h-6 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-16" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-4 bg-muted rounded w-40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : aircraft && aircraft.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aircraft.map((ac) => (
              <Card 
                key={ac.id} 
                className="hover:shadow-lg transition-all cursor-pointer border-border bg-card"
                onClick={() => navigate(`/diario-bordo/${ac.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Plane className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-foreground">
                          {ac.registration}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ac.model}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={ac.status === 'Ativa' ? 'default' : 'secondary'}
                      className={ac.status === 'Ativa' ? 'bg-green-500 text-white' : ''}
                    >
                      {ac.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Diário {new Date().getFullYear()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{ac.total_hours?.toFixed(1) || '0.0'} horas totais</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Plane className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma aeronave cadastrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando um diário e cadastrando sua primeira aeronave.
              </p>
              <Button onClick={() => setCreateDiaryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Diário
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Aeronave</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="nova" className="w-full">
              <TabsList>
                <TabsTrigger value="nova">Criar Nova Aeronave</TabsTrigger>
                <TabsTrigger value="aerodromos">Gerenciar Aeródromo</TabsTrigger>
              </TabsList>
              <TabsContent value="nova" className="pt-4">
                <div className="flex items-center gap-3">
                  <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Aeronave
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="aerodromos" className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">Aeródromos salvos</div>
                  <Button onClick={() => setAddAerodromeOpen(true)} variant="outline" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Adicionar Aeródromo
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código ICAO</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aerodromes?.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.icao_code}</TableCell>
                        <TableCell>{a.name}</TableCell>
                      </TableRow>
                    ))}
                    {(!aerodromes || aerodromes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          Nenhum aeródromo cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <AddAircraftDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <AddAerodromeDialog open={addAerodromeOpen} onOpenChange={setAddAerodromeOpen} />
        <CreateDiaryDialog
          open={createDiaryOpen}
          onOpenChange={setCreateDiaryOpen}
          onCreate={({ aircraftId, month, year }) => {
            navigate(`/diario-bordo/${aircraftId}?month=${month}&year=${year}`);
          }}
        />
      </div>
    </Layout>
  );
}
