const cp = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const util = require('util')

const dotenv = require('dotenv')

const conf = require('@open-condo/config')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)
const exists = util.promisify(fs.exists)

const PROJECT_ROOT = conf['PROJECT_ROOT']
const TRACE = conf['TRACE']

const getRandomString = () => crypto.randomBytes(6).hexSlice()

/**
 * If use '@open-condo/config' package probably you want to exec some command without current process.env!
 * @param command {string}
 * @param envNames {List<string>} you can throw some process.env id you need it, for example ['DOCKER_PROJECT_NAME']
 * @param opts {Object} exec additional options (for future usage)
 * @return {Promise<{stdout: string, stderr: string}>}
 */
async function safeExec (command, envNames = [], opts = {}) {
    if (typeof command !== 'string') throw new Error('safeExec(..., command) should be a string')
    if (!command) throw new Error('safeExec(..., command) should be a defined')

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

/**
 * Check that the docker-compose postgres container is running and working!
 * @return {Promise<void>}
 */
async function checkDockerComposePostgresIsRunning () {
    try {
        await safeExec('docker compose exec -T postgresdb bash -c "su -c \'psql -tAc \\"select 1+1\\" postgres\' postgres"', ['COMPOSE_PROJECT_NAME'])
    } catch (e) {
        throw new Error('ERROR: You should run: `docker compose up -d postgresdb redis`')
    }
}

/**
 * Run `createdb` command inside docker-compose to create database
 * @param dbName
 * @return {Promise<void>}
 */
async function createPostgresDatabaseInsideDockerComposeContainerIfNotExists (dbName) {
    try {
        await safeExec(`docker compose exec -T postgresdb bash -c "su -c 'createdb ${dbName}' postgres"`, ['COMPOSE_PROJECT_NAME'])
    } catch (e) {
        if (!e.stderr.includes('already exists')) throw e
    }
}

async function _checkCertDomain (certFile, domain) {
    try {
        await safeExec(`cat "${certFile}" | openssl x509 -text | grep "DNS" | grep "*.${domain}"`)
        return true
    } catch (e) {
        return false
    }
}

/**
 * Check that the mkcert command exists!
 * @return {Promise<void>}
 */
async function checkMkCertCommandAndLocalCerts (keyFile, certFile, domain = 'app.localhost') {
    try {
        await safeExec('which mkcert')
    } catch (e) {
        throw new Error('ERROR: You should install mkcert command! Use: `brew install mkcert`')
    }

    if (!await exists(keyFile) || !await exists(certFile) || !await _checkCertDomain(certFile, domain)) {
        // no user input expected for development utility script
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        await safeExec(`mkdir -p "${path.join(certFile, '..')}"`)
        await safeExec(`mkcert --cert-file "${certFile}" --key-file "${keyFile}" localhost "${domain}" "*.${domain}"`)
    }
}

/**
 * Add or update some .env config value!
 * @param filePath {string} path to env file
 * @param key {string} environment variable name
 * @param value {string} environment variable value
 * @param opts {{ override: boolean }}
 * @return {Promise<void>}
 */
async function updateEnvFile (filePath, key, value, opts = { override: true }) {
    if (typeof value !== 'string') throw new Error('updateAppEnvFile(..., value) should be a string')
    if (typeof key !== 'string') throw new Error('updateAppEnvFile(..., key) should be a string')
    if (!key) throw new Error('updateAppEnvFile(..., key) should be a defined')

    value = value.trim()
    // NOTE: JSON objects and space-containing strings must be escaped with quotes
    if ((value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']') ||
        (value.includes(' ') && !value.startsWith('\'') && !value.endsWith('\'')))) {
        value = `'${value}'`
    }
    let envData, result

    try {
        envData = (await readFile(filePath, { encoding: 'utf-8' })).toString()
    } catch (e) {
        if (e.code === 'ENOENT') {
            envData = ''
        } else {
            throw e
        }
    }

    // not a ReDoS case. Key is an env variable.
    // no user input expected for development utility script
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const re = new RegExp(`^${key}=.*?[\n]`, 'ms')

    if (!re.test(envData)) {
        result = envData + (envData && envData[envData.length - 1] !== '\n' ? '\n' : '') + `${key}=${value}\n`
    } else if (opts.override) {
        result = envData.replace(re, `${key}=${value}\n`)
    }

    if (result) {
        await writeFile(filePath, result, { encoding: 'utf-8' })
    }
}

