import test from "node:test";
import assert from "node:assert/strict";

import {
  loadJsonFixture,
  loadTextFixture
} from "../helpers/load-json-fixture.js";

test("fixture de IDs duplicados contém baralhos e cards repetidos", async () => {
  const state = await loadJsonFixture(
    "states/state-v0.1-duplicate-ids.json"
  );

  const deckIds = state.decks.map((deck) => deck.id);
  const cardIds = state.cards.map((card) => card.id);

  assert.ok(new Set(deckIds).size < deckIds.length);
  assert.ok(new Set(cardIds).size < cardIds.length);
});

test("fixture de card órfão referencia um baralho inexistente", async () => {
  const state = await loadJsonFixture(
    "states/state-v0.1-orphan-card.json"
  );

  const deckIds = new Set(state.decks.map((deck) => deck.id));

  assert.ok(
    state.cards.some((card) => !deckIds.has(card.deckId))
  );
});

test("fixture de sessão inválida contém inconsistências estruturais", async () => {
  const state = await loadJsonFixture(
    "states/state-v0.1-invalid-session.json"
  );

  const session = state.sessions[0];

  assert.equal(Array.isArray(session.results), false);
  assert.ok(session.durationMs < 0);
  assert.ok(session.endedAt < session.startedAt);
  assert.ok(session.answered > session.total);
});

test("fixture legada representa o formato flashcore.v1.1", async () => {
  const legacy = await loadJsonFixture(
    "states/state-legacy-v1.1.json"
  );

  assert.equal("schemaVersion" in legacy, false);
  assert.equal("sessions" in legacy, false);
  assert.ok(Array.isArray(legacy.decks));
  assert.ok(Array.isArray(legacy.cards));
  assert.equal(typeof legacy.cards[0].tags, "string");
});

test("fixture corrompida não pode ser interpretada como JSON", async () => {
  const content = await loadTextFixture(
    "states/state-corrupted.txt"
  );

  assert.throws(() => JSON.parse(content), SyntaxError);
});
