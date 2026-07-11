# Testes

## Informações

Projeto: FlashCore  
Versão testada: v0.1  
Última atualização do plano: 10/07/2026  
Execução dos testes: Ainda não iniciada

---

## Testes principais

### Inicialização, navegação e persistência

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T01 | Abrir a aplicação pela primeira vez | A aplicação carrega sem erros e apresenta o estado inicial correto | Pendente |
| T02 | Navegar entre as telas principais | A tela escolhida é exibida e a navegação ativa é atualizada | Pendente |
| T03 | Recarregar a página após criar dados | Baralhos, cards e preferências permanecem salvos | Pendente |
| T04 | Carregar dados com campos opcionais ausentes | A aplicação utiliza valores padrão sem falhar | Pendente |
| T05 | Carregar armazenamento inválido | A aplicação informa o problema e evita sobrescrever dados automaticamente | Pendente |

### Baralhos

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T06 | Criar baralho válido | O baralho é salvo e exibido na galeria | Pendente |
| T07 | Criar baralho sem nome | A aplicação bloqueia o salvamento e informa o campo obrigatório | Pendente |
| T08 | Criar baralho com nome duplicado | A aplicação bloqueia a duplicata normalizada | Pendente |
| T09 | Editar informações de um baralho | Os novos dados aparecem em todas as telas relacionadas | Pendente |
| T10 | Excluir baralho vazio | O modal confirma a ação e o baralho é removido | Pendente |
| T11 | Excluir baralho com cards | O modal informa a quantidade afetada e remove os dados somente após confirmação | Pendente |

### Flashcards

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T12 | Criar flashcard válido | O card é salvo no baralho selecionado | Pendente |
| T13 | Salvar card sem frente ou verso | A aplicação bloqueia o salvamento e destaca o erro | Pendente |
| T14 | Editar um flashcard | A lista e o detalhe exibem as novas informações | Pendente |
| T15 | Mover card para outro baralho | O card deixa o baralho antigo e aparece no destino | Pendente |
| T16 | Excluir flashcard | O card é removido somente após confirmação | Pendente |
| T17 | Pesquisar por frente, verso ou tag | Somente os cards correspondentes são exibidos | Pendente |
| T18 | Aplicar filtros de revisão e dificuldade | A listagem respeita o filtro selecionado | Pendente |

### Importação

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T19 | Importar texto estruturado válido | A prévia exibe os registros e a confirmação cria os cards | Pendente |
| T20 | Importar arquivo CSV válido | Colunas são reconhecidas ou mapeadas corretamente | Pendente |
| T21 | Importar registros parcialmente inválidos | Válidos e inválidos são separados sem perda dos válidos | Pendente |
| T22 | Importar para baralho escolhido | Todos os cards válidos são associados ao destino correto | Pendente |
| T23 | Detectar possíveis duplicatas | A prévia identifica duplicatas antes da confirmação | Pendente |
| T24 | Ignorar duplicatas | Apenas os registros não duplicados são salvos | Pendente |
| T25 | Manter duplicatas | Registros duplicados são importados após escolha explícita | Pendente |
| T26 | Cancelar importação antes de confirmar | Nenhum card é salvo | Pendente |

### Revisão

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T27 | Iniciar revisão programada | Somente cards disponíveis pela data entram na sessão | Pendente |
| T28 | Iniciar revisão livre de um baralho | Todos os cards do baralho entram, independentemente da data | Pendente |
| T29 | Revelar resposta | O verso permanece oculto até a ação do usuário | Pendente |
| T30 | Classificar como Errei | O progresso é atualizado e a próxima revisão recebe intervalo curto | Pendente |
| T31 | Classificar como Difícil | O progresso é atualizado com intervalo menor que Bom e Fácil | Pendente |
| T32 | Classificar como Bom | O progresso é atualizado com intervalo intermediário | Pendente |
| T33 | Classificar como Fácil | O progresso é atualizado com o maior intervalo disponível | Pendente |
| T34 | Verificar textos auxiliares dos botões | Cada opção informa claramente o efeito aproximado | Pendente |
| T35 | Concluir sessão | O resultado apresenta totais coerentes com as respostas | Pendente |
| T36 | Encerrar sessão antecipadamente | A aplicação solicita confirmação e registra sessão parcial corretamente | Pendente |
| T37 | Iniciar revisão sem cards disponíveis | A aplicação mostra estado vazio e oferece alternativas úteis | Pendente |

