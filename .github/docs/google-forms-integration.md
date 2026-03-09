# Integração Google Forms → Sistema de Problemas

Esta documentação descreve como configurar o formulário do Google para receber relatos de problemas e sincronizá-los com o banco de dados.

## Visão Geral

Relatores sem acesso à plataforma podem enviar problemas através de um formulário do Google. Os dados são salvos em uma planilha e periodicamente sincronizados com o sistema via API.

## 1. Criar o Formulário no Google Forms

1. Acesse [Google Forms](https://forms.google.com)
2. Crie um novo formulário em branco
3. Adicione as perguntas na **ordem exata** abaixo:

| Ordem | Pergunta | Tipo | Obrigatório |
|-------|----------|------|-------------|
| 1 | Carimbo de data/hora | Data/hora | Sim (automático) |
| 2 | Título do problema | Resposta curta | Sim |
| 3 | Descrição detalhada | Parágrafo | Sim |
| 4 | Categoria | Lista suspensa | Sim |
| 5 | Localização | Lista suspensa ou Resposta curta | Sim |
| 6 | Imagem (opcional) | Carregar arquivo | Não |

### Configurar opções de Categoria e Localização

As opções de **Categoria** e **Localização** devem corresponder **exatamente** aos nomes cadastrados no sistema. Exemplo:

- **Categorias**: Climatização, Elétrica, Hidráulica, etc.
- **Localizações**: Sala 101, Bloco A, Corredor 2, etc.

## 2. Conectar à Planilha do Google Sheets

1. No formulário, clique em **Respostas** → **Conectar ao Google Planilhas**
2. Selecione "Criar nova planilha" ou escolha uma existente
3. A planilha será criada com uma aba (geralmente "Formulário 1")

### Estrutura da Planilha

A planilha terá colunas na seguinte ordem:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Carimbo de data/hora | Título do problema | Descrição detalhada | Categoria | Localização | Imagem (opcional) |

**Sobre a coluna Imagem:** Se você adicionar a pergunta "Carregar arquivo" no formulário, o Google Forms armazena os arquivos no Google Drive e a planilha recebe o **link** do arquivo. O sistema importa esse link e associa a imagem ao problema. Se a linha não tiver imagem, deixe a célula em branco.

## 3. Configurar o Backend

### Variáveis de Ambiente

Adicione ao `.env` as credenciais de uma **Conta de Serviço** do Google:

```
GOOGLE_SHEETS_CLIENT_EMAIL=seu-servico@projeto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Como obter as credenciais

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Vá em **Credenciais** → **Criar credenciais** → **Conta de serviço**
5. Após criar, clique na conta → **Chaves** → **Adicionar chave** → **Criar nova chave** (JSON)
6. No JSON baixado, use `client_email` e `private_key`

### Compartilhar a planilha

A planilha deve ser compartilhada com o e-mail da conta de serviço (`client_email`) com permissão de **Leitor**.

## 4. Sincronizar os Dados

### Endpoint

```
POST /integrations/google-sheet/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "spreadsheetId": "ID_DA_PLANILHA",
  "sheetName": "Formulário 1"
}
```

O `spreadsheetId` está na URL da planilha:
```
https://docs.google.com/spreadsheets/d/ESTE_É_O_ID/edit
```

### Quem pode sincronizar

Apenas usuários com role **MANAGER**, **DIRECTOR** ou **ADMIN**.

### Comportamento

- **Evita duplicatas**: Cada linha é identificada por `spreadsheetId + sheetName + rowIndex`
- **Linhas já importadas** são ignoradas
- **Linhas com título ou descrição vazios** são ignoradas
- **Categoria inexistente** no sistema: linha é ignorada e erro registrado
- **Localização inexistente**: o problema é criado com o nome informado (campo `locationName`)
- **Coluna Imagem (F)**: Se a célula tiver uma URL válida (http/https), um anexo é criado e vinculado ao problema; se estiver vazia ou inválida, o problema é criado normalmente sem imagem

### Agendamento (opcional)

Para sincronização automática, configure um cron job ou serviço externo (ex: GitHub Actions, cron do servidor) para chamar o endpoint periodicamente.

## 5. Fluxo Completo

```
Relator preenche formulário
        ↓
Google Forms salva na planilha
        ↓
Manager/Director/Admin chama POST /integrations/google-sheet/sync
        ↓
Backend busca linhas novas
        ↓
Para cada linha não importada:
  - Valida dados
  - Busca categoria e localização por nome
  - Cria problema (sem reporter)
  - Registra importação (evita duplicata na próxima sync)
  - Se houver URL de imagem na coluna F, cria anexo e vincula ao problema
```
