const path = require('path')

const { program, Option } = require('commander')

const {
    getRandomString,
    checkPostgresIsRunning,
    checkMkCertCommandAndLocalCerts,
    createPostgresDatabasesIfNotExist,
    getAllActualApps,
    prepareAppEnv,
    runAppPackageJsonScript,
    updateGlobalEnvFile,
    safeExec,
    fillGlobalEnvWithDefaultValues,
    fillAppEnvWithDefaultValues,
} = require('@open-condo/cli')

const DEFAULT_DB_NAME_PREFIX = 'local'
const DEFAULT_APP_HTTPS_SUBDOMAIN = 'app.localhost'
const LOCAL_PG_DB_PREFIX = 'postgresql://postgres:postgres@127.0.0.1'
const LOCAL_REDIS_DB_PREFIX = 'redis://127.0.0.1'
const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')

program.option('-f, --filter <names...>', 'Filters apps by name')
program.option('--https', 'Uses https for local running')
program.addOption(new Option('-p, --preset <preset>', 'Allows you to select one of the presets for the databases')
    .choices(['local', 'production']).default('local'))
program.option('-r, --replicate <names...>', 'Enables replica adapter to interact with multiple databases')
program.option('-c, --cluster <names...>', 'Enables cluster setup for key-value storage')
program.description(`Prepares applications from the /apps directory for local running 
by creating separate databases for them 
and running their local bin/prepare.js scripts.
`)

function logWithIndent (message, indent = 1) {
    console.log('-'.repeat(indent * 4 - 2) + '> ' + message)
}