### Opções e dados

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T38 | Alterar para tema claro | O tema é aplicado e salvo | Pendente |
| T39 | Alterar para tema escuro | O tema é aplicado e salvo | Pendente |
| T40 | Usar tema do sistema | A aplicação acompanha a preferência do dispositivo | Pendente |
| T41 | Reabrir a aplicação após alterar o tema | A preferência anterior é restaurada | Pendente |
| T42 | Cancelar exclusão total na primeira confirmação | Nenhum dado é removido | Pendente |
| T43 | Digitar confirmação textual incorreta | A exclusão é cancelada | Pendente |
| T44 | Confirmar corretamente a exclusão total | Dados e preferências são removidos e o estado inicial aparece | Pendente |

### Responsividade e acessibilidade

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| T45 | Usar aplicação em largura de 320 px | Não existe rolagem horizontal indesejada e ações permanecem acessíveis | Pendente |
| T46 | Usar aplicação em celular comum | Navegação, formulários, modais e revisão permanecem legíveis | Pendente |
| T47 | Usar aplicação em tablet | Galerias e painéis se reorganizam sem espaços quebrados | Pendente |
| T48 | Usar aplicação em desktop amplo | O conteúdo aproveita o espaço sem linhas excessivamente longas | Pendente |
| T49 | Navegar pelos controles com teclado | A ordem de foco é lógica e o foco permanece visível | Pendente |
| T50 | Abrir e fechar modal com teclado | O foco entra no modal, Escape cancela e o foco retorna ao acionador | Pendente |
| T51 | Verificar contraste nos dois temas | Textos e controles permanecem legíveis | Pendente |
| T52 | Aumentar zoom do navegador para 200% | Conteúdo continua utilizável sem sobreposição crítica | Pendente |

---

## Cenários de volume

| Código | Teste | Resultado esperado | Status |
|---|---|---|---|
| TV01 | Criar ou importar 100 cards | A interface permanece responsiva e os dados são salvos corretamente | Pendente |
| TV02 | Criar 30 baralhos | Pesquisa e galeria continuam utilizáveis | Pendente |
| TV03 | Importar 500 registros válidos | A aplicação conclui a operação sem travar a interface por tempo excessivo | Pendente |
| TV04 | Pesquisar em uma base com 1.000 cards | O resultado aparece em tempo aceitável | Pendente |

---

## Bugs encontrados

Nenhum bug registrado. A execução da v0.1 ainda não foi iniciada.

Ao encontrar um problema, registrar no formato abaixo:

### Bug BXX - Título

Descrição:  
[Explique o comportamento observado.]

Como reproduzir:
1. [Passo]
2. [Passo]
3. [Passo]

Resultado esperado:  
[Comportamento correto.]

Resultado atual:  
[Comportamento incorreto.]

Ambiente:  
[Navegador, sistema e largura da tela.]

Status:  
[Pendente / Em correção / Corrigido / Não reproduzido]

---

## Observações

- Testar primeiro os fluxos essenciais antes dos detalhes visuais.
- Repetir os testes destrutivos com dados de exemplo, nunca com dados pessoais importantes.
- Executar os testes mobile em navegador responsivo e, quando possível, em aparelho real.
- Antes de fechar uma versão, repetir testes de persistência, importação e exclusão total.
- Atualizar este documento sempre que um requisito novo entrar no escopo.
