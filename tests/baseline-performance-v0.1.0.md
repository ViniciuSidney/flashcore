# FlashCore — Baseline de Desempenho da v0.1.0

Data: 27/07/2026  
Branch: dev  
Commit-base: 7c15108  
Navegador: Chrome  
Servidor: Live Server  
Cache durante a medição: desativado

## Procedimento

1. Abrir o FlashCore pelo Live Server.
2. Abrir o DevTools.
3. Acessar a aba Network.
4. Marcar Disable cache.
5. Recarregar a página.
6. Executar o código de medição no Console.
7. Repetir cinco vezes.

## Amostras

| Amostra | DOMContentLoaded | Load | Duração | HTML principal |
|---|---:|---:|---:|---:|
| 1 | 106,3 ms | 106,5 ms | 106,5 ms | 0,29 KB |
| 2 | 94,2 ms | 94,3 ms | 94,3 ms | 0,29 KB |
| 3 | 97,8 ms | 97,9 ms | 97,9 ms | 0,29 KB |
| 4 | 89,0 ms | 89,2 ms | 89,2 ms | 0,29 KB |
| 5 | 92,0 ms | 92,2 ms | 92,2 ms | 0,29 KB |

## Resultado consolidado

- Mediana de DOMContentLoaded: 94,2 ms
- Mediana de Load: 94,3 ms
- Mediana da duração: 94,3 ms
- Mediana da transferência do HTML principal: 0,29 KB
- Menor duração observada: 89,2 ms
- Maior duração observada: 106,5 ms
- Resultado: baseline aprovado

## Observações

A transferência registrada corresponde somente ao documento principal
de navegação. Comparações futuras deverão utilizar o mesmo navegador,
servidor, configuração de cache e código de medição.

A inicialização da v0.2.0 não deverá apresentar regressão superior a
25% em relação à mediana desta base sem justificativa documentada.
