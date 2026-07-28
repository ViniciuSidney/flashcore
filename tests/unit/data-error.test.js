import test from "node:test";
import assert from "node:assert/strict";

import {
  DATA_ERROR_CATEGORIES,
  DATA_ERROR_CODES
} from "../../src/scripts/shared/errors/data-error.constants.js";

import {
  DataError,
  isDataError
} from "../../src/scripts/shared/errors/data-error.js";

test("categorias e códigos centrais permanecem estáveis", () => {
  assert.equal(
    DATA_ERROR_CATEGORIES.STORAGE,
    "storage"
  );

  assert.equal(
    DATA_ERROR_CODES.STORAGE_WRITE_FAILED,
    "STORAGE_WRITE_FAILED"
  );

  assert.equal(
    DATA_ERROR_CODES.REMOTE_RESULT_AMBIGUOUS,
    "REMOTE_RESULT_AMBIGUOUS"
  );
});

test("DataError representa uma falha técnica controlada", () => {
  const cause = new Error("Falha original");

  const error = new DataError({
    code: DATA_ERROR_CODES.STORAGE_WRITE_FAILED,
    category: DATA_ERROR_CATEGORIES.STORAGE,
    userMessageKey: "errors.storage.writeFailed",
    technicalMessage: "Não foi possível gravar o estado.",
    retryable: true,
    cause,
    context: {
      operation: "writePrimary"
    }
  });

  assert.ok(error instanceof Error);
  assert.equal(error.name, "DataError");
  assert.equal(error.code, "STORAGE_WRITE_FAILED");
  assert.equal(error.category, "storage");
  assert.equal(error.retryable, true);
  assert.equal(error.cause, cause);
  assert.equal(error.context.operation, "writePrimary");
});

test("DataError possui valores padrão seguros", () => {
  const error = new DataError({
    code: DATA_ERROR_CODES.STATE_INVALID,
    technicalMessage: "Estado inválido."
  });

  assert.equal(error.category, "unknown");
  assert.equal(error.userMessageKey, "errors.unknown");
  assert.equal(error.retryable, false);
  assert.equal(error.cause, null);
  assert.deepEqual(error.context, {});
  assert.equal(Object.isFrozen(error.context), true);
});

test("DataError rejeita configurações incompletas", () => {
  assert.throws(
    () => new DataError(),
    /code deve ser uma string não vazia/
  );

  assert.throws(
    () => new DataError({
      code: "TEST_ERROR",
      category: "categoria-inexistente"
    }),
    /Categoria de erro inválida/
  );
});

test("isDataError diferencia erros controlados", () => {
  const controlledError = new DataError({
    code: "TEST_ERROR",
    technicalMessage: "Erro de teste."
  });

  assert.equal(isDataError(controlledError), true);
  assert.equal(isDataError(new Error("Comum")), false);
  assert.equal(isDataError(null), false);
});
