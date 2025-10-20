import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, UploadCloud, Trash2, Clock, Plane, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FlightHoursCard from "@/components/tripulacao/FlightHoursCard";
import CrewCalendar from "@/components/tripulacao/CrewCalendar";

export default function TripulanteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") === "anexos" ? "anexos" : searchParams.get("tab") === "calendario" ? "calendario" : "dados") as "dados" | "anexos" | "calendario";
  const [activeTab, setActiveTab] = useState<"dados" | "anexos" | "calendario">(initialTab);

  const { data: member, isLoading, refetch } = useQuery({
    queryKey: ["crew_member", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("id, full_name, canac, birth_date, email, phone, photo_url, status")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: licenses = [], isLoading: isLicensesLoading } = useQuery({
    queryKey: ["crew_licenses", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crew_licenses")
        .select("id, license_type, license_number, issue_date, expiry_date, issuing_authority, status, observations")
        .eq("crew_member_id", id)
        .order("expiry_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: ["crew_schedules", id],
    enabled: !!id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("flight_schedules")
        .select("id, flight_date, flight_time, origin, destination, status, aircraft:aircraft_id(registration), clients:client_id(company_name)")
        .eq("crew_member_id", id)
        .gte("flight_date", today)
        .order("flight_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getLicenseStatusBadge = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const today = new Date();
    const daysUntil = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(daysUntil)) return <Badge variant="secondary">Indefinido</Badge>;
    if (daysUntil < 0) return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Vencida</Badge>;
    if (daysUntil <= 60) return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Vence em {daysUntil} dias</Badge>;
    return <Badge className="bg-green-500 text-white">Válida</Badge>;
  };

  const ageText = useMemo(() => {
    if (!member?.birth_date) return null;
    const d = new Date(member.birth_date);
    const diff = Date.now() - d.getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${d.toLocaleDateString("pt-BR")} (${years} anos)`;
  }, [member?.birth_date]);

  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);

  const loadDocs = async () => {
    if (!id) return;
    const { data, error } = await supabase.storage.from("crew-docs").list(id, { limit: 100 });
    if (error) return setDocs([]);
    const items = await Promise.all(
      (data ?? []).map(async (f) => {
        const { data: pub } = await supabase.storage.from("crew-docs").getPublicUrl(`${id}/${f.name}`);
        return { name: f.name, url: pub.publicUrl };
      })
    );
    setDocs(items);
  };

  useEffect(() => {
    void loadDocs();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", activeTab);
    setSearchParams(params);
  }, [activeTab]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("crew-docs").upload(path, file, { upsert: false });
      if (error) throw error;
      await loadDocs();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!id) return;
    const { error } = await supabase.storage.from("crew-docs").remove([`${id}/${name}`]);
    if (!error) await loadDocs();
  };

  if (isLoading || !member) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="relative flex items-start justify-between rounded-xl bg-[rgba(1,24,53,0.69)] text-white p-6">
              <div className="flex items-center gap-4 ml-[9px]">
                <Avatar className="h-20 w-20 border-4 border-white/10">
                  <AvatarImage src={member.photo_url || undefined} />
                  <AvatarFallback className="bg-white text-primary">
                    {(member.full_name || "?")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-[19px] leading-[30px] font-bold">{member.full_name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <Badge className="bg-[#059936]">Código ANAC: {member.canac || "N/A"}</Badge>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Nascimento: {ageText || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate("/tripulacao")}
                className="absolute right-2 top-2 h-[22px] w-[26px] px-1 bg-sky-300/40 text-slate-200 border-transparent rounded-[10px]"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="dados">Dados Principais</TabsTrigger>
                <TabsTrigger value="escala">Escala</TabsTrigger>
                <TabsTrigger value="calendario">Horas de Voo</TabsTrigger>
                <TabsTrigger value="anexos">Anexos</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input value={member.full_name || "—"} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input value={member.birth_date ? new Date(member.birth_date).toLocaleDateString("pt-BR") : "—"} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={member.email || "—"} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={member.phone || "—"} readOnly className="bg-muted/50" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Habilitações</h3>
                  {isLicensesLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando...</div>
                  ) : licenses.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhuma habilitação cadastrada</div>
                  ) : (
                    <div className="space-y-3">
                      {licenses.map((lic: any) => (
                        <div key={lic.id} className="border rounded-lg p-4 flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold">{lic.license_type}</div>
                            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                              {lic.license_number && <span><strong>Número:</strong> {lic.license_number}</span>}
                              {lic.issuing_authority && <span><strong>Emissor:</strong> {lic.issuing_authority}</span>}
                              {lic.issue_date && <span><strong>Emissão:</strong> {new Date(lic.issue_date).toLocaleDateString("pt-BR")}</span>}
                              <span><strong>Validade:</strong> {lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString("pt-BR") : "—"}</span>
                            </div>
                            {lic.observations && <p className="text-sm text-muted-foreground">{lic.observations}</p>}
                          </div>
                          {lic.expiry_date && getLicenseStatusBadge(lic.expiry_date)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </TabsContent>

              <TabsContent value="escala" className="mt-6 space-y-4">
                {isSchedulesLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : schedules.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma escala programada</div>
                ) : (
                  <div className="space-y-3">
                    {(schedules as any[]).map((s: any) => (
                      <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{new Date(s.flight_date).getDate()}</p>
                            <p className="text-sm text-muted-foreground">{new Date(s.flight_date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                          </div>
                          <div>
                            <p className="font-semibold">{s.origin} → {s.destination}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> {s.flight_time}</p>
                          </div>
                        </div>
                        <Badge variant={s.status === 'confirmado' ? 'default' : 'secondary'}>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendario" className="mt-6 space-y-6">
                <CrewCalendar crewMemberId={member.id} />
                <FlightHoursCard canac={member.canac || ''} />
              </TabsContent>

              <TabsContent value="anexos" className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    id="doc-file"
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUpload(f);
                    }}
                  />
                  <Button disabled={uploading} onClick={() => document.getElementById("doc-file")?.click()}>
                    <UploadCloud className="h-4 w-4 mr-2" /> {uploading ? "Enviando..." : "Enviar Documento"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {docs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum documento enviado.</div>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {docs.map((d) => (
                        <li key={d.name} className="flex items-center justify-between p-3">
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {d.name}
                          </a>
                          <Button variant="destructive" size="icon" onClick={() => void handleDelete(d.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
