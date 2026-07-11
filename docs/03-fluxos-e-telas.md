# Fluxos e Telas

## Estrutura geral de navegação

A aplicação utilizará o layout **L02 - Shell Modular** como estrutura principal.

### Desktop e tablet amplo

- Barra lateral ou cabeçalho persistente.
- Área principal de conteúdo.
- Ações globais acessíveis sem competir com o conteúdo.

### Celular

- Cabeçalho compacto.
- Conteúdo em uma única coluna.
- Navegação inferior ou menu compacto.
- Formulários e fluxos extensos poderão ocupar a tela inteira.

Durante a sessão de revisão, a navegação principal será reduzida para manter o foco.

---

## Telas principais

### Tela 1 - Início

Layout base: **L01 - Hub Inicial**, com indicadores compactos inspirados no L03.

Objetivo:
Apresentar a situação atual das revisões e oferecer acesso rápido às ações mais importantes.

Elementos:
- Saudação ou título da aplicação.
- Quantidade de cards para revisar hoje.
- Botão “Iniciar revisão”.
- Resumo de baralhos e cards.
- Último baralho revisado.
- Ações rápidas para criar baralho, criar card e importar cards.

Ações do usuário:
- Iniciar revisão programada.
- Abrir um baralho.
- Criar baralho ou flashcard.
- Abrir o fluxo de importação.

Estados importantes:
- Estado vazio: orientação para criar o primeiro baralho.
- Estado sem revisões: mensagem de que não há cards programados, com opção de revisão livre.
- Estado com revisões: destaque da quantidade disponível.
- Estado de erro: aviso de falha ao carregar ou interpretar os dados locais.

---

### Tela 2 - Baralhos

Layout base: **L09 - Galeria de Cards**.

Objetivo:
Exibir e organizar todos os baralhos cadastrados.

Elementos:
- Campo de pesquisa.
- Botão “Novo baralho”.
- Galeria de baralhos.
- Nome, descrição, identificação visual e contadores de cada baralho.
- Ações para abrir, revisar livremente, editar e excluir.

Ações do usuário:
- Criar um baralho.
- Abrir o conteúdo de um baralho.
- Iniciar revisão livre.
- Editar ou excluir o baralho.

Estados importantes:
- Estado vazio: explicação e botão para criar o primeiro baralho.
- Estado sem resultados: mensagem para ajustar a pesquisa.
- Estado com dados: galeria responsiva.
- Estado de erro: mensagem sem remover os dados já carregados da interface.

---

### Tela 3 - Conteúdo do baralho

Layout base: **L06 - Mestre-Detalhe** no desktop e fluxo em telas sucessivas no mobile.

Objetivo:
Permitir visualizar, pesquisar e administrar os flashcards de um baralho.

Elementos:
- Cabeçalho do baralho.
- Pesquisa e filtros.
- Lista de flashcards.
- Painel de detalhes do card selecionado.
- Botões para criar, importar, revisar, editar, mover e excluir.

Ações do usuário:
- Selecionar e visualizar um card.
- Criar ou editar card.
- Mover card para outro baralho.
- Excluir card.
- Iniciar revisão programada ou livre do baralho.
- Abrir importação com o baralho já selecionado.

Estados importantes:
- Estado vazio: orientação para criar ou importar cards.
- Estado sem resultados: mensagem de filtro sem correspondência.
- Estado com dados: lista e detalhe sincronizados.
- Estado de erro: aviso sem perder filtros ou seleção atual.

---

### Tela 4 - Criar ou editar flashcard

Layout base: **L04 - Formulário Guiado**.

Objetivo:
Cadastrar ou alterar as informações de um flashcard.

Elementos:
- Seleção de baralho.
- Campo de frente.
- Campo de verso.
- Campo de tags.
- Dificuldade inicial.
- Botões de salvar e cancelar.

Ações do usuário:
- Preencher ou alterar campos.
- Salvar o card.
- Cancelar a operação.

Estados importantes:
- Estado inicial: formulário limpo ou preenchido com o card existente.
- Estado inválido: campos obrigatórios destacados com mensagem específica.
- Estado salvo: retorno visual e atualização da lista.
- Estado de saída com alterações: confirmação antes de descartar.

No mobile, o formulário poderá ocupar a tela inteira para evitar campos comprimidos.

---

### Tela 5 - Importar flashcards

Layout base: **L05 - Wizard**.

Objetivo:
Importar vários flashcards com segurança para um baralho escolhido.

Etapas:
1. Escolher o baralho de destino.
2. Selecionar texto estruturado ou arquivo CSV.
3. Informar ou confirmar o mapeamento de frente, verso e tags.
4. Validar e visualizar os registros encontrados.
5. Definir o tratamento de duplicatas.
6. Confirmar e visualizar o resultado.

Elementos:
- Indicador de etapas.
- Seletor de baralho.
- Área para colar texto ou selecionar arquivo.
- Prévia em lista ou tabela adaptável.
- Contadores de válidos, duplicados e inválidos.
- Botões voltar, avançar, cancelar e importar.

Ações do usuário:
- Selecionar origem e destino.
- Corrigir dados antes da importação.
- Ignorar ou aceitar duplicatas.
- Confirmar a importação.

