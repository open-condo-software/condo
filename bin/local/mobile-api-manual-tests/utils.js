const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const { User } = require('@condo/domains/user/gql')

const {
    ENV_REQUIRED_FIELDS,
    DEFAULT_VARIABLES,
} = require('./constants')

const { AddressAPI } = require('./init')

function parseEnv (envFilePath = './.env', requiredFields = ENV_REQUIRED_FIELDS) {
    const filePath = path.resolve(envFilePath)
    if (!fs.existsSync(filePath)) throw new Error('Please fill in .env')

    const env = dotenv.parse(fs.readFileSync(filePath))

    if (!env) throw new Error('Please fill in .env')

    for (const field of requiredFields) {
        if (!env[field]) throw new Error(`.env field ${field} is required`)
    }

    return env
}

async function getAll (context, query, variables = DEFAULT_VARIABLES) {
    const result = await context.query({
        query: query.GET_ALL_OBJS_QUERY,
        variables,
        fetchPolicy: 'network-only',
    })

    return result?.data?.objs
}

async function registerUser (CondoUser) {
    const context = CondoUser.client
    const sender = { dv: 1, fingerprint: 'api-manual-tests' }
    const meta = {
        dv: 1,
        city: CondoUser.user.city,
        county: CondoUser.user.country,
    }

    const result = await context.query({
        query: User.CREATE_OBJ_MUTATION,
        variables: {
            data: {
                dv: meta.dv,
                sender,
                name: CondoUser.user.name,
                phone: CondoUser.user.phone,
                email: CondoUser.user.email,
                password: CondoUser.user.password,
            },
        },
        fetchPolicy: 'network-only',
    })

    return result
}

async function signIn (CondoUser) {
    try {
        await CondoUser.signIn()
    } catch (err) {
        console.error('Unable to sign in user', err)

        try {
            console.log('Trying to register user...')

            const result = await registerUser(CondoUser)

            console.log('User successfully registered...', result)
        } catch (err) {
            console.error('Unable to register user, check credentials please.', err)

            process.exit(1)
        }

        process.exit(1)
    }
}

module.exports = {
    parseEnv,
    getAll,
    registerUser,
    signIn,
}