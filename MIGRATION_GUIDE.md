# Guia de Migração: Supabase → Neon Database

Este projeto foi parcialmente migrado de Supabase para Neon Database. Este guia descreve as mudanças feitas e o que ainda precisa ser concluído.

## ✅ Mudanças Implementadas

### 1. Dependências Instaladas
- `@neondatabase/serverless` - Cliente Neon
- `@vercel/blob` - Armazenamento de arquivos
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - Autenticação JWT

### 2. Novos Arquivos Criados

#### `src/lib/neon.ts`
Cliente Neon Database com função `query()` para executar SQL.

#### `src/lib/auth.ts`
Sistema de autenticação customizado com:
- `signUp()` - Registro de usuários
- `signIn()` - Login com JWT
- `verifyToken()` - Validação de tokens
- `getUserById()` - Buscar usuário por ID

#### `src/lib/storage.ts`
Gerenciamento de arquivos com Vercel Blob:
- `uploadFile()` - Upload de arquivos
- `deleteFile()` - Deletar arquivos
- `listFiles()` - Listar arquivos

#### `api/create-user.ts` e `api/list-crew.ts`
Exemplos de Vercel Functions substituindo Edge Functions do Supabase.

### 3. Arquivos Modificados

#### `src/contexts/AuthContext.tsx`
Completamente reescrito para usar autenticação customizada ao invés do Supabase Auth.

#### `src/pages/Login.tsx`
Atualizado para usar o novo método `signIn()` do AuthContext.

#### `.env`
```env
DATABASE_URL='postgresql://neondb_owner:npg_yXYSV7LRKM6Z@ep-blue-pond-ac5snklp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_kLLIMpLrPdjRbZW8_VUZhHsp1Yf2ZtmKsvLIdbyQjQ633SH"
JWT_SECRET="your-secret-key-change-in-production"
```

## ⚠️ Trabalho Restante

### 1. Migração do Banco de Dados

Execute o arquivo `migrate-to-neon.sql` no console do Neon para criar as tabelas.

**IMPORTANTE:** Você precisará:
1. Copiar o conteúdo de cada migration em `supabase/migrations/` em ordem cronológica
2. Remover todas as referências a:
   - `auth.uid()` → substitua pela lógica de ID do usuário customizada
   - `auth.users` → substitua pela tabela `users`
   - Row Level Security (RLS) → Neon não suporta RLS
   - Storage buckets → Migre para Vercel Blob

### 2. Atualizar ~130 Arquivos

Todos os arquivos que usam `supabase` precisam ser atualizados:

#### Padrão de Substituição - Autenticação:
```typescript
// ANTES (Supabase)
import { supabase } from "@/integrations/supabase/client";
const { data, error } = await supabase.auth.signInWithPassword({...});

// DEPOIS (Custom Auth)
import { useAuth } from "@/contexts/AuthContext";
const { signIn } = useAuth();
const { error } = await signIn(email, password);
```

#### Padrão de Substituição - Queries:
```typescript
// ANTES (Supabase)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// DEPOIS (Neon)
import { query } from "@/lib/neon";
const data = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

#### Padrão de Substituição - Storage:
```typescript
// ANTES (Supabase)
const { data, error } = await supabase.storage
  .from('bucket')
  .upload('path', file);

// DEPOIS (Vercel Blob)
import { uploadFile } from "@/lib/storage";
const url = await uploadFile(file, 'path');
```

### 3. Arquivos que Precisam de Atualização

Execute este comando para listar todos os arquivos que usam Supabase:
```bash
grep -r "supabase" src/ --include="*.tsx" --include="*.ts" -l
```

Principais arquivos para atualizar:
- `src/pages/*.tsx` (59 arquivos)
- `src/components/**/*.tsx` (57 arquivos)
- `src/services/*.ts` (4 arquivos)
- `src/hooks/*.ts` (4 arquivos)

### 4. Edge Functions → Vercel Functions

Migrar as 8 Edge Functions restantes:
- `delete-user.ts`
- `update-user.ts`
- `list-crew-members.ts`
- `list-user-roles.ts`
- `generate-travel-pdf.ts`
- `notify-vacation-request.ts`

Copie o padrão de `api/create-user.ts` e `api/list-crew.ts`.

### 5. Remover Código Supabase

Após migrar tudo, remover:
```bash
rm -rf supabase/
rm src/integrations/supabase/client.ts
rm src/integrations/supabase/types.ts
npm uninstall @supabase/supabase-js
```

## 🔐 Segurança

1. **Altere o JWT_SECRET** no `.env` para uma chave forte e segura
2. **Não exponha credenciais** do banco no código client-side
3. **Valide sempre** os tokens JWT nas Vercel Functions
4. **Use HTTPS** em produção

## 📝 Notas Importantes

- **RLS não está disponível** no Neon. Toda validação de permissões deve ser feita na camada da aplicação.
- **Realtime não está disponível**. Remova hooks que usam `supabase.channel()` ou `supabase.from().on()`.
- **Storage foi substituído** pelo Vercel Blob. URLs de arquivos mudaram.
- **Auth.users não existe mais**. Use a tabela `users` customizada.

## 🚀 Deploy

Para deploy no Vercel:

1. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `JWT_SECRET`

2. As Vercel Functions em `api/` serão automaticamente detectadas

3. O frontend será servido como SPA estático

## ❓ Problemas Comuns

### "Cannot read property 'auth' of undefined"
Significa que há código ainda usando `supabase`. Use o grep para encontrar e atualizar.

### "Invalid JWT token"
Verifique se o `JWT_SECRET` é o mesmo no servidor e cliente.

### "Database connection failed"
Verifique se o `DATABASE_URL` no `.env` está correto e o IP foi permitido no Neon.

## 📚 Recursos

- [Neon Documentation](https://neon.tech/docs)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
