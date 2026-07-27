import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const projectRoot = new URL("../../", import.meta.url);

function projectFile(path) {
  return new URL(path, projectRoot);
}

test("arquivos essenciais da v0.1 permanecem disponíveis", async () => {
  const essentialFiles = [
    "index.html",
    "src/scripts/main.js",
    "src/scripts/app.js",
    "src/scripts/core/config.js",
    "src/scripts/core/state.js",
    "src/styles/main.css",
    "public/favicon.svg",
    "public/manifest.json",
    "tests/manual-tests.md"
  ];

  await Promise.all(
    essentialFiles.map((file) => access(projectFile(file)))
  );
});

test("index mantém os pontos de entrada homologados", async () => {
  const html = await readFile(projectFile("index.html"), "utf8");

  assert.match(
    html,
    /src\/styles\/main\.css\?v=0\.1\.14/
  );

  assert.match(
    html,
    /src\/scripts\/main\.js\?v=0\.1\.8/
  );

  assert.match(html, /id="appView"/);
  assert.match(html, /id="appDialog"/);
  assert.match(html, /id="toastRegion"/);
  assert.match(html, /lang="pt-BR"/);
});

test("módulo principal preserva a inicialização da aplicação", async () => {
  const source = await readFile(
    projectFile("src/scripts/main.js"),
    "utf8"
  );

  assert.match(source, /app\.js\?v=0\.1\.8/);
  assert.match(source, /DOMContentLoaded/);
  assert.match(source, /initApp\(\)/);
  assert.match(source, /appInitialized/);
});
