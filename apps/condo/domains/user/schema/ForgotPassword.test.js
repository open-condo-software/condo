const { gql } = require('graphql-tag')
const { makeLoggedInAdminClient, makeClient, makeLoggedInClient } = require('@core/keystone/test.utils')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { WRONG_EMAIL_ERROR, PASSWORD_TOO_SHORT } = require('@condo/domains/user/constants/errors')


describe('FORGOT_RECOVERY_CHANGE_PASSWORD', () => {
    const ALL_FORGOT_PASSWORD_ACTIONS_QUERY = gql`
        query {
            objs: allForgotPasswordActions {
                id
                user {
                    id
                }
                token
            }
        }
    `

    const START_PASSWORD_RECOVERY_MUTATION = gql`
        mutation startPasswordRecovery($email: String!){
            status: startPasswordRecovery(email: $email)
        }
    `

    const CHANGE_PASSWORD_WITH_TOKEN_MUTATION = gql`
        mutation changePasswordWithToken($token: String!, $password: String!) {
            status: changePasswordWithToken(token: $token, password: $password)
        }
    `

    const ALL_TOKENS_FOR_USER_QUERY = gql`
        query findTokenForUser($email: String!) {
            passwordTokens: allForgotPasswordActions(where: { user: { email: $email}}) {
                id
                token
                user {
                    id
                }
            }
        }
    `

    test('anonymous: get all ForgotPasswordActions', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ objs: null })
    })

    test('user: get all ForgotPasswordActions', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ objs: null })
    })

    test('reset forgotten password', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const client = await makeClient()        
        const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: userAttrs.email })
        expect(res1.errors).toEqual(undefined)
        expect(res1.data).toEqual({ status: 'ok' })
        // get created token
        const { data: { passwordTokens } } = await admin.query(ALL_TOKENS_FOR_USER_QUERY, { email: userAttrs.email })
        expect(passwordTokens).toHaveLength(1)
        const token = passwordTokens[0].token
        expect(token).toMatch(/^[a-zA-Z0-9-]{7,40}$/g)
        // change password
        const password = `${user.password}:${user.password}:new`
        const res2 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { token, password })
        expect(res2.errors).toEqual(undefined)
        expect(res2.data).toEqual({ status: 'ok' })
        // check logging by new password
        const newClient = await makeLoggedInClient({ email: userAttrs.email, password })
        expect(newClient.user.id).toEqual(user.id)
    })

    test('start recovery for unknown email', async () => {
        const client = await makeClient()
        const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: `r${Math.random()}@example.com` })
        expect(JSON.stringify(res1.errors)).toContain(WRONG_EMAIL_ERROR)
    })

    test('change password to empty', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeClient()        
        await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: userAttrs.email })
        const { data: { passwordTokens } } = await admin.query(ALL_TOKENS_FOR_USER_QUERY, { email: userAttrs.email })
        expect(passwordTokens).toHaveLength(1)
        const token = passwordTokens[0].token
        const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { token, password: '' })
        expect(JSON.stringify(result.errors)).toContain(PASSWORD_TOO_SHORT)
    })
})
