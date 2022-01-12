Local development and debug
=====

For easy local development you can add `.env` config:

```shell
FILE_FIELD_ADAPTER=local
TESTS_FAKE_CLIENT_MODE=true
TESTS_FAKE_WORKER_MODE=true
TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS=true
NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE=true
```

- `TESTS_FAKE_CLIENT_MODE` -- switch to mode where the tests are executed in the same process as the web server
- `TESTS_FAKE_WORKER_MODE` -- switch to mode where a task worker is executed in the same process as the tests
- `TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS` -- console.log GraphQL request errors
- `NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE` -- switch to mode where SendMessageService just display the messages to console
- `FILE_FIELD_ADAPTER` -- store uploading files locally

With that configs you can easily use `debugger` or IDE breakpoints to debug.
Check `package.json` for debug command (`node inspect`).

## Pre-commit hooks

Pre-commit hooks are managed with Husky.

To install actual hook into Git, please run:

```shell
yarn run prepare
```

## Prettier

It takes changed code (Git stage) and formats it unobtrusively in pre-commit hook.
The best code convention is one, that forced automatically.

This way, all lines of code, affected by next commits will have consistent formatting.

Some Prettier rules are derived from ESLint

### Why Prettier and not only ESLint?

Not always attention is paid to indication of ESLint errors in IDE.
Since Prettier is automatic, no human mistakes will be made.

### Why formatting is not performed on CI level?

Formatting on CI level will make mess to the changes history, because formatting will be applied:

either by changing pushed commit on remote (we will get different local and remote SHA's);
or by creating a separate commit (will bloat changes history).
Locally installed Prettier acts on pre-commit phase locally, and we get instant feedback.

### Why @typescript-eslint/indent is disabled?

Because there is a clash of indentation rules between Prettier and ESLint in following case:

```
const { useObject, useObjects, useCreate, useUpdate, useDelete } = generateReactHooks<
    BillingAccount,
    BillingAccountUpdateInput,
    IBillingAccountFormState,
    IBillingAccountUIState,
    QueryAllBillingAccountsArgs
>(BillingAccountGQL, { convertToGQLInput, convertToUIState }
```

This code, formatted by Prettier, is handled as incorrect by ESLint.
I didn't found how to control ESLint especially for angle-brackets.
Just turned it off, it's not critical, IMHO.
https://stackoverflow.com/a/58977894/235158

### Error "husky - pre-commit hook exited with code 1 (error)"

It seems, like you are using external tool to work with Git ant it uses different version of Node.
Check your `~/.huskyrc`, `.nvmrc` or whatever you are using.