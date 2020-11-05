/**
 * @jest-environment node
 */

const { getSchemaObject, createSchemaObject, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient, createUser, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const { ForgotPasswordAction } = require('../schema/User')

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
    const user = await createUser()
    const client = await makeLoggedInClient(user)
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
    const user = await createUser()
    const client = await makeClient()
    const adm = await makeLoggedInAdminClient()
    const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: user.email })
    expect(res1.errors).toEqual(undefined)
    expect(res1.data).toEqual({ status: 'ok' })

    // get created token
    const { data: { passwordTokens } } = await adm.query(ALL_TOKENS_FOR_USER_QUERY, { email: user.email })
    expect(passwordTokens).toHaveLength(1)
    const token = passwordTokens[0].token
    expect(token).toMatch(/^[a-zA-Z0-9-]{7,40}$/g)

    // change password
    const password = `${user.password}:${user.password}:new`
    const res2 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { token, password })
    expect(res2.errors).toEqual(undefined)
    expect(res2.data).toEqual({ status: 'ok' })

    // check logging by new password
    const newClient = await makeLoggedInClient({ email: user.email, password })
    expect(newClient.user.id).toEqual(user.id)
})

test('start recovery for unknown email', async () => {
    const client = await makeClient()
    const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: 'random231314@emample.com' })
    expect(JSON.stringify(res1.errors)).toEqual(expect.stringMatching('unknown-user'))
})

test('change password to empty', async () => {
    const { id } = await createSchemaObject(ForgotPasswordAction)
    const obj = await getSchemaObject(ForgotPasswordAction, ['token'], { id })
    const client = await makeClient()
    const res1 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, {
        token: obj.token, password: '',
    })
    expect(res1.data).toEqual({ status: 'ok' })
})
