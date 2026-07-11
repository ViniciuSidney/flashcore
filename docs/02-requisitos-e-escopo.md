# Requisitos e Escopo

## Requisitos funcionais

### Navegação e visão geral

- RF01 - A aplicação deve possuir uma navegação principal entre Início, Baralhos, Revisão e Opções.
- RF02 - A tela inicial deve apresentar um resumo dos baralhos, cards e revisões disponíveis.
- RF03 - A aplicação deve permitir iniciar rapidamente uma revisão programada a partir da tela inicial.

### Baralhos

- RF04 - O usuário deve poder criar baralhos.
- RF05 - O usuário deve poder editar nome, descrição e identificação visual de um baralho.
- RF06 - O usuário deve poder excluir um baralho mediante confirmação.
- RF07 - Ao excluir um baralho com cards, a aplicação deve informar claramente o impacto da ação antes da confirmação.
- RF08 - A aplicação deve exibir a quantidade total de cards e a quantidade disponível para revisão em cada baralho.

### Flashcards

- RF09 - O usuário deve poder criar flashcards com frente, verso, tags e baralho de destino.
- RF10 - O usuário deve poder visualizar os cards de um baralho.
- RF11 - O usuário deve poder editar um flashcard existente.
- RF12 - O usuário deve poder mover um flashcard para outro baralho.
- RF13 - O usuário deve poder excluir um flashcard mediante confirmação.
- RF14 - O usuário deve poder pesquisar cards por frente, verso, tag ou baralho.
- RF15 - O usuário deve poder filtrar cards por situação de revisão e dificuldade.

### Importação

- RF16 - O usuário deve poder importar vários flashcards para um baralho escolhido.
- RF17 - A importação deve aceitar, inicialmente, texto estruturado e arquivo CSV.
- RF18 - A aplicação deve apresentar uma prévia antes de concluir a importação.
- RF19 - A aplicação deve identificar registros inválidos e possíveis duplicatas.
- RF20 - O usuário deve poder escolher se deseja ignorar ou manter duplicatas detectadas.
- RF21 - Ao finalizar, a aplicação deve informar quantos cards foram importados, ignorados ou rejeitados.

### Revisão

- RF22 - A aplicação deve permitir revisar somente os cards cuja data de revisão tenha chegado.
- RF23 - A aplicação deve permitir iniciar uma revisão livre com todos os cards de um baralho, independentemente da data programada.
- RF24 - Durante a sessão, a aplicação deve exibir primeiro a frente do card e revelar o verso somente após uma ação do usuário.
- RF25 - Após revelar a resposta, o usuário deve poder classificar o resultado como Errei, Difícil, Bom ou Fácil.
- RF26 - Cada opção de dificuldade deve informar o efeito aproximado sobre a próxima revisão.
- RF27 - A aplicação deve atualizar o progresso e a próxima data de revisão do card após a classificação.
- RF28 - A sessão deve mostrar o progresso atual e permitir encerramento antecipado mediante confirmação.
- RF29 - Ao concluir uma sessão, a aplicação deve exibir um resumo básico dos resultados.

### Preferências e dados

- RF30 - O usuário deve poder alternar entre tema claro, escuro e preferência do sistema.
- RF31 - A escolha de tema deve permanecer salva entre acessos.
- RF32 - A aplicação deve salvar automaticamente os dados localmente.
- RF33 - O usuário deve poder excluir todos os dados mediante confirmação dupla.
- RF34 - A aplicação deve utilizar modais próprios em vez de diálogos nativos do navegador.

## Requisitos não funcionais

- RNF01 - A aplicação deve adotar abordagem mobile-first e funcionar adequadamente em celulares, tablets e computadores.
- RNF02 - A interface deve ser simples, clara e consistente com o Design System do Modelo de Projeto.
- RNF03 - Os dados devem ser salvos localmente e permanecer disponíveis após recarregar ou fechar a página.
- RNF04 - A aplicação deve carregar rapidamente e evitar dependências desnecessárias.
- RNF05 - O código deve ser dividido por responsabilidades, evitando arquivos excessivamente grandes e duplicações.
- RNF06 - A aplicação deve validar entradas antes de salvar ou importar dados.
- RNF07 - A interface deve oferecer estados de carregamento, vazio, sucesso, aviso e erro quando aplicável.
- RNF08 - Elementos interativos devem possuir foco visível e suporte básico à navegação por teclado.
- RNF09 - Textos, botões e campos devem manter contraste e tamanho adequados nos temas claro e escuro.
- RNF10 - A aplicação deve funcionar nas versões atuais dos principais navegadores baseados em Chromium e Firefox.
- RNF11 - Alterações futuras no formato dos dados devem ser controladas por uma versão de esquema.
- RNF12 - A exclusão de dados importantes nunca deve acontecer com apenas um clique acidental.

## Escopo da versão atual

### Entra nesta versão

- Estrutura completa baseada no Modelo de Projeto.
- Shell responsivo com navegação principal.
- Tela inicial com resumo e ações rápidas.
- CRUD de baralhos.
- CRUD, pesquisa, filtro e movimentação de flashcards.
- Importação por texto estruturado e CSV para o baralho escolhido.
- Prévia e validação básica da importação.
- Revisão programada.
- Revisão livre por baralho.
- Avaliação por Errei, Difícil, Bom e Fácil.
- Resumo básico ao final da sessão.
- Tema claro, escuro e preferência do sistema.
- Persistência em `localStorage`.
- Modais próprios e confirmação dupla para apagar todos os dados.
- Responsividade mobile-first.
- Estados vazios e mensagens de retorno.

### Fica para versões futuras

- Algoritmo avançado de repetição espaçada.
- Estatísticas históricas detalhadas e gráficos.
- Exportação e restauração de backup completo.
- Importação por JSON e formatos de terceiros.
- Revisão por tags, dificuldade ou lista personalizada.
- IndexedDB para volumes maiores de dados.
- PWA com instalação e funcionamento offline completo.
- Sincronização entre dispositivos.
- Suporte a imagens, áudio, fórmulas e conteúdo rico nos cards.
- Atalhos de teclado avançados.

### Fora do escopo

- Contas de usuário e autenticação na versão inicial.
- Servidor próprio ou banco de dados remoto.
- Colaboração simultânea entre usuários.
- Compatibilidade direta com arquivos `.apkg` do Anki.
- Geração automática de cards por inteligência artificial.
- Recursos sociais, ranking ou competição entre usuários.
- Monetização, anúncios ou marketplace de baralhos.
