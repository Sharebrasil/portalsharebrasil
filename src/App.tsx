import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import AgendaPage from "./pages/AgendaPage";
import Agendamento from "./pages/Agendamento";
import Aniversarios from "./pages/agenda/Aniversarios";
import Clientes from "./pages/agenda/Clientes";
import Contatos from "./pages/agenda/Contatos";
import ConfigEmpresa from "./pages/financeiro/ConfigEmpresa";
import EmissaoRecibo from "./pages/financeiro/EmissaoRecibo";
import RelatorioViagem from "./pages/financeiro/RelatorioViagem";
import SolicitacaoCompras from "./pages/financeiro/SolicitacaoCompras";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import ControleVencimentos from "./pages/ControleVencimentos";
import DiarioBordo from "./pages/DiarioBordo";
import DiarioBordoDetalhes from "./pages/DiarioBordoDetalhes";
import GestaoTripulacao from "./pages/GestaoTripulacao";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Documentos from "./pages/Documentos";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";
import PlanoVoo from "./pages/PlanoVoo";
import PlanoVooForm from "./pages/PlanoVooForm";
import ProgramacaoManutencao from "./pages/ProgramacaoManutencao";
import Recados from "./pages/Recados";
import RelatoriosTecnicos from "./pages/RelatoriosTecnicos";
import Tarefas from "./pages/Tarefas";
import MinhasTarefas from "./pages/MinhasTarefas";
import TripulanteDetalhes from "./pages/TripulanteDetalhes";
import ValeAlimentacao from "./pages/ValeAlimentacao";
import ValeCombustivel from "./pages/ValeCombustivel";
import ValeRefeicao from "./pages/ValeRefeicao";
import PortalCliente from "./pages/PortalCliente";
import PortalClienteDashboard from "./pages/PortalClienteDashboard";
import PortalClienteColaborador from "./pages/PortalClienteColaborador";
import Aerodromos from "./pages/Aerodromos";
import Aeronaves from "./pages/Aeronaves";
import GestaoSalarios from "./pages/GestaoSalarios";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import GestaoFuncionarios from "./pages/GestaoFuncionarios";
import GestaoCTM from "./pages/GestaoCTM";
import ControleAbastecimento from "./pages/ControleAbastecimento";

const queryClient = new QueryClient();

const App = () => {
  const renderProtected = (element: JSX.Element) => (
    <ProtectedRoute>{element}</ProtectedRoute>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={renderProtected(<Index />)} />
              <Route path="/agenda" element={renderProtected(<AgendaPage />)} />
              <Route path="/agenda/contatos" element={renderProtected(<Contatos />)} />
              <Route path="/agenda/clientes" element={renderProtected(<Clientes />)} />
              <Route path="/agenda/aniversarios" element={renderProtected(<Aniversarios />)} />
              <Route path="/documentos" element={renderProtected(<Documentos />)} />
              <Route path="/agendamento" element={renderProtected(<Agendamento />)} />
              <Route path="/plano-voo" element={renderProtected(<PlanoVoo />)} />
              <Route path="/plano-voo/criar/:scheduleId" element={renderProtected(<PlanoVooForm />)} />
              <Route path="/financeiro/conciliacao" element={renderProtected(<ConciliacaoBancaria />)} />
              <Route path="/financeiro/config" element={renderProtected(<ConfigEmpresa />)} />
              <Route path="/financeiro/recibo" element={renderProtected(<EmissaoRecibo />)} />
              <Route path="/financeiro/viagem" element={renderProtected(<RelatorioViagem />)} />
              <Route path="/financeiro/compras" element={renderProtected(<SolicitacaoCompras />)} />
              <Route path="/cartao/alimentacao" element={renderProtected(<ValeAlimentacao />)} />
              <Route path="/cartao/refeicao" element={renderProtected(<ValeRefeicao />)} />
              <Route path="/cartao/combustivel" element={renderProtected(<ValeCombustivel />)} />
              <Route path="/recados" element={renderProtected(<Recados />)} />
              <Route path="/tarefas" element={renderProtected(<Tarefas />)} />
              <Route path="/minhas-tarefas" element={renderProtected(<MinhasTarefas />)} />
              <Route path="/perfil" element={renderProtected(<Perfil />)} />
              <Route path="/portal-cliente" element={renderProtected(<PortalCliente />)} />
              <Route path="/portal-cliente/dashboard" element={renderProtected(<PortalClienteDashboard />)} />
              <Route path="/portal-cliente/colaborador" element={renderProtected(<PortalClienteColaborador />)} />
              <Route path="/tripulacao" element={renderProtected(<GestaoTripulacao />)} />
              <Route path="/tripulacao/:id" element={renderProtected(<TripulanteDetalhes />)} />
              <Route path="/admin/usuarios" element={renderProtected(<GestaoUsuarios />)} />
              <Route path="/gestao-salarios" element={renderProtected(<GestaoSalarios />)} />
              <Route path="/gestao-funcionarios" element={renderProtected(<GestaoFuncionarios />)} />
              <Route path="/abastecimento" element={renderProtected(<ControleAbastecimento />)} />
              <Route path="/diario-bordo" element={renderProtected(<DiarioBordo />)} />
              <Route path="/aerodromos" element={renderProtected(<Aerodromos />)} />
              <Route path="/aeronaves" element={renderProtected(<Aeronaves />)} />
              <Route path="/diario-bordo/:aircraftId" element={renderProtected(<DiarioBordoDetalhes />)} />
              <Route path="/manutencao/vencimentos" element={renderProtected(<ControleVencimentos />)} />
              <Route path="/manutencao/programacao" element={renderProtected(<ProgramacaoManutencao />)} />
              <Route path="/manutencao/relatorios" element={renderProtected(<RelatoriosTecnicos />)} />
              <Route path="/manutencao/ctm" element={renderProtected(<GestaoCTM />)} />
              <Route path="*" element={renderProtected(<NotFound />)} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
