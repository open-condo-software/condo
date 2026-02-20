const { omitRecursively } = require('./cleaner')

const deserialize = (data, path) => {
    if (!data || !data[path]) {
        return null
    }
    return JSON.stringify(omitRecursively(data[path], '__typename'))
}

const serialize = (data, path) => {
    if (!data || !data[path]) {
        return null
    }

    if (Array.isArray(data[path])) {
        data[path] = JSON.stringify(data[path])
    }

    return omitRecursively(JSON.parse(data[path]), '__typename')
}

module.exports = {
    deserialize,
    serialize,
}
