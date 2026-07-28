import test from "node:test";
import assert from "node:assert/strict";

import {
  DATA_ERROR_CATEGORIES,
  DATA_ERROR_CODES
} from "../../src/scripts/shared/errors/data-error.constants.js";

import {
  DataError
} from "../../src/scripts/shared/errors/data-error.js";

import {
  createFailureResult,
  createSuccessResult,
  isResult
} from "../../src/scripts/shared/result.js";

test("resultado de sucesso possui o contrato completo", () => {
  const result = createSuccessResult({
    saved: true
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {saved: true});
  assert.equal(result.error, null);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.metadata, {});
});

test("resultado de falha exige DataError", () => {
  const error = new DataError({
    code: DATA_ERROR_CODES.STORAGE_READ_FAILED,
    category: DATA_ERROR_CATEGORIES.STORAGE,
    userMessageKey: "errors.storage.readFailed",
    technicalMessage: "Falha de leitura."
  });

  const result = createFailureResult(error);

  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.error, error);
});

test("Result cria cópias protegidas de avisos e metadados", () => {
  const warnings = ["WARNING_TEST"];
  const metadata = {
    source: "unit-test"
  };

  const result = createSuccessResult(null, {
    warnings,
    metadata
  });

  warnings.push("ALTERADO");
  metadata.source = "alterado";

  assert.deepEqual(result.warnings, ["WARNING_TEST"]);
  assert.equal(result.metadata.source, "unit-test");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.warnings), true);
  assert.equal(Object.isFrozen(result.metadata), true);
});

test("Result rejeita entradas estruturais inválidas", () => {
  assert.throws(
    () => createFailureResult(new Error("Erro comum")),
    /instância de DataError/
  );

  assert.throws(
    () => createSuccessResult(null, {
      warnings: "não é uma lista"
    }),
    /warnings deve ser uma lista/
  );

  assert.throws(
    () => createSuccessResult(null, {
      metadata: []
    }),
    /metadata deve ser um objeto/
  );
});

test("isResult reconhece somente o formato esperado", () => {
  const success = createSuccessResult("dados");

  assert.equal(isResult(success), true);
  assert.equal(isResult({ok: true}), false);
  assert.equal(isResult(null), false);
});
