# Testes

## Informações

**Projeto:** FlashCore  
**Versão testada:** v0.1.0  
**Última atualização:** 27/07/2026  
**Execução dos testes:** Concluída  
**Resultado geral:** Aprovado

---

## Homologação final da v0.1.0

**Data:** 27/07/2026  
**Resultado:** Aprovada

- verificações automatizadas: aprovadas;
- testes manuais HF-01 a HF-22: **22 de 22 aprovados**;
- falhas bloqueadoras conhecidas: nenhuma;
- correções encontradas durante a homologação: retestadas e aprovadas.

### Correções realizadas durante a homologação

| Código | Problema encontrado | Correção | Resultado |
|---|---|---|---|
| HF-15 | Não era possível concluir uma importação formada somente por duplicatas ignoradas | O fluxo passou a permitir a conclusão e registrar os itens como ignorados | Aprovado no reteste |
| HF-19 | O controle de escala sobrepunha elementos em telas abaixo de 621 px | O cabeçalho da sessão foi reorganizado para telas estreitas | Aprovado no reteste |
| HF-21 | A exclusão total falhava por carregar duas instâncias diferentes de `modal.js` | Os imports foram unificados e o cache dos módulos foi atualizado | Aprovado no reteste |

---

## Testes principais

### Inicialização, navegação e persistência

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T01 | Abrir a aplicação pela primeira vez | A aplicação carrega sem erros e apresenta o estado inicial correto | Aprovado |
| T02 | Navegar entre as telas principais | A tela escolhida é exibida e a navegação ativa é atualizada | Aprovado |
| T03 | Recarregar a página após criar dados | Baralhos, cards e preferências permanecem salvos | Aprovado |
| T04 | Carregar dados com campos opcionais ausentes | A aplicação utiliza valores padrão sem falhar | Aprovado |
| T05 | Carregar armazenamento inválido | A aplicação evita sobrescrever dados automaticamente e mantém o fluxo seguro | Aprovado |

### Baralhos

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T06 | Criar baralho válido | O baralho é salvo e exibido na galeria | Aprovado |
| T07 | Criar baralho sem nome | A aplicação bloqueia o salvamento e informa o campo obrigatório | Aprovado |
| T08 | Criar baralho com nome duplicado | A aplicação bloqueia a duplicata normalizada | Aprovado |
| T09 | Editar informações de um baralho | Os novos dados aparecem em todas as telas relacionadas | Aprovado |
| T10 | Excluir baralho vazio | O modal confirma a ação e o baralho é removido | Aprovado |
| T11 | Excluir baralho com cards | O modal informa a quantidade afetada e remove os dados somente após confirmação | Aprovado |

### Flashcards

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T12 | Criar flashcard válido | O card é salvo no baralho selecionado e começa como Novo | Aprovado |
| T13 | Salvar card sem frente ou verso | A aplicação bloqueia o salvamento e destaca o erro | Aprovado |
| T14 | Editar um flashcard | A lista e o detalhe exibem as novas informações sem alterar o agendamento | Aprovado |
| T15 | Mover card para outro baralho | O card deixa o baralho antigo e aparece no destino | Aprovado |
| T16 | Excluir flashcard | O card é removido somente após confirmação | Aprovado |
| T17 | Pesquisar por frente, verso ou tag | Somente os cards correspondentes são exibidos sem perda de foco | Aprovado |
| T18 | Aplicar filtros de revisão e dificuldade | A listagem respeita o filtro selecionado | Aprovado |

### Importação

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T19 | Importar texto estruturado válido | A prévia exibe os registros e a confirmação cria os cards | Aprovado |
| T20 | Importar arquivo CSV válido | As colunas compatíveis são reconhecidas corretamente | Aprovado |
| T21 | Importar registros parcialmente inválidos | Válidos e inválidos são separados sem perda dos válidos | Aprovado |
| T22 | Importar para baralho escolhido | Todos os cards válidos são associados ao destino correto | Aprovado |
| T23 | Detectar possíveis duplicatas | A prévia identifica duplicatas antes da confirmação | Aprovado |
| T24 | Ignorar duplicatas | Os registros duplicados são ignorados e contabilizados corretamente | Aprovado |
| T25 | Manter duplicatas | Registros duplicados são importados após escolha explícita | Aprovado |
| T26 | Cancelar importação antes de confirmar | Nenhum card é salvo e o descarte exige confirmação quando necessário | Aprovado |

