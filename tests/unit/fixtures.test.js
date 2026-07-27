import test from "node:test";
import assert from "node:assert/strict";

import { loadJsonFixture } from "../helpers/load-json-fixture.js";

test("fixture vazia representa um estado válido da v0.1", async () => {
  const state = await loadJsonFixture("states/state-v0.1-empty.json");

  assert.equal(state.schemaVersion, 1);
  assert.equal(state.settings.theme, "system");
  assert.equal(state.settings.reviewLimit, 30);
  assert.deepEqual(state.decks, []);
  assert.deepEqual(state.cards, []);
  assert.deepEqual(state.sessions, []);
});

test("fixture normal preserva entidades e relacionamentos", async () => {
  const state = await loadJsonFixture("states/state-v0.1-normal.json");

  assert.equal(state.decks.length, 2);
  assert.equal(state.cards.length, 3);
  assert.equal(state.sessions.length, 1);

  const deckIds = new Set(state.decks.map((deck) => deck.id));

  for (const card of state.cards) {
    assert.ok(deckIds.has(card.deckId));
  }

  assert.equal(state.sessions[0].total, 2);
  assert.equal(state.sessions[0].answered, 2);
  assert.equal(state.sessions[0].results.length, 2);
});
