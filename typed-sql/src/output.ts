/**
 * @file This file contains code related to validating output of {@link input.SQLQueryExecutor}.
 */

import * as t from "runtypes";
import type * as query from "./input";
import * as errors from "./errors";

/* eslint-disable @typescript-eslint/ban-types */

// Unfortunately, runtypes is not capable of transforming values.
// There is some discussion in issue https://github.com/pelotom/runtypes/issues/56
// And PR: https://github.com/pelotom/runtypes/pull/191
// However, this doesn't seem to be happening anytime soon, so just leave this out for now.
// /**
//  * Creates `runtypes` validator which ensures that input array of rows contains exactly one row with given shape.
//  * @param singleRow The `runtypes` validator for row object.
//  * @returns The `runtypes` validator which takes an array of rows as input, and ensures that array contains exactly one element. That element is then validated using given validator.
//  */
// export const one = <TValidation extends t.Runtype>(
//   singleRow: TValidation,
// ): t.Runtype<t.Static<TValidation>> =>
//   many(singleRow).withConstraint<t.Static<TValidation>, void>(
//     (array) =>
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//       array.length == 1
//         ? array[0]
//         : `Expected exactly 1 row, but got ${array.length}.`,
//     { name: "SingleRow" },
//   );

/**
 * Creates `runtypes` validator which ensures that all rows of input array match given shape.
 * @param singleRow The `runtypes` validator for row object.
 * @returns The `runtypes` validator which takes an array of rows as input, and ensures that all array elements adher to given validator. The array length is not checked.
 */
export const many = <TValidation extends t.Runtype>(
  singleRow: TValidation,
): t.Runtype<Array<t.Static<TValidation>>> => t.Array(singleRow);

/**
 * Creates {@link input.SQLQueryExecutor}, which takes input from rows produced from another {@link input.SQLQueryExecutor} and validate them using the given `runtypes` validation.
 * @param executor The {@link query.SQLQueryExecutor} which will provide the rows to validate.
 * @param validation The `runtypes` validation, typically obtained via {@link one} or {@link many}.
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return maybeResult.value;
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
