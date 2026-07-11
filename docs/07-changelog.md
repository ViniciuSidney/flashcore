# Changelog

Todas as mudanças importantes deste projeto serão registradas aqui.

O projeto utiliza versões semânticas adaptadas ao estágio de desenvolvimento:
- `v0.x` para versões em construção e validação.
- `v1.0` para a primeira versão considerada estável.

---

## [Não lançado]

### Planejado

- Refinamentos visuais após os primeiros testes de uso.
- Ajustes de acessibilidade e responsividade encontrados durante a validação manual.
- Evolução do algoritmo de revisão em versões futuras.

---

## [0.1.0] - 10/07/2026

### Adicionado

- Estrutura modular baseada no Modelo de Projeto.
- Shell responsivo com barra lateral no desktop e navegação inferior no celular.
- Tela inicial com resumo, revisões pendentes, baralhos recentes e ações rápidas.
- Criação, edição e exclusão de baralhos.
- Criação, edição, movimentação e exclusão de flashcards.
- Galeria de baralhos com busca e ordenação.
- Tela mestre-detalhe para os flashcards de cada baralho.
- Pesquisa e filtros por situação de revisão.
- Importação por texto estruturado e arquivo CSV.
- Prévia, validação e detecção básica de duplicatas na importação.
- Revisão programada e revisão livre por baralho.
- Botões de avaliação com Errei, Difícil, Bom e Fácil.
- Intervalos aproximados exibidos durante a revisão.
- Relatório básico ao final da sessão.
- Temas claro, escuro e preferência do sistema.
- Preferências de limite da sessão e exibição dos intervalos.
- Persistência local versionada com `localStorage`.
- Migração básica dos dados do protótipo anterior armazenados em `flashcore.v1.1`.
- Modais próprios, toasts e estados vazios orientativos.
- Confirmação dupla para apagar todos os dados.
- Documentação de visão, requisitos, fluxos, arquitetura, roadmap e testes.

### Alterado

- O protótipo anterior passou a ser tratado como prova de conceito.
- A aplicação foi reconstruída seguindo a organização do Modelo de Projeto.
- A identidade visual passou a usar uma paleta azulada e componentes próximos das demais aplicações pessoais.

### Observações

- Os layouts da v0.1 são funcionais, porém provisórios, e devem ser refinados após os testes reais de uso.
- O plano de testes ainda precisa ser executado antes do fechamento oficial da versão.
