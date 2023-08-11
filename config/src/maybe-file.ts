/**
 * @file This file contains functionality to read JSON string, either directly as env variable, or if env variable looks like path, read the file contents from the path.
 */

import * as t from "runtypes";
import * as fs from "node:fs/promises";

/**
 * Interprets the given string either as inline JSON or as file path, reads the file contents if it is the latter, and returns the JSON as `string`.
 *
 * Notice that in order for `stringValue` to be recognized as file path, it must start with either `"."` or `"/"` character.
 * @param stringValue String value which will be interpreted as inline JSON or path to file containing JSON.
 * @returns Asynchronously returns string which is either given string value as-is, or read from path specified by given string.
 */
export const getJSONStringValueFromStringWhichIsJSONOrFilename = async (
  stringValue: string,
): Promise<string> => {
  // Check the string contents - should we treat it as JSON string or path to file?
  const { type, str } = extractConfigStringType(stringValue);
  return type === "JSON" ? str : await fs.readFile(str, "utf8");
};

/**
 * Helper function to invoke the {@link getJSONStringValueFromStringWhichIsJSONOrFilename}, and passing value of environment variable as input.
 * @param envVarName The name of the environment variable.
 * @param maybeString Value which may be a string.
 * @returns Asynchronously returns string value.
 * @throws Error if string is empty.
 */
export const getJSONStringValueFromMaybeStringWhichIsJSONOrFilenameFromEnvVar =
  async (envVarName: string, maybeString: unknown): Promise<string> => {
    // Check that it is actually non-empty string.
    const maybeNonEmpty = nonEmptyString.validate(maybeString);
    if (!maybeNonEmpty.success) {
      throw new Error(
        `The "${envVarName}" env variable must contain non-empty string.`,
      );
    }
    return await getJSONStringValueFromStringWhichIsJSONOrFilename(
      maybeNonEmpty.value,
    );
  };

type ConfigStringType = { type: "JSON" | "file"; str: string };

const JSON_STARTS_REGEX = /^\s*(\{|\[|"|t|f|\d|-|n)/;

const FILE_STARTS = [".", "/"];

const extractConfigStringType = (configString: string): ConfigStringType =>
  JSON_STARTS_REGEX.test(configString)
    ? {
        type: "JSON",
        str: configString,
      }
    : FILE_STARTS.some((s) => configString.startsWith(s))
    ? {
        type: "file",
        str: configString,
      }
    : doThrow(
        `The env variable string must start with one of the following: ${[
          JSON_STARTS_REGEX.source,
          ...FILE_STARTS,
        ]
          .map((s) => `"${s}"`)
          .join(",")}.`,
      );

const doThrow = (message: string) => {
  throw new Error(message);
};

const nonEmptyString = t.String.withConstraint((str) => str.length > 0);
