import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Lock, FileDown } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddLogbookEntryDialog } from "@/components/diario/AddLogbookEntryDialog";
import { LogbookTable } from "@/components/diario/LogbookTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloseMonthDialog } from "@/components/diario/CloseMonthDialog";
import { AircraftMetricsForm } from "@/components/diario/AircraftMetricsForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DiarioBordoDetalhes() {
  const { aircraftId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const monthParam = params.get('month');
  const yearParam = params.get('year');
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState(
    monthParam !== null && !Number.isNaN(parseInt(monthParam)) ? parseInt(monthParam).toString() : new Date().getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    yearParam !== null && !Number.isNaN(parseInt(yearParam)) ? parseInt(yearParam).toString() : new Date().getFullYear().toString()
  );

  const { data: aircraft } = useQuery({
    queryKey: ['aircraft', aircraftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('id', aircraftId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!aircraftId,
  });

  const { data: entries, isLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['logbook-entries', aircraftId, selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-${(parseInt(selectedMonth) + 1).toString().padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);
      const endDateStr = `${selectedYear}-${(parseInt(selectedMonth) + 1).toString().padStart(2, '0')}-${endDate.getDate()}`;

      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!aircraftId,
  });

  const { data: monthClosure, refetch: refetchClosure } = useQuery({
    queryKey: ['month-closure', aircraftId, selectedMonth, selectedYear],
    queryFn: async () => {
      const { data: closureData, error: closureError } = await supabase
        .from('monthly_diary_closures')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .eq('month', parseInt(selectedMonth) + 1)
        .eq('year', parseInt(selectedYear))
        .maybeSingle();
      
      if (closureError) throw closureError;
      
      if (closureData && closureData.closed_by) {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', closureData.closed_by)
          .single();
        
        return {
          ...closureData,
          user_name: userData?.full_name || 'Usuário',
        };
      }
      
      return closureData;
    },
    enabled: !!aircraftId,
  });

  const { data: yearClosures } = useQuery({
    queryKey: ['year-closures', aircraftId, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_diary_closures')
        .select('month')
        .eq('aircraft_id', aircraftId)
        .eq('year', parseInt(selectedYear));
      if (error) throw error;
      return data ?? [] as { month: number }[];
    },
    enabled: !!aircraftId,
  });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const totalHours = entries?.reduce((sum, entry) => sum + entry.total_time, 0) || 0;
  const totalLandings = entries?.reduce((sum, entry) => sum + entry.landings, 0) || 0;
  const totalFuelAdded = entries?.reduce((sum, entry) => sum + entry.fuel_added, 0) || 0;

  const isMonthClosed = !!monthClosure;
  const hasEntries = entries && entries.length > 0;

  const handleCloseSuccess = () => {
    refetchClosure();
    refetchEntries();
  };

  const handleAddEntry = (date?: Date) => {
    setPrefilledDate(date);
    setAddEntryOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/diario-bordo')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {aircraft?.registration || 'Carregando...'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {aircraft?.model} - {aircraft?.total_hours?.toFixed(1) || '0.0'}H totais
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isMonthClosed && hasEntries && (
              <Button onClick={() => setCloseMonthOpen(true)} variant="destructive" className="gap-2">
                <Lock className="h-4 w-4" />
                Encerrar Mês
              </Button>
            )}
            {isMonthClosed && (
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
            {!isMonthClosed && (
              <Button onClick={() => handleAddEntry()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Registro
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {months.map((m, idx) => {
            const closed = (yearClosures ?? []).some((c: any) => c.month === idx + 1);
            const isActive = parseInt(selectedMonth) === idx;
            return (
              <Button
                key={m}
                variant={isActive ? 'default' : closed ? 'secondary' : 'outline'}
                size="sm"
                className="justify-center"
                onClick={() => setSelectedMonth(idx.toString())}
              >
                {m} {closed ? '🔒' : ''}
              </Button>
            );
          })}
        </div>

        {isMonthClosed && hasEntries && monthClosure && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Mês encerrado em {new Date(monthClosure.closed_at).toLocaleDateString('pt-BR')} por{' '}
              <span className="font-bold">{(monthClosure as any).user_name || 'Usuário'}</span>
              {monthClosure.closing_observations && (
                <>
                  <br />
                  <span className="text-sm italic">Observações: {monthClosure.closing_observations}</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <AircraftMetricsForm aircraftId={aircraftId!} isReadOnly={isMonthClosed} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Diário de Bordo
              </CardTitle>
              <div className="flex gap-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LogbookTable 
              entries={entries || []} 
              isLoading={isLoading}
              aircraft={aircraft}
              isReadOnly={isMonthClosed}
              onAddEntry={handleAddEntry}
            />
          </CardContent>
        </Card>

        {aircraftId && (
          <>
            <AddLogbookEntryDialog 
              open={addEntryOpen} 
              onOpenChange={setAddEntryOpen}
              aircraftId={aircraftId}
              prefilledDate={prefilledDate}
              onSuccess={refetchEntries}
            />
            <CloseMonthDialog
              open={closeMonthOpen}
              onOpenChange={setCloseMonthOpen}
              aircraftId={aircraftId}
              month={parseInt(selectedMonth)}
              year={parseInt(selectedYear)}
              totalHours={totalHours}
              totalLandings={totalLandings}
              totalFuelAdded={totalFuelAdded}
              onSuccess={handleCloseSuccess}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
