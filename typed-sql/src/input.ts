/**
 * @file This file contains code to build {@link SQLQueryInformation} from [template string literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
 */

import * as t from "runtypes";
import * as parameters from "./parameters";
import type * as classes from "./parameters.classes";
import * as errors from "./errors";

/* eslint-disable @typescript-eslint/ban-types */

/**
 * Creates new {@link SQLQueryInformation} from [template string literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) which doesn't have any `${...}` parameters within it.
 * @param template The template string literal as array.
 * @returns The {@link SQLQueryInformation} which produces {@link SQLQueryExecutor} requiring no input arguments.
 * @see SQLQueryInformation
 * @example
 * ```ts
 * import * as sql from "@ty-ras-extras/typed-sql-runtypes";
 *
 * const info = sql.prepareSQL`SELECT * FROM table;`;
 * // Info will be of type `SQLQueryInformation<void>`.
 * ```
 */
export function prepareSQL(
  template: TemplateStringsArray,
): SQLQueryInformation<void>;

/**
 * Creates new {@link SQLQueryInformation} which produces {@link SQLQueryExecutor} requiring inputs as specified by `${...}` used within [template string literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
 * @param template The template string literal as array.
 * @param args The `${...}` arguments used within template string.
 * @returns The {@link SQLQueryInformation} which produces {@link SQLQueryExecutor} requiring inputs as specified by `${...}` used within template string.
 * @see SQLQueryInformation
 * @example
 * ```ts
 * import * as sql from "@ty-ras-extras/typed-sql-runtypes";
 * import * as t from "runtypes";
 *
 * const info = sql.prepareSQL`SELECT * FROM table WHERE column = ${sql.param("column", t.string())}`;
 * // Info will be of type `SQLQueryInformation<{ column: string }>
 * ```
 */
export function prepareSQL<
  TArgs extends [
    parameters.SQLTemplateParameter,
    ...Array<parameters.SQLTemplateParameter>,
  ],
>(
  template: TemplateStringsArray,
  ...args: TArgs
): SQLQueryInformation<
  TArgs[number] extends classes.SQLRaw ? void : SQLParameterReducer<TArgs>
>;
/**
 * Creates new {@link SQLQueryInformation} which produces {@link SQLQueryExecutor} requiring inputs as specified by `${...}` used within [template string literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
 * @param template The template string literal as array.
 * @param args The `${...}` arguments used within template string.
 * @returns The {@link SQLQueryInformation} which produces {@link SQLQueryExecutor} requiring inputs as specified by `${...}` used within template string.
 * @see SQLQueryInformation
 * @example
 * ```ts
 * import * as sql from "@ty-ras-extras/typed-sql-runtypes";
 * import * as t from "runtypes";
 *
 * const info = sql.prepareSQL`SELECT * FROM table WHERE column = ${sql.param("column", t.string())}`;
 * // Info will be of type `SQLQueryInformation<{ column: string }>
 * ```
 */
export function prepareSQL<
  TArgs extends Array<parameters.SQLTemplateParameter>,
>(
  template: TemplateStringsArray,
  ...args: TArgs
): SQLQueryInformation<void | SQLParameterReducer<TArgs>> {
  const {
    parameterValidation,
    parameterNames,
    templateIndicesToParameterIndices,
  } = getParameterValidationAndNames(args);

  return ({ constructParameterReference, executeQuery }) => {
    const queryString = constructTemplateString(template, args, (argIdx) => {
      let thisFragment: string;
      const arg = args[argIdx];
      if (parameters.isSQLParameter(arg)) {
        const parameterIndex = templateIndicesToParameterIndices[argIdx];
        if (parameterIndex === undefined) {
          /* c8 ignore next 4 */
          throw new Error(
            `Internal error: parameter index for template arg at ${argIdx} was not defined when it should've been.`,
          );
        }
        thisFragment = constructParameterReference(parameterIndex, arg);
      } else {
        thisFragment = arg.rawSQL;
      }
      return thisFragment;
    });

    // It is possible to do this also via Object.assign
    // https://stackoverflow.com/questions/12766528/build-a-function-object-with-properties-in-typescript
    // However, I think this way is nicer.
    // It is from https://bobbyhadz.com/blog/typescript-assign-property-to-function
    async function executor(
      client: Parameters<typeof executeQuery>[0],
      queryParameters: void | SQLParameterReducer<TArgs>,
    ) {
      const maybeParameters = parameterValidation.validate(queryParameters);
      if (!maybeParameters.success) {
        throw new errors.SQLQueryInputValidationError(maybeParameters);
      }
      const validatedParameters = maybeParameters.value;
      return await executeQuery(
        client,
        queryString,
        parameterNames.map(
          (parameterName) => validatedParameters?.[parameterName],
        ),
      );
    }
    executor.sqlString = queryString;
    return executor;
  };
}

/**
 * This is auxiliary type used by {@link prepareSQL} to convert an array of {@link parameters.SQLTemplateParameter} into an object with named properties of `runtypes` validated types.
 * The tuple reducer idea originally spotted from [StackOverflow](https://stackoverflow.com/questions/69085499/typescript-convert-tuple-type-to-object).
 */
export type SQLParameterReducer<
  Arr extends Array<unknown>,
  Result extends Record<string, unknown> = {},
