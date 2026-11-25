# 7. Clientes e Incidentes

[← Índice](README.md)

Abra **Clientes** no menu. A tela tem duas abas: **Clientes** e **Incidentes**.

## Clientes

### Para que serve

A **ficha do cliente** reúne num lugar só: contato, pacote de horas, acessos aos sistemas, chamados, demandas e horas do mês. É a mesma lista de clientes que aparece no campo **Cliente / Projeto** das demandas e dos chamados.

### Cadastrar um cliente novo (administradores)

1. Na lista de clientes, clique em **Novo cliente**.
2. Digite o nome (ex.: "Padaria Exemplo") e clique em **Cadastrar** (ou aperte Enter). **Esc** ou **Cancelar** desiste.
3. A ficha do cliente novo abre na hora. Use **Editar ficha** para preencher o contato e o pacote de horas.

O nome não pode repetir o de um cliente que já existe.

### Desativar ou excluir um cliente (administradores)

Na ficha do cliente, clique em **Mais** (ao lado de **Editar ficha**):

- **Desativar cliente**: o cliente sai das listas de escolha de demandas e chamados, mas demandas, chamados, horas e o histórico continuam guardados. Ele aparece apagado na lista, com a marca **Desativado**. Para voltar, use **Reativar cliente**.
- **Excluir cliente**: apaga o cliente e os acessos aos sistemas cadastrados na ficha. Não dá para desfazer. Só funciona para clientes **sem nada ligado** (por exemplo, cadastrados por engano). Se o cliente tiver demandas, chamados, projetos ou artigos da base, o Portal mostra quantos são e oferece **Desativar cliente** no lugar, para não perder o histórico. Também dá para cadastrar pela lista **Demandas → ⋯ → Clientes e projetos**, que permite ainda renomear e desativar, ou por planilha em **Importar / Exportar**.

### Consultar um cliente

1. Busque o cliente na lista à esquerda e clique nele.
2. A ficha mostra:
   - **Contato principal**, e-mail, telefone e **Observações** (contrato, horário de atendimento, particularidades);
   - **Chamados em aberto** e **Demandas em aberto**;
   - **Horas nos últimos 6 meses** (com aviso a partir de 80% do pacote mensal);
   - **Sistemas e acessos**;
   - **Chamados recentes**.

### Editar a ficha (administradores)

Clique em **Editar ficha** e preencha **Contato principal**, **E-mail do contato**, **Telefone do contato**, **Pacote de horas por mês** (ex.: 40) e **Observações**. O nome do cliente se muda em **Demandas → Clientes e projetos**.

### Sistemas e acessos

Cada acesso guarda o **Sistema**, o **Ambiente**, o **Endereço (URL)**, o **Usuário** e a **Senha**.

**Cadastrar (administradores):**

1. Clique em **Novo acesso**.
2. Preencha sistema, ambiente, endereço, usuário e senha. A senha fica criptografada.
3. Em **Quem vê o login**, escolha o time dono do acesso ou **Só administradores**.
4. Se quiser, marque **Monitorar se está no ar**: o Portal verifica a cada 5 minutos e avisa o time no sino quando cair ou voltar.
5. Salve.

**Usar:** clique em **Copiar endereço**, **Copiar usuário** ou **Copiar senha**. Cada vez que alguém vê ou copia uma senha, isso fica registrado no histórico.

> Recomendado para acessos de teste, demonstração e treinamento. Senhas de produção com dados reais, servidores e bancos ficam melhor num cofre próprio (ex.: Bitwarden). Aqui você pode anotar só "senha no cofre, item X".

Se o monitor mostrar "fora do ar" sem o sistema estar, a porta daquele endereço pode não ser alcançável pelo servidor do Portal; desligue o monitor desse acesso. **Verificar agora** testa na hora.

### Relatório mensal para o cliente

Na ficha, em **Relatório mensal para o cliente**, escolha o **Mês do relatório** e baixe o Excel. Ele traz o resumo do mês (chamados, prazo de resposta, entregas e horas do pacote), a lista de chamados, as demandas entregues e as horas lançadas.

## Incidentes

### Para que serve

Registrar quando um sistema de cliente cai ou há um problema grave: o que aconteceu, a causa e o que muda para não repetir. Quedas detectadas pelo monitor abrem um incidente sozinhas; quando o sistema volta, o incidente fica resolvido esperando a análise.

No topo aparecem: **Em andamento**, **Falta análise**, **Incidentes (30 dias)** e **Tempo médio até resolver**.

### Registrar um incidente

1. Clique em **Registrar incidente**.
2. Preencha **O que aconteceu** (ex.: "Sistema do cliente fora do ar"), o **Cliente** (ou **Nenhum (interno)**), o **Sistema**, a **Gravidade** e a **Situação**.
3. Informe quando **Começou** e quando **Terminou** (vazio se ainda está acontecendo).
4. Descreva o **Impacto** (quem foi afetado e como).
5. Depois, complete a análise: **Causa** (a causa de verdade, não só o sintoma), **Como foi resolvido** e **O que muda para não repetir** (ex.: alerta de disco a 80%, rotina nova no checklist).
6. Na **Linha do tempo**, registre cada atualização (ex.: "cliente avisado", "servidor reiniciado") com **Adicionar**.

## Quem pode

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Ver clientes, fichas e incidentes | Sim | Sim | Sim |
| Cadastrar cliente novo | Sim | Não | Não |
| Desativar, reativar ou excluir cliente | Sim | Não | Não |
| Editar a ficha e cadastrar acessos | Sim | Não | Não |
| Ver e copiar a senha de um acesso | Sim | Só se for do time dono do acesso | Só se for do time dono do acesso |
| Registrar e atualizar incidentes | Sim | Sim | Não |
| Excluir incidentes | Sim | Não | Não |
