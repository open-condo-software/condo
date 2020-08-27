const { v5: uuidv5 } = require('uuid')

function makeid (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function getCookieSecret (cookieSecret) {
    if (!cookieSecret) {
        if (process.env.NODE_ENV === 'production') {
            throw new TypeError('getCookieSecret() call without cookieSecret (check the COOKIE_SECRET environment)')
        }
        return undefined
    }
    if (typeof cookieSecret !== 'string') throw new TypeError('getCookieSecret() cookieSecret is not a string')
    if (cookieSecret.startsWith('undefined')) {
        // NOTE: case for build time!
        return uuidv5(makeid(10), uuidv5.DNS)
    } else if (cookieSecret.startsWith('random')) {
        // NOTE: some production-ready secret! but it will change every time and expire sessions!
        return uuidv5(makeid(10), uuidv5.DNS)
    } else {
        if (cookieSecret.length < 10) return uuidv5(cookieSecret, uuidv5.DNS)
        return cookieSecret
    }
}

module.exports = {
    getCookieSecret,
}
