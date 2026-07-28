# FlashCore — Checklist-base de Regressão da v0.1.0

Data: 27/07/2026  
Branch: dev  
Commit-base: 7c15108  
Resultado geral: Aprovado

## Preparação

- [x] Utilizar dados descartáveis.
- [x] Confirmar ausência de erros no console ao abrir.
- [x] Confirmar que a aplicação abre em `#home`.
- [x] Confirmar que os dados permanecem após recarregar.

## Baralhos e cards

- [x] Criar, editar, abrir e excluir um baralho.
- [x] Criar, editar, mover e excluir um card.
- [x] Pesquisar cards por texto.
- [x] Filtrar cards por tag ou dificuldade.
- [x] Confirmar proteção contra alterações não salvas.

## Importação

- [x] Importar cards por texto estruturado.
- [x] Importar CSV separado por vírgula.
- [x] Importar CSV separado por ponto e vírgula.
- [x] Ignorar duplicatas quando configurado.
- [x] Manter duplicatas quando configurado.
- [x] Identificar linhas inválidas sem quebrar a importação.

## Revisão

- [x] Iniciar revisão programada.
- [x] Avaliar cards com as quatro opções.
- [x] Concluir sessão e abrir relatório.
- [x] Repetir cards errados ou difíceis.
- [x] Executar Estudo livre sem alterar a agenda dos cards.
- [x] Confirmar saída protegida durante uma sessão.

## Configurações e dados

- [x] Alternar entre tema do sistema, claro e escuro.
- [x] Alterar limite de revisão.
- [x] Alternar exibição dos intervalos.
- [x] Alterar escala da sessão.
- [x] Executar exclusão total com confirmação dupla.
- [x] Confirmar que dados antigos não reaparecem após recarregar.

## Responsividade

- [x] Testar em 360 × 800.
- [x] Testar em 768 × 1024.
- [x] Testar em 1366 × 768.
- [x] Confirmar ausência de rolagem horizontal global.
- [x] Confirmar modais e botões sem cortes.
- [x] Confirmar funcionamento por teclado nos fluxos principais.

## Encerramento

- [x] Executar `npm test`.
- [x] Confirmar árvore Git sem alterações inesperadas.
- [x] Registrar falhas encontradas.
- [x] Retestar todas as correções.

## Resultado

- Testes automatizados aprovados: 12/12
- Testes reprovados: 0
- Testes bloqueados: 0
- Observações: smoke test funcional, persistência e responsividade aprovados; baseline da v0.1.0 preservado.
- Decisão: Gate A aprovado