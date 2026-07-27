# FlashCore

Aplicação web local-first para criação, organização, importação e revisão de conteúdos por flashcards.

## Versão

**v0.1.0 — Fundação Essencial**

Status: **lançada e homologada** em 27/07/2026, com 22 de 22 testes manuais aprovados.

## Acesso

- Aplicação publicada: [viniciusidney.github.io/flashcore](https://viniciusidney.github.io/flashcore/)

## Funcionalidades

- tela inicial com resumo e ações rápidas;
- CRUD completo de baralhos e flashcards;
- pesquisa, filtros, ordenação e movimentação de cards;
- importação por texto estruturado e CSV;
- prévia detalhada, validação de registros e tratamento de duplicatas;
- Revisão programada com atualização do cronograma;
- Estudo livre sem alteração de datas, intervalos ou progresso programado;
- classificação por Errei, Difícil, Bom e Fácil;
- modo focado com escalas de 100%, 125% e 150%;
- relatório com Índice de recordação;
- reforço de cards classificados como Errei ou Difícil;
- temas claro, escuro e do sistema;
- configurações de revisão;
- proteção contra descarte acidental de formulários;
- persistência local versionada com `localStorage`;
- modais próprios, toasts e confirmação dupla para exclusão total;
- interface responsiva e mobile-first.

## Tecnologias

- HTML5
- CSS3
- JavaScript ES Modules
- `localStorage`

## Como executar localmente

Por usar módulos JavaScript, o projeto deve ser aberto por um servidor local.

No VS Code, a extensão **Live Server** é suficiente.

Outra opção:

```bash
python -m http.server 5500
```

Depois, acesse:

```text
http://localhost:5500
```

## Estrutura

```text
flashcore/
├── docs/
├── public/
├── src/
│   ├── scripts/
│   │   ├── core/
│   │   ├── features/
│   │   └── shared/
│   └── styles/
│       ├── base/
│       ├── base-layout/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── themes/
│       └── utilities/
├── tests/
└── index.html
```

## Dados e privacidade

Os dados ficam salvos somente no navegador, sob a chave:

```text
flashcore.app.v0.1
```

A v0.1.0 não possui backend, login ou sincronização em nuvem. Apagar os dados do navegador pode remover os baralhos e flashcards salvos.

## Documentação

A pasta `docs/` contém:

- visão do produto;
- requisitos e escopo;
- fluxos e telas;
- arquitetura e estrutura dos dados;
- roadmap;
- plano e resultados de testes;
- changelog;
- referências de layouts.

## Homologação

A versão foi encerrada após:

- verificações automatizadas de sintaxe e integridade;
- homologação manual HF-01 a HF-22;
- validação de importação, revisão, persistência e exclusão total;
- testes responsivos em celulares, tablet, paisagem e desktop;
- teste com zoom do navegador em 200%;
- correção e reteste das falhas encontradas.

## Limitações da v0.1.0

- dados restritos ao navegador atual;
- ausência de backup e restauração;
- ausência de sincronização entre dispositivos;
- algoritmo de repetição espaçada simplificado;
- sem instalação PWA e suporte offline completo.

## Próximo ciclo

A v0.2 será planejada após um período de uso real da v0.1.0 e registro das necessidades encontradas no cotidiano.
