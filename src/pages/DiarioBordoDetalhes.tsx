import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDecimalHoursToHHMM, parseHHMMToDecimal, formatMinutesToHHMM } from "@/lib/utils";

const MONTHS = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

interface LogbookEntry {
  id?: string;
  data: string;
  de: string;
  para: string;
  ac: string;
  dep: string;
  pou: string;
  cor: string;
  tvoo: string;
  tdia: string;
  tnoit: string;
  total: string;
  ifr: string;
  pousos: string;
  abast: string;
  fuel: string;
  ctm: string;
  pic: string;
  sic: string;
  diarias: string;
  extras: string;
  voo_para: string;
  confere: boolean;
}

export default function DiarioBordoDetalhes() {
  const { aircraftId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { roles } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get('month') || String(new Date().getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get('year') || String(new Date().getFullYear())
  );
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [newRowIndex, setNewRowIndex] = useState<number | null>(null);

  const canEdit = roles.some(role =>
    role === "admin" || role === "piloto_chefe" || role === "gestor_master" || role === "operacoes" || role === "tripulante"
  );

  const canConfirm = roles.some(role =>
    role === "admin" || role === "piloto_chefe" || role === "gestor_master"
  );

  const canEditClosed = roles.some(role =>
    role === "admin" || role === "gestor_master"
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

  const { data: logbookMonth, refetch: refetchMonth } = useQuery({
    queryKey: ['logbook-month', aircraftId, selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logbook_months')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .eq('year', parseInt(selectedYear))
        .eq('month', parseInt(selectedMonth))
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!aircraftId,
  });

  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('canac, full_name')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name');

      if (error) throw error;
      return data;
    },
  });

  const { data: company } = useQuery({
    queryKey: ['company-settings-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('logo_url, name')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setSearchParams({ month: selectedMonth, year: selectedYear });
  }, [selectedMonth, selectedYear, setSearchParams]);

  useEffect(() => {
    if (logbookMonth) {
      loadEntries();
    }
  }, [logbookMonth]);

  const loadEntries = async () => {
    if (!logbookMonth) return;

    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('aircraft_id', logbookMonth.aircraft_id)
      .gte('flight_date', logbookMonth.start_date)
      .lte('flight_date', logbookMonth.end_date)
      .order('flight_date', { ascending: true });

    if (error) {
      console.error('Error loading entries:', error.message || JSON.stringify(error));
      toast.error(`Erro ao carregar entradas: ${error.message || 'Unknown error'}`);
      return;
    }

    const formattedEntries = data.map(entry => {
      const flightMinutes = (Number(entry.flight_time_hours) || 0) * 60 + (Number(entry.flight_time_minutes) || 0)
      const totalMinutes = Math.round((Number(entry.total_time) || 0) * 60) || flightMinutes
      const nightMinutes = (Number(entry.night_time_hours) || 0) * 60 + (Number(entry.night_time_minutes) || 0)
      const dayMinutes = Math.max(0, totalMinutes - nightMinutes)

      return {
        id: entry.id,
        data: entry.entry_date,
        de: entry.departure_airport,
        para: entry.arrival_airport,
        ac: '',
        dep: entry.departure_time,
        pou: entry.arrival_time,
        cor: '',
        tvoo: formatMinutesToHHMM(flightMinutes || totalMinutes),
        tdia: formatMinutesToHHMM(dayMinutes),
        tnoit: formatMinutesToHHMM(nightMinutes),
        total: formatMinutesToHHMM(totalMinutes),
        ifr: formatDecimalHoursToHHMM(entry.ifr_count ?? 0),
        pousos: entry.landings?.toString() || '',
        abast: entry.fuel_added?.toString() || '',
        fuel: entry.fuel_liters?.toString() || '',
        ctm: entry.cell_after?.toString() || '',
        pic: entry.pic_canac || '',
        sic: entry.sic_canac || '',
        diarias: entry.daily_rate?.toString() || '',
        extras: entry.extras || '',
        voo_para: entry.flight_number || '',
        confere: entry.confirmed || false,
      } as LogbookEntry
    });

    setEntries(formattedEntries);
  };

  const addNewRow = () => {
    if (!canEdit) {
      toast.error("Você não tem permissão para adicionar entradas");
      return;
    }

    const newEntry: LogbookEntry = {
      data: '',
      de: '',
      para: '',
      ac: '',
      dep: '',
      pou: '',
      cor: '',
      tvoo: '',
      tdia: '',
      tnoit: '',
      total: '',
      ifr: '',
      pousos: '',
      abast: '',
      fuel: '',
      ctm: '',
      pic: '',
      sic: '',
      diarias: '',
      extras: '',
      voo_para: '',
      confere: false,
    };

    setEntries([...entries, newEntry]);
    setNewRowIndex(entries.length);
  };

  const updateEntry = (index: number, field: keyof LogbookEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const saveEntry = async (index: number) => {
    if (!logbookMonth) {
      toast.error("Diário de bordo não encontrado");
      return;
    }

    if (!canEdit && !canEditClosed) {
      toast.error("Você não tem permissão para salvar entradas");
      return;
    }

    const entry = entries[index];

    const tvooDec = parseHHMMToDecimal(entry.tvoo)
    const tnoitDec = parseHHMMToDecimal(entry.tnoit)
    const tdiaDec = parseHHMMToDecimal(entry.tdia)
    const totalDec = parseHHMMToDecimal(entry.total) || tvooDec
    const ifrDec = parseHHMMToDecimal(entry.ifr)

    const flightHours = Math.floor(tvooDec)
    const flightMinutes = Math.round((tvooDec - flightHours) * 60)
    const nightHours = Math.floor(tnoitDec)
    const nightMinutes = Math.round((tnoitDec - nightHours) * 60)

    const entryData = {
      logbook_month_id: logbookMonth.id,
      aircraft_id: aircraftId,
      entry_date: entry.data,
      departure_airport: entry.de,
      arrival_airport: entry.para,
      departure_time: entry.dep,
      arrival_time: entry.pou,
      flight_time_hours: flightHours,
      flight_time_minutes: flightMinutes,
      day_time: tdiaDec,
      night_hours: tnoitDec,
      night_time_hours: nightHours,
      night_time_minutes: nightMinutes,
      total_time: totalDec,
      ifr_count: ifrDec,
      landings: parseInt(entry.pousos) || 0,
      fuel_added: parseFloat(entry.abast) || 0,
      fuel_liters: parseFloat(entry.fuel) || 0,
      cell_after: parseFloat(entry.ctm) || 0,
      pic_canac: entry.pic,
      sic_canac: entry.sic,
      daily_rate: parseFloat(entry.diarias) || 0,
      extras: entry.extras,
      flight_number: entry.voo_para,
      confirmed: entry.confere,
    } as Record<string, any>;

    if (entry.id) {
      const { error } = await supabase
        .from('logbook_entries')
        .update(entryData)
        .eq('id', entry.id);

      if (error) {
        toast.error("Erro ao atualizar entrada");
        console.error(error);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('logbook_entries')
        .insert([entryData])
        .select()
        .single();

      if (error) {
        toast.error("Erro ao salvar entrada");
        console.error(error);
        return;
      }

      const updated = [...entries];
      updated[index].id = data.id;
      setEntries(updated);
    }

    setNewRowIndex(null);
    toast.success("Entrada salva com sucesso");
    loadEntries();
  };

  const toggleConfirm = async (index: number) => {
    if (!canConfirm) {
      toast.error("Você não tem permissão para confirmar entradas");
      return;
    }

    const entry = entries[index];
    if (!entry.id) {
      toast.error("Salve a entrada antes de confirmar");
      return;
    }

    const newConfirmStatus = !entry.confere;

    const { error } = await supabase
      .from('logbook_entries')
      .update({
        confirmed: newConfirmStatus,
        confirmed_by: newConfirmStatus ? (await supabase.auth.getUser()).data.user?.id : null,
        confirmed_at: newConfirmStatus ? new Date().toISOString() : null,
      })
      .eq('id', entry.id);

    if (error) {
      toast.error("Erro ao confirmar entrada");
      return;
    }

    updateEntry(index, 'confere', newConfirmStatus);
    toast.success(newConfirmStatus ? "Entrada confirmada" : "Confirmação removida");
  };

  const closeMonth = async () => {
    if (!logbookMonth) return;
    if (!canConfirm) {
      toast.error("Você não tem permissão para fechar o diário");
      return;
    }

    const { error } = await supabase
      .from('logbook_months')
      .update({
        is_closed: true,
        closed_by: (await supabase.auth.getUser()).data.user?.id,
        closed_at: new Date().toISOString(),
      })
      .eq('id', logbookMonth.id);

    if (error) {
      toast.error("Erro ao fechar o diário");
      return;
    }

    toast.success("Diário fechado com sucesso");
    refetchMonth();
  };

  if (!logbookMonth) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/diario-bordo')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Diário de Bordo não encontrado</h1>
          </div>
          <p>Crie um diário de bordo para este ano e aeronave.</p>
        </div>
      </Layout>
    );
  }

  const monthName = MONTHS[parseInt(selectedMonth) - 1];
  const isClosed = logbookMonth?.is_closed;
  const cellStart = logbookMonth?.cell_hours_start || 0;
  const cellEnd = logbookMonth?.cell_hours_end || 0;
  const cellPrev = Math.ceil(cellEnd / 10) * 10;
  const cellDisp = Math.max(0, Number((cellPrev - cellEnd).toFixed(2)));

  const canAddOrEdit = isClosed ? canEditClosed : canEdit;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/diario-bordo')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name || 'Logo'} className="h-8 w-auto" />
            )}
            <h1 className="text-2xl font-bold">
              DIÁRIO {monthName} {selectedYear} {aircraft?.registration}
            </h1>
            {isClosed && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">FECHADO</span>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isClosed && !canEditClosed}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={String(idx + 1)}>
                    {month.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isClosed && !canEditClosed}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canAddOrEdit && (
              <Button onClick={addNewRow}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Trecho
              </Button>
            )}
            {!isClosed && canConfirm && entries.length > 0 && (
              <Button onClick={closeMonth} variant="destructive">
                Fechar Diário
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-blue-700 to-blue-900 border-0 rounded-md shadow-lg">
          <div className="grid grid-cols-2 gap-6 text-sm text-white">
            <div className="space-y-1">
              <div className="font-bold">AERONAVE: <span className="font-normal">{aircraft?.registration}</span></div>
              <div className="font-bold">MODELO: <span className="font-normal">{aircraft?.model}</span></div>
              <div className="font-bold">CONS. MÉD: <span className="font-normal">{aircraft?.fuel_consumption} L/H</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-green-300 font-bold mb-2">ANTER.:</div>
                <div className="text-2xl font-bold">{cellStart.toFixed(1)} H</div>
              </div>
              <div className="space-y-1">
                <div className="text-green-300 font-bold mb-2">ATUAL:</div>
                <div className="text-2xl font-bold">{cellEnd.toFixed(1)} H</div>
              </div>
              <div className="space-y-1">
                <div className="text-red-300 font-bold mb-2">PREV.:</div>
                <div className="text-2xl font-bold text-red-300">{cellPrev.toFixed(1)} H</div>
              </div>
              <div className="space-y-1">
                <div className="text-red-400 font-bold mb-2">DISP.:</div>
                <div className="text-2xl font-bold text-red-400">{cellDisp.toFixed(1)} H</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">DATA</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">DE</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">PARA</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">AC</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">DEP</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">POU</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">COR</th>
                <th colSpan={4} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">TEMPO DE VOO</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">IFR</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">POUSOS</th>
                <th colSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)] text-white">COMBUSTÍVEL</th>
                <th colSpan={2} className="border border-gray-300 p-1 bg-[rgba(2,54,34,1)] text-white">CANAC</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-gray-600 text-white">DIÁRIAS</th>
                <th colSpan={3} className="border border-gray-300 p-1 bg-[rgba(2,54,34,1)] text-white">CANAC</th>
              </tr>
              <tr>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">T VOO</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">T DIA</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">T NOITE</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">TOTAL</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">ABAST</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">FUEL</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">CÉLULA</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">PIC</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">SIC</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)] text-white">DIARIAS</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id || index} className={newRowIndex === index ? "bg-blue-50" : ""}>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="date"
                      value={entry.data}
                      onChange={(e) => updateEntry(index, 'data', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.de}
                      onChange={(e) => updateEntry(index, 'de', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.para}
                      onChange={(e) => updateEntry(index, 'para', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="00:00"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.ac}
                      onChange={(e) => updateEntry(index, 'ac', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="time"
                      value={entry.dep}
                      onChange={(e) => updateEntry(index, 'dep', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="time"
                      value={entry.pou}
                      onChange={(e) => updateEntry(index, 'pou', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="00:00"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.cor}
                      onChange={(e) => updateEntry(index, 'cor', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="01:30"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.tvoo}
                      onChange={(e) => updateEntry(index, 'tvoo', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="01:30"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.tdia}
                      onChange={(e) => updateEntry(index, 'tdia', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="01:30"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.tnoit}
                      onChange={(e) => updateEntry(index, 'tnoit', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="01:30"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.total}
                      onChange={(e) => updateEntry(index, 'total', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="00:00"
                      pattern="^\d{1,2}:\d{2}$"
                      value={entry.ifr}
                      onChange={(e) => updateEntry(index, 'ifr', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      value={entry.pousos}
                      onChange={(e) => updateEntry(index, 'pousos', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-12"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.abast}
                      onChange={(e) => updateEntry(index, 'abast', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.fuel}
                      onChange={(e) => updateEntry(index, 'fuel', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.ctm}
                      onChange={(e) => updateEntry(index, 'ctm', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.pic}
                      onChange={(e) => updateEntry(index, 'pic', e.target.value)}
                      disabled={!canAddOrEdit}
                      list="crew-canac-list"
                      placeholder="CANAC"
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.sic}
                      onChange={(e) => updateEntry(index, 'sic', e.target.value)}
                      disabled={!canAddOrEdit}
                      list="crew-canac-list"
                      placeholder="CANAC"
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    <input
                      type="checkbox"
                      checked={Number(entry.diarias) === 1}
                      onChange={(e) => updateEntry(index, 'diarias', e.target.checked ? '1' : '0')}
                      disabled={!canAddOrEdit}
                      className="h-4 w-4"
                      aria-label="Diária PIC"
                      title="Marque para contabilizar 1 diária para o PIC"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.extras}
                      onChange={(e) => updateEntry(index, 'extras', e.target.value)}
                      disabled={!canAddOrEdit}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Select
                      value={entry.voo_para || undefined}
                      onValueChange={(val) => updateEntry(index, 'voo_para', val === '__none__' ? '' : val)}
                      disabled={!canAddOrEdit}
                    >
                      <SelectTrigger className="h-7 text-xs w-full">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="__none__">Sem cliente</SelectItem>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {newRowIndex === index ? (
                      <Button
                        size="sm"
                        onClick={() => saveEntry(index)}
                        className="h-7 px-2"
                      >
                        Salvar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={entry.confere ? "default" : "outline"}
                        onClick={() => toggleConfirm(index)}
                        disabled={!canConfirm || (isClosed && !canEditClosed)}
                        className="h-7 w-7 p-0"
                      >
                        {entry.confere && <Check className="h-4 w-4" />}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="crew-canac-list">
            {crewMembers?.map(crew => (
              <option key={crew.canac} value={crew.canac}>{crew.full_name} - {crew.canac}</option>
            ))}
          </datalist>
        </div>
      </div>
    </Layout>
  );
}
