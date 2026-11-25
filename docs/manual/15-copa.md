# 15. Copa: estoque e compras

[← Índice](README.md)

## Para que serve

Controlar o que tem na copa (café, açúcar, biscoito, leite, chá...), saber o que comprar antes de acabar e receber os pedidos da equipe. No menu, abra **Estoque**: ele tem **Itens e saldos**, **Pedidos da equipe**, **Planejamento**, **Relatórios** e **Histórico**.

## Como o estoque funciona

Cada item tem duas quantidades:

- **Fechado**: unidades guardadas, ainda lacradas;
- **Aberto**: o que está em uso.

E quatro movimentações:

| Movimentação | O que faz | Exemplo |
| --- | --- | --- |
| **Compra** | Adiciona unidades fechadas | Chegaram 4 pacotes de café |
| **Abertura** | Passa unidades de fechado para aberto | Abri 1 pacote de café |
| **Consumo** | Baixa o que estava aberto | O pacote aberto acabou |
| **Ajuste** | Corrige o saldo pela contagem física | Contei e há 3 pacotes, não 4 |

Com as aberturas e consumos registrados, o Portal calcula quanto tempo cada item dura e prevê quando vai acabar.

## Itens e saldos

### Registrar uma movimentação

1. Em **Itens e saldos**, use os botões do topo **Registrar compra**, **Abrir item**, **Lançar consumo** ou **Conferir saldo**, ou os botões da linha do item.
2. Escolha o **Item** e as quantidades (**Quantidade fechada** e **Quantidade aberta**, conforme o caso).
3. Deixe a data vazia para registrar agora, ou preencha se a movimentação aconteceu antes.
4. Se quiser, escreva uma observação (ex.: "compra mensal", "contagem feita pela manhã").
5. Salve.

### Cadastrar um item

1. Clique em **Novo item**.
2. Preencha o **Nome do item** (ex.: "Café em pó"), a **Categoria**, a **Unidade de controle** (pacote, caixa, unidade...) e o **Estoque mínimo** (abaixo dele, o item entra na lista de compras).
3. Escolha a aparência (ícone, emoji ou foto) e salve.

Com o estoque vazio, **Usar lista inicial** cadastra café, açúcar, biscoito, leite e chá para começar.

Busque por item ou categoria e filtre (ex.: só os que estão baixos). Em cada item: **Editar item**, **Excluir item** e as **Movimentações** dele.

### Lista de compras

O quadro **Lista de compras** mostra o que comprar, pelo estoque mínimo e pelo ritmo de consumo de cada item: o que acabou, está no mínimo ou acaba nos próximos 7 dias. Os que acabam em 8 a 14 dias ficam em **De olho**.

- **WhatsApp**: abre o WhatsApp com a lista pronta para enviar.
- **Excel**: baixa a lista.
- **Ver no estoque**: filtra os itens baixos.

## Fazer compras (no mercado)

1. Clique em **Fazer compras**. A lista de compras abre no celular.
2. No mercado, marque o que já foi para o carrinho e ajuste as quantidades com **+** e **−**.
3. Comprou algo fora da lista? Use **Comprar outro item…**.
4. No fim, registre tudo de uma vez. As compras entram no estoque.

A ida fica salva **neste aparelho** até você registrar: dá para fechar e voltar depois. **Descartar ida** apaga a lista marcada.

## Pedidos da equipe

### Pedir um item

1. Em **Pedidos da equipe** (ou **+ Criar → Pedido da copa**), escreva **O que você quer pedir** (ex.: "adoçante", "chá de camomila").
2. Se quiser, coloque um detalhe: marca, sabor, quantidade.
3. Clique em **Pedir**.

Quem concordar clica em **Apoiar este pedido**. Quem cuida das compras vê primeiro os pedidos mais apoiados. Você pode **Tirar meu apoio** ou **Tirar o pedido** que fez.

### Decidir os pedidos (quem cadastra itens)

1. Clique em **Aprovar** ou **Recusar**.
2. Ao aprovar, escolha **Como entra no estoque**: **Já existe no estoque** (escolha o item) ou **Cadastrar como item novo** (nome, categoria, unidade e estoque mínimo; começa com saldo zero e já entra na lista de compras).

Os pedidos decididos ficam em **Decididos recentemente**.

### Aviso de estoque baixo

Quando um item chega ao mínimo, quem cuida das compras recebe aviso no sino. Na tela de pedidos, dá para **Publicar o aviso de estoque baixo também no chat**, num canal escolhido (a mensagem entra no assunto "Estoque da Copa").

## Planejamento

**Duração e previsão por item**: duração média de cada item, sugestão de compra para 30 dias, cobertura do saldo atual e quantos ciclos entraram no cálculo. A média usa os últimos oito ciclos completos e melhora conforme a equipe registra os consumos. Em **Comprar para**, escolha para quantos dias a lista deve cobrir. Itens novos aparecem como **Em medição** ou **Sem histórico** até completar um ciclo.

## Relatórios

Escolha o **Período** e veja: registros no período, compras, aberturas e consumos, **Quem mais registrou**, **Registros por mês** e **Movimentação por item** (consumido, comprado e aberto, com o consumo mês a mês).

## Histórico

Todas as compras, aberturas, consumos e ajustes, com quem registrou e quando.

## Quem pode

O administrador escolhe, para cada pessoa, o que ela faz no estoque (veja [Permissões individuais](17-administracao.md#permissões-individuais)). O padrão de cada perfil é:

| Ação | Administrador | Membro (padrão) | Somente leitura (padrão) |
| --- | --- | --- | --- |
| Ver itens e saldos | Sim | Sim | Sim |
| Registrar compras e usar "Fazer compras" | Sim | Sim | Não |
| Abrir produtos (abertura) | Sim | Sim | Não |
| Lançar consumo | Sim | Sim | Não |
| Ajustar saldo (conferir saldo) | Sim | Não | Não |
| Cadastrar, editar e excluir itens | Sim | Não | Não |
| Decidir pedidos da equipe e configurar avisos | Sim | Não | Não |
| Fazer e apoiar pedidos | Sim | Sim | Não |
| Ver planejamento | Sim | Sim | Sim |
| Ver relatórios e histórico | Sim | Sim | Sim |
