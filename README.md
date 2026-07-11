# FlashCore

Aplicação web local-first para criação, organização, importação e revisão de conteúdos por flashcards.

## Versão

`v0.1 - Fundação Essencial`

## Funcionalidades

- Tela inicial com resumo e ações rápidas.
- CRUD de baralhos e flashcards.
- Pesquisa, filtros e movimentação de cards.
- Importação por texto estruturado e CSV.
- Prévia, validação e tratamento de duplicatas.
- Revisão programada e revisão livre por baralho.
- Classificação por Errei, Difícil, Bom e Fácil.
- Relatório básico ao final da sessão.
- Tema claro, escuro e preferência do sistema.
- Persistência local versionada com `localStorage`.
- Modais próprios e confirmação dupla para apagar os dados.
- Interface responsiva com foco em dispositivos móveis.

## Tecnologias

- HTML5
- CSS3
- JavaScript ES Modules
- localStorage

## Como executar

Por usar módulos JavaScript, abra o projeto por um servidor local. No VS Code, a extensão **Live Server** é suficiente.

Outra opção:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

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

## Dados

Os dados ficam salvos no navegador sob a chave `flashcore.app.v0.1`. Não há sincronização em nuvem nesta versão.

## Observação

Os layouts desta versão são uma primeira implementação funcional baseada nos modelos visuais do projeto. Eles foram preparados para serem refinados durante o desenvolvimento.
