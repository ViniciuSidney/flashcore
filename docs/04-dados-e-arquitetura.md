# Dados e Arquitetura

## Princípios da arquitetura

- Aplicação web local-first, sem backend na v0.1.
- Código dividido por domínio e responsabilidade.
- Estado central controlado por funções próprias, evitando alterações espalhadas pelo código.
- Persistência isolada da interface.
- Componentes e estilos reutilizáveis provenientes do Modelo de Projeto.
- Dados versionados para permitir migrações futuras.
- Interface mobile-first e progressivamente aprimorada para telas maiores.

---

## Dados principais

### Entidade: Estado da aplicação

Campos:
- schemaVersion: versão do formato dos dados salvos.
- decks: coleção de baralhos.
- cards: coleção de flashcards.
- reviewSessions: histórico básico das sessões.
- settings: preferências do usuário.
- metadata: informações de criação e última atualização do armazenamento.

---

### Entidade: Baralho

Campos:
- id: identificador único.
- name: nome do baralho.
- description: descrição opcional.
- color: identificação visual baseada nos tokens disponíveis.
- icon: ícone opcional.
- createdAt: data de criação.
- updatedAt: data da última alteração.

Regras:
- O nome é obrigatório.
- Nomes duplicados devem ser bloqueados após normalização de espaços, caixa e acentuação.
- A exclusão deve informar quantos cards serão afetados.

---

### Entidade: Flashcard

Campos:
- id: identificador único.
- deckId: identificador do baralho ao qual pertence.
- front: conteúdo da frente.
- back: conteúdo do verso.
- tags: lista de tags normalizadas.
- initialDifficulty: dificuldade definida na criação ou importação.
- reviewCount: quantidade total de revisões.
- correctStreak: sequência atual de respostas positivas.
- intervalDays: intervalo atual em dias.
- nextReviewAt: data programada para a próxima revisão.
- lastReviewedAt: data da última revisão ou `null`.
- createdAt: data de criação.
- updatedAt: data da última alteração.

Regras:
- Frente e verso são obrigatórios.
- O `deckId` deve corresponder a um baralho existente.
- Tags devem ser armazenadas sem duplicação.
- Cards novos devem ficar disponíveis para revisão inicial.

---

### Entidade: Sessão de revisão

Campos:
- id: identificador único.
- mode: `scheduled` ou `free`.
- deckId: baralho específico ou `null` para sessão geral.
- cardIds: cards incluídos na sessão.
- currentIndex: posição atual durante uma sessão ativa.
- answers: registros das classificações realizadas.
- startedAt: início da sessão.
- completedAt: término ou `null`.
- status: `active`, `completed` ou `abandoned`.

Cada resposta da sessão deve registrar:
- cardId.
- grade: `again`, `hard`, `good` ou `easy`.
- answeredAt.
- previousNextReviewAt.
- nextReviewAt.

---

### Entidade: Preferências

Campos:
- theme: `light`, `dark` ou `system`.
- reviewOrder: ordem padrão dos cards.
- showIntervals: indica se o intervalo aparece nos botões de classificação.
- dailyLimit: limite opcional de cards por sessão programada.
- reducedMotion: preferência para reduzir animações.

---

### Entidade: Resultado de importação

Essa entidade pode existir apenas durante o fluxo, sem persistência obrigatória.

Campos:
- sourceType: `text` ou `csv`.
- targetDeckId: baralho de destino.
- parsedRows: registros interpretados.
- validRows: registros válidos.
- invalidRows: registros inválidos com motivo.
- duplicateRows: possíveis duplicatas.
- duplicatePolicy: `ignore` ou `keep`.

---

## Relações entre dados

- Um baralho possui vários flashcards.
- Um flashcard pertence a exatamente um baralho.
- Uma sessão de revisão possui vários flashcards.
- Um flashcard pode aparecer em várias sessões ao longo do tempo.
- As preferências pertencem à aplicação local como um todo.
- Uma importação adiciona vários flashcards a um baralho escolhido.

---

## Persistência

Chave sugerida:

