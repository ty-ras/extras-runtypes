# Typesafe REST API Specification Extras - Configuration Utilities for Runtypes

[![Coverage](https://codecov.io/gh/ty-ras/extras-runtypes/branch/main/graph/badge.svg?flag=config)](https://codecov.io/gh/ty-ras/extras-runtypes)

This folder contains library which exposes few utility functions which can be used by both backend and frontend applications to read configurations from strings (e.g. environment variables).
The strings are parsed as necessary and then validated at runtime using [`runtypes`](https://github.com/pelotom/runtypes) library.

# Using in Frontend

```ts
import * as t from "runtypes";
import { configuration } from "@ty-ras-extras/frontend-runtypes";
// Or, if not using bundled libraries: import * as configuration from "@ty-ras-extras/config-runtypes/string";

// Define runtime validation of configuration
const validation = t.Record({
  someStringProperty: t.String,
});
// Acquire configuration
export const config = configuration.validateFromStringifiedJSONOrThrow(
  validation,
  import.meta.env["MY_FE_CONFIG"], // Or, if webpack: process.env["MY_FE_CONFIG"]),
);
// The compile-time type of 'config' is now:
// {
//   someStringProperty: string
// }
```

# Using in Backend
For situations where environment variable is always serialized JSON:
```ts
import * as t from "runtypes";
import { configuration } from "@ty-ras-extras/backend-runtypes";
// Or, if not using bundled libraries: import * as configuration from "@ty-ras-extras/config-runtypes";

// Define runtime validation of configuration
const validation = t.Record({
  someStringProperty: t.String,
});
// Acquire configuration
export const config = configuration.validateFromStringifiedJSONOrThrow(
  validation,
  process.env["MY_BE_CONFIG"],
);
// The compile-time type of 'config' is now:
// {
//   someStringProperty: string
// }
```

For situations where environment variable is either serialized JSON or a path to file containing serialized JSON:
```ts
import * as t from "runtypes";
import { configuration } from "@ty-ras-extras/backend-runtypes";
// Or, if not using bundled libraries: import * as configuration from "@ty-ras-extras/config-runtypes";

// Define runtime validation of configuration
const validation = t.Record({
  someStringProperty: t.String,
});
// Acquire configuration
export const acquireConfiguration = async () => configuration.validateFromStringifiedJSONOrThrow(
  validation,
  await configuration.getJSONStringValueFromStringWhichIsJSONOrFilename(
    process.env["MY_BE_CONFIG"]
  )
);
// The compile-time type of 'acquireConfiguration' is now:
// () => Promise<{
//   someStringProperty: string
// }>
```
