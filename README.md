<p align="center">
  <img src="assets/brand/recivo-wordmark.webp" alt="Recivo" width="320" />
</p>

Caderno de receitas pessoal para Windows. Guarda receitas **doces** e **salgadas** só no seu PC, em arquivos simples que você pode abrir, copiar e fazer backup. Sem conta, sem nuvem, sem internet.

## O que faz

- Receitas separadas em **Salgadas** e **Doces**, com um seletor central (Salgadas · Todas · Doces) que mostra a contagem de cada lado.
- Nome, foto, tempo de preparo, rendimento, ingredientes, modo de preparo e anotações/dicas.
- Favoritar, buscar por nome **ou ingrediente** (ignora acentos) e filtrar só favoritas.
- Leitura pensada para a cozinha: texto grande, ingredientes ao lado do passo a passo.
- Segue o tema claro/escuro do Windows. Atalhos: `Ctrl+N` nova receita, `Ctrl+F` ou `/` buscar.
- Editar protege contra perda: `Esc` com alterações pergunta antes de descartar.

## Onde ficam as receitas

```
Documentos\Recivo\
├── salgada\   uma receita por arquivo .json
├── doce\
├── fotos\     fotos reduzidas (JPEG)
└── lixeira\   receitas e fotos excluídas (o app nunca apaga de verdade)
```

A pasta onde o arquivo está define o tipo da receita: mover um `.json` de `salgada\` para `doce\` troca a categoria. Nomes de arquivo usam só minúsculas, números e hífens (ex.: `bolo-de-cenoura-3f2a.json`); arquivos ilegíveis são ignorados e avisados na tela. Para usar outra pasta, defina a variável de ambiente `RECIVO_DATA_DIR`.

## Rodando

Requer [Node.js](https://nodejs.org) 22+.

```bash
npm install
npm run dev      # modo desenvolvimento (Vite + Electron, recarrega ao salvar)
npm start        # build de produção + abre o app
```

## Instalar no Windows

```bash
npm run dist     # gera release\Recivo Setup 0.1.0.exe (~107 MB)
```

1. Dê dois cliques em `Recivo Setup 0.1.0.exe`. A instalação é de um clique, só para o seu usuário (sem pedir administrador) em `%LOCALAPPDATA%\Programs\Recivo`, cria atalhos na Área de Trabalho e no Menu Iniciar e abre o app.
2. O instalador não é assinado digitalmente, então o Windows pode mostrar "O Windows protegeu seu PC": clique em **Mais informações → Executar assim mesmo**.
3. Para desinstalar: Configurações → Aplicativos. Suas receitas em `Documentos\Recivo` **não** são apagadas.

Para testar o app empacotado sem instalar: `release\win-unpacked\Recivo.exe`.

## Testes

```bash
npm test            # armazenamento (node:test)
npm run test:e2e    # abre o app Electron real com uma pasta temporária e testa o fluxo completo
```

O teste e2e salva capturas de tela em `.e2e/` (claro, escuro e janela estreita).

## Estrutura

| Caminho | Função |
| --- | --- |
| `electron/store.cjs` | Leitura/escrita das receitas, validação, lixeira, fotos |
| `electron/main.cjs` · `preload.cjs` | Janela, protocolo `recivo://`, ponte IPC (sandbox + `contextIsolation`) |
| `src/` | Interface React + TypeScript |
| `PRODUCT.md` · `DESIGN.md` | Contexto de produto e sistema visual |
| `assets/brand/` | Logo oficial (ícone e wordmark) |

## Ideias para depois

Assinatura do instalador, atualização automática, backup/sincronização, lista de compras, conversão de medidas, importar de outros apps.
