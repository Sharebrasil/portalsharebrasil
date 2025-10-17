import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Plus, Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddAircraftDialog } from "@/components/diario/AddAircraftDialog";
import { AddAerodromeDialog } from "@/components/diario/AddAerodromeDialog";
import { CreateLogbookDialog } from "@/components/diario/CreateLogbookDialog";
import { useNavigate } from "react-router-dom";

export default function DiarioBordo() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addAerodromeOpen, setAddAerodromeOpen] = useState(false);
  const [createLogbookOpen, setCreateLogbookOpen] = useState(false);
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

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6 w-full">
        <div className="flex justify-between items-center pb-[30px]">
          <div>
            <h1 className="text-3xl font-bold text-foreground pb-[2px] mt-2 mr-[85px]">Diários de Bordo</h1>
            <p className="text-muted-foreground mt-1 pb-[21px]">
              Gerencie os diários de bordo digitais das aeronaves.
            </p>
          </div>
          <div className="flex gap-2"></div>
        </div>

        <div className="flex flex-row gap-2">
          <Button onClick={() => setAddAerodromeOpen(true)} variant="outline" className="gap-2 bg-background border-border">
            <MapPin className="h-4 w-4 text-foreground" />
            <span className="capitalize">gerenciar aerodromos</span>
          </Button>
          <Button onClick={() => setCreateLogbookOpen(true)} className="gap-2 bg-custom-cyan text-[#0F121A] shadow-[0_4px_15px_-4px_rgba(26,228,255,0.2)]">
            <BookOpen className="h-4 w-4" />
            Criar Diário de Bordo
          </Button>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} variant="outline" className="gap-2 mt-2 bg-background border-border">
          <Plus className="h-4 w-4 text-foreground" />
          <span className="capitalize">gerenciar aeronaves</span>
        </Button>

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
                Comece adicionando sua primeira aeronave ao sistema.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setCreateLogbookOpen(true)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Criar Diário de Bordo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <AddAircraftDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <AddAerodromeDialog open={addAerodromeOpen} onOpenChange={setAddAerodromeOpen} />
        <CreateLogbookDialog
          open={createLogbookOpen}
          onOpenChange={setCreateLogbookOpen}
          aircraft={aircraft || []}
        />
      </div>
    </Layout>
  );
}
