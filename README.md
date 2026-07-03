# EventFlow 2.0 Firebase

Versão modernizada do EventFlow mantendo o foco em **eventos, criação de eventos, venda de ingressos, painel do organizador e validação de entrada**.

## O que mudou na 2.0

- Frontend reorganizado e responsivo, mantendo a identidade azul/roxa do EventFlow.
- Firebase Auth para login e cadastro.
- Firestore como banco principal, usando as coleções `Usuario`, `Evento`, `Lote` e `Ingresso`.
- Backend em `api/` para compra e validação de ingressos usando `firebase-admin`.
- Compra com transação no Firestore para evitar vender ingresso esgotado.
- Geração de PDF com QR Code no backend.
- Envio de e-mail opcional via Gmail SMTP quando as variáveis estiverem configuradas.
- Servidor local `server.js` para testar frontend e APIs sem depender do Vercel CLI.

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Variáveis de ambiente do backend

Crie um arquivo `.env` local ou configure no Vercel:

```env
FRONTEND_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}
GMAIL_EMAIL=seuemail@gmail.com
GMAIL_SENHA=sua_senha_de_app
```

Também é aceito:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=conteudo_do_json_em_base64
```

`GMAIL_EMAIL` e `GMAIL_SENHA` são opcionais. Sem eles, a compra continua funcionando, mas o ingresso não é enviado por e-mail.

## Coleções usadas no Firestore

### Usuario
```js
{
  nome, email, telefone, cpf, dataNascimento,
  tipo: "usuario",
  criadoEm
}
```

### Evento
```js
{
  titulo, descricao, categoria, local, cidade, endereco, cep,
  imagemBanner, dataInicio, status,
  organizadorID, criadoEm, atualizadoEm
}
```

### Lote
```js
{
  eventoID, organizadorID, nome, preco,
  quantidade, quantidadeInicial,
  dataInicioVenda, dataFimVenda, criadoEm
}
```

### Ingresso
```js
{
  eventoID, loteID, usuarioID,
  status: "ativo" | "usado" | "cancelado",
  nomeEvento, nomeLote, preco,
  qrCodeData, emailEnviado,
  dataCompra, validadoEm
}
```

## Páginas principais

- `/index.html` - landing page
- `/login.html` - login
- `/cadastro.html` - cadastro
- `/home/home.html` - vitrine de eventos
- `/home/evento.html?id=ID_DO_EVENTO` - detalhes e compra
- `/home/criarEvento.html` - criar evento
- `/home/meusEventos.html` - eventos criados pelo usuário
- `/home/meusIngressos.html` - ingressos comprados
- `/organizador/painelOrganizador.html` - painel e validação

## Deploy

```bash
vercel --prod
```

No Vercel, configure as variáveis de ambiente acima.
