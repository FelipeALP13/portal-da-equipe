# 1. Primeiros passos

[← Índice](README.md)

## Entrar no Portal

1. Abra o endereço do Portal no navegador (computador ou celular).
2. Digite o **Usuário** e a **Senha** que o administrador cadastrou para você.
3. Clique em **Entrar**.

Se a sua conta tiver a verificação em duas etapas ligada, o Portal pede em seguida o **código do aplicativo autenticador** (veja abaixo).

**Esqueceu a senha ou perdeu o celular?** Não existe "esqueci a senha" por e-mail. Peça para um administrador redefinir a sua senha (ou desligar a verificação em duas etapas) em **Usuários**.

Você sai sozinho depois de **7 dias sem usar** o Portal naquele aparelho. Enquanto você usa, a sessão se renova.

### Primeiro acesso de todos (instalação)

Na primeiríssima vez que o Portal é aberto, ainda sem nenhum usuário, a tela mostra **Criar administrador**. Quem instala preenche nome, e-mail, o **código de instalação** (combinado com quem hospeda o Portal), usuário e senha. Depois disso essa tela não aparece mais.

## Verificação em duas etapas

Com ela ligada, além da senha o Portal pede um código de 6 números que muda a cada 30 segundos no seu celular. Mesmo que alguém descubra a sua senha, não entra.

**Para ligar:**

1. Clique no seu nome, no menu lateral, para abrir **Meu perfil**.
2. Em **Verificação em duas etapas**, clique em **Ligar a verificação em duas etapas**.
3. Instale um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator ou outro).
4. No aplicativo, toque em "adicionar" e leia o QR code. Se não conseguir, digite a chave que aparece embaixo dele.
5. Digite o código de 6 números do aplicativo e clique em **Ligar**.
6. O Portal mostra os **códigos de recuperação**. Guarde-os em lugar seguro, fora do celular. Cada um serve uma vez para entrar se você perder o celular. Eles não aparecem de novo. Clique em **Já guardei**.

**Para desligar:** em Meu perfil, clique em **Desligar a verificação**, digite um código do aplicativo e confirme.

## Meu perfil

Clique no seu nome no menu lateral (ou busque "Meu perfil" com **Ctrl+K**). Ali você:

- muda a sua **foto ou ícone**, nome, e-mail, cargo e telefone;
- vê os **seus times** (quem inclui você num time é o administrador);
- **altera a senha**: preencha a senha atual e a nova (8 ou mais caracteres, com letras e números). Deixe os dois campos vazios para manter a senha;
- escolhe a **Aparência** (claro, escuro ou automático);
- liga a **verificação em duas etapas**;
- liga os **avisos no celular**;
- vê os **aparelhos conectados** e pode **Sair de todos**;
- vê a sua atividade do último ano (mapa de calor) e o seu nível de acesso;
- pode **Ver o tour** de novo.

## Tema claro e escuro

Em **Meu perfil → Aparência**, escolha **Claro**, **Escuro** ou **Automático** (segue o modo do computador ou do celular). A escolha vale para o navegador em que você está.

## Aparelhos conectados

Em **Meu perfil → Aparelhos conectados** aparece cada computador ou celular em que você está logado. Esqueceu o Portal aberto em outro computador? Encerre a sessão dele ali, ou use **Sair de todos**.

## Avisos no celular

Em **Meu perfil → Avisos no celular**, clique em **Ligar neste aparelho** e aceite a permissão do navegador. A partir daí os avisos do sino (chamado novo, menção, lembrete...) chegam como notificação mesmo com o Portal fechado. Use **Enviar um teste** para conferir e **Desligar neste aparelho** para parar.

> Alguns navegadores (como o Brave) bloqueiam esse tipo de aviso por padrão. Se der erro, o Portal explica o que ajustar.

## Instalar como aplicativo

No celular ou no computador, o navegador oferece **Instalar** ou **Adicionar à tela inicial**. O Portal passa a abrir como um aplicativo, com ícone próprio.

## Conhecendo a tela

### Menu lateral

O menu fica à esquerda e abre ao passar o mouse (no celular, pelo botão de menu no topo). Ele é dividido em grupos:

- **Início**: Visão geral, Minha agenda, Calendário e Chat.
- **Trabalho**: Demandas, Chamados, Sprints e retros, Projetos, Clientes e Base de conhecimento.
- **Equipe**: Escala, Avaliações e metas, Pessoas, Painel e Manutenção.
- **Copa**: Estoque (Itens e saldos, Pedidos da equipe, Planejamento, Relatórios e Histórico).
- **Administração** (só administradores): Usuários e Marca e segurança.

Números ao lado dos itens mostram o que espera por você (demandas em aberto, chamados na fila do seu time, mensagens não lidas). Em vermelho, há algo atrasado ou uma conversa direta.

No rodapé do menu fica o seu nome (abre **Meu perfil**) e o botão **Sair do sistema**.

### Barra do topo

- **Importar / Exportar**: aparece nas telas que têm planilha (veja [Importar e exportar](16-importar-exportar.md)).
- **Cronômetro**: se você tiver um cronômetro rodando numa demanda, ele aparece aqui; clique para abrir a demanda.
- **+ Criar**: atalhos para criar Nova demanda, Abrir chamado, Novo compromisso, Pedir ausência e Pedido da copa. Ele não repete o que a tela aberta já cria.
- **Buscar em tudo** (**Ctrl+K**).
- **Chat**: abre o chat num painel ao lado, sem sair da tela.
- **Sino de avisos**.
- O seu perfil de acesso (Administrador, Membro ou Somente leitura).

### Buscar em tudo (Ctrl+K)

Aperte **Ctrl+K** (ou clique na lupa) e digite pelo menos 2 letras. A busca encontra demandas, chamados, projetos, artigos, pessoas e mais. Dá para buscar pelo código: **DEM-12**, **CH-3**, **PRJ-5** ou a chave do Jira.

A mesma caixa faz ações rápidas: digite "nova demanda", "escala", "meu perfil", "tour" e aperte **Enter**.

### Sino de avisos

O sino mostra os avisos para você: demandas e chamados (atribuições, comentários, menções, chamados novos para o seu time), compromissos da agenda, chat, ausências, mural e outros.

- Filtre por **Todos**, **Não lidos**, **Menções**, **Demandas e chamados**, **Chat**, **Prazos** e **Atividade**.
- Clique num aviso para abrir o item.
- **Marcar todas como lidas** limpa a contagem.
- **Receber avisos também com o Portal minimizado** liga o aviso do sistema operacional enquanto o Portal está aberto em segundo plano.

### Janelas de confirmação

Ações que não têm volta (excluir, cancelar, recusar) abrem uma janela pedindo confirmação. Algumas pedem também um **Motivo**. Leia antes de confirmar.

### Tour do Portal

Na primeira entrada, um tour curto mostra onde fica cada coisa: menu, demandas, chamados, busca, chat, avisos e perfil. Para ver de novo: **Meu perfil → Ver o tour**, ou busque "tour" no **Ctrl+K**.

### Página não encontrada

Se você abrir um endereço que não existe, o Portal mostra **Página não encontrada** com o botão **Voltar para o Portal**.

## Quem pode

| Ação | Administrador | Membro | Somente leitura |
| --- | --- | --- | --- |
| Entrar, mudar a própria senha, foto, tema e avisos | Sim | Sim | Sim |
| Ligar e desligar a própria verificação em duas etapas | Sim | Sim | Sim |
| Usar o botão "+ Criar" | Sim | Sim | Não |
| Redefinir a senha ou a verificação de outra pessoa | Sim | Não | Não |
