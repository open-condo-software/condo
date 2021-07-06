Local development and debug
=====

For easy local development you can add `.env` config:

```shell
TESTS_FAKE_CLIENT_MODE=true
TESTS_FAKE_WORKER_MODE=true
TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS=true
NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE=true
```

- `TESTS_FAKE_CLIENT_MODE` -- switch to mode where the tests are executed in the same process as the web server
- `TESTS_FAKE_WORKER_MODE` -- switch to mode where a task worker is executed in the same process as the tests
- `TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS` -- console.log GraphQL request errors
- `NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE` -- switch to mode where SendMessageService just display the messages to console

With that configs you can easily use `debugger` or IDE breakpoints to debug.
Check `package.json` for debug command (`node inspect`).
