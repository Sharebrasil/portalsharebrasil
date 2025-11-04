export const handleAPIError = (error: any) => {
  const ensureString = (v: any) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch { return String(v); }
  };

  const lower = ensureString(
    (error && (error.message || error.error_description || error.error || error.details))
  ).toLowerCase();

  let friendly = [
    ensureString(error?.message),
    ensureString(error?.details),
    ensureString(error?.hint),
    ensureString(error?.code),
    typeof error?.error === 'string' ? error.error : ensureString(error?.error?.message || error?.error)
  ].filter(Boolean).join(' - ');

  if (!friendly) friendly = ensureString(error) || 'Erro desconhecido.';
  
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('load failed')) {
    return 'Não foi possível contatar o servidor. Verifique sua conexão e tente novamente.';
  }
  
  return `Erro: ${friendly}`;
};