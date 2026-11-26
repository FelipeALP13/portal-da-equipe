import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WALLPAPER, PHOTO_VEIL_DEFAULT, clampVeil, isChatPhotoUrl, parseWallpaper, wallpaperStyle } from "../app/chat-wallpaper.ts";

const photo = "/api/media?key=media%2Fchat%2F1b2c3d4e-aaaa-bbbb-cccc-1234567890ab.jpg";

test("fundo guardado é lido com segurança", () => {
  assert.deepEqual(parseWallpaper(null), DEFAULT_WALLPAPER);
  assert.deepEqual(parseWallpaper("não é json"), DEFAULT_WALLPAPER);
  assert.deepEqual(parseWallpaper(JSON.stringify({ kind: "preset", id: "pontos" })), { kind: "preset", id: "pontos" });
  assert.deepEqual(parseWallpaper(JSON.stringify({ kind: "preset", id: "inventado" })), DEFAULT_WALLPAPER);
  assert.deepEqual(parseWallpaper(JSON.stringify({ kind: "photo", url: photo, veil: 200 })), { kind: "photo", url: photo, veil: 90 });
});

test("foto só do próprio Portal", () => {
  assert.ok(isChatPhotoUrl(photo));
  assert.ok(isChatPhotoUrl("/api/media?key=media/chat/abc.png"));
  assert.ok(!isChatPhotoUrl("https://outro-site.example/foto.jpg"));
  assert.ok(!isChatPhotoUrl("/api/media?key=media%2Fprofiles%2Fabc.png"), "foto de perfil de outra pessoa não vira fundo");
  assert.ok(!isChatPhotoUrl('/api/media?key=media/chat/a.png") , url("x'), "sem escapar do CSS");
  assert.deepEqual(parseWallpaper(JSON.stringify({ kind: "photo", url: "javascript:alert(1)" })), DEFAULT_WALLPAPER);
});

test("véu da foto fica entre 50% e 90%", () => {
  assert.equal(clampVeil(10), 50);
  assert.equal(clampVeil("abc"), PHOTO_VEIL_DEFAULT);
  assert.equal(clampVeil(72.4), 72);
  assert.equal(wallpaperStyle({ kind: "preset", id: "liso" }), undefined);
  assert.match(wallpaperStyle({ kind: "photo", url: photo, veil: 70 })!.backgroundImage, /70%.*url\("\/api\/media/);
});
