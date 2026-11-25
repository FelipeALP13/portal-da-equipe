# 4. Demandas

[← Índice](README.md)

## Para que serve

**Demandas** são as tarefas da equipe: o que precisa ser feito, por quem, para qual cliente e até quando. Cada demanda tem um código (ex.: **DEM-12**), responsáveis, prazo, checklist, horas trabalhadas e uma conversa própria. Substitui as planilhas de demandas diárias.

## As telas de Demandas

Abra **Demandas** no menu. No topo você escolhe:

- **Quais**: **Todas**, **Do meu time** ou **Minhas** (as que você é responsável ou apoia).
- **Visualização**:
  - **Lista**: demandas agrupadas por status.
  - **Quadro**: colunas por status. **Arraste** uma demanda de uma coluna para outra para mudar o status.
  - **Semana**: os dias da semana com as demandas de cada dia. Mostra também as **Atrasadas** e as **Sem prazo**. Arraste uma demanda para outro dia para mudar o prazo. Navegue com **Semana anterior** e **Próxima semana**.
- **Busca**: por título, código (ex.: DEM-12) ou cliente.
- **Filtros**: pessoa (ou **Sem responsável**), cliente ou projeto, categoria, time e prioridade.

No topo da tela aparece **Minhas demandas**, com as suas em aberto e as atrasadas.

### Status de uma demanda

**Backlog** → **A Fazer** → **Fazendo** → **Em Validação** → **Concluído**. No caminho ela pode ficar **Aguardando Resposta**, **Bloqueado** ou **Pausado**. Demandas que não serão feitas ficam **Cancelado**.

### Prioridades

**Crítica**, **Alta**, **Média**, **Baixa** ou sem prioridade.

## Criar uma demanda

1. Clique em **Nova demanda** (ou aperte a tecla **C**, ou use **+ Criar → Nova demanda**). Nas colunas do quadro e nos dias da semana há um **+** que já cria no status ou no dia certo.
2. Se quiser, clique em **Usar um modelo** para começar com categoria, time, prioridade e checklist prontos. Ou **Começar do zero**.
3. Preencha o **Título da demanda**.
4. Escolha os **Responsáveis** e, se houver, o **Resp. Suporte** (quem apoia). O Portal avisa se a pessoa está de férias ou ausente no período.
5. Defina **Status**, **Prioridade**, **Cliente / Projeto**, **Categoria**, **Time**, **Projeto grande** e **Sprint**, se fizer sentido.
6. Defina o prazo. Os **Atalhos de prazo** preenchem datas comuns com um clique. Em **Período**, escolha **Manhã**, **Tarde** ou qualquer hora.
7. Se quiser, informe **Horas estimadas** e a **Origem / Ticket** (ex.: "WhatsApp", "TICKET-663").
8. Escreva a descrição e, se quiser, clique em **Adicionar checklist** (um passo por linha).
9. Clique em criar. **Ctrl + Enter** também cria. **Esc** fora dos campos fecha a janela.

O texto digitado não se perde se você fechar sem querer: ao abrir de novo, ele continua lá.

## Trabalhar numa demanda

Clique numa demanda para abrir o painel lateral. Ali você pode:

- **Mudar qualquer campo** (status, prioridade, prazo, responsáveis...). A mudança é salva na hora.
- **Descrição** e **OBS / Impedimentos**: anotações livres.
- **Checklist**: marque os passos feitos. Use **Adicionar** (ou "Novo passo" e Enter), **Subir**, **Descer** e **Apagar**.
- **Dependências**: em **Depende de outra demanda**, busque pelo código (DEM-0012) ou parte do título. A demanda mostra **Só começa depois de** (as que precisam terminar antes) e **Quem espera por esta**. Enquanto houver dependência em aberto, aparece um cadeado com "Aguardando".
- **Anexos**: envie arquivos e imagens. Clique para **Abrir** ou **Baixar**.
- **Atividade**: comentários e o histórico do que mudou. Escreva **@** para **mencionar** alguém: a pessoa recebe aviso no sino.
- **Repetir**: veja abaixo.
- **Horas**: veja abaixo.

## Lançar horas

Na demanda, na seção **Horas**:

1. Escolha o **Dia trabalhado**.
2. Informe as horas, por exemplo **1,5** ou **1:30**.
3. Se quiser, escreva **O que foi feito**.
4. Salve. Para corrigir, exclua o lançamento e faça de novo.

**Horas anteriores** guarda as horas que vieram das planilhas antigas. Se a importação trouxe um valor fora do normal, a demanda mostra o aviso "Horas importadas fora do normal: revise". Corrija em **Horas anteriores**; o aviso some quando o valor for salvo.

### Cronômetro

1. Na demanda, clique em **Iniciar cronômetro**. Ele conta enquanto você trabalha e aparece na barra do topo em qualquer tela.
2. Clique em **Parar**. O Portal mostra as **Horas a lançar**; escreva o que foi feito e confirme. Vira um lançamento de hoje.
3. Se não quiser lançar, use **Continuar contando** ou **Descartar**.

Só um cronômetro roda por vez. Se você tentar iniciar outro, o Portal avisa em qual demanda o primeiro está rodando.

## Demandas que se repetem

Para tarefas que voltam sempre (fechamento, backup, relatório):

1. Na demanda, abra **Repetir**.
2. Escolha a **Frequência**: **Toda semana** ou **Todo mês** (no mês, até o dia 28, para valer em todos os meses).
3. Defina o **Prazo da cópia** e salve.

O Portal cria uma cópia com os mesmos responsáveis e o mesmo checklist. Para parar, use **Parar de repetir**.

## Modelos de demanda

Um modelo já traz categoria, time, prioridade e os passos do checklist. Ele aparece em **Nova demanda → Usar um modelo**.

Para manter os modelos (administradores): no menu **⋯** da tela de Demandas, abra **Modelos de demanda**. Use **Novo modelo**, **Editar** ou **Excluir**. Se a lista estiver vazia, **Criar modelos de exemplo** traz três modelos (implantação de cliente, publicação de versão e novo colaborador) para você ajustar. Mudar um modelo não altera as demandas já criadas com ele.

## Clientes e projetos (lista)

É a lista que aparece no campo **Cliente / Projeto**. Administradores mantêm a lista no menu **⋯ → Clientes e projetos**: **Novo cliente ou projeto**, renomear e desativar. Desativar tira o nome dos menus sem mexer nas demandas antigas.

## Exportar e importar

- **Exportar Excel** (menu **⋯**): baixa as demandas que estão na tela, com os filtros e a busca aplicados.
- **Importar planilhas** (menu **⋯**, só administradores): traz as planilhas antigas de demandas. Veja [Importar e exportar planilhas](16-importar-exportar.md).

## Excluir

Só administradores excluem demandas (ícone de lixeira no painel da demanda). Para tirar uma demanda do caminho sem apagar, use o status **Cancelado**.

## Quem pode

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Ver demandas | Sim | Sim | Sim |
| Criar e editar demandas, checklist e dependências | Sim | Sim | Não |
| Comentar e anexar arquivos | Sim | Sim | Não |
| Excluir um comentário | Qualquer um | Os seus | Não |
| Excluir um anexo | Qualquer um | Os que enviou | Não |
| Lançar horas | Para qualquer pessoa | Só as suas | Não |
| Usar o cronômetro | Sim | Sim | Não |
| Manter modelos e a lista de clientes e projetos | Sim | Não | Não |
| Importar planilhas de demandas | Sim | Não | Não |
| Excluir demandas | Sim | Não | Não |
