/**
 * @file This file contains unit tests for functionality in file `../output.ts`.
 */

import test, { ExecutionContext } from "ava";
import * as spec from "../output";
import * as input from "../input";
import * as t from "runtypes";
import * as common from "./common";
import * as errors from "../errors";

const runValidationForOneValue = (
  c: ExecutionContext,
  validation: t.Runtype,
  input: unknown,
  shouldSucceed: boolean,
) => {
  c.plan(1);
  const result = validation.validate(input);
  c.deepEqual(result.success, shouldSucceed);
};

const rowValidation = t.Record({ id: t.String });
const manyRows = spec.many(rowValidation);

test(
  "Validate that validation for many rows works for empty array",
  runValidationForOneValue,
  manyRows,
  [],
  true,
);
test(
  "Validate that validation for many rows works for array of one element",
  runValidationForOneValue,
  manyRows,
  [{ id: "id" }],
  true,
);
test(
  "Validate that validation for many rows works for array of two elements",
  runValidationForOneValue,
  manyRows,
  [{ id: "id" }, { id: "another" }],
  true,
);
test(
  "Validate that validation for many rows doesn't work for non-array",
  runValidationForOneValue,
  manyRows,
  "garbage",
  false,
);

test("Validate that validateRows invokes given validation", async (c) => {
  c.plan(2);
  const firstQueryResult = ["returnedRow"];
  const secondQueryResult = [42];
  const { usingMockedClient } = common.createMockedClientProvider([
    firstQueryResult,
    secondQueryResult,
  ]);
  const executor = spec.validateRows(
    input.prepareSQL`SELECT 1`(usingMockedClient),
    spec.many(t.String),
  );
  c.deepEqual(await executor([]), ["returnedRow"]);
  await c.throwsAsync(async () => await executor([]), {
    instanceOf: errors.SQLQueryOutputValidationError,
  });
});

test("Validate that validateOneRow invokes given validation", async (c) => {
  c.plan(3);
  const firstQueryResult = ["returnedRow"];
  const secondQueryResult = ["one", "two"];
  const thirdQueryResult = "bad-query";
  const { usingMockedClient } = common.createMockedClientProvider([
    firstQueryResult,
    secondQueryResult,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thirdQueryResult as any,
  ]);
  const executor = spec.validateOneRow(
    input.prepareSQL`SELECT 1`(usingMockedClient),
    // Validator for single row, not many rows!
    t.String,
  );
  c.deepEqual(await executor([]), "returnedRow");
  await c.throwsAsync(async () => await executor([]), {
    instanceOf: errors.SQLQueryOutputValidationError,
    message: "Expected array to contain exactly one element, but contained 2.",
  });
  await c.throwsAsync(async () => await executor([]), {
    instanceOf: errors.SQLQueryOutputValidationError,
    message: "Expected string[], but was string",
  });
});
