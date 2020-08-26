/**
 * @jest-environment node
 */

const faker = require('faker')
const { createUser, makeClient, gql, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
        user: registerNewUser(data: $data) {
            id
        }
    }
`

test('register new user', async () => {
    const client = await makeClient()
    const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
    const password = faker.internet.password()
    const email = faker.internet.exampleEmail()
    const captcha = 'no'
    const { data, errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
        data: {
            name,
            password,
            email,
            captcha,
        },
    })
    expect(errors).toEqual(undefined)
    expect(data.user.id).toMatch(/^[0-9a-zA-Z-_]+$/)
})

test('register user with existed email', async () => {
    const user = await createUser()
    const client = await makeClient()
    const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
    const password = faker.internet.password()
    const email = user.email
    const captcha = 'no'
    const { data, errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
        data: {
            name,
            password,
            email,
            captcha,
        },
    })
    expect(JSON.stringify(errors)).toMatch(/register:email:multipleFound/)
})
