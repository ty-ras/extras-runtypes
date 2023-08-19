/**
 * @file This file contains code related to validating output of {@link input.SQLQueryExecutor}.
 */

import * as t from "runtypes";
import type * as query from "./input";
import * as errors from "./errors";

/**
 * Creates `runtypes` validator which ensures that all rows of input array match given shape.
 * @param singleRow The `runtypes` validator for row object.
 * @returns The `runtypes` validator which takes an array of rows as input, and ensures that all array elements adher to given validator. The array length is not checked.
 */
export const many = <TValidation extends t.Runtype>(
  singleRow: TValidation,
): t.Runtype<Array<t.Static<TValidation>>> => t.Array(singleRow);

/**
 * Creates {@link input.SQLQueryExecutor}, which takes input from rows produced from another {@link input.SQLQueryExecutor} and validates them using the given `runtypes` validation.
 * @param executor The {@link query.SQLQueryExecutor} which will provide the rows to validate.
 * @param validation The `runtypes` validation, typically obtained via {@link many}.
 * @returns The {@link input.SQLQueryExecutor}, which takes input from rows produced from another {@link input.SQLQueryExecutor} and validate them using the given `runtypes` validation.
 */
export const validateRows = <
  TClient,
  TParameters,
  TValidation extends t.Runtype,
>(
  executor: query.SQLQueryExecutor<TClient, TParameters, Array<unknown>>,
  validation: TValidation,
): query.SQLQueryExecutor<TClient, TParameters, t.Static<TValidation>> => {
  async function retVal(
    client: ClientOf<typeof executor>,
    parameters: ParametersOf<typeof executor>,
  ) {
    const maybeResult = validation.validate(await executor(client, parameters));
    if (!maybeResult.success) {
      throw new errors.SQLQueryOutputValidationError(maybeResult);
    }
    return maybeResult.value;
  }
  retVal.sqlString = executor.sqlString;
  return retVal;
};

/**
 * Creates {@link input.SQLQueryExecutor}, which takes input from rows produced from another {@link input.SQLQueryExecutor} and validates that only one row is present, and that the row passes the given `runtypes` validation.
 * @param executor The {@link query.SQLQueryExecutor} which will provide the rows to validate.
 * @param validation The `runtypes` validation for a single row.
 * @returns The {@link input.SQLQueryExecutor}, which takes input from rows produced from another {@link input.SQLQueryExecutor} and validate them using the given `runtypes` validation.
 */
export const validateOneRow = <
  TClient,
  TParameters,
  TValidation extends t.Runtype,
>(
  executor: query.SQLQueryExecutor<TClient, TParameters, Array<unknown>>,
  validation: TValidation,
): query.SQLQueryExecutor<TClient, TParameters, t.Static<TValidation>> => {
  const validateRows = many(validation);
  async function retVal(
    client: ClientOf<typeof executor>,
    parameters: ParametersOf<typeof executor>,
  ) {
    const maybeResult = validateRows.validate(
      await executor(client, parameters),
    );
    if (!maybeResult.success) {
      throw new errors.SQLQueryOutputValidationError(maybeResult);
    }
    const len = maybeResult.value.length;
    if (len !== 1) {
      throw new errors.SQLQueryOutputValidationError({
        success: false,
        code: "CONSTRAINT_FAILED",
        message: `Expected array to contain exactly one element, but contained ${len}.`,
      });
    }
    return maybeResult.value[0];
  }
  retVal.sqlString = executor.sqlString;
  return retVal;
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
type ParametersOf<TExecutor extends query.SQLQueryExecutor<any, any, any>> =
  TExecutor extends query.SQLQueryExecutor<
    infer _1,
    infer TParameters,
    infer _2
  >
    ? TParameters
    : never;

type ClientOf<TExecutor extends query.SQLQueryExecutor<any, any, any>> =
  TExecutor extends query.SQLQueryExecutor<infer TClient, infer _1, infer _2>
    ? TClient
    : never;
