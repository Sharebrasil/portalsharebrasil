import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AddLogbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: string;
  prefilledDate?: Date;
  onSuccess?: () => void;
}

export function AddLogbookEntryDialog({ open, onOpenChange, aircraftId, prefilledDate, onSuccess }: AddLogbookEntryDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(prefilledDate);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);

  useEffect(() => {
    if (prefilledDate) {
      setDate(prefilledDate);
    }
  }, [prefilledDate]);

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

  const [formData, setFormData] = useState({
    departure_airport: "",
    arrival_airport: "",
    departure_time: "",
    arrival_time: "",
    flight_time_hours: "",
    flight_time_minutes: "",
    night_time_hours: "",
    night_time_minutes: "",
    ifr_count: "",
    landings: "1",
    fuel_added: "",
    fuel_liters: "",
    fuel_cell: "",
    pc: "",
    isc: "",
    daily_rate: "",
    extras: "",
    flight_type: "",
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast({
        title: "Erro",
        description: "Selecione a data do voo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const flightHours = parseFloat(formData.flight_time_hours) || 0;
      const flightMinutes = parseFloat(formData.flight_time_minutes) || 0;
      const totalTime = flightHours + (flightMinutes / 60);

      const { error } = await supabase.from('logbook_entries').insert([{
        aircraft_id: aircraftId,
        entry_date: format(date, 'yyyy-MM-dd'),
        departure_airport: formData.departure_airport,
        arrival_airport: formData.arrival_airport,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        flight_time_hours: flightHours,
        flight_time_minutes: flightMinutes,
        night_time_hours: parseFloat(formData.night_time_hours) || 0,
        night_time_minutes: parseFloat(formData.night_time_minutes) || 0,
        total_time: totalTime,
        ifr_count: parseInt(formData.ifr_count) || 0,
        landings: parseInt(formData.landings) || 1,
        fuel_added: parseFloat(formData.fuel_added) || 0,
        fuel_liters: formData.fuel_liters ? parseFloat(formData.fuel_liters) : null,
        fuel_cell: formData.fuel_cell ? parseFloat(formData.fuel_cell) : null,
        pc: formData.pc ? parseFloat(formData.pc) : null,
        isc: formData.isc || null,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
        extras: formData.extras || null,
        flight_type: formData.flight_type || null,
        remarks: formData.remarks || null,
      }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Registro adicionado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      onSuccess?.();
      onOpenChange(false);
      setDate(undefined);
      setFormData({
        departure_airport: "",
        arrival_airport: "",
        departure_time: "",
        arrival_time: "",
        flight_time_hours: "",
        flight_time_minutes: "",
        night_time_hours: "",
        night_time_minutes: "",
        ifr_count: "",
        landings: "1",
        fuel_added: "",
        fuel_liters: "",
        fuel_cell: "",
        pc: "",
        isc: "",
        daily_rate: "",
        extras: "",
        flight_type: "",
        remarks: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar registro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Registro de Voo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Voo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: pt }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_type">Tipo de Voo</Label>
              <Input
                id="flight_type"
                value={formData.flight_type}
                onChange={(e) => setFormData({ ...formData, flight_type: e.target.value })}
                placeholder="TRANSLADO, EXECUTIVO, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_airport">DE (Aeroporto) *</Label>
              <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {formData.departure_airport || "Selecione ou digite..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Digite o código ICAO..." 
                      value={formData.departure_airport}
                      onValueChange={(value) => setFormData({ ...formData, departure_airport: value.toUpperCase() })}
                    />
                    <CommandEmpty>Nenhum aeródromo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {aerodromes?.map((aerodrome) => (
                        <CommandItem
                          key={aerodrome.id}
                          value={aerodrome.icao_code}
                          onSelect={(value) => {
                            setFormData({ ...formData, departure_airport: value.toUpperCase() });
                            setDepartureOpen(false);
                          }}
                        >
                          {aerodrome.icao_code} - {aerodrome.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrival_airport">PARA (Aeroporto) *</Label>
              <Popover open={arrivalOpen} onOpenChange={setArrivalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {formData.arrival_airport || "Selecione ou digite..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Digite o código ICAO..." 
                      value={formData.arrival_airport}
                      onValueChange={(value) => setFormData({ ...formData, arrival_airport: value.toUpperCase() })}
                    />
                    <CommandEmpty>Nenhum aeródromo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {aerodromes?.map((aerodrome) => (
                        <CommandItem
                          key={aerodrome.id}
                          value={aerodrome.icao_code}
                          onSelect={(value) => {
                            setFormData({ ...formData, arrival_airport: value.toUpperCase() });
                            setArrivalOpen(false);
                          }}
                        >
                          {aerodrome.icao_code} - {aerodrome.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_time">DEP (UTC) *</Label>
              <div className="relative">
                <Input
                  id="departure_time"
                  type="time"
                  step="1"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  required
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">z</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrival_time">POU (UTC) *</Label>
              <div className="relative">
                <Input
                  id="arrival_time"
                  type="time"
                  step="1"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  required
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">z</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight_time_hours">Tempo Voo (H) *</Label>
              <Input
                id="flight_time_hours"
                type="number"
                step="1"
                value={formData.flight_time_hours}
                onChange={(e) => setFormData({ ...formData, flight_time_hours: e.target.value })}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_time_minutes">Tempo Voo (M) *</Label>
              <Input
                id="flight_time_minutes"
                type="number"
                step="1"
                max="59"
                value={formData.flight_time_minutes}
                onChange={(e) => setFormData({ ...formData, flight_time_minutes: e.target.value })}
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="night_time_hours">Noturno (H)</Label>
              <Input
                id="night_time_hours"
                type="number"
                step="1"
                value={formData.night_time_hours}
                onChange={(e) => setFormData({ ...formData, night_time_hours: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="night_time_minutes">Noturno (M)</Label>
              <Input
                id="night_time_minutes"
                type="number"
                step="1"
                max="59"
                value={formData.night_time_minutes}
                onChange={(e) => setFormData({ ...formData, night_time_minutes: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ifr_count">IFR</Label>
              <Input
                id="ifr_count"
                type="number"
                value={formData.ifr_count}
                onChange={(e) => setFormData({ ...formData, ifr_count: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landings">Pousos</Label>
              <Input
                id="landings"
                type="number"
                value={formData.landings}
                onChange={(e) => setFormData({ ...formData, landings: e.target.value })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fuel_added">FUEL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-sm">
                        O total de combustível por etapa de voo deve ser registrado com a quantidade existente no momento da partida dos motores, no formato de número inteiro, com arredondamento para o menor se necessário, nas unidades alternativas: massa (kg), volume (L), massa em libras (lb), ou volume em galões (gal).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="fuel_added"
                type="number"
                step="0.1"
                value={formData.fuel_added}
                onChange={(e) => setFormData({ ...formData, fuel_added: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuel_liters">Combustível (L)</Label>
              <Input
                id="fuel_liters"
                type="number"
                step="0.1"
                value={formData.fuel_liters}
                onChange={(e) => setFormData({ ...formData, fuel_liters: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_cell">Célula</Label>
              <Input
                id="fuel_cell"
                type="number"
                step="0.1"
                value={formData.fuel_cell}
                onChange={(e) => setFormData({ ...formData, fuel_cell: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pc">PC</Label>
              <Input
                id="pc"
                type="number"
                step="0.1"
                value={formData.pc}
                onChange={(e) => setFormData({ ...formData, pc: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isc">ISC</Label>
              <Input
                id="isc"
                value={formData.isc}
                onChange={(e) => setFormData({ ...formData, isc: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Diárias</Label>
              <Input
                id="daily_rate"
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extras">Extras</Label>
              <Input
                id="extras"
                value={formData.extras}
                onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Observações</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
