/**
 * @file This file contains common functionality used by unit tests.
 */

import type * as input from "../input";
import type * as parameters from "../parameters";

/* eslint-disable jsdoc/require-jsdoc */

export const createMockedClientProvider = (
  returnValues: ReadonlyArray<Array<unknown>>,
): {
  seenParameters: SeenParameters;
  usingMockedClient: input.SQLClientInformation<LoggedQueries>;
} => {
  let returnValueIndex = 0;
  const seenParameters: SeenParameters = [];
  return {
    seenParameters,
    usingMockedClient: {
      constructParameterReference: (index, parameter) => {
        seenParameters.push({ index, parameter });
        return `$${index + 1}`;
      },
      executeQuery: (client, query, parameters) => {
        client.push({ query, parameters });
        return Promise.resolve(returnValues[returnValueIndex++]);
      },
    },
  };
};

export type LoggedQueries = Array<{
  query: string;
  parameters: Array<unknown>;
}>;

export type SeenParameters = Array<{
  parameter: parameters.AnySQLParameter;
  index: number;
}>;
