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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Plane, Calendar, Award, AlertTriangle, Plus, Edit, Trash2, Phone, Mail, MapPin, Clock, FileText, Eye, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface CrewMember {
  id: string;
  full_name: string;
  canac: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  status: string;
  photo_url?: string;
  user_id?: string;
  role?: string;
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
  const navigate = useNavigate();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [flightHours, setFlightHours] = useState<CrewFlightHours[]>([]);
  const [licenses, setLicenses] = useState<CrewLicense[]>([]);
  const [schedules, setSchedules] = useState<FlightSchedule[]>([]);
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<CrewLicense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  useEffect(() => {
    loadCrewMembers();
  }, []);
  useEffect(() => {
    if (selectedCrew) {
      loadCrewDetails(selectedCrew.id);
    }
  }, [selectedCrew]);
  const loadCrewMembers = async () => {
    const {
      data,
      error
    } = await supabase.from('crew_members').select('*').order('full_name');
    if (error) {
      toast({
        title: "Erro ao carregar tripulantes",
        variant: "destructive"
      });
      return;
    }

    // Carregar roles dos tripulantes
    const crewWithRoles = await Promise.all((data || []).map(async crew => {
      if (!crew.user_id) return {
        ...crew,
        role: 'Tripulante'
      };
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', crew.user_id);
      const isPilotChief = roleData?.some(r => r.role === 'piloto_chefe');
      return {
        ...crew,
        role: isPilotChief ? 'Piloto Chefe' : 'Tripulante'
      };
    }));
    setCrewMembers(crewWithRoles);
  };
  const loadCrewDetails = async (crewId: string) => {
    // Carregar horas de voo
    const {
      data: hoursData
    } = await supabase.from('crew_flight_hours').select(`
        *,
        aircraft:aircraft_id (
          registration,
          model
        )
      `).eq('crew_member_id', crewId);
    setFlightHours(hoursData || []);

    // Carregar licenças
    const {
      data: licensesData
    } = await (supabase as any).from('crew_licenses').select('*').eq('crew_member_id', crewId).order('expiry_date');
    setLicenses(licensesData || []);

    // Carregar escalas de voo
    const {
      data: schedulesData
    } = await supabase.from('flight_schedules').select('*').eq('crew_member_id', crewId).gte('flight_date', new Date().toISOString().split('T')[0]).order('flight_date', {
      ascending: true
    }).limit(10);
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
      const {
        error
      } = await (supabase as any).from('crew_licenses').update(payload).eq('id', editingLicense.id);
      if (error) {
        toast({
          title: "Erro ao atualizar licença",
          variant: "destructive"
        });
        return;
      }
    } else {
      const {
        error
      } = await (supabase as any).from('crew_licenses').insert([payload]);
      if (error) {
        toast({
          title: "Erro ao criar licença",
          variant: "destructive"
        });
        return;
      }
    }
    toast({
      title: "Licença salva com sucesso!"
    });
    setIsLicenseDialogOpen(false);
    setEditingLicense(null);
    loadCrewDetails(selectedCrew.id);
  };
  const deleteLicense = async (licenseId: string) => {
    if (!confirm('Deseja realmente excluir esta licença?')) return;
    const {
      error
    } = await (supabase as any).from('crew_licenses').delete().eq('id', licenseId);
    if (error) {
      toast({
        title: "Erro ao excluir licença",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Licença excluída com sucesso!"
    });
    if (selectedCrew) loadCrewDetails(selectedCrew.id);
  };
  const isActive = (status?: string) => {
    const s = String(status ?? '').toLowerCase();
    return s === 'active' || s === 'ativo' || s === '';
  };

  const filteredCrewMembers = crewMembers.filter(crew =>
    crew.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crew.canac.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCrewMembers = filteredCrewMembers.filter(crew => isActive(crew.status));
  const inactiveCrewMembers = filteredCrewMembers.filter(crew => !isActive(crew.status));
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };
  return <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Tripulação</h1>
            <p className="text-muted-foreground">Gerencie tripulantes, horas de voo e habilitações</p>
          </div>
        </div>

        {/* Resumo de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card onClick={() => setShowInactive(false)} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{activeCrewMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Tripulantes Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setShowInactive(true)} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{inactiveCrewMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Tripulantes Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header com busca */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <Input placeholder="Buscar por nome ou CANAC..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
            </div>
          </CardHeader>
        </Card>

        {/* Tripulantes Ativos */}
        {activeCrewMembers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tripulantes Ativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeCrewMembers.map(crew => <Card key={crew.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Avatar e Badge de Status */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src={crew.photo_url} alt={crew.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {crew.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <Badge variant={crew.role === 'Piloto Chefe' ? 'default' : 'secondary'} className="whitespace-nowrap shadow-md">
                        {crew.role || 'Tripulante'}
                      </Badge>
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="text-center space-y-1 w-full">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2">
                      {crew.full_name}
                    </h3>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-2 pt-2 border-t">
                  {crew.email && <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-primary transition-colors">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{crew.email}</span>
                    </div>}
                  {crew.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-primary transition-colors">
                      <Phone size={14} className="flex-shrink-0" />
                      <span>{crew.phone}</span>
                    </div>}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-full justify-center bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      ANAC: {crew.canac}
                    </Badge>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/tripulacao/${crew.id}?tab=dados`)} className="gap-2">
                    <Eye size={14} />
                    Detalhes
                  </Button>
                  {crew.phone && <Button variant="outline" size="sm" className="gap-2" asChild>
                      
                    </Button>}
                  {crew.email && !crew.phone && <Button variant="outline" size="sm" className="gap-2" asChild>
                      
                    </Button>}
                </div>
              </CardContent>
            </Card>)}
            </div>
          </div>
        )}

        {/* Tripulantes Inativos */}
        {inactiveCrewMembers.length > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-accent transition-colors"
              onClick={() => setShowInactive((v) => !v)}
              aria-expanded={showInactive}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <span className="text-xl font-semibold text-foreground">Tripulantes Inativos</span>
                <Badge variant="secondary">{inactiveCrewMembers.length}</Badge>
              </div>
              <span className="text-sm text-muted-foreground">{showInactive ? 'Ocultar' : 'Abrir pasta'}</span>
            </button>

            {showInactive && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inactiveCrewMembers.map(crew => <Card key={crew.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden opacity-75">
                    <CardContent className="p-6 space-y-4">
                      {/* Avatar e Badge de Status */}
                      <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={crew.photo_url} alt={crew.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                              {crew.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <Badge variant="destructive" className="whitespace-nowrap shadow-md">
                              Inativo
                            </Badge>
                          </div>
                        </div>

                        {/* Nome */}
                        <div className="text-center space-y-1 w-full">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2">
                            {crew.full_name}
                          </h3>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-2 pt-2 border-t">
                        {crew.email && <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-primary transition-colors">
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate">{crew.email}</span>
                          </div>}
                        {crew.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-primary transition-colors">
                            <Phone size={14} className="flex-shrink-0" />
                            <span>{crew.phone}</span>
                          </div>}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-full justify-center bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                            ANAC: {crew.canac}
                          </Badge>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/tripulacao/${crew.id}?tab=dados`)} className="gap-2">
                          <Eye size={14} />
                          Detalhes
                        </Button>
                        {crew.phone && <Button variant="outline" size="sm" className="gap-2" asChild>

                          </Button>}
                        {crew.email && !crew.phone && <Button variant="outline" size="sm" className="gap-2" asChild>

                          </Button>}
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            )}
          </div>
        )}

        {/* Dialog de Detalhes do Tripulante */}
        <Dialog open={!!selectedCrew} onOpenChange={open => !open && setSelectedCrew(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User size={24} />
                Perfil Completo - {selectedCrew?.full_name}
              </DialogTitle>
            </DialogHeader>
            {selectedCrew ? <Tabs defaultValue="profile" className="space-y-4">
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
                        {selectedCrew.photo_url ? <img src={selectedCrew.photo_url} alt={selectedCrew.full_name} className="w-32 h-32 rounded-full object-cover" /> : <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={48} className="text-primary" />
                          </div>}
                        <div className="space-y-2 flex-1">
                          <h2 className="text-2xl font-bold">{selectedCrew.full_name}</h2>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Award className="text-primary" size={16} />
                              <span><strong>CANAC:</strong> {selectedCrew.canac}</span>
                            </div>
                            {selectedCrew.email && <div className="flex items-center gap-2">
                                <Mail className="text-primary" size={16} />
                                <span>{selectedCrew.email}</span>
                              </div>}
                            {selectedCrew.phone && <div className="flex items-center gap-2">
                                <Phone className="text-primary" size={16} />
                                <span>{selectedCrew.phone}</span>
                              </div>}
                            {selectedCrew.birth_date && <div className="flex items-center gap-2">
                                <Calendar className="text-primary" size={16} />
                                <span><strong>Nascimento:</strong> {formatDate(selectedCrew.birth_date)}</span>
                              </div>}
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
                      {flightHours.length > 0 ? <Table>
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
                            {flightHours.map(hours => <TableRow key={hours.id}>
                                <TableCell className="font-medium">
                                  {(hours.aircraft as any)?.registration} - {(hours.aircraft as any)?.model}
                                </TableCell>
                                <TableCell className="text-right">{hours.total_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_pic_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_sic_hours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{hours.total_ifr_hours?.toFixed(1) || '0.0'}h</TableCell>
                              </TableRow>)}
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
                        </Table> : <div className="text-center py-8 text-muted-foreground">
                          Nenhuma hora de voo registrada
                        </div>}
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
                            <LicenseForm license={editingLicense} onSave={saveLicense} onCancel={() => {
                          setIsLicenseDialogOpen(false);
                          setEditingLicense(null);
                        }} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {licenses.length > 0 ? <div className="space-y-4">
                          {licenses.map(license => <div key={license.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{license.license_type}</h3>
                                    {getLicenseStatusBadge(license)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {license.license_number && <p><strong>Número:</strong> {license.license_number}</p>}
                                    {license.issuing_authority && <p><strong>Emissor:</strong> {license.issuing_authority}</p>}
                                    {license.issue_date && <p><strong>Emissão:</strong> {formatDate(license.issue_date)}</p>}
                                    <p><strong>Validade:</strong> {formatDate(license.expiry_date)}</p>
                                  </div>
                                  {license.observations && <p className="text-sm text-muted-foreground mt-2">{license.observations}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => {
                            setEditingLicense(license);
                            setIsLicenseDialogOpen(true);
                          }}>
                                    <Edit size={16} />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteLicense(license.id)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>)}
                        </div> : <div className="text-center py-8 text-muted-foreground">
                          Nenhuma habilitação cadastrada
                        </div>}
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
                      {schedules.length > 0 ? <div className="space-y-3">
                          {schedules.map(schedule => <div key={schedule.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold">
                                    {new Date(schedule.flight_date).getDate()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(schedule.flight_date).toLocaleDateString('pt-BR', {
                              month: 'short'
                            })}
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
                            </div>)}
                        </div> : <div className="text-center py-8 text-muted-foreground">
                          Nenhuma escala programada
                        </div>}
                    </CardContent>
                  </Card>
                 </TabsContent>
               </Tabs> : null}
           </DialogContent>
         </Dialog>
       </div>
     </Layout>;
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
  const [formData, setFormData] = useState<Partial<CrewLicense>>(license || {
    license_type: '',
    license_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    observations: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.license_type || !formData.expiry_date) {
      toast({
        title: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    onSave(formData);
  };
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Habilitação *</Label>
          <Select value={formData.license_type} onValueChange={value => setFormData({
          ...formData,
          license_type: value
        })}>
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
          <Input value={formData.license_number} onChange={e => setFormData({
          ...formData,
          license_number: e.target.value
        })} />
        </div>
        <div>
          <Label>Data de Emissão</Label>
          <Input type="date" value={formData.issue_date} onChange={e => setFormData({
          ...formData,
          issue_date: e.target.value
        })} />
        </div>
        <div>
          <Label>Data de Validade *</Label>
          <Input type="date" value={formData.expiry_date} onChange={e => setFormData({
          ...formData,
          expiry_date: e.target.value
        })} required />
        </div>
        <div className="col-span-2">
          <Label>Autoridade Emissora</Label>
          <Input value={formData.issuing_authority} onChange={e => setFormData({
          ...formData,
          issuing_authority: e.target.value
        })} placeholder="Ex: ANAC, FAA, EASA" />
        </div>
        <div className="col-span-2">
          <Label>Observações</Label>
          <Textarea value={formData.observations} onChange={e => setFormData({
          ...formData,
          observations: e.target.value
        })} rows={3} />
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
    </form>;
}