Estados importantes:
- Estado sem dados: orientação e exemplo de formato.
- Estado válido: prévia pronta para confirmação.
- Estado parcialmente válido: registros problemáticos destacados.
- Estado de erro: explicação do formato ou arquivo rejeitado.
- Estado concluído: resumo da importação.

---

### Tela 6 - Sessão de revisão

Layout base: **L13 - Focus Mode**.

Objetivo:
Conduzir uma sessão de revisão sem distrações.

Elementos:
- Progresso da sessão.
- Nome do baralho e indicação do modo programado ou livre.
- Frente do card.
- Botão “Mostrar resposta”.
- Verso do card.
- Botões Errei, Difícil, Bom e Fácil.
- Intervalo aproximado associado a cada opção.
- Ação para encerrar a sessão.

Ações do usuário:
- Revelar a resposta.
- Classificar o desempenho.
- Avançar automaticamente para o próximo card.
- Encerrar a sessão antecipadamente.

Estados importantes:
- Estado de pergunta: apenas a frente e o botão de revelar.
- Estado de resposta: verso e opções de classificação.
- Estado final: redirecionamento para o resumo da sessão.
- Estado sem cards: mensagem e opções para voltar ou iniciar revisão livre.

No mobile, os quatro botões de dificuldade serão exibidos em grade 2 × 2 ou em coluna, conforme a largura disponível.

---

### Tela 7 - Resultado da sessão

Layout base: **L20 - Report**.

Objetivo:
Apresentar um fechamento claro da revisão concluída.

Elementos:
- Total de cards revisados.
- Quantidade de Errei, Difícil, Bom e Fácil.
- Duração da sessão.
- Percentual simples de desempenho.
- Botões para voltar ao início, abrir o baralho ou rever erros.

Ações do usuário:
- Encerrar o fluxo.
- Revisar novamente os cards errados.
- Retornar ao baralho estudado.

Estados importantes:
- Estado concluído: relatório completo.
- Estado encerrado antecipadamente: indicação de sessão parcial.
- Estado sem respostas: retorno simples sem estatísticas enganosas.

---

### Tela 8 - Opções

Layout base: **L19 - Settings**.

Objetivo:
Centralizar preferências da aplicação e ações sobre os dados locais.

Categorias:
- Aparência.
- Revisão.
- Dados.
- Sobre.

Elementos:
- Tema claro, escuro ou sistema.
- Preferências básicas da sessão.
- Informações de armazenamento.
- Botão para apagar todos os dados.
- Versão da aplicação.

Ações do usuário:
- Alterar preferências.
- Restaurar configurações.
- Excluir todos os dados com confirmação dupla.

Estados importantes:
- Estado padrão: preferências atuais carregadas.
- Estado salvo: retorno visual imediato.
- Estado de ação crítica: modal de confirmação.

---

## Componentes e estados reutilizáveis

### Modais

Layout base: **L22 - Modal de Ação**.

Usos:
- Confirmação de exclusão.
- Criação e edição rápida de baralho.
- Movimentação de card.
- Confirmação de saída da revisão.
- Confirmação dupla para apagar todos os dados.

### Estados vazios

Layout base: **L25 - Empty State**.

Usos:
- Nenhum baralho.
- Nenhum card no baralho.
- Nenhum resultado de pesquisa.
- Nenhuma revisão disponível.
- Importação sem registros válidos.

---

## Fluxos principais

### Fluxo 1 - Criar o primeiro baralho e flashcard

1. O usuário acessa a tela Início sem dados cadastrados.
2. Seleciona “Criar primeiro baralho”.
3. Informa nome, descrição opcional e identificação visual.
4. A aplicação salva o baralho e abre seu conteúdo.
5. O usuário seleciona “Novo flashcard”.
6. Preenche frente, verso, tags e dificuldade inicial.
7. A aplicação valida, salva e exibe o card na lista.

### Fluxo 2 - Importar flashcards

1. O usuário abre um baralho ou seleciona “Importar cards”.
2. Escolhe o baralho de destino.
3. Cola texto estruturado ou seleciona um CSV.
4. A aplicação interpreta os registros e apresenta a prévia.
5. O usuário revisa inválidos e define o tratamento das duplicatas.
6. Confirma a importação.
7. A aplicação salva os cards e mostra o resumo do resultado.

### Fluxo 3 - Revisão programada

1. O usuário acessa Início ou Revisão.
2. A aplicação apresenta os cards cuja data chegou.
3. O usuário inicia a sessão.
4. Para cada card, revela a resposta e classifica o desempenho.
5. A aplicação atualiza o progresso e a próxima revisão.
6. Ao terminar, apresenta o resultado da sessão.

### Fluxo 4 - Revisão livre por baralho

1. O usuário acessa Baralhos ou o conteúdo de um baralho.
2. Seleciona “Revisar livremente”.
3. A aplicação inclui todos os cards do baralho, independentemente da data.
4. O usuário realiza a sessão normalmente.
5. A aplicação registra as respostas e exibe o resumo final.

### Fluxo 5 - Excluir dados

1. O usuário solicita a exclusão de um card, baralho ou todos os dados.
2. A aplicação abre um modal próprio explicando o impacto.
3. Para exclusão total, solicita uma segunda confirmação textual.
4. O usuário confirma ou cancela.
5. A aplicação atualiza o armazenamento e informa o resultado.
