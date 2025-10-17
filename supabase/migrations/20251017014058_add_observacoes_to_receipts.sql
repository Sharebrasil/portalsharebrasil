/*
  # Adicionar coluna observações na tabela receipts

  1. Alterações
    - Adiciona coluna `observacoes` (text, nullable) na tabela `receipts` para armazenar observações opcionais do recibo
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE receipts ADD COLUMN observacoes text;
  END IF;
END $$;
