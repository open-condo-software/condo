const path = require('path')

const { program } = require('commander')

const {
    checkDockerComposePostgresIsRunning,
    checkMkCertCommandAndLocalCerts,
    createPostgresDatabaseInsideDockerComposeContainerIfNotExists,
    getAllActualApps,
    prepareMinimalAppEnv,
    runAppPackageJsonScript,
} = require('@open-condo/cli')

const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')

program.option('-f, --filter <names...>', 'Filters apps by name')
program.option('--https', 'Uses https for local running')
program.description(`Prepares applications from the /apps directory for local running 
by creating separate databases for them 
and running their local bin/prepare.js scripts.
`)

async function main () {
    let project, useHttps
    program.parse()
    const cliOpts = program.opts()

    if (cliOpts.https) {
        project = undefined
        useHttps = 'app.localhost'
    }

    if (!project) project = 'local'

    const secure = Boolean(useHttps)
    const localhostDomain = (useHttps) ? useHttps : 'localhost'
    let domains = `127.0.0.1 ${localhostDomain}`

    await checkDockerComposePostgresIsRunning()
    if (secure) await checkMkCertCommandAndLocalCerts(KEY_FILE, CERT_FILE, useHttps)

    let apps = await getAllActualApps()
    const appsIndexes = Object.assign({}, ...apps.map((appName, idx) => ({ [appName]: idx + 1 })))
    if (cliOpts.filter) {
        apps = apps.filter(app => cliOpts.filter.includes(app))
    }

    for (const app of apps) {
        const dbName = `${project}-${app}`
        const redisName = 5 + appsIndexes[app]
        const port = 4000 + appsIndexes[app]
        const sport = 8000 + appsIndexes[app]
        domains += ` ${app}.${localhostDomain}`
        const serverUrl = (secure) ? `https://${app}.${localhostDomain}:${sport}` : `http://${localhostDomain}:${port}`

        console.log(`====> prepare '${app}' database`)
        await createPostgresDatabaseInsideDockerComposeContainerIfNotExists(dbName)
        await prepareMinimalAppEnv(app, dbName, redisName, port, sport, serverUrl)
        const migrateResult = await runAppPackageJsonScript(app, 'migrate')
        if (migrateResult) console.log(`----> '${app}' > migrate ${JSON.stringify(migrateResult)}`)
    }

    for (const app of apps) {
        const prepareResult = await runAppPackageJsonScript(app, 'prepare')
        if (prepareResult) console.log(`----> '${app}' > prepare ${JSON.stringify(prepareResult)}`)
    }

    if (secure) console.log(`
======== you need to run the following commands ========

# - add mkcert root CA for node.js
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.bashrc
echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.zshrc

# - add domains to /etc/hosts
sudo -- sh -c -e "echo '${domains}' >> /etc/hosts"

====
`)
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
