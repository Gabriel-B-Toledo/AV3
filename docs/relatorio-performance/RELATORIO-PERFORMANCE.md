# Relatório de Qualidade - Aerocode

## Como as medições foram feitas

Em vez de estimar, instrumentamos a própria aplicação e medimos requisições reais.

No servidor, um middleware dedicado ([`metrics.ts`](../../api/src/middleware/metrics.ts))
cronometra cada requisição com `process.hrtime.bigint()` e devolve o tempo de
processamento no cabeçalho `Server-Timing` de toda resposta.

Do lado do cliente, um pequeno gerador de carga ([`run.ts`](../../api/bench/run.ts)) faz o
papel do usuário: autentica-se via JWT e dispara chamadas reais ao endpoint
`/api/aeronaves`. Para cada chamada ele mede o tempo de resposta com `performance.now()`
— do envio até o corpo chegar por inteiro — e lê o tempo de processamento no cabeçalho. A
**latência** é o que sobra: tempo de resposta menos tempo de processamento.

Cada gráfico mostra os três cenários de carga lado a lado — **1, 5 e 10 usuários
simultâneos** —, usando a média das medições de cada cenário. Assim dá para enxergar de
relance como cada métrica se comporta à medida que a concorrência aumenta.

## Os gráficos

### Latência

![Latência por número de usuários](latencia.png)

Mostra o custo de rede em cada cenário. Como cresce pouco entre 1 e 10 usuários, o
transporte não é o gargalo do sistema. (Veja a ressalva mais abaixo: nos testes, cliente e
servidor estavam na mesma máquina, então esse valor é naturalmente baixo.)

### Tempo de processamento

![Tempo de processamento por número de usuários](processamento.png)

Mostra quanto o servidor realmente trabalha por requisição. É a parte sob nosso controle —
código, consultas ao banco — e o que mais influencia a experiência. O crescimento suave com
mais usuários indica que a aplicação tem folga para a carga esperada.

### Tempo de resposta

![Tempo de resposta por número de usuários](resposta.png)

É a soma das duas métricas anteriores e o número mais próximo do que o usuário sente. Por
acompanhar de perto o tempo de processamento, confirma que, havendo um gargalo, ele estará
no trabalho do servidor e não na rede.

Nestes testes, cliente e servidor rodaram na mesma máquina, então os dados quase não
trafegam pela rede e a latência medida é mínima — é o melhor cenário possível, não o mais
realista. Para reproduzir uma condição próxima à de produção, basta apontar o cliente para
uma API hospedada em outro host antes de regenerar os gráficos:

```bash
BENCH_BASE_URL=http://<host-da-api>:4000 npm run bench
```

## Como atualizar os gráficos

Com a API no ar e o banco já populado (`npm run seed`):

```bash
cd api
npm run bench
```

O comando refaz as medições e regenera os três gráficos (`latencia.png`,
`processamento.png` e `resposta.png`) nesta pasta, prontos para análise. O número de
usuários, de requisições e o endpoint podem ser ajustados por variáveis de ambiente
(`BENCH_LEVELS`, `BENCH_REQUESTS`, `BENCH_WARMUP`, `BENCH_ENDPOINT`, `BENCH_BASE_URL`).
