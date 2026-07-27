# Roadmap

## Versão atual

### v0.1.0 — Fundação Essencial

**Status:** Concluída  
**Data de fechamento:** 27/07/2026

A v0.1.0 estabelece a primeira base oficial e utilizável do FlashCore. A versão foi homologada com **22 de 22 testes manuais aprovados**, sem falhas bloqueadoras conhecidas.

### Principais entregas

- organização por baralhos;
- criação, edição, movimentação e exclusão de flashcards;
- pesquisa, filtros e ordenação;
- importação por texto estruturado e CSV;
- validação de registros inválidos e tratamento de duplicatas;
- revisão programada com reagendamento;
- Estudo livre sem alteração do cronograma;
- modo focado com escalas de 100%, 125% e 150%;
- relatório com Índice de recordação;
- temas claro, escuro e do sistema;
- configurações de revisão;
- proteção contra descarte acidental de formulários;
- persistência local versionada;
- interface responsiva e mobile-first.

### Encerramento da versão

- verificações automatizadas de sintaxe e integridade aprovadas;
- homologação HF-01 a HF-22 concluída;
- correções encontradas durante a homologação retestadas e aprovadas;
- documentação, testes e changelog atualizados;
- versão pronta para tag `v0.1.0` e GitHub Release.

---

## Próximas versões

### v0.2 — Revisão e desempenho

**Objetivo:** aprimorar a qualidade da revisão e oferecer informações mais úteis sobre o progresso do usuário.

A definição final do escopo será feita após um período de uso real da v0.1.0.

Funcionalidades planejadas:

- algoritmo de repetição espaçada mais consistente;
- configuração de limite diário;
- ordem de revisão configurável;
- revisão por erros, tags ou dificuldade;
- histórico detalhado das sessões;
- estatísticas por baralho;
- indicadores de retenção e evolução;
- atalhos de teclado para a sessão;
- melhorias de acessibilidade e redução de movimento.

---

### v0.3 — Segurança dos dados e portabilidade

**Objetivo:** dar ao usuário controle completo sobre os próprios dados e preparar a aplicação para uso prolongado.

Funcionalidades planejadas:

- exportação de backup em JSON;
- importação e restauração de backup;
- histórico de backups locais;
- importação por JSON;
- relatório detalhado de conflitos e duplicatas;
- migração de `localStorage` para IndexedDB, se necessária;
- preparação para instalação como PWA.

---

### v0.4 — PWA e experiência offline

**Objetivo:** transformar o FlashCore em uma aplicação instalável e confiável para uso cotidiano.

Funcionalidades planejadas:

- manifesto da aplicação;
- service worker;
- instalação em desktop e celular;
- cache dos arquivos essenciais;
- tela e mensagens de estado offline;
- atualização controlada da aplicação.

---

### v1.0 — Primeira versão estável

**Objetivo:** consolidar o FlashCore como uma aplicação local completa para estudos por flashcards, com organização, revisão, importação, backup e uso móvel confiáveis.

Critérios para fechar a versão:

- fluxos principais estáveis e documentados;
- revisão programada validada em uso real;
- importação e backup testados com diferentes volumes de dados;
- experiência mobile refinada;
- acessibilidade básica revisada;
- PWA instalável e funcional offline;
- migrações de dados testadas sem perda de conteúdo;
- documentação, changelog e testes atualizados;
- ausência de bugs críticos conhecidos.

---

## Ideias futuras

- sincronização opcional entre dispositivos;
- contas de usuário sem abandonar o modo local;
- cards com imagens, áudio e fórmulas;
- modelos reutilizáveis de flashcards;
- baralhos compartilháveis por arquivo ou link;
- campos personalizados por tipo de card;
- modo de escrita da resposta antes de revelar o verso;
- revisão de perguntas discursivas;
- integração futura com a Central de Estudos Web;
- importação de formatos externos, quando tecnicamente viável.
