# 11. Pessoas e times

[← Índice](README.md)

Abra **Pessoas** no menu. A tela tem as abas **Pessoas**, **Times**, **Férias e ausências**, **Integração** e **Equipamentos**.

## Pessoas (diretório)

### Para que serve

O diretório da empresa: nome, cargo, contato, times, aniversário, tempo de casa e quem está disponível hoje.

### Como usar

- Busque por nome, cargo ou e-mail e filtre por time.
- Clique numa pessoa para abrir o **perfil** (painel lateral): **Disponível hoje** ou ausente, e-mail, **Ligar**, times, contato, aniversário, data de entrada, férias e ausências marcadas, **elogios** recebidos e a atividade do último ano (mapa de calor com demandas concluídas, chamados resolvidos e horas lançadas).

### Como uma pessoa entra no diretório

Toda pessoa cadastrada em **Usuários** (só administradores) já aparece aqui (veja [Administração](17-administracao.md#cadastrar-um-usuário)). Depois, inclua-a num time na aba **Times**.

### Editar o seu perfil no diretório

1. Na sua linha (marcada "(você)"), clique em **Editar**.
2. Preencha **Cargo** (ex.: "Analista de Suporte"), **Telefone ou ramal**, **Aniversário** (dia e mês, sem o ano) e **Na empresa desde**.
3. Salve. Cargo e contato aparecem no diretório para toda a empresa. A equipe recebe aviso no sino no dia do seu aniversário e quando você completa mais um ano de casa.

Para definir quem lidera um time, edite o time na aba **Times**.

## Times

Cada time tem nome, descrição, cor, integrantes e um ou mais **líderes**. O líder tem poderes extras (aprovar ausências, publicar no mural para o time, metas do time, 1:1, receber bloqueios da daily).

**Criar ou editar um time (administradores):**

1. Na aba **Times**, clique em **Novo time** (ou **Editar time**).
2. Preencha **Nome do time** (ex.: "Suporte"), **Descrição** e **Cor**.
3. Marque os integrantes e quem é **Líder**.
4. Salve. Para apagar um time, use **Excluir**. Um time que ainda tem itens no estoque da Copa não pode ser excluído: exclua antes os itens do estoque dele.

O time também define o estoque da Copa que a pessoa vê e mexe (veja [Um estoque por time](15-copa.md#um-estoque-por-time)).

## Férias e ausências

### Para que serve

Férias, folgas, atestados, cursos e outras ausências. Elas aparecem na escala, no painel da liderança, no calendário e na hora de escolher responsáveis para uma demanda (o Portal avisa que a pessoa estará fora).

### Pedir uma ausência

1. Na aba **Férias e ausências**, clique em **Pedir ausência** (ou use **+ Criar → Pedir ausência**).
2. Escolha o **Tipo**: **Férias**, **Folga**, **Atestado**, **Curso / evento** ou **Ausência**.
3. Informe o início e **Até (inclusive)**.
4. Se quiser, escreva uma **Observação** (ex.: "volta na segunda; quem cobre é o Bruno").
5. Envie. O líder do seu time recebe um aviso para aprovar. A ausência entra na escala depois da aprovação.

Enquanto aguarda, o pedido aparece como **Aguardando aprovação** e você pode **Cancelar pedido**.

### Aprovar (líderes e administradores)

Os pedidos do seu time aparecem em **Pedidos aguardando aprovação**. Clique em **Aprovar** ou **Recusar**. Quem pediu recebe um aviso.

Líderes podem registrar a ausência de alguém do time (o botão vira **Registrar ausência**): nesse caso ela já entra aprovada. Ninguém aprova o próprio pedido, exceto administradores.

## Integração de quem chega

### Para que serve

Um checklist dos primeiros dias de quem entra na empresa (acessos, ambiente, apresentações), com um **padrinho ou madrinha** que acompanha. A pessoa e o padrinho veem o checklist também na Visão geral.

### Começar uma integração (administradores)

1. Crie antes o usuário da pessoa em **Usuários**.
2. Na aba **Integração**, clique em **Nova integração**.
3. Escolha **Quem está chegando**, o **Padrinho ou madrinha** e o **Primeiro dia**.
4. Ajuste os **Passos** (um por linha). Já vem uma lista sugerida.
5. Salve. A pessoa e o padrinho recebem aviso no sino.

Conforme os passos são feitos, marque-os. Quando tudo estiver pronto, clique em **Concluir** (ou **Reabrir**, se precisar).

## Equipamentos e licenças

### Para que serve

Saber com quem está cada notebook, monitor ou licença de software e receber aviso antes de uma licença ou garantia vencer.

No topo: **Equipamentos**, **Licenças**, **Vencem em 30 dias** e **Com você** (o que está no seu nome). Busque por nome, patrimônio ou pessoa.

### Cadastrar (administradores)

1. Clique em **Novo equipamento** ou **Nova licença**.
2. Preencha **Nome**, **Tipo**, **Situação**, **Com quem está** (ou **Ninguém (guardado)**), patrimônio e datas (compra, vencimento ou fim da garantia). Para licenças, informe as **Vagas (usuários)**.
3. Valor de compra e **Observações** só administradores veem.
4. Salve. O **Histórico** mostra por quem o equipamento já passou.

## Quem pode

| Ação | Administrador | Líder de time | Membro | Somente leitura |
| --- | --- | --- | --- | --- |
| Ver o diretório, perfis e times | Sim (inclusive pessoas desativadas) | Sim | Sim | Sim |
| Editar o próprio perfil no diretório | Sim | Sim | Sim | Sim |
| Editar o perfil de outra pessoa | Sim | Não | Não | Não |
| Criar e editar times, definir líderes | Sim | Não | Não | Não |
| Pedir ausência | Sim | Sim | Sim | Não |
| Registrar ausência de outra pessoa | Qualquer pessoa | Pessoas dos times que lidera | Não | Não |
| Aprovar ou recusar ausências | Sim | Do time que lidera (não o próprio pedido) | Não | Não |
| Começar uma integração | Sim | Não | Não | Não |
| Marcar passos da integração | Sim | Se for o padrinho ou quem chega | Se for o padrinho ou quem chega | Não |
| Ver equipamentos e licenças | Sim, com valores e observações | Sim | Sim | Sim |
| Cadastrar equipamentos e licenças | Sim | Não | Não | Não |
