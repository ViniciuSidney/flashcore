import { readFile } from "node:fs/promises";

export async function loadTextFixture(relativePath) {
  const fixtureUrl = new URL(`../fixtures/${relativePath}`, import.meta.url);
  const content = await readFile(fixtureUrl, "utf8");

  return content.replace(/^\uFEFF/, "");
}

export async function loadJsonFixture(relativePath) {
  return JSON.parse(await loadTextFixture(relativePath));
}
