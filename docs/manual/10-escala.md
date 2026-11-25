# 10. Escala de atendimento

[← Índice](README.md)

## Para que serve

A **Escala** mostra qual equipe está no atendimento em cada semana (ex.: os desenvolvedores que apoiam o Suporte em questões de código). Inclui a **passagem de plantão** de uma equipe para a outra e os **pedidos de troca de semana**.

Abra **Escala** no menu. A semana atual aparece em destaque, com o **Time de atendimento**, seguida das próximas semanas. Dias fora dos períodos cadastrados ficam sem atendimento. A escala também aparece na Visão geral ("Hoje na equipe") e no Calendário.

## Montar a escala (quem edita a escala)

A área **Edição da escala** só aparece para quem tem a permissão **Editar escala**. As mudanças aparecem para toda a equipe na hora.

### Cadastrar uma equipe

1. Clique em **Nova equipe**.
2. Dê o **Nome da equipe** (ex.: "Equipe Azul") e uma **Cor**.
3. Em **Integrantes**, escreva um nome por linha (ex.: "Ana Souza", "Bruno Lima").
4. Salve.

### Cadastrar uma semana

1. Clique em **Nova semana**.
2. Informe **Início**, **Fim** e a **Equipe responsável**.
3. Se quiser, escreva uma **Observação** (ex.: "sem expediente na sexta, feriado"). Ela aparece junto do período para toda a equipe.
4. Salve.

### Gerar várias semanas de uma vez

1. Clique em **Gerar semanas**.
2. Informe em que dia a **Primeira semana começa**, a **Quantidade de semanas** e os **Dias de atendimento por semana**.
3. Escolha as **Equipes no rodízio** e por qual **Começar**.
4. Confira a **Prévia**. Se alguma semana conflitar com a escala atual, o Portal avisa; mude a data inicial ou a quantidade.
5. Confirme.

Para corrigir, use **Editar equipe** ou **Editar semana**.

## Pedir troca de semana

1. Em **Trocas de semana**, clique em **Pedir troca**.
2. Escolha a **Semana que sai** e com qual semana quer **Trocar com** (de outra equipe, ainda no futuro).
3. Escreva o **Motivo** (ex.: "consulta médica na quarta; a outra equipe topou trocar").
4. Envie. Quem gerencia a escala recebe um aviso.

Quem gerencia a escala clica em **Aprovar** ou **Recusar**. Aprovada, as duas semanas trocam de equipe. Quem pediu pode **Cancelar pedido** enquanto ele não foi decidido. Só dá para trocar semanas que ainda não passaram.

## Passagem de plantão

No fim da semana, quem está no atendimento conta o que ficou pendente para a próxima equipe.

1. Em **Passagem de plantão**, clique em **Registrar passagem**.
2. Escreva o que ficou pendente, combinados com clientes e alertas para a próxima equipe.
3. Salve.

Quem assume lê e clica em **Li e estou ciente**.

## Quem pode

| Ação | Administrador | Membro com "Editar escala" | Membro | Somente leitura |
| --- | --- | --- | --- | --- |
| Ver a escala | Sim | Sim | Sim | Sim |
| Cadastrar equipes e semanas, gerar semanas | Sim | Sim | Não | Não |
| Pedir troca de semana | Sim | Sim | Sim | Não |
| Aprovar ou recusar trocas | Sim | Sim | Não | Não |
| Registrar passagem de plantão | Sim | Sim | Sim | Não |
| Excluir uma passagem | Qualquer uma | As que escreveu | As que escreveu | Não |
