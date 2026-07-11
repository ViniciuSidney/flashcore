# Roadmap

## Versão atual

### v0.1 - Fundação Essencial

Status: Planejada

Objetivo:
Construir uma base organizada, responsiva e realmente utilizável para criação, importação, organização e revisão de flashcards, seguindo o Modelo de Projeto.

Funcionalidades:
- Estrutura modular do projeto.
- Shell responsivo e navegação principal.
- Tela inicial com resumo e ações rápidas.
- Criação, edição e exclusão de baralhos.
- Criação, visualização, edição, movimentação e exclusão de flashcards.
- Pesquisa e filtros.
- Importação por texto estruturado e CSV para um baralho escolhido.
- Prévia, validação e tratamento básico de duplicatas.
- Revisão programada.
- Revisão livre por baralho.
- Classificação por Errei, Difícil, Bom e Fácil.
- Resultado básico da sessão.
- Tema claro, escuro e preferência do sistema.
- Modais próprios e mensagens de retorno.
- Persistência em `localStorage`.
- Responsividade mobile-first.
- Documentação e plano de testes atualizados.

Critérios para fechar a versão:
- Todos os fluxos essenciais devem funcionar sem erros bloqueadores.
- Os dados devem permanecer íntegros após recarregar a página.
- A importação deve rejeitar registros inválidos sem corromper os válidos.
- A revisão programada e a revisão livre devem produzir filas corretas.
- A interface deve funcionar em larguras pequenas sem rolagem horizontal indesejada.
- Todas as ações destrutivas devem possuir confirmação adequada.
- O checklist de testes da v0.1 deve estar concluído.

---

## Próximas versões

### v0.2 - Revisão e desempenho

Objetivo:
Aprimorar a qualidade da revisão e oferecer informações mais úteis sobre o progresso do usuário.

Funcionalidades planejadas:
- Algoritmo de repetição espaçada mais consistente.
- Configuração de limite diário.
- Ordem de revisão configurável.
- Revisão por erros, tags ou dificuldade.
- Histórico detalhado das sessões.
- Estatísticas por baralho.
- Indicadores de retenção e evolução.
- Atalhos de teclado para a sessão.
- Melhorias de acessibilidade e redução de movimento.

---

### v0.3 - Segurança dos dados e portabilidade

Objetivo:
Dar ao usuário controle completo sobre os próprios dados e preparar a aplicação para uso prolongado.

Funcionalidades planejadas:
- Exportação de backup em JSON.
- Importação e restauração de backup.
- Histórico de backups locais.
- Importação por JSON.
- Relatório detalhado de conflitos e duplicatas.
- Migração de `localStorage` para IndexedDB, se necessária.
- Preparação para instalação como PWA.

---

### v0.4 - PWA e experiência offline

Objetivo:
Transformar o FlashCore em uma aplicação instalável e confiável para uso cotidiano.

Funcionalidades planejadas:
- Manifesto da aplicação.
- Service worker.
- Instalação em desktop e celular.
- Cache dos arquivos essenciais.
- Tela e mensagens de estado offline.
- Atualização controlada da aplicação.

---

### v1.0 - Primeira versão estável

Objetivo:
Consolidar o FlashCore como uma aplicação local completa para estudos por flashcards, com organização, revisão, importação, backup e uso móvel confiáveis.

Critérios para fechar a versão:
- Fluxos principais estáveis e documentados.
- Revisão programada validada em uso real.
- Importação e backup testados com diferentes volumes de dados.
- Experiência mobile refinada.
- Acessibilidade básica revisada.
- PWA instalável e funcional offline.
- Migrações de dados testadas sem perda de conteúdo.
- Documentação, changelog e testes atualizados.
- Ausência de bugs críticos conhecidos.

---

## Ideias futuras

- Sincronização opcional entre dispositivos.
- Contas de usuário sem abandonar o modo local.
- Cards com imagens, áudio e fórmulas.
- Modelos reutilizáveis de flashcards.
- Baralhos compartilháveis por arquivo ou link.
- Campos personalizados por tipo de card.
- Modo de escrita da resposta antes de revelar o verso.
- Revisão de perguntas discursivas.
- Integração futura com a Central de Estudos Web.
- Importação de formatos externos, quando tecnicamente viável.
