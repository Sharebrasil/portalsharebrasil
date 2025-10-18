import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function hoursToHhmm(n?: number | null) {
  const v = Number(n || 0);
  const h = Math.floor(v);
  const m = Math.round((v - h) * 60);
  const mm = String(m).padStart(2, "0");
  return `${h}:${mm}`;
}

interface Props { canac: string }

export default function FlightHoursCard({ canac }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1).toISOString().slice(0,10);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).toISOString().slice(0,10);

  const { data } = useQuery({
    queryKey: ["crew-flight-aggregates", canac, start, end],
    enabled: !!canac,
    queryFn: async () => {
      // Busca entradas onde o tripulante aparece como PIC ou SIC
      const { data, error } = await supabase
        .from("logbook_entries")
        .select("aircraft_id, total_time, night_hours, ifr_count, landings, daily_rate, pic_canac, sic_canac, entry_date")
        .or(`pic_canac.eq.${canac},sic_canac.eq.${canac}`)
        .gte("entry_date", start)
        .lte("entry_date", end);
      if (error) throw error;

      // Mapa por aeronave
      const byAircraft: Record<string, { hours: number; diarias: number; registration?: string }> = {};

      // Totais segregados PIC/SIC
      let totals = {
        pic: { total: 0, noite: 0, ifr: 0, pousos: 0 },
        sic: { total: 0, noite: 0, ifr: 0, pousos: 0 },
      };

      for (const e of data || []) {
        const isPIC = e.pic_canac === canac;
        const isSIC = e.sic_canac === canac;
        if (isPIC) {
          totals.pic.total += Number(e.total_time || 0);
          totals.pic.noite += Number(e.night_hours || 0);
          totals.pic.ifr += Number(e.ifr_count || 0);
          totals.pic.pousos += Number(e.landings || 0);
          const key = e.aircraft_id;
          if (!byAircraft[key]) byAircraft[key] = { hours: 0, diarias: 0 };
          byAircraft[key].hours += Number(e.total_time || 0);
          byAircraft[key].diarias += Number(e.daily_rate || 0) > 0 ? 1 : 0;
        }
        if (isSIC) {
          totals.sic.total += Number(e.total_time || 0);
          totals.sic.noite += Number(e.night_hours || 0);
          totals.sic.ifr += Number(e.ifr_count || 0);
          totals.sic.pousos += Number(e.landings || 0);
          const key = e.aircraft_id;
          if (!byAircraft[key]) byAircraft[key] = { hours: 0, diarias: 0 };
          // SIC não contabiliza diárias
          byAircraft[key].hours += 0; // horas por aeronave no quadro de diárias refletem PIC; manter somente PIC para diárias
        }
      }

      // Enriquecer com matrícula
      const ids = Object.keys(byAircraft);
      if (ids.length) {
        const { data: acs } = await supabase.from("aircraft").select("id, registration").in("id", ids as any);
        const map = new Map((acs || []).map(a => [a.id, a.registration]));
        for (const id of ids) byAircraft[id].registration = map.get(id) || id;
      }

      return { totals, perAircraft: Object.values(byAircraft).map(a => ({ registration: a.registration || "—", hours: a.hours, diarias: a.diarias })) };
    }
  });

  const totals = data?.totals;
  const perAircraft = data?.perAircraft || [];

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(cursor);
  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Horas de Voo</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-[140px] text-center font-semibold capitalize">{monthLabel}</div>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
          <div></div>
          <div className="text-center font-semibold">PIC</div>
          <div className="text-center font-semibold">SIC</div>

          <div className="font-medium">IFR</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.pic.ifr) : "0:00"}</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.sic.ifr) : "0:00"}</div>

          <div className="font-medium">T.VOO</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.pic.total) : "0:00"}</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.sic.total) : "0:00"}</div>

          <div className="font-medium">T.NOITE</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.pic.noite) : "0:00"}</div>
          <div className="text-center">{totals ? hoursToHhmm(totals.sic.noite) : "0:00"}</div>

          <div className="font-medium">POUSO</div>
          <div className="text-center">{totals ? totals.pic.pousos : 0}</div>
          <div className="text-center">{totals ? totals.sic.pousos : 0}</div>
        </div>

        <div>
          <div className="text-sm md:text-base font-bold bg-emerald-500 text-white inline-block px-3 py-1 rounded">TOTAL POR AERONAVE</div>
          <Table className="mt-2 text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Aeronave</TableHead>
                <TableHead>Horas de Voo</TableHead>
                <TableHead>Diárias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perAircraft.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-muted-foreground">Sem registros</TableCell></TableRow>
              ) : (
                perAircraft.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{a.registration}</TableCell>
                    <TableCell>{hoursToHhmm(a.hours)}</TableCell>
                    <TableCell>{a.diarias}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
