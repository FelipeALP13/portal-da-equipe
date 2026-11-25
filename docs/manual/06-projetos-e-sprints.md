# 6. Projetos e Sprints

[← Índice](README.md)

## Projetos

### Para que serve

**Projetos** são entregas grandes, que juntam várias demandas (ex.: "Implantação do sistema na Clínica Modelo"). Cada projeto tem um código (ex.: **PRJ-5**), uma fase, um **farol** de saúde, datas e as demandas que fazem parte dele. Substitui a aba "Projetos Grandes" da planilha da liderança.

### A tela de Projetos

- No topo, os projetos em andamento por **farol**: **Verde**, **Azul**, **Amarelo** e **Vermelho**. Clique para filtrar.
- **Busca** por projeto, cliente ou escopo, e filtro por **fase**: **Planejamento**, **Execução / Monitoramento**, **Validação**, **Pausado** e **Encerramento**.
- **Como mostrar**:
  - **Lista**: tabela com projeto, fase, status, prazo, demandas e responsáveis. Clique na seta da linha para ver as demandas em aberto do projeto ali mesmo.
  - **Linha do tempo**: barras no tempo (gráfico de Gantt).
- **Exportar Excel**: baixa os projetos da tela, com as demandas de cada um.

### Criar um projeto

1. Clique em **Novo projeto**.
2. Preencha o **Nome do projeto**, o **Farol**, a **Fase do projeto** e o **Cliente / Projeto**.
3. Informe a **Data de início** e a **Previsão de encerramento** (ex.: "28/11/2026" ou "A definir").
4. Escreva a **Descrição / Escopo** e, se houver, **OBS / Impedimentos / Bloqueios**.
5. Escolha os responsáveis e salve.

Se você fechar com mudanças não salvas, o Portal avisa: "Há alterações não salvas".

### Ligar demandas ao projeto

No projeto, em **Demandas do projeto**, busque uma demanda em aberto pelo título ou código e clique para ligar. O projeto mostra quantas estão concluídas (ex.: "3 de 8 demandas concluídas"). Para tirar, use **Tirar do projeto**. Também dá para escolher o projeto no campo **Projeto grande** da própria demanda.

### Linha do tempo

- **Arraste a barra** para mudar as datas; puxe as pontas para mudar só o início ou o fim.
- **Entregas**: marcos com nome e data (ex.: "Homologação com o cliente"). Use **Adicionar**.
- **Depende de**: ligue um projeto a outro que precisa terminar antes. Se um começa antes do outro terminar, a linha fica vermelha.

### Quem pode (Projetos)

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Ver projetos e a linha do tempo | Sim | Sim | Sim |
| Criar e editar projetos, ligar demandas, mexer nas datas | Sim | Sim | Não |
| Excluir projetos | Sim | Não | Não |

## Sprints

### Para que serve

Um **sprint** é um período curto (1 ou 2 semanas) com as demandas que o time se compromete a entregar. O Portal calcula a capacidade do time (descontando férias e folgas) e desenha o **gráfico de queima** (quanto falta a cada dia).

### Criar um sprint

1. Abra **Sprints e retros** no menu, aba **Sprints**, e clique em **Novo sprint**.
2. Dê um **Nome** (ex.: "Sprint 12"), escolha o **Time**, o **Início** e o **Fim**.
3. Em **Horas por dia de cada pessoa**, informe o tempo realmente dedicado às demandas (descontando reuniões e suporte).
4. Escreva o **Objetivo** (ex.: "Entregar o módulo de boletos para homologação") e salve.
5. Clique em **Adicionar demandas** e escolha as demandas em aberto que ainda não estão em nenhum sprint. Também dá para escolher o sprint dentro da própria demanda.
6. Clique em **Começar**.

### Acompanhar

- **Planejado × capacidade**: horas estimadas das demandas comparadas com as horas disponíveis de cada pessoa.
- **Gráfico de queima**: horas que faltam a cada dia. Para ele funcionar, preencha **Horas estimadas** nas demandas do sprint.
- **Demandas do sprint**: a lista, com **Tirar do sprint**.

### Encerrar

Clique em **Encerrar**. As demandas não concluídas voltam para a lista geral (sem sprint). Depois, registre a retrospectiva.

## Retrospectivas

No fim de cada sprint (ou do mês), o time anota o que foi bem, o que melhorar e as ações.

1. Na aba **Retrospectivas**, clique em **Nova retrospectiva**.
2. Dê um **Título**, escolha o time (ou **Toda a equipe**) e o **Sprint**, se houver.
3. Se quiser, marque **Anônima**: ninguém vê quem escreveu cada item, nem administradores.
4. Cada pessoa escreve nas três colunas (escreva e aperte Enter) e **vota** no que mais importa.
5. Itens de ação podem **Virar demanda** com um clique.
6. Quem criou encerra a retrospectiva quando terminar.

Cada pessoa pode apagar o que escreveu.

### Quem pode (Sprints e retrospectivas)

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Ver sprints e retrospectivas | Sim | Sim | Sim |
| Criar, editar, começar e encerrar sprints | Sim | Sim | Não |
| Escrever e votar na retrospectiva | Sim | Sim | Não |
| Encerrar uma retrospectiva | Qualquer uma | As que criou | Não |
| Excluir sprints e retrospectivas | Sim | Não | Não |
