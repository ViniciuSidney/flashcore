# Layouts utilizados na v0.1

Os layouts desta versão foram adaptados provisoriamente a partir dos modelos visuais do projeto. A estrutura interna já está preparada para refinamentos sem exigir reorganização completa do código.

## Mapeamento

| Área | Layout de referência | Aplicação na v0.1 |
|---|---|---|
| Estrutura geral | L02 - Shell Modular | Barra lateral no desktop, cabeçalho e navegação inferior no celular |
| Início | L01 - Hub Inicial | Destaque da revisão, indicadores, atalhos e baralhos recentes |
| Baralhos | L09 - Galeria de Cards | Busca, ordenação e cards de baralho com ações |
| Conteúdo do baralho | L06 - Mestre-Detalhe | Lista de flashcards e painel de visualização contextual |
| Criação e edição | L04 e L22B | Formulários dentro de modal próprio |
| Importação | L05 - Wizard | Processo em quatro etapas com apoio lateral |
| Revisão | L13 - Focus Mode | Card central, progresso e ações de dificuldade |
| Resultado | L20 - Report | Resumo, indicadores e distribuição das respostas |
| Opções | L19 - Settings | Categorias laterais e painel de configuração atual |
| Confirmações | L22A/L22C | Modais de confirmação, aviso e ações destrutivas |
| Ausência de dados | L25 - Empty State | Estados vazios com explicação e ação principal |

## Diretrizes para os próximos refinamentos

- Manter o conteúdo central como prioridade visual.
- Evitar painéis excessivamente comprimidos no celular.
- Preferir uma coluna no mobile e múltiplas colunas apenas quando houver espaço real.
- Conservar os mesmos componentes, tokens e padrões de ação entre as telas.
- Ajustar proporções e densidade com base no uso real, sem alterar a arquitetura por impulso.
