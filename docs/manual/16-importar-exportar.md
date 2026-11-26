# 16. Importar e exportar planilhas

[← Índice](README.md)

O Portal troca dados com o Excel de três jeitos:

1. o botão **Importar / Exportar**, no topo das telas de registro;
2. a **importação das planilhas antigas de demandas**, em Demandas;
3. a **exportação completa** e a ligação com o Power BI, em Marca e segurança (veja [Administração](17-administracao.md#exportar-dados-e-power-bi)).

## Botão "Importar / Exportar"

### Onde aparece e o que traz

| Tela | Exporta | Importa |
| --- | --- | --- |
| Demandas | Demandas e horas lançadas | Demandas |
| Chamados | Chamados | Chamados (entram como abertos) |
| Projetos | Projetos | Projetos |
| Clientes | Clientes e incidentes | Clientes |
| Base de conhecimento | Artigos | Artigos |
| Escala | Escala de atendimento | Não |
| Pessoas | Pessoas, férias e ausências, equipamentos e licenças | Pessoas, ausências, equipamentos e licenças |
| Usuários | Pessoas | Pessoas |
| Manutenção | Pedidos de manutenção | Não |
| Estoque (Itens e saldos) | Itens do estoque | Itens |
| Estoque (Histórico) | Histórico do estoque | Não |
| Marca e segurança | Todos os conjuntos acima | Todos os que aceitam importação |

### Exportar

1. Clique em **Importar / Exportar**.
2. No conjunto desejado, escolha **Excel** ou **CSV**.

### Importar

1. Clique em **Importar / Exportar** e, no conjunto desejado, em **Baixar modelo**. O modelo traz as colunas certas e uma aba **Como preencher**.
2. Preencha a planilha (até 2.000 linhas e 5 MB). Use os mesmos títulos de coluna do modelo.
3. Volte ao botão e clique em **Importar planilha**. Escolha o arquivo.
4. Confira a **prévia**: quantas linhas são novas, quantas **já existem** e quantas estão **com erro**. Nada é gravado antes de você confirmar.
5. Se quiser, marque **Atualizar os registros que já existem** (células vazias não apagam nada).
6. Confirme. Se houver erros, corrija na planilha e envie de novo.

A importação **nunca apaga** registros. Como o Portal reconhece um registro que já existe:

- **Demandas** e **chamados**: mesmo título e mesmo cliente;
- **Projetos**: o nome do projeto;
- **Clientes**: o nome do cliente;
- **Artigos**: o título;
- **Pessoas**: o e-mail. Pessoas novas entram **sem senha**: o acesso é criado depois, em **Usuários**;
- **Ausências**: mesma pessoa, tipo e início;
- **Equipamentos e licenças**: tipo e patrimônio (ou o nome, sem patrimônio);
- **Itens do estoque**: o **Time** e o nome (cada time tem o próprio estoque). Com a coluna **Time** em branco, o item vai para o seu time, se você for de um só. Você só exporta e importa o estoque dos seus times (administradores, de todos). Os saldos não mudam pela planilha: use compra ou ajuste.

## Importar as planilhas antigas de demandas

Para trazer as planilhas de demandas que a equipe usava antes do Portal (só administradores):

1. No Google Planilhas, abra cada planilha e use **Arquivo → Fazer download → Microsoft Excel (.xlsx)**.
2. No Portal, abra **Demandas**, menu **⋯ → Importar planilhas**.
3. Envie os arquivos. O Portal reconhece três modelos:
   - **Demandas Diárias – Suporte** (abas por pessoa + Configurações);
   - **Demandas Diárias – Desenvolvimento**;
   - **Gestão de Demandas – Liderança** (usa a aba Projetos Grandes).
4. Confira a prévia: **Linhas lidas**, **Demandas novas**, **Repetidas unidas**, **Projetos**, pessoas novas, clientes novos e **Horas suspeitas** (marcadas para revisão). Use o filtro para procurar avisos.
5. Se houver problemas, corrija as linhas direto na planilha, baixe o .xlsx de novo e gere outra prévia.
6. Confirme. Aparece **Importação concluída**.

Linhas já importadas antes não entram de novo. Se tudo já estiver no Portal, a prévia mostra **Nada novo para importar**. Pessoas novas entram sem senha; libere o acesso em **Usuários** quando quiser.

## Quem pode

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Exportar demandas, chamados, projetos, artigos, escala e itens do estoque | Sim | Sim | Sim |
| Exportar o histórico do estoque | Sim | Com "Ver histórico" | Com "Ver histórico" |
| Exportar pedidos de manutenção | Sim | Com "Cuidar da manutenção" | Com "Cuidar da manutenção" |
| Exportar pessoas, ausências, equipamentos, clientes, incidentes e horas | Sim | Não | Não |
| Importar itens do estoque | Sim | Com "Gerenciar itens" | Com "Gerenciar itens" |
| Importar qualquer outro conjunto | Sim | Não | Não |
| Importar as planilhas antigas de demandas | Sim | Não | Não |