/**
 * Add or update some ./apps/<appName>/.env config value!
 * @param appName {string} application name ./apps/<appName>
 * @param key {string} environment variable name
 * @param value {string} environment variable value
 * @return {Promise<void>}
 */
async function updateAppEnvFile (appName, key, value) {
    if (typeof appName !== 'string') throw new Error('updateAppEnvFile(..., appName) should be a string')
    if (!appName) throw new Error('updateAppEnvFile(..., appName) should be a defined')
    return await updateEnvFile(`${PROJECT_ROOT}/apps/${appName}/.env`, key, value)
}

/**
 * Add or update some global monorepo .env file!
 * @param key {string} environment variable name
 * @param value {string} environment variable value
 * @return {Promise<void>}
 */
async function updateGlobalEnvFile (key, value) {
    return await updateEnvFile(`${PROJECT_ROOT}/.env`, key, value)
}

/**
 * Get current environment value form ./apps/<appName>/.env
 * @param appName {string} application name ./apps/<appName>
 * @param key {string} environment name
 * @return {Promise<string>}
 */
async function getAppEnvValue (appName, key) {
    const { stdout } = await safeExec(`yarn workspace @app/${appName} node ./../../bin/show-conf-value.js ${key}`)
    return stdout.trim()
}

/**
 * Get current ./apps/<appName>/.env SERVER_URL environment value
 * @param appName {string} application name ./apps/<appName>
 * @return {Promise<string>}
 */
async function getAppServerUrl (appName) {
    return await getAppEnvValue(appName, 'SERVER_URL')
}

async function prepareCondoAppOidcConfig (appName) {
    const clientSecret = getRandomString() + getRandomString() + getRandomString()
    const clientId = appName
    const serverUrl = await getAppServerUrl('condo')
    const callbackUrl = await getAppServerUrl(appName) + '/oidc/callback'
    await safeExec(`yarn workspace @app/condo node ./bin/create-oidc-client.js ${appName} ${clientSecret} ${callbackUrl}`)
    return { serverUrl, clientId, clientSecret }
}

async function prepareCondoAppB2BAppConfig (appName, p2pAppName) {
    const appUrl = await getAppServerUrl(appName)
    const opts = JSON.stringify({ appUrl, displayPriority: 2 })
    await safeExec(`yarn workspace @app/condo node ./bin/create-b2bapp.js ${p2pAppName} ${JSON.stringify(opts)}`)
    return { appUrl }
}

async function prepareAppEnv (appName, envToFill) {
    for (const [key, value] of Object.entries(envToFill)) {
        await updateAppEnvFile(appName, key, value)
    }
}

async function prepareAppEnvLocalAdminUsers (appName, identity = 'email') {
    // TODO(pahaz): check create-user.js logic!
    const justUserDefaultIdentity = identity === 'email' ? 'user@example.com' : '+79067777777'
    const justUserIdentity = await getAppEnvValue(appName, 'DEFAULT_TEST_USER_IDENTITY') || justUserDefaultIdentity
    const justUserPassword = await getAppEnvValue(appName, 'DEFAULT_TEST_USER_SECRET') || getRandomString()
    const justUserOpts = JSON.stringify({ password: justUserPassword, isAdmin: false, name: 'JustUser' })
    await safeExec(`yarn workspace @app/${appName} node ./bin/create-user.js ${JSON.stringify(justUserIdentity)} ${JSON.stringify(justUserOpts)}`)

    const adminDefaultIdentity = identity === 'email' ? 'admin@example.com' : '+79068888888'
    const adminUserIdentity = await getAppEnvValue(appName, 'DEFAULT_TEST_ADMIN_IDENTITY') || adminDefaultIdentity
    const adminUserPassword = await getAppEnvValue(appName, 'DEFAULT_TEST_ADMIN_SECRET') || getRandomString()
    const adminUserOpts = JSON.stringify({ password: adminUserPassword, isAdmin: true, name: 'Admin' })
    await safeExec(`yarn workspace @app/${appName} node ./bin/create-user.js ${JSON.stringify(adminUserIdentity)} ${JSON.stringify(adminUserOpts)}`)
    await updateAppEnvFile(appName, 'DEFAULT_TEST_USER_IDENTITY', justUserIdentity)
    await updateAppEnvFile(appName, 'DEFAULT_TEST_USER_SECRET', justUserPassword)
    await updateAppEnvFile(appName, 'DEFAULT_TEST_ADMIN_IDENTITY', adminUserIdentity)
    await updateAppEnvFile(appName, 'DEFAULT_TEST_ADMIN_SECRET', adminUserPassword)
    return { justUserIdentity, justUserPassword, adminUserIdentity, adminUserPassword }
}

