# Portal da Equipe: regras do projeto

Visão técnica do projeto (como rodar, publicar, migrações, segurança e sistema visual): veja o `README.md`.

## Manual de uso (`docs/manual/`)

O manual em `docs/manual/` explica o Portal para quem usa, sem termos de programação. Ele tem um capítulo por módulo (índice em `docs/manual/README.md`), perguntas frequentes e o changelog `docs/manual/novidades.md`.

**Regra: toda mudança que altera tela, fluxo ou permissão atualiza o manual no mesmo commit.**

Isso inclui: tela, aba, botão ou campo novo, renomeado ou removido; mudança no passo a passo de uma ação; mudança em quem pode fazer o quê (perfil Administrador/Membro/Somente leitura, líder de time ou permissão individual); importação/exportação; avisos do sino.

Como fazer:

1. Ache o capítulo do módulo no índice (`docs/manual/README.md`) e atualize a seção certa: "Para que serve", o passo a passo e a tabela **Quem pode**. Use os nomes exatos dos botões e menus como aparecem na tela.
2. Módulo novo ganha um capítulo novo, numerado, e uma linha no índice.
3. Se a mudança gera uma dúvida comum, acrescente uma pergunta em `perguntas-frequentes.md`.
4. Acrescente uma linha em `docs/manual/novidades.md` na data do dia, com o link do capítulo.
5. Confira permissões no servidor (`app/api/*/route.ts`), não só na tela: o manual descreve o que o servidor permite.

Escrita do manual: português simples, frases curtas, segunda pessoa ("clique em..."), negrito nos nomes de botões e menus. Exemplos sempre fictícios (ex.: "Ana Souza", "Padaria Exemplo", "Clínica Modelo"): nunca nomes de pessoas, clientes, e-mails ou dados reais.

Mudanças sem efeito para quem usa (refatoração, testes, performance invisível, infraestrutura) não mexem no manual.

## Outras regras

- Nunca abra nem faça commit das planilhas `.xlsx` (têm dados de clientes). `backups/` e `video/` ficam fora do git.
- Não exponha tokens ou segredos em código, commits ou documentação.
