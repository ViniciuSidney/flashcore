# Visão do Projeto

## Nome do projeto

FlashCore

## Ideia principal

O FlashCore é uma aplicação web local-first para criação, organização, importação e revisão de conteúdos por flashcards. O usuário poderá manter diferentes baralhos, cadastrar ou importar cards, revisar conteúdos na data programada ou iniciar uma revisão livre a qualquer momento.

## Problema que resolve

Conteúdos estudados costumam ficar espalhados entre cadernos, arquivos, anotações e diferentes aplicativos. Isso dificulta manter uma rotina de revisão, encontrar rapidamente um assunto e perceber quais cards precisam ser estudados novamente.

O FlashCore concentra os flashcards em um único ambiente, com organização simples e liberdade para adaptar os baralhos à rotina real do estudante.

## Objetivo principal

Permitir que o usuário transforme conteúdos estudados em flashcards organizados e mantenha uma rotina prática de revisão ativa, com controle sobre o que revisar, quando revisar e como classificar o próprio desempenho.

## Público-alvo

- Estudantes do ensino médio, técnico, vestibular e ensino superior.
- Pessoas que utilizam revisão ativa para aprender conceitos, idiomas, fórmulas ou conteúdos profissionais.
- Usuários que preferem uma ferramenta simples, local e personalizável.

## Diferencial da aplicação

- Organização livre por baralhos, tags e filtros.
- Revisão programada e revisão livre por baralho.
- Importação de vários flashcards para um baralho escolhido.
- Dados armazenados localmente, sem exigir conta ou servidor na versão inicial.
- Interface pensada desde o início para uso em celulares.
- Estrutura própria e modular, preparada para evoluir sem perder organização.

## Versão atual

v0.1 - Fundação Essencial

## Observações iniciais

- O protótipo anterior será tratado como prova de conceito e referência de funcionalidades, não como base estrutural definitiva.
- A nova implementação seguirá o Modelo de Projeto já utilizado em outras aplicações pessoais.
- O foco inicial será entregar um fluxo completo e confiável de organização, importação e revisão, antes de adicionar estatísticas avançadas ou sincronização em nuvem.
- A aplicação será local-first e utilizará `localStorage` na v0.1.
- A arquitetura deve permitir migração futura para IndexedDB, PWA e sincronização, sem exigir reescrita completa da interface.
