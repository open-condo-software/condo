const path = require('path')

const { program } = require('commander')

const {
    checkDockerComposePostgresIsRunning,
    checkMkCertCommandAndLocalCerts,
    createPostgresDatabaseInsideDockerComposeContainerIfNotExists,
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
const LOCAL_REDIS_DB_PREFIX = 'redis://127.0.0.1:6379'
const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')

program.option('-f, --filter <names...>', 'Filters apps by name')
program.option('--https', 'Uses https for local running')
program.description(`Prepares applications from the /apps directory for local running 
by creating separate databases for them 
and running their local bin/prepare.js scripts.
`)

async function prepare () {
    program.parse()
    const { https, filter } = program.opts()

    // Step 1. Sanity checks
    await checkDockerComposePostgresIsRunning()
    if (https) await checkMkCertCommandAndLocalCerts(KEY_FILE, CERT_FILE, DEFAULT_APP_HTTPS_SUBDOMAIN)

    // Step 2. Get list of available apps and assign ports / indexes / dbNames and so on
    const allApps = await getAllActualApps()
    const appsWithData = allApps.map((app, idx) => {
        const appOrder = idx + 1
        if (app.type === 'KS') {
            const sport = 8000 + appOrder
            const port = 4000 + appOrder
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
            throw new Error('Unknown app type!')
        }
    })

    // Step 3.1. Copy global .env.example values to .env with no override
    await fillGlobalEnvWithDefaultValues()
    // Step 3.2. Extract domains .env information, like CONDO_DOMAIN, MY_APP_DOMAIN and put it global monorepo env
    for (const app of appsWithData) {
        const domainEnvKey = `${app.name.toUpperCase().replaceAll('-', '_')}_DOMAIN`
        await updateGlobalEnvFile(domainEnvKey, app.serviceUrl)
    }

    // Step 4. Filter out apps that you don't need, save
    const filteredApps = filter ? appsWithData.filter(app => filter.includes(app.name)) : appsWithData

    // Step 5. Create missing databases and update apps .env if needed
    for (const app of filteredApps) {
        console.log(`====> Preparing ${app.name} databases / .env`)
        if (app.type === 'KS') {
            console.log('========> Creating PG DB if not exists')
            await createPostgresDatabaseInsideDockerComposeContainerIfNotExists(app.pgName)
            console.log('========> Filling default .env values')
            await fillAppEnvWithDefaultValues(app.name)
            const env = {
                COOKIE_SECRET: `${app.name}-secret`,
                DATABASE_URL: `${LOCAL_PG_DB_PREFIX}/${app.pgName}`,
                REDIS_URL:`${LOCAL_REDIS_DB_PREFIX}/${app.redisIndex}`,
                PORT: String(app.port),
                SPORT: String(app.sport),
                SERVER_URL: app.serviceUrl,
            }
            await prepareAppEnv(app.name, env)
            console.log('========> Running migration script')
            const migrateResult = await runAppPackageJsonScript(app.name, 'migrate')
            if (migrateResult) console.log(migrateResult)
        } else if (app.type === 'Next') {
            // NOTE: Server url is not filled, since it's per-app logic and probably should just use domains as well
            console.log('========> Filling default .env values')
            await fillAppEnvWithDefaultValues(app.name)
        } else {
            throw new Error('Unknown app type')
        }
    }

    // Step 6. Run prepare.js script of individual apps according to dependencies-graph
    console.log('====> Executing prepare script of individual apps')
    const filterArgs = filteredApps.map(app => `--filter=${app.name}`).join(' ')
    const { stdout, stderr } = await safeExec(`turbo run prepare ${filterArgs}`)
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    // Step 7. Give a user hosts instruction with all domains, so he can do it once for all apps
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