### Revisão

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T27 | Iniciar Revisão programada | Somente cards disponíveis pela data entram na sessão | Aprovado |
| T28 | Iniciar Estudo livre de um baralho | Todos os cards do baralho entram, independentemente da data | Aprovado |
| T29 | Revelar resposta | O verso permanece oculto até a ação do usuário | Aprovado |
| T30 | Classificar como Errei | Na Revisão programada, o progresso é atualizado e a próxima revisão recebe intervalo curto | Aprovado |
| T31 | Classificar como Difícil | Na Revisão programada, o intervalo é menor que Bom e Fácil | Aprovado |
| T32 | Classificar como Bom | Na Revisão programada, o intervalo intermediário é aplicado | Aprovado |
| T33 | Classificar como Fácil | Na Revisão programada, o maior intervalo disponível é aplicado | Aprovado |
| T34 | Verificar textos auxiliares dos botões | Os efeitos são exibidos na revisão programada e “sem reagendar” no Estudo livre | Aprovado |
| T35 | Concluir sessão | O relatório apresenta totais e Índice de recordação coerentes | Aprovado |
| T36 | Encerrar sessão antecipadamente | A aplicação solicita confirmação e registra a sessão parcial corretamente | Aprovado |
| T37 | Iniciar revisão sem cards disponíveis | A aplicação mostra estado vazio e oferece alternativas úteis | Aprovado |

### Opções e dados

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T38 | Alterar para tema claro | O tema é aplicado e salvo | Aprovado |
| T39 | Alterar para tema escuro | O tema é aplicado e salvo | Aprovado |
| T40 | Usar tema do sistema | A aplicação acompanha a preferência do dispositivo | Aprovado |
| T41 | Reabrir a aplicação após alterar o tema | A preferência anterior é restaurada | Aprovado |
| T42 | Cancelar exclusão total na primeira confirmação | Nenhum dado é removido | Aprovado |
| T43 | Digitar confirmação textual incorreta | A exclusão não prossegue e a validação informa o valor esperado | Aprovado |
| T44 | Confirmar corretamente a exclusão total | Dados e preferências são removidos e o estado inicial aparece | Aprovado |

### Responsividade e acessibilidade

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T45 | Usar a aplicação em 360 px | Não existe rolagem horizontal indesejada e as ações permanecem acessíveis | Aprovado |
| T46 | Usar a aplicação em celulares de 390 px e 412 px | Navegação, formulários, modais e revisão permanecem legíveis | Aprovado |
| T47 | Usar a aplicação em tablet de 768 px | Galerias e painéis se reorganizam sem espaços quebrados | Aprovado |
| T48 | Usar a aplicação em desktop amplo | O conteúdo aproveita o espaço sem linhas excessivamente longas | Aprovado |
| T49 | Navegar pelos controles com teclado | A ordem de foco é lógica e o foco permanece visível | Aprovado |
| T50 | Abrir e fechar modal com teclado | Escape cancela quando permitido e o modal permanece utilizável | Aprovado |
| T51 | Verificar contraste nos temas | Textos e controles permanecem legíveis | Aprovado |
| T52 | Aumentar o zoom do navegador para 200% | O conteúdo continua utilizável sem sobreposição crítica | Aprovado |

---

## Cenários de volume

Os cenários abaixo permanecem como testes de carga planejados para ciclos futuros. Eles **não fizeram parte da homologação obrigatória da v0.1.0**.

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| TV01 | Criar ou importar 100 cards | A interface permanece responsiva e os dados são salvos corretamente | Não executado |
| TV02 | Criar 30 baralhos | Pesquisa e galeria continuam utilizáveis | Não executado |
| TV03 | Importar 500 registros válidos | A aplicação conclui a operação sem travar a interface por tempo excessivo | Não executado |
| TV04 | Pesquisar em uma base com 1.000 cards | O resultado aparece em tempo aceitável | Não executado |

---

## Bugs encontrados

### B01 — Importação somente com duplicatas ignoradas

**Origem:** HF-15  
**Status:** Corrigido e aprovado no reteste

O botão de conclusão permanecia desativado quando todos os registros eram duplicatas e a política escolhida era ignorá-los.

### B02 — Sobreposição no cabeçalho da revisão

**Origem:** HF-19  
**Status:** Corrigido e aprovado no reteste

O controle de escala sobrepunha o progresso e outras ações em telas abaixo de 621 px.

### B03 — Erro na exclusão total

**Origem:** HF-21  
**Status:** Corrigido e aprovado no reteste

O fluxo carregava uma instância não inicializada de `modal.js`, causando erro ao abrir a confirmação de exclusão.

---

## Conclusão

A v0.1.0 foi aprovada para lançamento. Os fluxos essenciais, a importação, os modos de estudo, a persistência, a exclusão total e a matriz responsiva foram validados sem falhas bloqueadoras pendentes.
