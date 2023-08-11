/**
 * @file This file contains unit tests for functionality in file `../errors.ts`.
 */

import test from "ava";
import * as t from "runtypes";
import * as spec from "../errors";

test("Validate that isDuplicateSQLParameterNameError method works", (c) => {
  c.plan(5);
  c.true(
    spec.isDuplicateSQLParameterNameError(
      new spec.DuplicateSQLParameterNameError("parameterName"),
    ),
  );
  c.false(
    spec.isDuplicateSQLParameterNameError(
      new spec.InvalidSQLTemplateArgumentError(0),
    ),
  );
  c.false(
    spec.isDuplicateSQLParameterNameError(
      new spec.SQLQueryInputValidationError(error),
    ),
  );
  c.false(
    spec.isDuplicateSQLParameterNameError(
      new spec.SQLQueryOutputValidationError(error),
    ),
  );
  c.false(spec.isDuplicateSQLParameterNameError(new Error()));
});

test("Validate that isInvalidSQLTemplateArgumentError method works", (c) => {
  c.plan(5);
  c.true(
    spec.isInvalidSQLTemplateArgumentError(
      new spec.InvalidSQLTemplateArgumentError(0),
    ),
  );
  c.false(
    spec.isInvalidSQLTemplateArgumentError(
      new spec.DuplicateSQLParameterNameError("parameterName"),
    ),
  );
  c.false(
    spec.isInvalidSQLTemplateArgumentError(
      new spec.SQLQueryInputValidationError(error),
    ),
  );
  c.false(
    spec.isInvalidSQLTemplateArgumentError(
      new spec.SQLQueryOutputValidationError(error),
    ),
  );
  c.false(spec.isInvalidSQLTemplateArgumentError(new Error()));
});

test("Validate that isSQLQueryValidationError method works", (c) => {
  c.plan(5);
  c.true(
    spec.isSQLQueryValidationError(
      new spec.SQLQueryInputValidationError(error),
    ),
  );
  c.false(
    spec.isSQLQueryValidationError(
      new spec.DuplicateSQLParameterNameError("parameterName"),
    ),
  );
  c.false(
    spec.isSQLQueryValidationError(new spec.InvalidSQLTemplateArgumentError(0)),
  );
  c.true(
    spec.isSQLQueryValidationError(
      new spec.SQLQueryOutputValidationError(error),
    ),
  );
  c.false(spec.isSQLQueryValidationError(new Error()));
});

test("Validate that isSQLQueryInputValidationError method works", (c) => {
  c.plan(5);
  c.true(
    spec.isSQLQueryInputValidationError(
      new spec.SQLQueryInputValidationError(error),
    ),
  );
  c.false(
    spec.isSQLQueryInputValidationError(
      new spec.DuplicateSQLParameterNameError("parameterName"),
    ),
  );
  c.false(
    spec.isSQLQueryInputValidationError(
      new spec.InvalidSQLTemplateArgumentError(0),
    ),
  );
  c.false(
    spec.isSQLQueryInputValidationError(
      new spec.SQLQueryOutputValidationError(error),
    ),
  );
  c.false(spec.isSQLQueryInputValidationError(new Error()));
});

test("Validate that isSQLQueryOutputValidationError method works", (c) => {
  c.plan(5);
  c.true(
    spec.isSQLQueryOutputValidationError(
      new spec.SQLQueryOutputValidationError(error),
    ),
  );
  c.false(
    spec.isSQLQueryOutputValidationError(
      new spec.DuplicateSQLParameterNameError("parameterName"),
    ),
  );
  c.false(
    spec.isSQLQueryOutputValidationError(
      new spec.SQLQueryInputValidationError(error),
    ),
  );
  c.false(
    spec.isSQLQueryOutputValidationError(
      new spec.InvalidSQLTemplateArgumentError(0),
    ),
  );
  c.false(spec.isSQLQueryOutputValidationError(new Error()));
});

const error: t.Failure = {
  success: false,
  code: "TYPE_INCORRECT",
  message: "Hello",
};
