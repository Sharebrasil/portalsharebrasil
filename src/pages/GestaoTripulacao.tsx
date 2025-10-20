import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Plane,
  Calendar,
  Award,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText
} from "lucide-react";

interface CrewMember {
  id: string;
  full_name: string;
  canac: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  status: string;
  photo_url?: string;
}

interface CrewFlightHours {
  id: string;
  crew_member_id: string;
  aircraft_id: string;
  total_hours: number;
  total_pic_hours: number;
  total_sic_hours: number;
  total_ifr_hours?: number;
  aircraft?: {
    registration: string;
    model: string;
  };
}

interface CrewLicense {
  id: string;
  crew_member_id: string;
  license_type: string;
  license_number?: string;
  issue_date?: string;
  expiry_date: string;
  issuing_authority?: string;
  status: string;
  observations?: string;
  document_url?: string;
}

interface FlightSchedule {
  id: string;
  flight_date: string;
  flight_time: string;
  origin: string;
  destination: string;
  status: string;
  aircraft_id?: string;
  client_id?: string;
}

export default function GestaoDeTripulacao() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [flightHours, setFlightHours] = useState<CrewFlightHours[]>([]);
  const [licenses, setLicenses] = useState<CrewLicense[]>([]);
  const [schedules, setSchedules] = useState<FlightSchedule[]>([]);
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<CrewLicense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCrewMembers();
  }, []);

  useEffect(() => {
    if (selectedCrew) {
      loadCrewDetails(selectedCrew.id);
    }
  }, [selectedCrew]);

  const loadCrewMembers = async () => {
    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .order('full_name');

    if (error) {
      toast({ title: "Erro ao carregar tripulantes", variant: "destructive" });
      return;
    }

    setCrewMembers(data || []);
  };

  const loadCrewDetails = async (crewId: string) => {
    // Carregar horas de voo
    const { data: hoursData } = await supabase
      .from('crew_flight_hours')
      .select(`
        *,
        aircraft:aircraft_id (
          registration,
          model
        )
      `)
      .eq('crew_member_id', crewId);

    setFlightHours(hoursData || []);

    // Carregar licenças
    const { data: licensesData } = await (supabase as any)
      .from('crew_licenses')
      .select('*')
      .eq('crew_member_id', crewId)
      .order('expiry_date');

    setLicenses(licensesData || []);

    // Carregar escalas de voo
    const { data: schedulesData } = await supabase
      .from('flight_schedules')
      .select('*')
      .eq('crew_member_id', crewId)
      .gte('flight_date', new Date().toISOString().split('T')[0])
      .order('flight_date', { ascending: true })
      .limit(10);

    setSchedules(schedulesData || []);
  };

  const getLicenseStatusBadge = (license: CrewLicense) => {
    const expiryDate = new Date(license.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle size={14} /> Vencida
      </Badge>;
    } else if (daysUntilExpiry <= 60) {
      return <Badge className="bg-yellow-500 flex items-center gap-1">
        <AlertTriangle size={14} /> Vence em {daysUntilExpiry} dias
      </Badge>;
    } else {
      return <Badge className="bg-green-500">Válida</Badge>;
    }
  };

  const saveLicense = async (licenseData: Partial<CrewLicense>) => {
    if (!selectedCrew) return;

    const payload = {
      crew_member_id: selectedCrew.id,
      ...licenseData
    };

    if (editingLicense) {
      const { error } = await (supabase as any)
        .from('crew_licenses')
        .update(payload)
        .eq('id', editingLicense.id);

      if (error) {
        toast({ title: "Erro ao atualizar licença", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await (supabase as any)
        .from('crew_licenses')
        .insert([payload]);

      if (error) {
        toast({ title: "Erro ao criar licença", variant: "destructive" });
        return;
      }
    }

    toast({ title: "Licença salva com sucesso!" });
    setIsLicenseDialogOpen(false);
    setEditingLicense(null);
    loadCrewDetails(selectedCrew.id);
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm('Deseja realmente excluir esta licença?')) return;

    const { error } = await (supabase as any)
      .from('crew_licenses')
      .delete()
      .eq('id', licenseId);

    if (error) {
      toast({ title: "Erro ao excluir licença", variant: "destructive" });
      return;
    }

    toast({ title: "Licença excluída com sucesso!" });
    if (selectedCrew) loadCrewDetails(selectedCrew.id);
  };

  const filteredCrewMembers = crewMembers.filter(crew =>
    crew.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crew.canac.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Tripulação</h1>
            <p className="text-muted-foreground">Gerencie tripulantes, horas de voo e habilitações</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Lista de Tripulantes */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Tripulantes
                </CardTitle>
                <Input
                  placeholder="Buscar por nome ou CANAC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredCrewMembers.map((crew) => (
                  <div
                    key={crew.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedCrew?.id === crew.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                    onClick={() => setSelectedCrew(crew)}
                  >
                    <div className="flex items-center gap-3">
                      {crew.photo_url ? (
                        <img src={crew.photo_url} alt={crew.full_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={24} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{crew.full_name}</p>
                        <p className="text-sm text-muted-foreground">CANAC: {crew.canac}</p>
                      </div>
                      <Badge variant={crew.status === 'active' ? 'default' : 'secondary'}>
                        {crew.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Tripulante */}
          <div className="col-span-8">
            {selectedCrew ? (
              <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="hours">Horas de Voo</TabsTrigger>
                  <TabsTrigger value="licenses">Habilitações</TabsTrigger>
                  <TabsTrigger value="schedule">Escala</TabsTrigger>
                </TabsList>

                {/* Perfil */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User size={20} />
                        Dados Pessoais e Profissionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        {selectedCrew.photo_url ? (
                          <img src={selectedCrew.photo_url} alt={selectedCrew.full_name} className="w-32 h-32 rounded-full object-cover" />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={48} className="text-primary" />
                          </div>
                        )}
                        <div className="space-y-2 flex-1">
                          <h2 className="text-2xl font-bold">{selectedCrew.full_name}</h2>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Award className="text-primary" size={16} />
                              <span><strong>CANAC:</strong> {selectedCrew.canac}</span>
                            </div>
                            {selectedCrew.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="text-primary" size={16} />
                                <span>{selectedCrew.email}</span>
                              </div>
                            )}
                            {selectedCrew.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="text-primary" size={16} />
                                <span>{selectedCrew.phone}</span>
                              </div>
                            )}
                            {selectedCrew.birth_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="text-primary" size={16} />
                                <span><strong>Nascimento:</strong> {formatDate(selectedCrew.birth_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Horas de Voo */}
                <TabsContent value="hours">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock size={20} />
                        Horas de Voo por Aeronave
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {flightHours.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Aeronave</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">PIC</TableHead>
                              <TableHead className="text-right">SIC</TableHead>
                              <TableHead className="text-right">IFR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {flightHours.map((hours) => (
                              <TableRow key={hours.id}>
                                <TableCell className="font-medium">
                                  {(hours.aircraft as any)?.registration} - {(hours.aircraft as any)?.model}
                                </TableCell>
                                <TableCell className="text-right">{hours.total_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_pic_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_sic_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_ifr_hours?.toFixed(1) || '0.0'}h</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted">
                              <TableCell>TOTAL GERAL</TableCell>
                              <TableCell className="text-right">
                                {flightHours.reduce((acc, h) => acc + h.total_hours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                {flightHours.reduce((acc, h) => acc + h.total_pic_hours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                {flightHours.reduce((acc, h) => acc + h.total_sic_hours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                {flightHours.reduce((acc, h) => acc + (h.total_ifr_hours || 0), 0).toFixed(1)}h
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma hora de voo registrada
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Habilitações */}
                <TabsContent value="licenses">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Award size={20} />
                          Habilitações e Licenças
                        </CardTitle>
                        <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => setEditingLicense(null)}>
                              <Plus className="mr-2" size={16} />
                              Nova Habilitação
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {editingLicense ? 'Editar Habilitação' : 'Nova Habilitação'}
                              </DialogTitle>
                            </DialogHeader>
                            <LicenseForm
                              license={editingLicense}
                              onSave={saveLicense}
                              onCancel={() => {
                                setIsLicenseDialogOpen(false);
                                setEditingLicense(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {licenses.length > 0 ? (
                        <div className="space-y-4">
                          {licenses.map((license) => (
                            <div key={license.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{license.license_type}</h3>
                                    {getLicenseStatusBadge(license)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {license.license_number && (
                                      <p><strong>Número:</strong> {license.license_number}</p>
                                    )}
                                    {license.issuing_authority && (
                                      <p><strong>Emissor:</strong> {license.issuing_authority}</p>
                                    )}
                                    {license.issue_date && (
                                      <p><strong>Emissão:</strong> {formatDate(license.issue_date)}</p>
                                    )}
                                    <p><strong>Validade:</strong> {formatDate(license.expiry_date)}</p>
                                  </div>
                                  {license.observations && (
                                    <p className="text-sm text-muted-foreground mt-2">{license.observations}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingLicense(license);
                                      setIsLicenseDialogOpen(true);
                                    }}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteLicense(license.id)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma habilitação cadastrada
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Escala de Voo */}
                <TabsContent value="schedule">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        Próximas Escalas de Voo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {schedules.length > 0 ? (
                        <div className="space-y-3">
                          {schedules.map((schedule) => (
                            <div key={schedule.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold">
                                    {new Date(schedule.flight_date).getDate()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(schedule.flight_date).toLocaleDateString('pt-BR', { month: 'short' })}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {schedule.origin} → {schedule.destination}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Horário: {schedule.flight_time}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={schedule.status === 'confirmado' ? 'default' : 'secondary'}>
                                {schedule.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma escala programada
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <User size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Selecione um tripulante para ver os detalhes</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Componente de formulário de licença
function LicenseForm({
  license,
  onSave,
  onCancel
}: {
  license: CrewLicense | null;
  onSave: (data: Partial<CrewLicense>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<CrewLicense>>(
    license || {
      license_type: '',
      license_number: '',
      issue_date: '',
      expiry_date: '',
      issuing_authority: '',
      observations: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.license_type || !formData.expiry_date) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Habilitação *</Label>
          <Select
            value={formData.license_type}
            onValueChange={(value) => setFormData({ ...formData, license_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PPL">PPL - Piloto Privado</SelectItem>
              <SelectItem value="CPL">CPL - Piloto Comercial</SelectItem>
              <SelectItem value="ATPL">ATPL - Piloto de Linha Aérea</SelectItem>
              <SelectItem value="INVA">INVA - Instrutor de Voo</SelectItem>
              <SelectItem value="IFR">IFR - Instrumentos</SelectItem>
              <SelectItem value="MLTE">MLTE - Multi-motor Terrestre</SelectItem>
              <SelectItem value="CMA">CMA - Certificado Médico Aeronáutico</SelectItem>
              <SelectItem value="CHT">CHT - Habilitação de Tipo</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Número da Licença</Label>
          <Input
            value={formData.license_number}
            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
          />
        </div>
        <div>
          <Label>Data de Emissão</Label>
          <Input
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Data de Validade *</Label>
          <Input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            required
          />
        </div>
        <div className="col-span-2">
          <Label>Autoridade Emissora</Label>
          <Input
            value={formData.issuing_authority}
            onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
            placeholder="Ex: ANAC, FAA, EASA"
          />
        </div>
        <div className="col-span-2">
          <Label>Observações</Label>
          <Textarea
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
}
