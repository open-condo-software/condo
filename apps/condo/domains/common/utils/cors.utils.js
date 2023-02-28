
// RegExp explain:
// wildcardToRegExp('*.doma.ai') = /^[^.]*?\.doma\.ai$/
// start of string + any character except dot + escaped remain part + end of string

function wildcardToRegExp (input) {
    return new RegExp('^' + input.split(/\*+/).map(escape).join('[^.]*?') + '$')
}

function escape (input) {
    return input.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}

function parseCorsSettings (settings) {
    if (settings && typeof settings === 'object') {
        if (typeof settings.origin === 'string' && settings.origin.indexOf('*') !== -1) {
            settings.origin = wildcardToRegExp(settings.origin)
        }
    }
    return settings
}

module.exports = {
    parseCorsSettings,
}