const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')

const exec = util.promisify(cp.exec)
const readdir = util.promisify(fs.readdir)
const exists = util.promisify(fs.exists)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const conf = require('@open-condo/config')

const PROJECT_ROOT = conf['PROJECT_ROOT']
const TRACE = conf['TRACE']
const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')

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

async function getEnv (app, key) {
    const { stdout } = await safeExec(`yarn workspace @app/${app} node ./../../bin/show-conf-value.js ${key}`)
    return stdout.trim()
}

async function checkPostgres () {
    try {
        await safeExec('docker-compose exec postgresdb bash -c "su -c \'psql -tAc \\"select 1+1\\" postgres\' postgres"', ['COMPOSE_PROJECT_NAME'])
    } catch (e) {
        throw new Error('ERROR: You should run: `docker-compose up -d postgresdb redis`')
    }
}

async function getAllActualApps () {
    const appNames = await readdir(`${PROJECT_ROOT}/apps`)
    const hasPackageJson = await Promise.all(appNames.map(name => exists(`${PROJECT_ROOT}/apps/${name}/package.json`)))
    return appNames.filter((value, index) => hasPackageJson[index])
}

async function createPostgresDb (dbName) {
    try {
        await safeExec(`docker-compose exec postgresdb bash -c "su -c 'createdb ${dbName}' postgres"`, ['COMPOSE_PROJECT_NAME'])
    } catch (e) {
        if (!e.stderr.includes('already exists')) throw e
    }
}

async function createAppEnv (serviceName, dbName, redisName, port, sport, serverUrl) {
    await updateAppEnvFile(serviceName, 'DATABASE_URL', `postgresql://postgres:postgres@127.0.0.1/${dbName}`)
    await updateAppEnvFile(serviceName, 'REDIS_URL', `redis://127.0.0.1:6379/${redisName}`)
    await updateAppEnvFile(serviceName, 'PORT', port)
    await updateAppEnvFile(serviceName, 'SPORT', sport)
    await updateAppEnvFile(serviceName, 'SERVER_URL', serverUrl)
}

async function runAppScript (app, script) {
    const packageJson = JSON.parse((await readFile(`${PROJECT_ROOT}/apps/${app}/package.json`, { encoding: 'utf-8' })).trim())
    if (packageJson.scripts && packageJson.scripts[script]) {
        const { stdout } = await safeExec(`yarn workspace @app/${app} ${script}`)
        return stdout.trim()
    }
    return ''
}

async function checkCert () {
    try {
        await safeExec('which mkcert')
    } catch (e) {
        throw new Error('ERROR: You should install mkcert command! Use: `brew install mkcert`')
    }

    if (!await exists(KEY_FILE) || !await exists(CERT_FILE)) {
        await safeExec(`mkdir -p "${path.join(CERT_FILE, '..')}"`)
        await safeExec(`mkcert --cert-file "${CERT_FILE}" --key-file "${KEY_FILE}" localhost app.localhost "*.app.localhost"`)
    }
}

async function main ([project]) {
    if (!project) project = 'local'

    const secure = true
    let index = 1

    await checkPostgres()
    await checkCert()

    const apps = await getAllActualApps()

    for (const app of apps) {
        const dbName = `${project}-${app}`
        const redisName = 5 + index
        const port = 4000 + index
        const sport = 8000 + index
        const serverUrl = (secure) ? `https://localhost:${sport}` : `http://localhost:${port}`

        console.log(`====> prepare '${app}' database`)
        await createPostgresDb(dbName)
        await createAppEnv(app, dbName, redisName, port, sport, serverUrl)
        const migrateResult = await runAppScript(app, 'migrate')
        if (migrateResult) console.log(`----> '${app}' > migrate ${JSON.stringify(migrateResult)}`)
        index += 1
    }

    for (const app of apps) {
        const prepareResult = await runAppScript(app, 'prepare')
        if (prepareResult) console.log(`----> '${app}' > prepare ${JSON.stringify(prepareResult)}`)
    }

    console.log(`
======== you need to run the following commands ========

# - add mkcert root CA for node.js
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.bashrc
echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.zshrc

====
`)
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
