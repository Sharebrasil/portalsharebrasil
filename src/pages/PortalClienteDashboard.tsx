import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Upload, DollarSign, Plane, LogOut } from "lucide-react";
import { UploadComprovanteDialog } from "@/components/portal-cliente/UploadComprovanteDialog";

interface ClientSession {
  clientId: string;
  aircraftId: string;
  companyName: string;
  registration: string;
}

const PortalClienteDashboard = () => {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [portalData, setPortalData] = useState<any[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = localStorage.getItem("clientPortalSession");
    if (!sessionData) {
      navigate("/portal-cliente");
      return;
    }

    const parsedSession = JSON.parse(sessionData) as ClientSession;
    setSession(parsedSession);
    void loadReconciliations(parsedSession);
    void loadPortalData(parsedSession);
  }, [navigate]);

  const loadReconciliations = async (s: ClientSession) => {
    try {
      const { data, error } = await supabase
        .from("client_reconciliations")
        .select("*")
        .eq("client_id", s.clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReconciliations(data || []);
    } catch (error) {
      console.error("Erro ao carregar conciliações:", error);
    }
  };

  const loadPortalData = async (s: ClientSession) => {
    try {
      const { data, error } = await supabase
        .from("client_portal_data")
        .select("*")
        .eq("client_id", s.clientId)
        .eq("aircraft_id", s.aircraftId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPortalData(data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do portal:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("clientPortalSession");
    navigate("/portal-cliente");
    toast.success("Logout realizado com sucesso");
  };

  const pendingReconciliations = reconciliations.filter((r: any) => r.status === "pendente");
  const totalPending = pendingReconciliations.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  if (!session) return null;

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{session.companyName}</h1>
            <p className="text-muted-foreground">Aeronave: {session.registration}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {totalPending.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">{pendingReconciliations.length} pagamento(s) pendente(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Aeronave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.registration}</div>
              <p className="text-sm text-muted-foreground">Em operação</p>
            </CardContent>
          </Card>
        </div>

        {pendingReconciliations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>Envie comprovantes para dar baixa nos pagamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReconciliations.map((reconciliation: any) => (
                <div key={reconciliation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{reconciliation.description}</p>
                    <p className="text-sm text-muted-foreground">{reconciliation.category}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold">R$ {Number(reconciliation.amount).toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReconciliation(reconciliation.id);
                        setUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Comprovante
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {portalData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos e Arquivos</CardTitle>
              <CardDescription>Notas fiscais, boletos e outros documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portalData.map((data: any) => (
                  <div key={data.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{data.file_name || data.data_type}</p>
                        <p className="text-sm text-muted-foreground">{new Date(data.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    {data.file_url && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(data.file_url, "_blank")}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedReconciliation && (
          <UploadComprovanteDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            reconciliationId={selectedReconciliation}
            onSuccess={() => {
              if (session) {
                void loadReconciliations(session);
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default PortalClienteDashboard;
