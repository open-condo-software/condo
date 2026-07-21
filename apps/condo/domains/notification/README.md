# notifications

This domain contains all notification logic. 

Notification is a typed message which send to the user by transport.

Features:
 - all messages stored in DB for debugging
 - all message template logic hidden inside message.type
 - each message type have own template meta variables
 - we can change template logic in a future. Store it inside DB or in somewhere else.
 - support different transport (email, sms, push, ...)
 - sending messages by worker process
 - we can filter all messages related to some user or organization
 - we can deliver a message by user preferred transport (not implemented yet)
 - user can ignore some messages types if want (not implemented yet)

Everything you needed is to call `sendMessage` inside your code.

![sendMessage Sequence Diagram](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/open-condo-software/condo/main/apps/condo/domains/notification/docs/send-message-sequence-diagram.iuml)

# server side logic example

```javascript

const { COUNTRIES, DEFAULT_ENGLISH_COUNTRY } = require('@condo/domains/common/constants/countries')

const { INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

...

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    ...
    const organization = ..
    const user = ..
    const employee = ..

    ...
    await sendMessage(context, {
       to: { user },
       type: INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
       meta: {
           organizationName: organization.name,
           inviteCode: employee.inviteCode,
       },
       organization: { id: organiation.id },
    })
    ...
})
...

```

# test and debug

You can use `NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE` environment 
to fake transport.send() logic and display message context in console.

Debug and test purposes!

If you want to run tests inside your IDE with fake express server and in the same process worker
and display all transport messages in console use:

`.env`:
```
TESTS_FAKE_CLIENT_MODE=true
TESTS_FAKE_WORKER_MODE=true
NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE=true
```

# email providers

Email delivery goes through shared `EmailAdapter` (`@open-condo/keystone/emailAdapter`).
Provider is selected by `type` inside `EMAIL_API_CONFIG`:
- omitted / `mailgun` — Mailgun (backward compatible with existing configs)
- `sendsay` — Sendsay
- `unisendergo` — Unisender Go

Zod validates only common required fields (`api_url`, `from`); any additional keys are accepted.
Optional `doNotSendEmails: true` skips the provider call (useful in local/dev).
Inline CID images can be passed via `meta.inlineAttachments` (Mailgun uses `inline`; other providers rewrite `cid:` to data URIs).

## How to add a new provider

1. Implement an adapter class with static `type` and methods: `isConfigured`, `isEmailSupported`, `checkIsAvailable`, `send`
2. Register it in the `EMAIL_ADAPTERS` map in `packages/keystone/emailAdapter.js`
3. Set `EMAIL_API_CONFIG.type` to that type value

## Mailgun (default)

Required: `api_url`, `token`, `from`.

```bash
EMAIL_API_CONFIG='{"api_url":"https://api.mailgun.net/v3/<domain>/messages","token":"<api-key>","from":"Condo <noreply@example.com>","useTags":true,"useAttachingData":true}'
```

## Unisender Go

Uses [Unisender Go Web API](https://godocs.unisender.ru/web-api-ref#email-send) `email/send.json`.

Required: `type`, `api_url`, `token`, `from`.

Pick `api_url` for the data center where the account is registered (for example `go1` or `go2`).
Wrong data center typically returns API error code `114` (“User with id … not found”).

```bash
EMAIL_API_CONFIG='{"type":"unisendergo","api_url":"https://go1.unisender.ru/ru/transactional/api/v1","token":"<api-key>","from":"Condo <noreply@example.com>","useTags":true,"useAttachingData":true}'
```

- `token` — Unisender Go API key (`X-API-KEY`)
- `from` — sender email, optionally with display name (`Name <email@domain>`)

API key: Unisender Go dashboard → Account → Security → API key
(or project-level key under Settings → Projects).

Sender domain must be verified (SPF/DKIM) in Unisender Go before production sends.

## Sendsay

Uses Sendsay transactional API via `issue.send` with `group: "personal"`.

Required: `type`, `api_url`, `login`, `passwd`, `from`.

```bash
EMAIL_API_CONFIG='{"type":"sendsay","api_url":"https://api.sendsay.ru/general/api/v100/json","login":"<login>","sublogin":"<sublogin>","passwd":"<password>","from":"Condo <noreply@example.com>","useTags":true,"useAttachingData":true}'
```

- `api_url` — JSON endpoint base (`.../json`); account login is appended automatically as `.../json/<login>`
- `login` / `sublogin` / `passwd` — Sendsay password auth via `one_time_auth` (or set `apikey`/`token` instead of `passwd`)
- `from` — **must be a sender already verified** in Sendsay (`issue.emailsender.*`). Unverified `from` still returns `track.id`, but delivery fails later with `emailsender`
- `cc` / `bcc` are not supported by the current Sendsay adapter
