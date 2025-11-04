export interface Expense {
  categoria: string;
  descricao: string;
  valor: number | string;
  pago_por: string;
  comprovante_url?: string;
}

export interface Report {
  numero: string;
  cliente: string;
  aeronave: string;
  tripulante: string;
  tripulante2?: string;
  destino: string;
  data_inicio: string;
  data_fim?: string;
  despesas: Expense[];
  total_combustivel: number;
  total_hospedagem: number;
  total_alimentacao: number;
  total_transporte: number;
  total_outros: number;
  total_tripulante: number;
  total_cliente: number;
  total_share_brasil: number;
  valor_total: number;
  observacoes?: string;
  status: 'draft' | 'finalized';
  createdAt: string;
  updatedAt: string;
  db_id?: number;
}