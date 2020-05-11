const path = require('path')

const root = path.resolve(path.join(__dirname, '../..'))
const cwd = process.cwd()
let namespace

if (root === cwd) {
    namespace = undefined
    // load only root .env
    require('dotenv').config({ path: path.join(root, '.env') })
} else {
    namespace = path.dirname(cwd)
    // load root .env
    require('dotenv').config({ path: path.join(root, '.env') })
    // load project .env
    require('dotenv').config({ path: path.join(cwd, '.env') })
}

function getEnv (namespace, name, defaultValue) {
    return preprocessEnv(process.env[`${namespace}${name}`] || process.env[`${name}`] || defaultValue)
}

function preprocessEnv (v) {
    if (!v) return v
    if (v.includes('${ROOT}')) {
        v = v.replace('${ROOT}', root)
    }
    return v
}

function getConfig (namespace) {
    namespace = (namespace) ? namespace.toUpperCase().replace('_', '') : ''
    namespace = (namespace) ? namespace + '__' : ''

    const baseConfigs = {
        NODE_ENV: getEnv(namespace, 'NODE_ENV', 'production'),
        PROJECT_NAME: getEnv(namespace, 'PROJECT_NAME', 'noname-project'),
        SERVER_URL: getEnv(namespace, 'SERVER_URL', 'http://localhost:3000'),
        DATABASE_URL: getEnv(namespace, 'DATABASE_URL'),
        // LOCAL MEDIA FILES
        MEDIA_ROOT: process.env.MEDIA_ROOT || path.join(root, '__media'),
        MEDIA_URL: process.env.MEDIA_URL || '/media',
    }

    const getter = (obj, name) => {
        if (name in obj) return obj[name]
        return getEnv(namespace, name)
    }

    const setter = () => {
        throw new TypeError('config object is not settable! If you want to change value, you should set ' +
            'an environment variable or change value inside .env file')
    }

    return new Proxy(baseConfigs, { get: getter, set: setter })
}

module.exports = getConfig(namespace)