async function runAppPackageJsonScript (appName, script) {
    const packageJson = JSON.parse((await readFile(`${PROJECT_ROOT}/apps/${appName}/package.json`, { encoding: 'utf-8' })).trim())
    if (packageJson.scripts && packageJson.scripts[script]) {
        const { stdout } = await safeExec(`yarn workspace @app/${appName} ${script}`)
        return stdout.trim()
    }
    return ''
}

/**
 * Takes all environment default variables from {fromPath} env file (if exists), and copies them to {toPath} env file
 * If opts.override = true, existing keys in toPath will be overwritten, otherwise they will stay the same
 * @param {string} fromPath
 * @param {string} toPath
 * @param {{override: boolean}} opts
 * @return {Promise<void>}
 */
async function copyEnv (fromPath, toPath, opts = { override: true }) {
    let fromEnvData

    try {
        fromEnvData = (await readFile(fromPath, { encoding: 'utf-8' })).toString()
    } catch (e) {
        if (e.code === 'ENOENT') {
            fromEnvData = ''
        } else {
            throw e
        }
    }

    const fromEnv = dotenv.parse(fromEnvData)
    for (const [key, value] of Object.entries(fromEnv)) {
        await updateEnvFile(toPath, key, value, opts)
    }
}

/**
 * Takes all environment default variables from {PROJECT_ROOT}/.env.example
 * After that update {PROJECT_ROOT}/.env file to include default values
 * (no override if key already present in .env)
 * @return {Promise<void>}
 */
async function fillGlobalEnvWithDefaultValues () {
    return await copyEnv(`${PROJECT_ROOT}/.env.example`, `${PROJECT_ROOT}/.env`, { override: false })
}

/**
 * Takes all environment default variables from app's .env.example file
 * After that update app's .env file to include default values
 * (no override if key already present in .env)
 * @return {Promise<void>}
 */
async function fillAppEnvWithDefaultValues (appName) {
    return await copyEnv(`${PROJECT_ROOT}/apps/${appName}/.env.example`, `${PROJECT_ROOT}/apps/${appName}/.env`, { override: false })
}

/**
 * @return {Promise<Array<{name: string, type: 'KS' | 'Next'}>>}
 */
async function getAllActualApps () {
    const appNames = await readdir(`${PROJECT_ROOT}/apps`)
    const hasPackageJson = await Promise.all(appNames.map(name => exists(`${PROJECT_ROOT}/apps/${name}/package.json`)))
    const hasIndexJs = await Promise.all(appNames.map(name => exists(`${PROJECT_ROOT}/apps/${name}/index.js`)))
    const hasNextConfig = await Promise.all(appNames.map(name => exists(`${PROJECT_ROOT}/apps/${name}/next.config.js`)))

    return appNames.reduce((apps, name, idx) => {
        if (hasPackageJson[idx] && (hasIndexJs[idx] || hasNextConfig[idx])) {
            apps.push({ name, type: hasIndexJs[idx] ? 'KS' : 'Next' })
        }
        return apps
    }, [])
}

module.exports = {
    safeExec,
    checkDockerComposePostgresIsRunning,
    createPostgresDatabaseInsideDockerComposeContainerIfNotExists,
    checkMkCertCommandAndLocalCerts,
    updateAppEnvFile,
    updateGlobalEnvFile,
    getAppEnvValue,
    getAppServerUrl,
    prepareCondoAppOidcConfig,
    prepareCondoAppB2BAppConfig,
    prepareAppEnv,
    prepareAppEnvLocalAdminUsers,
    runAppPackageJsonScript,
    getAllActualApps,
    copyEnv,
    fillAppEnvWithDefaultValues,
    fillGlobalEnvWithDefaultValues,
}
