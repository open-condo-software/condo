const path = require('path')

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

async function main ([project, useHttps]) {
    if (project === '--apphttps') {
        project = undefined
        useHttps = 'app.localhost'
    }

    if (!project) project = 'local'

    const secure = Boolean(useHttps)
    const localhostDomain = (useHttps) ? useHttps : 'localhost'
    let index = 1
    let domains = `127.0.0.1 ${localhostDomain}`

    await checkDockerComposePostgresIsRunning()
    if (secure) await checkMkCertCommandAndLocalCerts(KEY_FILE, CERT_FILE, useHttps)

    const apps = await getAllActualApps()

    for (const app of apps) {
        const dbName = `${project}-${app}`
        const redisName = 5 + index
        const port = 4000 + index
        const sport = 8000 + index
        domains += ` ${app}.${localhostDomain}`
        const serverUrl = (secure) ? `https://${app}.${localhostDomain}:${sport}` : `http://${localhostDomain}:${port}`

        console.log(`====> prepare '${app}' database`)
        await createPostgresDatabaseInsideDockerComposeContainerIfNotExists(dbName)
        await prepareMinimalAppEnv(app, dbName, redisName, port, sport, serverUrl)
        const migrateResult = await runAppPackageJsonScript(app, 'migrate')
        if (migrateResult) console.log(`----> '${app}' > migrate ${JSON.stringify(migrateResult)}`)
        index += 1
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

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