```text
flashcore.app-data
```

Formato geral:

```json
{
  "schemaVersion": 1,
  "decks": [],
  "cards": [],
  "reviewSessions": [],
  "settings": {},
  "metadata": {
    "createdAt": 0,
    "updatedAt": 0
  }
}
```

Cuidados:
- A leitura deve utilizar valores padrão quando algum campo antigo estiver ausente.
- A aplicação não deve salvar elementos transitórios da interface, como modal aberto ou filtro digitado, salvo se houver motivo claro.
- Toda escrita deve atualizar `metadata.updatedAt`.
- Falhas de leitura devem ser tratadas sem sobrescrever imediatamente o conteúdo corrompido.
- A camada de armazenamento deve ficar preparada para migrações de esquema.

---

## Módulos de responsabilidade

### Core

- Gerenciamento do estado.
- Persistência e migração de dados.
- Navegação interna.
- Inicialização da aplicação.
- Eventos globais.

### Features

- Baralhos.
- Flashcards.
- Importação.
- Revisão.
- Resultados de sessão.
- Configurações.

### Shared

- Modais.
- Toasts e alertas.
- Validações.
- Formatação de datas e textos.
- Normalização e sanitização.
- Utilitários de identificadores.

---

## Estrutura de arquivos prevista

A estrutura definitiva será montada a partir do Modelo de Projeto. Organização esperada:

```text
/
  index.html
  README.md

  /public
    manifest.webmanifest
    favicon.svg

  /src
    /assets
      /icons
      /images

    /scripts
      main.js
      app.js

      /core
        state.js
        storage.js
        migrations.js
        router.js
        events.js

      /features
        /decks
          deck-service.js
          deck-view.js
          deck-controller.js

        /cards
          card-service.js
          card-view.js
          card-controller.js

        /import
          import-parser.js
          import-validator.js
          import-view.js
          import-controller.js

        /review
          review-scheduler.js
          review-session.js
          review-view.js
          review-controller.js

        /settings
          settings-service.js
          settings-view.js

      /shared
        modal.js
        toast.js
        validators.js
        formatters.js
        normalizers.js
        dom.js

    /styles
      /base
        reset.css
        tokens.css
        typography.css
        app-theme.css

      /base-layout
        app-shell.css
        navigation.css

      /components
        buttons.css
        forms.css
        cards.css
        panels.css
        modals.css
        badges.css
        empty-states.css
        feedback.css

      /layouts
        hub-layout.css
        gallery-layout.css
        master-detail-layout.css
        form-layout.css
        wizard-layout.css
        focus-layout.css
        report-layout.css
        settings-layout.css

      /pages
        home.css
        decks.css
        deck-details.css
        import.css
        review.css
        results.css
        settings.css

      /themes
        light.css
        dark.css

      /utilities
        responsive.css
        visibility.css

    /templates
      app-shell.html
      modal.html
      empty-state.html

  /docs
    01-visao-do-projeto.md
    02-requisitos-e-escopo.md
    03-fluxos-e-telas.md
    04-dados-e-arquitetura.md
    05-roadmap.md
    06-testes.md
    07-changelog.md
```

A divisão final pode ser simplificada durante a v0.1 caso algum módulo fique artificialmente pequeno. O objetivo é separar responsabilidades reais, não criar arquivos sem necessidade.

---

## Regras de implementação

- Nenhuma feature deve manipular diretamente o `localStorage` fora da camada de armazenamento.
- Mudanças no estado devem passar por serviços ou controladores da feature correspondente.
- A interface deve renderizar dados já validados e normalizados.
- Conteúdo fornecido pelo usuário deve ser exibido com segurança, evitando inserção direta de HTML não confiável.
- IDs devem ser gerados com `crypto.randomUUID()` quando disponível.
- Datas devem ser armazenadas como timestamps ou ISO 8601 de forma consistente.
- A lógica de revisão deve ficar separada da apresentação dos botões.
- Os intervalos de revisão da v0.1 devem ser simples e documentados, permitindo substituição futura por um algoritmo mais avançado.
