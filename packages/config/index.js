const fs = require('fs')
const path = require('path')

const dotenv = require('dotenv')
const DEBUG = false

const root = path.resolve(path.join(__dirname, '../..'))
const cwd = process.cwd()
const env0 = JSON.parse(JSON.stringify(process.env))
let namespace, env1, env2

// load root .env
if (fs.existsSync(path.join(root, '.env'))) {
    if (DEBUG) console.log(`@open-condo/config: load ${path.join(root, '.env')}`)
    env1 = dotenv.parse(fs.readFileSync(path.join(root, '.env')))
    for (const k in env1) {
        if (!env0.hasOwnProperty(k)) {
            if (DEBUG) console.log(`@open-condo/config: [root.env] process.env[${k}] = ${env1[k]}`)
            process.env[k] = env1[k]
        }
    }
}

// load app/cwd .env
if (root !== cwd) {
    const appsRoot = path.join(root, 'apps')
    const isInsideApps = cwd.startsWith(appsRoot)
    const appName = (isInsideApps) ? cwd.substring(appsRoot.length).split(path.sep)[1] : undefined

    if (fs.existsSync(path.join(cwd, '.env'))) {
        if (DEBUG) console.log(`@open-condo/config: load ${path.join(cwd, '.env')}`)
        env2 = dotenv.parse(fs.readFileSync(path.join(cwd, '.env')))
        namespace = path.basename(cwd)
    } else if (isInsideApps && appName && fs.existsSync(path.join(root, 'apps', appName, '.env'))) {
        if (DEBUG) console.log(`@open-condo/config: load ${path.join(root, 'apps', appName, '.env')}`)
        env2 = dotenv.parse(fs.readFileSync(path.join(root, 'apps', appName, '.env')))
        namespace = appName
    }
    if (env2) {
        for (const k in env2) {
            if (!env0.hasOwnProperty(k)) {
                if (DEBUG) console.log(`@open-condo/config: [app.env] process.env[${k}] = ${env2[k]}`)
                process.env[k] = env2[k]
            }
        }
    }
}

if (DEBUG) console.log(`@open-condo/config: inited! namespace=${namespace}, cwd=${cwd}, root=${root}`)
if (DEBUG) console.dir(process.env)

function getEnv (namespace, name, defaultValue) {
    return preprocessEnv(process.env[`${namespace}_${name}`] || process.env[`${name}`] || defaultValue)
}

function preprocessEnv (v) {
    if (!v) return v
    if (v.includes('${ROOT}')) {
        v = v.replace('${ROOT}', root)
    }
    return v
}

function getConfig (namespace) {
    namespace = namespace ? namespace.toUpperCase().replace('_', '') : ''
    namespace = namespace ? namespace + '__' : ''

    const baseConfigs = {
        NODE_ENV: getEnv(namespace, 'NODE_ENV', 'production'),
        PROJECT_NAME: getEnv(namespace, 'PROJECT_NAME', 'noname-project'),
        SERVER_URL: getEnv(namespace, 'SERVER_URL', 'http://localhost:3000'),
        DATABASE_URL: getEnv(namespace, 'DATABASE_URL'),
        // LOCAL MEDIA FILES
        MEDIA_ROOT: process.env.MEDIA_ROOT || path.join(root, '__media'),
        MEDIA_URL: process.env.MEDIA_URL || '/media',
        DEFAULT_LOCALE: String(process.env.DEFAULT_LOCALE || 'en'),
        DEFAULT_CURRENCY_CODE: String(process.env.DEFAULT_CURRENCY_CODE || 'RUB'),
        PROJECT_ROOT: root,
    }
    const getter = (obj, name) => {
        if (name in obj) return obj[name]
        return getEnv(namespace, name)
    }

    const setter = () => {
        throw new TypeError(
            'config object is not settable! If you want to change value, you should set ' +
                'an environment variable or change value inside .env file'
        )
    }

    return new Proxy(baseConfigs, { get: getter, set: setter })
}

module.exports = getConfig(namespace)
