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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [deSearchOpen, setDeSearchOpen] = useState<number | null>(null);
  const [paraSearchOpen, setParaSearchOpen] = useState<number | null>(null);
  const [deSearchValue, setDeSearchValue] = useState('');
  const [paraSearchValue, setParaSearchValue] = useState('');

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
        .select('id, canac, full_name')
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

  const { data: aerodromes } = useQuery({
    queryKey: ['aerodromes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aerodromes')
        .select('id, icao_code, name')
        .order('icao_code', { ascending: true });
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
    if (!logbookMonth || !aircraftId) return;

    const startDate = new Date(logbookMonth.year, logbookMonth.month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(logbookMonth.year, logbookMonth.month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*, pic:crew_members!pic_canac(id, canac), sic:crew_members!sic_canac(id, canac)')
      .eq('aircraft_id', aircraftId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('Error loading entries:', error.message || JSON.stringify(error));
      toast.error(`Erro ao carregar entradas: ${error.message || 'Unknown error'}`);
      return;
    }

    const formattedEntries = data.map(entry => {
      const timeValue = Number(entry.time) || 0;
      const nightHoursValue = Number(entry.night_hours) || 0;
      const dayTimeValue = Number(entry.day_time) || 0;
      const totalTimeValue = Number(entry.total_time) || 0;
      const ifrTimeValue = Number(entry.ifr_time) || 0;

      return {
        id: entry.id,
        data: entry.entry_date,
        de: entry.departure_aerodrome || '',
        para: entry.arrival_aerodrome || '',
        ac: entry.ac_time ? new Date(entry.ac_time).toISOString().substring(11, 16) : '',
        dep: entry.dep_time ? new Date(entry.dep_time).toISOString().substring(11, 16) : '',
        pou: entry.pou_time ? new Date(entry.pou_time).toISOString().substring(11, 16) : '',
        cor: entry.cor_time ? new Date(entry.cor_time).toISOString().substring(11, 16) : '',
        tvoo: formatDecimalHoursToHHMM(timeValue),
        tdia: formatDecimalHoursToHHMM(dayTimeValue),
        tnoit: formatDecimalHoursToHHMM(nightHoursValue),
        total: formatDecimalHoursToHHMM(totalTimeValue),
        ifr: formatDecimalHoursToHHMM(ifrTimeValue),
        pousos: entry.pousos?.toString() || '',
        abast: entry.fuel_added?.toString() || '',
        fuel: entry.fuel_liters?.toString() || '',
        ctm: entry.celula?.toString() || '',
        pic: entry.pic?.canac || '',
        sic: entry.sic?.canac || '',
        diarias: entry.daily_rate?.toString() || '',
        extras: entry.extras || '',
        voo_para: entry.client_id || '',
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

    const tvooDec = parseHHMMToDecimal(entry.tvoo);
    const tnoitDec = parseHHMMToDecimal(entry.tnoit);
    const tdiaDec = parseHHMMToDecimal(entry.tdia);
    const totalDec = parseHHMMToDecimal(entry.total) || tvooDec;
    const ifrDec = parseHHMMToDecimal(entry.ifr);

    const picMember = crewMembers?.find(c => c.canac === entry.pic);
    const sicMember = crewMembers?.find(c => c.canac === entry.sic);

    const entryData = {
      logbook_month_id: logbookMonth.id,
      aircraft_id: aircraftId,
      entry_date: entry.data,
      departure_aerodrome: entry.de,
      arrival_aerodrome: entry.para,
      ac_time: entry.ac ? new Date(`${entry.data}T${entry.ac}:00`).toISOString() : null,
      dep_time: entry.dep ? new Date(`${entry.data}T${entry.dep}:00`).toISOString() : null,
      pou_time: entry.pou ? new Date(`${entry.data}T${entry.pou}:00`).toISOString() : null,
      cor_time: entry.cor ? new Date(`${entry.data}T${entry.cor}:00`).toISOString() : null,
      time: tvooDec,
      day_time: tdiaDec,
      night_hours: tnoitDec,
      total_time: totalDec,
      ifr_time: ifrDec,
      pousos: parseInt(entry.pousos) || 0,
      fuel_added: parseFloat(entry.abast) || 0,
      fuel_liters: parseFloat(entry.fuel) || 0,
      celula: parseFloat(entry.ctm) || 0,
      pic_canac: picMember?.id || null,
      sic_canac: sicMember?.id || null,
      daily_rate: parseFloat(entry.diarias) || 0,
      extras: entry.extras,
      client_id: entry.voo_para || null,
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
        confirmed_by: (await supabase.auth.getUser()).data.user?.id,
        confirmed_at: new Date().toISOString(),
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
  const cellStart = logbookMonth?.celula_anterior || 0;
  const cellEnd = logbookMonth?.celula_atual || 0;
  const cellPrev = Math.ceil(cellEnd / 10) * 10;
  const cellDisp = Math.max(0, Number((cellPrev - cellEnd).toFixed(2)));

  const canAddOrEdit = isClosed ? canEditClosed : canEdit;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/diario-bordo')} className="hover:bg-cyan-50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name || 'Logo'} className="h-10 w-auto" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                DIÁRIO {monthName} {selectedYear}
              </h1>
              <p className="text-lg text-cyan-600 font-semibold">{aircraft?.registration}</p>
            </div>
            {isClosed && (
              <span className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-md">FECHADO</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isClosed && !canEditClosed}>
              <SelectTrigger className="w-36 border-cyan-300 focus:ring-cyan-500">
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
              <SelectTrigger className="w-28 border-cyan-300 focus:ring-cyan-500">
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
              <Button onClick={addNewRow} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Trecho
              </Button>
            )}
            {!isClosed && canConfirm && entries.length > 0 && (
              <Button onClick={closeMonth} variant="destructive" className="shadow-md">
                Fechar Diário
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-700 border-0 rounded-lg shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div className="space-y-2">
              <div className="text-lg font-bold border-b border-cyan-300 pb-2 mb-3">INFORMAÇÕES DA AERONAVE</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">AERONAVE:</div>
                <div className="font-bold text-lg">{aircraft?.registration}</div>
                <div className="font-semibold">MODELO:</div>
                <div>{aircraft?.model}</div>
                <div className="font-semibold">CONS. MÉD:</div>
                <div className="font-bold">{aircraft?.fuel_consumption} L/H</div>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold border-b border-cyan-300 pb-2 mb-3">HORAS DE CÉLULA</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-cyan-100 font-semibold text-sm mb-1">ANTERIOR:</div>
                  <div className="text-2xl font-bold">{cellStart.toFixed(1)} H</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-cyan-100 font-semibold text-sm mb-1">ATUAL:</div>
                  <div className="text-2xl font-bold">{cellEnd.toFixed(1)} H</div>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3 backdrop-blur-sm border border-orange-300">
                  <div className="text-orange-100 font-semibold text-sm mb-1">PREV.:</div>
                  <div className="text-2xl font-bold text-orange-100">{cellPrev.toFixed(1)} H</div>
                </div>
                <div className="bg-red-500/30 rounded-lg p-3 backdrop-blur-sm border border-red-300">
                  <div className="text-red-100 font-semibold text-sm mb-1">DISP.:</div>
                  <div className="text-2xl font-bold text-red-100">{cellDisp.toFixed(1)} H</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">DATA</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">DE</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">PARA</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">AC</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">DEP</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">POU</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">COR</th>
                  <th colSpan={4} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">TEMPO DE VOO</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">IFR</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">POUSOS</th>
                  <th colSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">COMBUSTÍVEL</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-[rgb(0,206,209)] text-white font-bold">CÉLULA</th>
                  <th colSpan={2} className="border border-gray-300 p-2 bg-cyan-700 text-white font-bold">TRIPULAÇÃO</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-gray-600 text-white font-bold">DIÁRIAS</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-cyan-700 text-white font-bold">EXTRAS</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-cyan-700 text-white font-bold">VOO PARA</th>
                  <th rowSpan={2} className="border border-gray-300 p-2 bg-cyan-800 text-white font-bold">✓</th>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">T VOO</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">T DIA</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">T NOITE</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">TOTAL</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">ABAST</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">FUEL</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">PIC</th>
                  <th className="border border-gray-300 p-1.5 text-[10px] bg-cyan-600 text-white font-semibold">SIC</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id || index} className={`${newRowIndex === index ? "bg-cyan-50" : index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-cyan-50 transition-colors`}>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="date"
                        value={entry.data}
                        onChange={(e) => updateEntry(index, 'data', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-28 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Popover open={deSearchOpen === index} onOpenChange={(open) => setDeSearchOpen(open ? index : null)}>
                        <PopoverTrigger asChild>
                          <Input
                            placeholder="Buscar..."
                            value={deSearchOpen === index ? deSearchValue : entry.de}
                            onChange={(e) => {
                              setDeSearchValue(e.target.value);
                              if (deSearchOpen !== index) setDeSearchOpen(index);
                            }}
                            disabled={!canAddOrEdit}
                            className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0" align="start">
                          <div className="max-h-40 overflow-y-auto">
                            {aerodromes?.filter(a =>
                              a.icao_code.toLowerCase().includes(deSearchValue.toLowerCase()) ||
                              a.name.toLowerCase().includes(deSearchValue.toLowerCase())
                            ).map((aerodrome) => (
                              <button
                                key={aerodrome.id}
                                onClick={() => {
                                  updateEntry(index, 'de', aerodrome.icao_code);
                                  setDeSearchOpen(null);
                                  setDeSearchValue('');
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-100 border-b border-gray-200"
                              >
                                <div className="font-semibold">{aerodrome.icao_code}</div>
                                <div className="text-gray-600">{aerodrome.name}</div>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Popover open={paraSearchOpen === index} onOpenChange={(open) => setParaSearchOpen(open ? index : null)}>
                        <PopoverTrigger asChild>
                          <Input
                            placeholder="Buscar..."
                            value={paraSearchOpen === index ? paraSearchValue : entry.para}
                            onChange={(e) => {
                              setParaSearchValue(e.target.value);
                              if (paraSearchOpen !== index) setParaSearchOpen(index);
                            }}
                            disabled={!canAddOrEdit}
                            className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0" align="start">
                          <div className="max-h-40 overflow-y-auto">
                            {aerodromes?.filter(a =>
                              a.icao_code.toLowerCase().includes(paraSearchValue.toLowerCase()) ||
                              a.name.toLowerCase().includes(paraSearchValue.toLowerCase())
                            ).map((aerodrome) => (
                              <button
                                key={aerodrome.id}
                                onClick={() => {
                                  updateEntry(index, 'para', aerodrome.icao_code);
                                  setParaSearchOpen(null);
                                  setParaSearchValue('');
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-100 border-b border-gray-200"
                              >
                                <div className="font-semibold">{aerodrome.icao_code}</div>
                                <div className="text-gray-600">{aerodrome.name}</div>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="time"
                        value={entry.ac}
                        onChange={(e) => updateEntry(index, 'ac', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="time"
                        value={entry.dep}
                        onChange={(e) => updateEntry(index, 'dep', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="time"
                        value={entry.pou}
                        onChange={(e) => updateEntry(index, 'pou', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="time"
                        value={entry.cor}
                        onChange={(e) => updateEntry(index, 'cor', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
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
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        value={entry.pousos}
                        onChange={(e) => updateEntry(index, 'pousos', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-12 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={entry.abast}
                        onChange={(e) => updateEntry(index, 'abast', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={entry.fuel}
                        onChange={(e) => updateEntry(index, 'fuel', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={entry.ctm}
                        onChange={(e) => updateEntry(index, 'ctm', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-16 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        value={entry.pic}
                        onChange={(e) => updateEntry(index, 'pic', e.target.value)}
                        disabled={!canAddOrEdit}
                        list="crew-canac-list"
                        placeholder="CANAC"
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        value={entry.sic}
                        onChange={(e) => updateEntry(index, 'sic', e.target.value)}
                        disabled={!canAddOrEdit}
                        list="crew-canac-list"
                        placeholder="CANAC"
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={Number(entry.diarias) === 1}
                        onChange={(e) => updateEntry(index, 'diarias', e.target.checked ? '1' : '0')}
                        disabled={!canAddOrEdit}
                        className="h-4 w-4 accent-cyan-600"
                        aria-label="Diária PIC"
                        title="Marque para contabilizar 1 diária para o PIC"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        value={entry.extras}
                        onChange={(e) => updateEntry(index, 'extras', e.target.value)}
                        disabled={!canAddOrEdit}
                        className="h-7 text-xs w-20 border-cyan-200 focus:border-cyan-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Select
                        value={entry.voo_para || undefined}
                        onValueChange={(val) => updateEntry(index, 'voo_para', val === '__none__' ? '' : val)}
                        disabled={!canAddOrEdit}
                      >
                        <SelectTrigger className="h-7 text-xs w-full border-cyan-200 focus:ring-cyan-500">
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
                          className="h-7 px-3 bg-cyan-600 hover:bg-cyan-700"
                        >
                          Salvar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={entry.confere ? "default" : "outline"}
                          onClick={() => toggleConfirm(index)}
                          disabled={!canConfirm || (isClosed && !canEditClosed)}
                          className={`h-7 w-7 p-0 ${entry.confere ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300 hover:bg-cyan-50'}`}
                        >
                          {entry.confere && <Check className="h-4 w-4" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <datalist id="crew-canac-list">
          {crewMembers?.map(crew => (
            <option key={crew.canac} value={crew.canac}>{crew.full_name} - {crew.canac}</option>
          ))}
        </datalist>
      </div>
    </Layout>
  );
}
