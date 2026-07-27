# Changelog

Todas as mudanças importantes deste projeto serão registradas aqui.

O projeto utiliza versões semânticas adaptadas ao estágio de desenvolvimento:

- `v0.x` para versões em construção e validação;
- `v1.0` para a primeira versão considerada estável.

---

## [0.1.0] - 2026-07-27

### Adicionado

- estrutura modular baseada no Modelo de Projeto;
- shell responsivo com barra lateral no desktop e navegação inferior no celular;
- tela inicial com resumo, revisões pendentes, baralhos recentes e ações rápidas;
- criação, edição e exclusão de baralhos;
- criação, edição, movimentação e exclusão de flashcards;
- galeria de baralhos com pesquisa e ordenação;
- tela mestre-detalhe para os flashcards de cada baralho;
- pesquisa e filtros por situação de revisão;
- importação por texto estruturado e arquivo CSV;
- prévia detalhada com linha, frente, verso, tags, status e motivo de erro;
- detecção e tratamento de duplicatas na importação;
- Revisão programada com atualização do cronograma;
- Estudo livre por baralho sem alteração de datas, intervalos ou progresso programado;
- classificação por Errei, Difícil, Bom e Fácil;
- modo focado durante as sessões;
- controle de escala da sessão em 100%, 125% e 150%;
- relatório com Índice de recordação;
- reforço de cards classificados como Errei ou Difícil;
- temas claro, escuro e do sistema;
- preferências de limite da sessão e exibição de intervalos;
- persistência local versionada com `localStorage`;
- migração básica dos dados do protótipo anterior armazenados em `flashcore.v1.1`;
- modais próprios, toasts e estados vazios orientativos;
- proteção contra descarte acidental de alterações não salvas;
- confirmação dupla para apagar todos os dados;
- documentação de visão, requisitos, fluxos, arquitetura, roadmap e testes.

### Alterado

- o protótipo anterior passou a ser tratado como prova de conceito;
- a aplicação foi reconstruída seguindo a organização do Modelo de Projeto;
- a identidade visual passou a usar uma paleta azulada alinhada às demais aplicações pessoais;
- “Revisão livre” foi renomeada para **Estudo livre**;
- o Estudo livre passou a preservar integralmente o cronograma;
- a sessão de estudo passou a ocultar a navegação e o cabeçalho global;
- o relatório passou a usar o termo **Índice de recordação**;
- pesquisas passaram a preservar foco e posição do cursor;
- ações secundárias e destrutivas foram agrupadas em menus de contexto;
- cards novos passaram a iniciar automaticamente como `Novo`;
- o formulário deixou de permitir a escolha manual da dificuldade inicial;
- a criação rápida passou a priorizar o baralho contextual;
- a importação foi consolidada em quatro etapas: Destino, Conteúdo, Revisão e Resultado;
- formulários extensos passaram a ocupar melhor a tela em dispositivos móveis;
- o resumo final da importação passou a usar cards mais largos e responsivos.

### Corrigido

- carregamento de arquivos antigos causado por cache e Service Worker de outro projeto no ambiente local;
- aparência inconsistente dos selects e do campo de arquivo;
- extrapolação horizontal de flashcards importados com textos longos;
- perda de foco durante pesquisas;
- espaçamento interno do aviso de Estudo livre;
- rolagem externa indevida durante sessões com escala ampliada;
- sobreposição dos controles da revisão em telas abaixo de 621 px;
- impossibilidade de concluir importações formadas somente por duplicatas ignoradas;
- erro ao abrir a confirmação de exclusão total por carregamento duplicado de `modal.js`.

### Removido

- campo de dificuldade inicial do formulário de flashcards;
- alteração do cronograma durante o Estudo livre.

### Homologação

- concluída homologação final com **22 de 22 testes manuais aprovados**;
- verificações automatizadas de sintaxe e integridade aprovadas;
- correções encontradas em HF-15, HF-19 e HF-21 retestadas e aprovadas;
- responsividade validada em celulares, tablet, paisagem, desktop e zoom do navegador em 200%;
- escalas de revisão de 100%, 125% e 150% validadas;
- nenhuma falha bloqueadora conhecida no fechamento da versão.

### Limitações conhecidas

- os dados ficam armazenados somente no navegador atual;
- não há login, backend ou sincronização entre dispositivos;
- não existe exportação de backup nesta versão;
- o algoritmo de repetição espaçada ainda é simplificado;
- a instalação como PWA e o funcionamento offline completo ficam para versões futuras.
