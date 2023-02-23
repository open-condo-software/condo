const cp = require('child_process')
const fs = require('fs')
const util = require('util')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const conf = require('@open-condo/config')
const { getRandomString } = require('@open-condo/keystone/test.utils')

const PROJECT_ROOT = conf['PROJECT_ROOT']
const TRACE = conf['TRACE']

async function safeExec (command, envNames = []) {
    try {
        // dotenv package add all variables in process.env but we really don't want it!
        const env = { PATH: process.env.PATH, HOME: process.env.HOME, USER: process.env.USER }
        for (const name of envNames) {
            if (typeof process.env[name] === 'undefined') continue
            env[name] = process.env[name]
        }
        const { stdout, stderr } = await exec(`${command}`, { env })
        if (TRACE) console.log('EXEC RESULT', JSON.stringify(stdout), JSON.stringify(stderr))
        return { stdout, stderr }
    } catch (e) {
        if (TRACE) console.error('EXEC ERROR', e)
        throw e
    }
}

async function updateAppEnvFile (serviceName, key, value) {
    value = `${value}`.trim()
    let envData, result

    try {
        envData = (await readFile(`${PROJECT_ROOT}/apps/${serviceName}/.env`, { encoding: 'utf-8' })).toString()
    } catch (e) {
        if (e.code === 'ENOENT') {
            envData = ''
        } else {
            throw e
        }
    }

    const re = new RegExp(`^${key}=.*?[\n]`, 'ms')

    if (!re.test(envData)) {
        result = envData + (envData && envData[envData.length - 1] !== '\n' ? '\n' : '') + `${key}=${value}\n`
    } else {
        result = envData.replace(re, `${key}=${value}\n`)
    }

    await writeFile(`${PROJECT_ROOT}/apps/${serviceName}/.env`, result, { encoding: 'utf-8' })
}

async function getEnv (serviceName, key) {
    const { stdout } = await safeExec(`yarn workspace @app/${serviceName} node ./../../bin/show-conf-value.js ${key}`)
    return stdout.trim()
}

async function getServerUrl (serviceName) {
    return await getEnv(serviceName, 'SERVER_URL')
}

async function prepareOidcConfig (serviceName) {
    const clientSecret = getRandomString() + getRandomString() + getRandomString()
    const clientId = serviceName
    const serverUrl = await getServerUrl('condo')
    const callbackUrl = await getServerUrl(serviceName) + '/oidc/callback'
    await safeExec(`yarn workspace @app/condo node ./bin/create-oidc-client.js ${serviceName} ${clientSecret} ${callbackUrl}`)
    return { serverUrl, clientId, clientSecret }
}

async function updateAppEnvUsers (serviceName) {
    const justUserEmail = await getEnv(serviceName, 'DEFAULT_TEST_USER_IDENTITY') || 'user@example.com'
    const justUserPassword = await getEnv(serviceName, 'DEFAULT_TEST_USER_SECRET') || getRandomString()
    const justUserOpts = JSON.stringify({ password: justUserPassword, isAdmin: false, name: 'JustUser' })
    await safeExec(`yarn workspace @app/${serviceName} node ./bin/create-user.js ${JSON.stringify(justUserEmail)} ${JSON.stringify(justUserOpts)}`)
    const adminUserEmail = await getEnv(serviceName, 'DEFAULT_TEST_ADMIN_IDENTITY') || 'admin@example.com'
    const adminUserPassword = await getEnv(serviceName, 'DEFAULT_TEST_ADMIN_SECRET') || getRandomString()
    const adminUserOpts = JSON.stringify({ password: adminUserPassword, isAdmin: true, name: 'Admin' })
    await safeExec(`yarn workspace @app/${serviceName} node ./bin/create-user.js ${JSON.stringify(adminUserEmail)} ${JSON.stringify(adminUserOpts)}`)
    await updateAppEnvFile(serviceName, 'DEFAULT_TEST_USER_IDENTITY', justUserEmail)
    await updateAppEnvFile(serviceName, 'DEFAULT_TEST_USER_SECRET', justUserPassword)
    await updateAppEnvFile(serviceName, 'DEFAULT_TEST_ADMIN_IDENTITY', adminUserEmail)
    await updateAppEnvFile(serviceName, 'DEFAULT_TEST_ADMIN_SECRET', adminUserPassword)
    return { justUserEmail, justUserPassword, adminUserEmail, adminUserPassword }
}

async function main () {
    // 1) add local admin users!
    const serviceName = 'condo'
    await updateAppEnvUsers(serviceName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
