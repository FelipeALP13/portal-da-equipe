# 5. Chamados

[← Índice](README.md)

## Para que serve

**Chamados** são pedidos de um time para outro (ex.: o Suporte pede ajuda ao Desenvolvimento) e pedidos que chegam dos clientes pelo Jira ou pelo atendimento automático. Cada chamado tem um código (ex.: **CH-3**), cai na **fila do time** escolhido e tem prazos de resposta e de solução.

## A tela de Chamados

Abra **Chamados** no menu. No topo há quatro contadores: **Abertos** (aguardando alguém assumir), **Em atendimento**, **Aguardando** (esperando retorno) e **Fora do prazo**. Clique num contador para filtrar.

Você escolhe:

- **Quais chamados**: **Fila do meu time**, **Abertos por mim**, **Atribuídos a mim** ou todos.
- **Situação**: **Em aberto**, **Encerrados** ou **Todos**.
- **Como mostrar**: **Lista** ou **Quadro** (colunas por status; arraste para mudar o status). No quadro, a coluna de resolvidos mostra os últimos 7 dias.
- **Busca** por título, código ou cliente, e filtro por time.

O cartão **Chamados** no topo mostra o que espera por você: atribuídos a você ou sem dono na fila do seu time.

### Status

**Aberto** → **Em atendimento** → **Resolvido**. No meio do caminho pode ficar **Aguardando** (esperando retorno). Chamados desistidos ficam **Cancelado**.

### Tipos e urgência

- Tipos: **Bug**, **Dúvida**, **Melhoria**, **Acesso** e **Outro**.
- Urgência: **Crítica**, **Alta**, **Normal** e **Baixa**.

### Prazos (SLA)

Os prazos contam em horas corridas, a partir da abertura:

| Urgência | Primeira resposta | Solução |
| --- | --- | --- |
| Crítica | 2 horas | 8 horas |
| Alta | 8 horas | 2 dias |
| Normal | 24 horas | 5 dias |
| Baixa | 72 horas | 10 dias |

Cada chamado mostra quanto tempo falta ("Resolver em...") ou há quanto tempo atrasou. O Portal avisa quando um chamado sai do prazo.

## Abrir um chamado

1. Clique em **Abrir chamado** (ou **+ Criar → Abrir chamado**).
2. Em **O que você precisa?**, descreva em uma frase (ex.: "Cliente não consegue emitir nota fiscal").
3. Antes de enviar, olhe o quadro **Antes de abrir, veja se isso já resolve**: o Portal sugere artigos da base de conhecimento e chamados parecidos já resolvidos.
4. Escolha **Para qual time?**, o **Tipo**, a **Urgência** e o **Cliente afetado** (ex.: "Padaria Exemplo").
5. Em **Detalhes**, coloque o passo a passo, a mensagem de erro, prints ou links.
6. Envie. O chamado cai na fila do time escolhido, sem responsável, e todos do time são avisados.

## Atender um chamado (time responsável)

1. Abra o chamado na fila do seu time.
2. Clique em **Assumir**. Você vira o responsável e o chamado passa para **Em atendimento**.
3. Converse em **Atividade**. Cada comentário pode ser:
   - **Nota interna**: só a equipe vê;
   - **Enviado ao cliente**: em chamados que vieram do Jira, use **Enviar ao cliente no Jira** para responder lá.
4. Use **Respostas prontas** para inserir textos usados com frequência.
5. Se precisar de trabalho maior, clique em **Criar demanda**: a demanda nasce ligada ao chamado.
6. Quando terminar, clique em **Resolver**.
7. Se a solução pode servir de novo, clique em **Salvar solução na base**: o Portal abre um artigo novo já preenchido.

O painel lateral mostra também **Status**, **Responsável**, **Time responsável**, **Primeira resposta** e as **Etapas do chamado**.

## Quem abriu o chamado

- Acompanha o andamento e conversa pela **Atividade**.
- Pode **Cancelar chamado** enquanto ele está em aberto.
- Se o problema voltar, pode **Reabrir** um chamado resolvido.
- Depois de resolvido, pode dar uma nota de 1 a 5 ao atendimento.

## Avaliação do cliente

Em um chamado resolvido, o cartão **Avaliação do cliente** gera um **Link de avaliação**. Quem atendeu copia o link e manda ao cliente. O cliente abre sem login, escolhe uma nota de 1 a 5 (**Como foi o atendimento?**) e pode deixar um comentário. A nota entra na média do time e de quem atendeu, no [Painel da liderança](13-painel-da-lideranca.md).

## Respostas prontas

São textos usados com frequência, com campos que se preenchem sozinhos, como `{solicitante}` e `{cliente}`. Exemplo:

> Olá {solicitante}, tudo bem? Pode mandar um print da mensagem de erro que aparece para a {cliente}?

Para criar: no menu **⋯** da tela de Chamados, abra **Respostas prontas** → **Nova resposta**. Dê um **Nome**, escolha **Quem usa** (todos ou um time) e escreva o **Texto**. No chamado, clique em **Respostas prontas** acima do comentário para inserir.

## Assistente de chamados (IA)

Se o administrador ligou o assistente, o chamado mostra o botão **Assistente**. Ele resume chamados longos e sugere uma resposta a partir do chamado, da base de conhecimento e de chamados parecidos. A sugestão pode errar: revise antes de clicar em **Usar no comentário**. Use **Fazer de novo** para outra sugestão ou **Descartar**.

## Chamados do Jira

Administradores podem ligar contas do Jira (menu **⋯ → Contas do Jira**). Os chamados abertos nos projetos marcados aparecem sozinhos na fila do Suporte, com o cliente certo. O Portal busca novos chamados a cada 2 minutos enquanto alguém da equipe está com ele aberto. Chamados que vieram do Jira mostram o botão **Abrir no Jira**. Veja [Administração](17-administracao.md#jira).

## Exportar

**Exportar Excel** (menu **⋯**) baixa os chamados que estão na tela, com os filtros aplicados.

## Quem pode

| Ação | Administrador | Membro do time responsável | Outro membro | Somente leitura |
| --- | --- | --- | --- | --- |
| Ver chamados | Sim | Sim | Sim | Sim |
| Abrir chamado | Sim | Sim | Sim | Não |
| Assumir, mudar status, resolver, criar demanda | Sim | Sim | Não | Não |
| Cancelar ou reabrir | Sim | Se foi quem abriu | Se foi quem abriu | Não |
| Avaliar o atendimento | Não | Se foi quem abriu | Se foi quem abriu | Não |
| Gerar o link de avaliação para o cliente | Quem atende | Quem atende | Não | Não |
| Criar respostas prontas | Para todos ou qualquer time | Para todos ou os seus times | Para todos ou os seus times | Não |
| Configurar o Jira | Sim | Não | Não | Não |
| Excluir chamados | Sim | Não | Não | Não |
