import { Report } from '@/types/reports';

export const validateReport = (report: Report) => {
  const errors: string[] = [];
  
  if (!report.cliente) errors.push('Cliente');
  if (!report.aeronave) errors.push('Aeronave');
  if (!report.tripulante) errors.push('Tripulante');
  if (!report.destino) errors.push('Trecho');
  if (!report.data_inicio) errors.push('Data Início');
  
  return errors;
};

export const formatDateBR = (value?: string) => {
  if (!value) return '';
  const s = String(value).split('T')[0];
  const parts = s.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  try { 
    return new Date(value).toLocaleDateString('pt-BR'); 
  } catch { 
    return String(value); 
  }
};

export const parseLocalDate = (value: string) => {
  const s = String(value).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toInputDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toFolderSafe = (s: string) => (s || 'sem_cliente')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_]/g, '_');