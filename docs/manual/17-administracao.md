# 17. Administração

[← Índice](README.md)

Este capítulo é para **administradores**. O grupo **Administração** do menu só aparece para eles e tem duas telas: **Usuários** e **Marca e segurança**.

## Usuários e permissões

Cada pessoa entra com a própria conta, e tudo o que ela faz fica registrado no nome dela. Cargo, telefone e times ficam na área **Pessoas**.

### Cadastrar um usuário

1. Abra **Usuários** e clique em **Adicionar membro** (ou, em **Pessoas**, clique em **Nova pessoa**: é o mesmo cadastro).
2. Na aba **Geral**, preencha **Nome**, **Usuário de acesso** (ex.: "ana"), **E-mail** (ex.: ana@empresa.com) e a **senha inicial** (8 ou mais caracteres, com letras e números).
3. Escolha o **Perfil base**: **Administrador**, **Membro** ou **Somente leitura** (veja [Perfis de acesso](README.md#perfis-de-acesso)).
4. Deixe o **Status** como **Ativo**.
5. Se quiser, ajuste as **Permissões individuais** (veja abaixo).
6. Salve e passe o usuário e a senha inicial para a pessoa. Ela pode trocar a senha em **Meu perfil**.

A senha é guardada como um código seguro e não pode ser vista depois de salva, nem pelo administrador.

### Permissões individuais

Na aba **Permissões** de cada pessoa, ligue ou desligue:

| Permissão | O que libera | Padrão do Membro | Padrão do Somente leitura |
| --- | --- | --- | --- |
| Gerenciar itens | Cadastrar, editar e excluir produtos da copa; decidir pedidos da copa | Não | Não |
| Registrar compras | Adicionar unidades ao estoque; usar "Fazer compras" | Sim | Não |
| Abrir produtos | Mover unidades fechadas para em uso | Sim | Não |
| Lançar consumo | Baixar quantidades já abertas | Sim | Não |
| Ajustar saldo | Corrigir a contagem física | Não | Não |
| Ver planejamento | Consultar duração e previsão de compras | Sim | Sim |
| Ver histórico | Consultar as movimentações e os relatórios da copa | Sim | Sim |
| Editar escala | Alterar equipes e semanas de atendimento; aprovar trocas | Não | Não |
| Cuidar da manutenção | Atender os pedidos de manutenção do escritório | Não | Não |

Administradores sempre têm acesso completo. As permissões são conferidas de novo pelo servidor em cada operação.

### Outras ações na lista de usuários

- **Permissão**: troque o perfil direto na linha da pessoa.
- **Status**: **Desativado** bloqueia o acesso sem apagar o histórico da pessoa. Reative quando quiser.
- **Editar**: muda os dados e **redefine a senha** de quem esqueceu.
- **Desconectar de todos os aparelhos**: encerra todas as sessões da pessoa (ex.: celular perdido).
- **Desligar a verificação em duas etapas**: para quem perdeu o celular e os códigos de recuperação. A pessoa entra só com a senha e pode ligar de novo.
- **Excluir membro**: apaga o usuário. Prefira **Desativado** se a pessoa só saiu da empresa.

## Marca e segurança

### Marca do Portal

Muda nome, logo e cor para toda a equipe, sem precisar publicar uma versão nova:

1. **Nome do sistema**, **Nome curto** (ícone na tela inicial do celular) e **Frase embaixo do nome** (opcional).
2. **Cor principal**: escolha uma das **Cores sugeridas** ou **Outra cor** (pelo código da cor). Com cor clara, o texto dos botões fica escuro para continuar legível.
3. **Logo**: PNG, JPG ou WebP, até 1 MB, de preferência quadrado. Use **Ajustar o logo** para recortar.
4. Confira a **Pré-visualização** e salve. A mudança aparece na hora para quem está com o Portal aberto: login, menu, aba do navegador, botões e avisos no celular.

**Desfazer** volta ao que estava; **Restaurar padrão** volta à marca original.

### Cópia de segurança

O botão da **Cópia de segurança** gera um arquivo Excel com todos os dados do Portal, uma aba por tabela. Ficam de fora: senhas, chaves e sessões de login, as senhas dos sistemas dos clientes, as conversas do chat, a nota privada do 1:1 e o registro de quem já avaliou quem. Recomendado uma vez por semana.

### Histórico de ações

Mostra quem fez o quê no Portal: **Quando**, **Quem**, **O que fez** e **Detalhes**. Ações sensíveis (permissões, exclusões, senhas, Jira) ficam destacadas.

- Filtre pelo período (**Até**), pela **Área** e por texto (nome, item, endereço IP...).
- **Exportar Excel** baixa o período filtrado.

### Exportar dados e Power BI

- **Exportar dados**: escolha **O que exportar**, o período e o formato (**Excel** ou **CSV**).
- **Power BI e Excel conectados**: crie uma **Nova chave de leitura**. Copie a chave na hora (ela não aparece de novo). No Power BI, use **Obter dados → Web → Avançado**, cole o endereço do conjunto (**Copiar endereço**) e, em cabeçalhos, informe `Authorization` com `Bearer` + a chave. A chave só lê; não altera nada no Portal. Use **Revogar** para desligar uma chave.

### Integrações

**Agente de atendimento automático (N1 do AtendeChat)**: uma chave para o agente buscar respostas na Base de conhecimento e abrir chamados no Portal.

1. Clique em **Nova chave**.
2. Dê um **Nome**, escolha o **Time que recebe os chamados** e a **Etiqueta dos artigos liberados** (o agente só lê artigos com essa etiqueta; o resto da base continua interno).
3. Clique em **Criar chave** e copie na hora (ela não aparece de novo).
4. Cole no AtendeChat, na configuração do agente (campo "Chave do Portal").

**Revogar** desliga a chave.

### Assistente de chamados (IA)

Liga o resumo de chamados longos e a sugestão de resposta (veja [Chamados](05-chamados.md#assistente-de-chamados-ia)). Cole a chave da conta da Anthropic, escolha o **Modelo** e clique em **Salvar chave**. A chave fica criptografada e nunca volta para a tela. Cada uso consome créditos da conta. **Remover** desliga o assistente.

## Jira

Fica em **Chamados → menu ⋯ → Contas do Jira**.

1. Entre no Jira com o usuário que vai ler os chamados (pode ser só de leitura).
2. Em **id.atlassian.com → Segurança → Tokens de API**, crie uma chave.
3. No Portal, clique em **Adicionar conta do Jira** e informe **Nome**, **Endereço do Jira** (ex.: https://suaempresa.atlassian.net), **E-mail do usuário**, **Chave de API** e a **Fila no Portal** (Suporte, por padrão).
4. Salve. O Portal testa a conexão; a chave fica guardada no servidor e não aparece mais.
5. Marque os projetos do Jira que devem virar chamados (**Trazer**) e escolha o **Cliente no Portal** de cada um (ou **Usar o nome do projeto**).

Repita para cada conta. **Buscar chamados desta conta** traz na hora; **Editar conta** e **Remover conta** mantêm a lista.

## Busca de GIFs no chat

No chat, botão **GIF**: se ainda não há chave, o administrador vê o campo **Chave do Giphy**. Crie uma chave gratuita em developers.giphy.com (botão "Create an API Key", tipo API), cole e salve. A chave fica criptografada. O termo buscado é enviado ao Giphy.

## Quem pode

Tudo deste capítulo é só para **administradores**.