async function prepare () {
    program.parse()
    const { https, filter, replicate, cluster, preset } = program.opts()

    // TODO(pahaz): DOMA-10616 we need to run packages build before migrations ... because our backend depends on icon package ...

    // Step 1. Sanity checks
    logWithIndent('Running sanity checks')
    await checkPostgresIsRunning(LOCAL_PG_DB_PREFIX)
    if (https) await checkMkCertCommandAndLocalCerts(KEY_FILE, CERT_FILE, DEFAULT_APP_HTTPS_SUBDOMAIN)

    // Step 2. Get list of available apps and assign ports / indexes / dbNames and so on
    logWithIndent('Receiving all existing apps')
    const allApps = await getAllActualApps()
    logWithIndent(`Apps found: ${allApps.map(app => app.name).join(', ')}`)
    logWithIndent('Assigning ports, urls and db indexes/names to all apps')

    const appsWithData = allApps.map((app, idx) => {
        const appOrder = idx + 1
        const sport = 8000 + appOrder
        const port = 4000 + appOrder

        if (app.type === 'KS') {
            return {
                ...app,
                pgName: `${DEFAULT_DB_NAME_PREFIX}-${app.name}`,
                redisIndex: appOrder,
                port,
                sport,
                serviceUrl: https
                    ? `https://${app.name}.${DEFAULT_APP_HTTPS_SUBDOMAIN}:${sport}`
                    : `http://localhost:${port}`,
            }
        } else if (app.type === 'Next') {
            // NOTE: Next applications now do not support either specifying a port via an environment variable or working over https without a provider
            // TODO: Add a dev script wrapper to NextJS apps to support local https runtime
            return {
                ...app,
                serviceUrl: 'http://localhost:3000',
            }
        } else {
            return {
                ...app,
                serviceUrl: `http://localhost:${port}`,
            }
        }
    })

    // Step 3.1. Copy global .env.example values to .env with no override
    logWithIndent('Copying global .env.example values to global .env if not exists')
    await fillGlobalEnvWithDefaultValues()
    // Step 3.2. Extract domains .env information, like CONDO_DOMAIN, MY_APP_DOMAIN and put it global monorepo env
    logWithIndent('Writing services <service-name>_DOMAIN variables to global .env')
    for (const app of appsWithData) {
        const domainEnvKey = `${app.name.toUpperCase().replaceAll('-', '_')}_DOMAIN`
        await updateGlobalEnvFile(domainEnvKey, app.serviceUrl)
    }

    // Step 4. Filter out apps that you don't need
    const knownApps = appsWithData.filter(app => app.type !== 'Unknown')
    const filteredApps = filter ? knownApps.filter(app => filter.includes(app.name)) : knownApps
    logWithIndent(`Filtering apps to prepare: ${filteredApps.map(app => app.name).join(', ')}`)

    // Step 5. Create missing databases
    const pgNames = filteredApps.filter(app => app.pgName).map(app => app.pgName)
    logWithIndent(`Creating databases for apps if not exists: ${pgNames.join(', ')}`)
    await createPostgresDatabasesIfNotExist(LOCAL_PG_DB_PREFIX, pgNames)

    // Step 6. Create missing databases and update apps .env if needed
    for (const app of filteredApps) {
        logWithIndent(`Preparing "${app.name}" app`)
        if (app.type === 'KS') {
            logWithIndent('Copying app\'s .env.example values to .env if not exists', 2)
            await fillAppEnvWithDefaultValues(app.name)
            logWithIndent('Writing assigned urls / ports / dbs to app\'s .env', 2)
            const env = {
                DATABASE_URL: `${LOCAL_PG_DB_PREFIX}/${app.pgName}`,
                REDIS_URL: `${LOCAL_REDIS_DB_PREFIX}/${app.redisIndex}`,
                PORT: String(app.port),
                SPORT: String(app.sport),
                SERVER_URL: app.serviceUrl,
            }

            if (preset === 'production' || (replicate && replicate.includes(app.name))) {
                env.DATABASE_URL = `custom:${JSON.stringify({
                    main: `${LOCAL_PG_DB_PREFIX}:5432/${app.pgName}`,
                    replica: `${LOCAL_PG_DB_PREFIX}:5433/${app.pgName}`,
                })}`
                env.DATABASE_POOLS = JSON.stringify({
                    main: { databases: ['main'], writable: true },
                    replicas: { databases: ['replica'], writable: false },
                })
                env.DATABASE_ROUTING_RULES = JSON.stringify([
                    { target: 'main', gqlOperationType: 'mutation' },
                    { target: 'replicas', sqlOperationName: 'select' },
                    { target: 'main' },
                ])
            }

            if (preset === 'production' || (cluster && cluster.includes(app.name))) {
                env.REDIS_URL = JSON.stringify([
                    { 'port': 7001, 'host': '127.0.0.1' },
                    { 'port': 7002, 'host': '127.0.0.1' },
                    { 'port': 7003, 'host': '127.0.0.1' }]
                )
            }

            await prepareAppEnv(app.name, env)
            // NOTE(pahaz): we don't need to update secret if someone already set it
            await prepareAppEnv(
                app.name,
                {
                    COOKIE_SECRET: `${app.name}-secret-${getRandomString(12)}-value`,
                },
                { override: false },
            )
            await prepareAppEnv(
                app.name,
                {
                    DATA_ENCRYPTION_CONFIG: JSON.stringify({
                        [`${app.name}_1`]: {
                            algorithm: 'aes-256-gcm',
                            secret: getRandomString(32),
                            compressor: 'brotli',
                            // Semgrep identifies this as hard-coded credentials, but it is not
                            // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
                            keyDeriver: 'pbkdf2-sha512',
                        },
                    }),
                    DATA_ENCRYPTION_VERSION_ID: `${app.name}_1`,
                },
                { override: false },
            )
            logWithIndent('Running migration script', 2)
            const migrateResult = await runAppPackageJsonScript(app.name, 'migrate')
            if (migrateResult) console.log(migrateResult)
        } else if (app.type === 'Next') {
            // NOTE: Server url is not filled, since it's per-app logic and probably should just use domains as well
            logWithIndent('Copying app\'s .env.example values to .env if not exists', 2)
            await fillAppEnvWithDefaultValues(app.name)
        } else {
            throw new Error('Unknown app type')
        }
    }

    // Step 7. Run prepare.js script of individual apps according to dependencies-graph
    logWithIndent('Executing prepare script of individual apps via turbo-repo')
    const filterArgs = filteredApps.map(app => `--filter=@app/${app.name}`).join(' ')
    const { stdout, stderr } = await safeExec(`yarn turbo run prepare ${filterArgs}`)
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    // Step 8. Give a user hosts instruction with all domains, so he can do it once for all apps
    if (https) {
        const domains = ['127.0.0.1', DEFAULT_APP_HTTPS_SUBDOMAIN]
        domains.push(...appsWithData.filter(app => app.sport).map(app => `${app.name}.${DEFAULT_APP_HTTPS_SUBDOMAIN}`))
        console.log(`
            ======== you need to run the following commands ========
            
            # - add mkcert root CA for node.js
            export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
            echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.bashrc
            echo '\\nexport NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"' >> ~/.zshrc
            
            # - add domains to /etc/hosts
            sudo -- sh -c -e "echo '${domains.join(' ')}' >> /etc/hosts"
            
            ====
        `)
    }
}

prepare().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
