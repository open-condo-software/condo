function isFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object Function]'
}

function isAsyncFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object AsyncFunction]'
}

function isGeneratorFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object GeneratorFunction]'
}

function findAllByKey (obj, keyToFind) {
    return Object.entries(obj)
        .reduce((acc, [key, value]) => (key === keyToFind)
            ? acc.concat(value)
            : (typeof value === 'object' && value)
                ? acc.concat(findAllByKey(value, keyToFind))
                : acc
        , [])
}

module.exports = {
    isFunction,
    isAsyncFunction,
    isGeneratorFunction,
    findAllByKey,
}
