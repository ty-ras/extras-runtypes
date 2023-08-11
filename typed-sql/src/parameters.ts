/**
 * @file This file contains types and functions related to SQL parameters and raw SQL strings.
 */

import type * as t from "runtypes";
import * as classes from "./parameters.classes";

/**
 * This is common type for any non-string entity within SQL string template literal.
 * @see AnySQLParameter
 * @see classes.SQLRaw
 */
export type SQLTemplateParameter = AnySQLParameter | classes.SQLRaw;

/**
 * This is {@link classes.SQLParameter} without any generic arguments.
 */
export type AnySQLParameter = classes.SQLParameter<string, t.Runtype>;

/**
 * This function will create new {@link classes.SQLRaw}.
 * @param str The raw SQL string. Will not be escaped or processed.
 * @returns A new instance of {@link classes.SQLRaw} to be used within SQL string template literal.
 */
export const raw = (str: string) => new classes.SQLRaw(str);

/**
 * This function will create new {@link classes.SQLParameter}.
 * @param name The name of the SQL parameter.
 * @param validation The native `runtypes` validation object, used to validate values passed as this parameter.
 * @returns A new instance of {@link classes.SQLParameter} to be used within SQL string template literal.
 */
export const param = <TName extends string, TValidation extends t.Runtype>(
  name: TName,
  validation: TValidation,
) => new classes.SQLParameter(name, validation);

/**
 * Function to check whether given {@link SQLTemplateParameter} is {@link AnySQLParameter}, since only type information about {@link classes.SQLParameter} is exported to library users.
 * @param templateParameter The {@link SQLTemplateParameter}.
 * @returns `true` if given `templateParameter` is {@link AnySQLParameter}, `false` otherwise.
 */
export const isSQLParameter = (
  templateParameter: SQLTemplateParameter,
): templateParameter is AnySQLParameter =>
  templateParameter instanceof classes.SQLParameter;

/**
 * Function to check whether given {@link SQLTemplateParameter} is {@link classes.SQLRaw}, since only type information about {@link classes.SQLRaw} is exported to library users.
 * @param templateParameter The {@link SQLTemplateParameter}.
 * @returns `true` if given `templateParameter` is {@link classes.SQLRaw}, `false` otherwise.
 */
export const isRawSQL = (
  templateParameter: SQLTemplateParameter,
): templateParameter is classes.SQLRaw =>
  templateParameter instanceof classes.SQLRaw;
