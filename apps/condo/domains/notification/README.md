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
 - we can delivery message by user preferred transport (not implemented yet)
 - user can ignore some messages types if want (not implemented yet)

# server side logic example

```javascript

const { COUNTRIES, DEFAULT_ENGLISH_COUNTRY } = require('@condo/domains/common/constants/countries')

const { INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

...

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    ...
    const organization = ..
    const user = ..
    const employee = ..

    ...
    const lang = (COUNTRIES[organization.country] || COUNTRIES[DEFAULT_ENGLISH_COUNTRY]).locale
    await sendMessage(context, {
       lang,
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
to fake transport.send() logic and disploay message context in console.

Debug and test purposes!