import { test } from "node:test";
import assert from "node:assert/strict";
import { canUseStockTeam, pickStockTeam, stockTeamsOf } from "../app/stock-team-rules.ts";

const teams = [{ id: 1, name: "Suporte" }, { id: 2, name: "Desenvolvimento" }, { id: 3, name: "Liderança" }];

test("cada pessoa só tem o estoque dos próprios times; administrador tem todos", () => {
  assert.deepEqual(stockTeamsOf("member", teams, [2]).map((team) => team.id), [2], "desenvolvedor vê só o Desenvolvimento");
  assert.deepEqual(stockTeamsOf("viewer", teams, [1]).map((team) => team.id), [1]);
  assert.deepEqual(stockTeamsOf("member", teams, []), [], "sem time, sem estoque");
  assert.deepEqual(stockTeamsOf("admin", teams, []).map((team) => team.name), ["Desenvolvimento", "Liderança", "Suporte"], "administrador vê todos, em ordem alfabética");
  assert.deepEqual(stockTeamsOf("admin", teams, [1]).map((team) => team.name), ["Suporte", "Desenvolvimento", "Liderança"], "o time do administrador vem primeiro (é o que abre)");
});

test("o time pedido pela tela só vale se a pessoa tiver acesso", () => {
  const dev = stockTeamsOf("member", teams, [2]);
  assert.equal(pickStockTeam(dev, 1), 2, "desenvolvedor pedindo o Suporte cai no próprio time");
  assert.equal(pickStockTeam(dev, "2"), 2);
  assert.equal(pickStockTeam(dev, null), 2);
  assert.equal(pickStockTeam([], 1), null);
  assert.equal(pickStockTeam(stockTeamsOf("admin", teams, []), 1), 1, "administrador escolhe qualquer um");
  const lead = stockTeamsOf("admin", teams, [1, 3]);
  assert.equal(pickStockTeam(lead, null), 3, "sem escolha: o primeiro time da pessoa");
  assert.equal(pickStockTeam(lead, null, [1]), 1, "sem escolha: prefere um time da pessoa que já tem itens");
  assert.equal(pickStockTeam(lead, "", [1]), 1);
});

test("mexer em item de outro time é recusado", () => {
  const dev = stockTeamsOf("member", teams, [2]);
  assert.equal(canUseStockTeam(dev, 1), false);
  assert.equal(canUseStockTeam(dev, 2), true);
  assert.equal(canUseStockTeam(dev, null), false, "item sem time fica só com administradores");
});
