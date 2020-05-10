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


function getConfig (namespace) {
    namespace = (namespace) ? namespace.toUpperCase().replace('_', '') : ''
    namespace = (namespace) ? namespace + '__' : ''

    const baseConfigs = {
        NODE_ENV: process.env[`${namespace}NODE_ENV`] || process.env[`NODE_ENV`] || 'production',
        PROJECT_NAME: process.env[`${namespace}PROJECT_NAME`] || process.env[`PROJECT_NAME`] || 'noname-project',
        SERVER_URL: process.env[`${namespace}SERVER_URL`] || process.env[`SERVER_URL`] || 'http://localhost:3000',
        DATABASE_URL: process.env[`${namespace}DATABASE_URL`] || process.env[`DATABASE_URL`] || undefined,
        // LOCAL MEDIA FILES
        MEDIA_ROOT: process.env.MEDIA_ROOT || path.join(root, '__media'),
        MEDIA_URL: process.env.MEDIA_URL || '/media',
    }

    const getter = (obj, name) => {
        if (name in obj) return obj[name]
        return process.env[`${namespace}${name}`] || process.env[`${name}`] || undefined
    }

    const setter = () => {
        throw new TypeError('config object is not settable! If you want to change value, you should set ' +
            'an environment variable or change value inside .env file')
    }

    return new Proxy(baseConfigs, { get: getter, set: setter })
}

module.exports = getConfig(namespace)
