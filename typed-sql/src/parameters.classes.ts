/**
 * @file This only file contains classes to be used as parameters within SQL string literals.
 */

import type * as t from "runtypes";

/**
 * This class is used to represent raw SQL string and not SQL parameter, within SQL string template.
 * The given string will not be escaped or otherwise processed.
 * Useful when having multiple queries re-using e.g. same `WHERE` condition.
 *
 * Notice that only type information about this class is exported.
 */
export class SQLRaw {
  /**
   * Creates new instance of this class.
   * @param rawSQL The raw SQL as `string`.
   */
  public constructor(public readonly rawSQL: string) {}
}

/**
 * This class is used to represent SQL parameter within SQL string template.
 *
 * Notice that only type information about this class is exported.
 */
export class SQLParameter<
  TName extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TValidation extends t.Runtype<any>,
> {
  /**
   * Creates new instance of this class.
   * @param parameterName The name of the parameter.
   * @param validation The native `runtypes` validation object which will be used to validate the parameter value.
   */
  public constructor(
    public readonly parameterName: TName,
    public readonly validation: TValidation,
  ) {}
}
