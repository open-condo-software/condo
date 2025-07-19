Local development and debug
=====

For easy local development you can add `.env` config:

```shell
FILE_FIELD_ADAPTER=local
TESTS_FAKE_CLIENT_MODE=true
TESTS_FAKE_WORKER_MODE=true
TESTS_LOG_REQUEST_RESPONSE=true
NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE=true
FAKE_ADDRESS_SUGGESTIONS=true
```

- `TESTS_FAKE_CLIENT_MODE` -- switch to mode where the tests are executed in the same process as the web server
- `TESTS_FAKE_WORKER_MODE` -- switch to mode where a task worker is executed in the same process as the tests
- `TESTS_LOG_REQUEST_RESPONSE` -- console.log GraphQL requests and responses
- `NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE` -- switch to mode where SendMessageService just display the messages to console
- `FILE_FIELD_ADAPTER` -- store uploading files locally
- `FAKE_ADDRESS_SUGGESTIONS` -- switch to mode where fake address suggestion service used in tests / server-side validations

With that configs you can easily use `debugger` or IDE breakpoints to debug.
Check `package.json` for debug command (`node inspect`).

## Pre-commit hooks

Pre-commit hooks are managed with Husky.

To install actual hook into Git, please run:

```shell
yarn run prepare
```