> = Arr extends []
  ? Result
  : Arr extends [infer Head, ...infer Tail]
  ? SQLParameterReducer<
      [...Tail],
      Result &
        (Head extends classes.SQLParameter<infer TName, infer TValidation>
          ? { [P in TName]: t.Static<TValidation> }
          : {})
    >
  : Readonly<Result>;

/**
 * This is return type of {@link prepareSQL}, which encapsulates the input type of the final {@link SQLQueryExecutor}.
 * It is a callback, capable of creating this {@link SQLQueryExecutor} given the {@link SQLClientInformation} to fill in vendor-specific functionality (e.g. how SQL parameters are stringified within final SQL string).
 */
export type SQLQueryInformation<TParameters> = <TClient>(
  clientInformation: SQLClientInformation<TClient>,
) => SQLQueryExecutor<TClient, TParameters, Array<unknown>>;

/**
 * This interface contains necessary vendor-specific functionality so that {@link SQLQueryInformation} can produce {@link SQLQueryExecutor}s.
 */
export interface SQLClientInformation<TClient> {
  /**
   * This function should produce final SQL string sent to database, representing the reference to this parameter.
   * @param parameterIndex The index of the parameter.
   * @param parameter The {@link classes.SQLParameter}.
   * @returns The string to be used in final SQL string sent to database, representing the reference to this parameter.
   */
  constructParameterReference: (
    parameterIndex: number,
    parameter: classes.SQLParameter<string, t.Runtype>,
  ) => string;

  /**
   * This function should use the given database connection, SQL string, and SQL parameters, to execute the query, and return any rows resulting from the query.
   * @param client The database connection.
   * @param sqlString The SQL string to execute.
   * @param parameters The parameters to use.
   * @returns Asynchronously returns either error or an array of rows.
   */
  executeQuery: (
    client: TClient,
    sqlString: string,
    parameters: Array<unknown>,
  ) => Promise<Array<unknown>>;
}

/**
 * This is {@link SQLQueryExecutorFunction} also exposing the SQL string via {@link WithSQLString} that is being used to send to the database, including parameter references returned by {@link SQLClientInformation#constructParameterReference}.
 */
export type SQLQueryExecutor<TClient, TParameters, TReturnType> =
  SQLQueryExecutorFunction<TClient, TParameters, TReturnType> & WithSQLString;

/**
 * This is type augmenting {@link SQLQueryExecutorFunction} with readonly SQL string property.
 * The property can be used in e.g. unit tests to verify that produced SQL string is expected and makes sense.
 */
export interface WithSQLString {
  /**
   * This will be the final SQL string to be sent to the database, including parameter references returned by {@link SQLClientInformation#constructParameterReference}.
   */
  readonly sqlString: string;
}

/**
 * This is callback type capturing the how to execute the final SQL with given parameters.
 * It returns actual callback which takes DB connection as input, and asynchronously returns either error or the result of successful SQL execution.
 */
export type SQLQueryExecutorFunction<TClient, TParameters, TReturnType> = (
  client: TClient,
  parameters: TParameters,
) => Promise<TReturnType>;

const constructTemplateString = <T>(
  fragments: TemplateStringsArray,
  args: ReadonlyArray<T>,
  transformArg: (idx: number, fragment: string) => string,
) =>
  fragments.reduce(
    (curString, fragment, idx) =>
      `${curString}${fragment}${
        idx >= args.length ? "" : transformArg(idx, fragment)
      }`,
    "",
  );

const getParameterValidationAndNames = (
  args: ReadonlyArray<parameters.SQLTemplateParameter>,
) => {
  const { parameterInstances, props, templateIndicesToParameterIndices } =
    args.reduce<{
      parameterInstances: Array<classes.SQLParameter<string, t.Runtype>>;
      props: { [_: string]: t.Runtype };
      templateIndicesToParameterIndices: Array<number | undefined>;
      namesToIndices: Record<string, number>;
    }>(
      (state, arg, idx) => {
        let paramIdx: number | undefined;
        if (parameters.isSQLParameter(arg)) {
          const parameterName = arg.parameterName;
          const existing = state.props[parameterName];
          if (existing) {
            if (arg.validation === existing) {
              paramIdx = state.namesToIndices[parameterName];
            } else {
              throw new errors.DuplicateSQLParameterNameError(parameterName);
            }
          } else {
            paramIdx = state.parameterInstances.length;
            state.parameterInstances.push(arg);
            state.namesToIndices[parameterName] = paramIdx;
            state.props[parameterName] = arg.validation;
          }
        } else if (!parameters.isRawSQL(arg)) {
          throw new errors.InvalidSQLTemplateArgumentError(idx);
        }
        state.templateIndicesToParameterIndices.push(paramIdx);
        return state;
      },
      {
        parameterInstances: [],
        props: {},
        templateIndicesToParameterIndices: [],
        namesToIndices: {},
      },
    );
  const parameterValidation =
    parameterInstances.length > 0
      ? t.Record(props)
      : // do NOT use t.Void here!
        // t.Void is same as t.Unknown, and it always accepts any value, probably not what we want in this case.
        t.Undefined;
  return {
    parameterValidation,
    parameterNames: parameterInstances.map((p) => p.parameterName),
    templateIndicesToParameterIndices,
  };
};
