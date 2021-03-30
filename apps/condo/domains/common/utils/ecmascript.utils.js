function isFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object Function]'
}

function isAsyncFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object AsyncFunction]'
}

function isGeneratorFunction (functionToCheck) {
    return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object GeneratorFunction]'
}

module.exports = {
    isFunction,
    isAsyncFunction,
    isGeneratorFunction,
}
