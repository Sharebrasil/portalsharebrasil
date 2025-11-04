import { useState } from 'react';
import { Expense, Report } from '@/types/reports';

export const useReportCalculations = () => {
  const calculateTotals = (despesas: Expense[]) => {
    const totals = {
      total_combustivel: 0,
      total_hospedagem: 0,
      total_alimentacao: 0,
      total_transporte: 0,
      total_outros: 0,
      total_tripulante: 0,
      total_cliente: 0,
      total_share_brasil: 0,
      valor_total: 0
    };

    despesas.forEach(despesa => {
      const valor = Number(despesa.valor) || 0;
      
      // Totais por categoria
      switch (despesa.categoria) {
        case 'Combustível':
          totals.total_combustivel += valor;
          break;
        case 'Hospedagem':
          totals.total_hospedagem += valor;
          break;
        case 'Alimentação':
          totals.total_alimentacao += valor;
          break;
        case 'Transporte':
          totals.total_transporte += valor;
          break;
        default:
          totals.total_outros += valor;
      }

      // Totais por pagador
      switch (despesa.pago_por) {
        case 'Tripulante':
          totals.total_tripulante += valor;
          break;
        case 'Cliente':
          totals.total_cliente += valor;
          break;
        case 'ShareBrasil':
          totals.total_share_brasil += valor;
          break;
      }
    });

    totals.valor_total = totals.total_tripulante + totals.total_cliente + totals.total_share_brasil;
    return totals;
  };

  const calculateDays = (dataInicio: string, dataFim: string) => {
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 1;
  };

  return {
    calculateTotals,
    calculateDays
  };
};