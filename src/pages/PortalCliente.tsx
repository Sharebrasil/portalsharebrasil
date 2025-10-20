import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plane } from "lucide-react";

const PortalCliente = () => {
  const [cnpj, setCnpj] = useState("");
  const [registration, setRegistration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: aircraft, error: aircraftError } = await supabase
        .from("aircraft")
        .select("id, registration")
        .eq("registration", registration.toUpperCase())
        .maybeSingle();

      if (aircraftError) {
        console.error("Erro ao buscar aeronave:", aircraftError);
        toast.error("Erro ao buscar aeronave");
        return;
      }

      if (!aircraft) {
        toast.error("Aeronave não encontrada");
        return;
      }

      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, cnpj, company_name, aircraft_id");

      if (clientError) {
        console.error("Erro ao buscar clientes:", clientError);
        toast.error("Erro ao buscar cliente");
        return;
      }

      if (!clients || clients.length === 0) {
        toast.error("Nenhum cliente cadastrado");
        return;
      }

      const clientWithAircraft = clients.find((c: any) => {
        const cleanCnpj = c.cnpj.replace(/[^\d]/g, '');
        return cleanCnpj.startsWith(cnpj) && c.aircraft_id === aircraft.id;
      });

      if (!clientWithAircraft) {
        toast.error("CNPJ ou aeronave incorretos");
        return;
      }

      localStorage.setItem(
        "clientPortalSession",
        JSON.stringify({
          clientId: clientWithAircraft.id,
          aircraftId: aircraft.id,
          companyName: clientWithAircraft.company_name,
          registration: aircraft.registration,
        })
      );

      toast.success("Login realizado com sucesso!");
      navigate("/portal-cliente/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Plane className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Área do Cliente</CardTitle>
            <CardDescription>
              Acesse com os 4 primeiros dígitos do CNPJ e a matrícula da aeronave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (4 primeiros dígitos)</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="1234"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value.slice(0, 4))}
                  maxLength={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration">Matrícula da Aeronave</Label>
                <Input
                  id="registration"
                  type="text"
                  placeholder="PR-ABC"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Acessar Sistema"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PortalCliente;
