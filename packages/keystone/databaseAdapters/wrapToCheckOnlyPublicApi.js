function Logger (allowd) {
    this.allowd = new Set(allowd || [])
    this.logAccess = function (attribute) {
        if (!this.allowd.has(attribute)) {
            console.warn(`Accessed to non allowed attribute: ${attribute}`)
            throw new Error(`wrapToCheckOnlyPublicApi(..): attr=${attribute}`)
        }
    }
}

Logger.prototype = {
    get: function (target, prop) {
        this.logAccess(prop)
        return target[prop]
    },
    set: function (target, prop, value) {
        this.logAccess(prop)
        target[prop] = value
        return true
    },
    deleteProperty: function (target, prop) {
        this.logAccess(prop)
        delete target[prop]
        return true
    },
}

function wrapToCheckOnlyPublicApi (obj, allowed) {
    return new Proxy(obj, new Logger(allowed))
}

module.exports = {
    wrapToCheckOnlyPublicApi,
}
