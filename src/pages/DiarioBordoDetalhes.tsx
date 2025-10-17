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
  celula_ant: string;
  celula_post: string;
  celula_disp: string;
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

  const canConfirm = roles.some(role =>
    role === "admin" || role === "piloto_chefe" || role === "gestor_master"
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
      .eq('logbook_month_id', logbookMonth.id)
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('Error loading entries:', error);
      return;
    }

    const formattedEntries = data.map(entry => ({
      id: entry.id,
      data: entry.entry_date,
      de: entry.departure_airport,
      para: entry.arrival_airport,
      ac: entry.aircraft_commander || '',
      dep: entry.departure_time,
      pou: entry.arrival_time,
      cor: entry.flight_type_code || '',
      tvoo: entry.flight_time_hours?.toString() || '',
      tdia: entry.day_time?.toString() || '',
      tnoit: entry.night_hours?.toString() || '',
      total: entry.total_time?.toString() || '',
      ifr: entry.ifr_count?.toString() || '',
      pousos: entry.landings?.toString() || '',
      abast: entry.fuel_added?.toString() || '',
      fuel: entry.fuel_liters?.toString() || '',
      celula_ant: entry.cell_before?.toString() || '',
      celula_post: entry.cell_after?.toString() || '',
      celula_disp: entry.cell_disp?.toString() || '',
      pic: entry.pic_canac || '',
      sic: entry.sic_canac || '',
      diarias: entry.daily_rate?.toString() || '',
      extras: entry.extras || '',
      voo_para: entry.flight_number || '',
      confere: entry.confirmed || false,
    }));

    setEntries(formattedEntries);
  };

  const addNewRow = () => {
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
      celula_ant: '',
      celula_post: '',
      celula_disp: '',
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

    const entry = entries[index];

    const entryData = {
      logbook_month_id: logbookMonth.id,
      aircraft_id: aircraftId,
      entry_date: entry.data,
      departure_airport: entry.de,
      arrival_airport: entry.para,
      aircraft_commander: entry.ac,
      departure_time: entry.dep,
      arrival_time: entry.pou,
      flight_type_code: entry.cor,
      flight_time_hours: parseFloat(entry.tvoo) || 0,
      flight_time_minutes: 0,
      day_time: parseFloat(entry.tdia) || 0,
      night_hours: parseFloat(entry.tnoit) || 0,
      total_time: parseFloat(entry.total) || 0,
      ifr_count: parseInt(entry.ifr) || 0,
      landings: parseInt(entry.pousos) || 0,
      fuel_added: parseFloat(entry.abast) || 0,
      fuel_liters: parseFloat(entry.fuel) || 0,
      cell_before: parseFloat(entry.celula_ant) || 0,
      cell_after: parseFloat(entry.celula_post) || 0,
      cell_disp: parseFloat(entry.celula_disp) || 0,
      pic_canac: entry.pic,
      sic_canac: entry.sic,
      daily_rate: parseFloat(entry.diarias) || 0,
      extras: entry.extras,
      flight_number: entry.voo_para,
      confirmed: entry.confere,
    };

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
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isClosed}>
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
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isClosed}>
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
            {!isClosed && (
              <Button onClick={addNewRow}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Voo
              </Button>
            )}
            {!isClosed && canConfirm && entries.length > 0 && (
              <Button onClick={closeMonth} variant="destructive">
                Fechar Diário
              </Button>
            )}
          </div>
        </div>

        <Card className="p-4 bg-[rgba(10,19,50,1)] border border-gray-700 rounded-xl">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium">
            <div>
              <div>AERONAVE: {aircraft?.registration}</div>
              <div>MODELO: {aircraft?.model}</div>
              <div>CONS. MÉD: {aircraft?.fuel_consumption} L/H</div>
            </div>
            <div>
              <div className="font-bold">CÉLULA</div>
              <div>ANTER.: {cellStart} H</div>
              <div>ATUAL.: {cellEnd} H</div>
              <div>P.REV.: {cellPrev} H</div>
              <div>DISP.: <span className="text-destructive font-semibold">{cellDisp} H</span></div>
            </div>
            <div>
              <div className="font-bold">HORÍMETRO</div>
              <div>INÍCIO: {logbookMonth.hobbs_hours_start || 0} H</div>
              <div>FINAL: {logbookMonth.hobbs_hours_end || 0} H</div>
              <div>ATIVO: {(logbookMonth.hobbs_hours_end || 0) - (logbookMonth.hobbs_hours_start || 0)} H</div>
            </div>
          </div>
        </Card>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">DATA</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">DE</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">PARA</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">AC</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">DEP</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">POU</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">COR</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">T VOO</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">T DIA</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">T NOITE</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">TOTAL</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">IFR</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">POUSOS</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">ABAST</th>
                <th rowSpan={2} className="border border-gray-300 p-1 bg-[rgba(1,63,18,1)]">FUEL</th>
                <th className="border border-gray-300 p-1 bg-[rgba(2,54,34,1)]" colSpan={3}>CTM</th>
                <th className="border border-gray-300 p-1 bg-[rgba(2,54,34,1)]" colSpan={2}>CANAC</th>
                <th rowSpan={2} className="border border-gray-300 p-1">DIÁRIAS</th>
                <th className="border border-gray-300 p-1 bg-[rgba(2,54,34,1)]" colSpan={3}>CONTROLE COTISTA</th>
              </tr>
              <tr>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">ANT</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">POST</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">DISP</th>
                <th className="border border-gray-300 p-1">PIC</th>
                <th className="border border-gray-300 p-1">SIC</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">EXTRAS</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">VOO PARA</th>
                <th className="border border-gray-300 p-1 text-[10px] bg-[rgba(4,56,88,1)]">CONF</th>
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
                      disabled={isClosed}
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.de}
                      onChange={(e) => updateEntry(index, 'de', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.para}
                      onChange={(e) => updateEntry(index, 'para', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.ac}
                      onChange={(e) => updateEntry(index, 'ac', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-12"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="time"
                      value={entry.dep}
                      onChange={(e) => updateEntry(index, 'dep', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="time"
                      value={entry.pou}
                      onChange={(e) => updateEntry(index, 'pou', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.cor}
                      onChange={(e) => updateEntry(index, 'cor', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-12"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.tvoo}
                      onChange={(e) => updateEntry(index, 'tvoo', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.tdia}
                      onChange={(e) => updateEntry(index, 'tdia', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.tnoit}
                      onChange={(e) => updateEntry(index, 'tnoit', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.total}
                      onChange={(e) => updateEntry(index, 'total', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      value={entry.ifr}
                      onChange={(e) => updateEntry(index, 'ifr', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-12"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      value={entry.pousos}
                      onChange={(e) => updateEntry(index, 'pousos', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-12"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.abast}
                      onChange={(e) => updateEntry(index, 'abast', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.fuel}
                      onChange={(e) => updateEntry(index, 'fuel', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.celula_ant}
                      onChange={(e) => updateEntry(index, 'celula_ant', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.celula_post}
                      onChange={(e) => updateEntry(index, 'celula_post', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.celula_disp}
                      onChange={(e) => updateEntry(index, 'celula_disp', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.pic}
                      onChange={(e) => updateEntry(index, 'pic', e.target.value)}
                      disabled={isClosed}
                      list="crew-canac-list"
                      placeholder="CANAC"
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.sic}
                      onChange={(e) => updateEntry(index, 'sic', e.target.value)}
                      disabled={isClosed}
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
                      disabled={isClosed}
                      className="h-4 w-4"
                      aria-label="Diária PIC"
                      title="Marque para contabilizar 1 diária para o PIC"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={entry.extras}
                      onChange={(e) => updateEntry(index, 'extras', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-20"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <select
                      value={entry.voo_para}
                      onChange={(e) => updateEntry(index, 'voo_para', e.target.value)}
                      disabled={isClosed}
                      className="h-7 text-xs w-full border rounded px-1"
                    >
                      <option value="">-</option>
                      {clients?.map(client => (
                        <option key={client.id} value={client.id}>{client.company_name}</option>
                      ))}
                    </select>
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
                        disabled={!canConfirm || isClosed}
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
