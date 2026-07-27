import test from "node:test";
import assert from "node:assert/strict";

import { APP_CONFIG } from "../../src/scripts/core/config.js";

test("configuração-base da v0.1 permanece estável", () => {
  assert.equal(APP_CONFIG.name, "FlashCore");
  assert.equal(APP_CONFIG.version, "0.1.0");
  assert.equal(APP_CONFIG.schemaVersion, 1);
  assert.equal(APP_CONFIG.storageKey, "flashcore.app.v0.1");
  assert.deepEqual(APP_CONFIG.legacyStorageKeys, ["flashcore.v1.1"]);
  assert.equal(APP_CONFIG.defaultReviewLimit, 30);
  assert.equal(APP_CONFIG.maxSessionsStored, 50);
});
