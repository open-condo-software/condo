const MAIL_DOMAINS = [
    {
        mainAddress: 'gmail.com',
        addresses: ['gmail.com', 'googlemail.com'],
    },
    {
        mainAddress: 'outlook.com',
        addresses: ['outlook.com', 'hotmail.at', 'hotmail.be', 'hotmail.ca', 'hotmail.cl', 'hotmail.co.il', 'hotmail.co.nz', 'hotmail.co.th', 'hotmail.co.uk', 'hotmail.com', 'hotmail.com.ar', 'hotmail.com.au', 'hotmail.com.br', 'hotmail.com.gr', 'hotmail.com.mx', 'hotmail.com.pe', 'hotmail.com.tr', 'hotmail.com.vn', 'hotmail.cz', 'hotmail.de', 'hotmail.dk', 'hotmail.es', 'hotmail.fr', 'hotmail.hu', 'hotmail.id', 'hotmail.ie', 'hotmail.in', 'hotmail.it', 'hotmail.jp', 'hotmail.kr', 'hotmail.lv', 'hotmail.my', 'hotmail.ph', 'hotmail.pt', 'hotmail.sa', 'hotmail.sg', 'hotmail.sk', 'live.be', 'live.co.uk', 'live.com', 'live.com.ar', 'live.com.mx', 'live.de', 'live.es', 'live.eu', 'live.fr', 'live.it', 'live.nl', 'msn.com', 'outlook.at', 'outlook.be', 'outlook.cl', 'outlook.co.il', 'outlook.co.nz', 'outlook.co.th', 'outlook.com.ar', 'outlook.com.au', 'outlook.com.br', 'outlook.com.gr', 'outlook.com.pe', 'outlook.com.tr', 'outlook.com.vn', 'outlook.cz', 'outlook.de', 'outlook.dk', 'outlook.es', 'outlook.fr', 'outlook.hu', 'outlook.id', 'outlook.ie', 'outlook.in', 'outlook.it', 'outlook.jp', 'outlook.kr', 'outlook.lv', 'outlook.my', 'outlook.ph', 'outlook.pt', 'outlook.sa', 'outlook.sg', 'outlook.sk', 'passport.com'],
    },
    {
        mainAddress: 'yahoo.com',
        addresses: ['yahoo.com', 'rocketmail.com', 'yahoo.ca', 'yahoo.co.uk', 'yahoo.de', 'yahoo.fr', 'yahoo.in', 'yahoo.it', 'ymail.com'],
    },
    {
        mainAddress: 'yandex.ru',
        addresses: ['yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.eu', 'yandex.ee', 'yandex.lt', 'yandex.lv', 'yandex.md', 'yandex.uz', 'yandex.tm', 'yandex.tj', 'yandex.az', 'ya.ru', 'yandex.kz'],
    },
    {
        mainAddress: 'icloud.com',
        addresses: ['icloud.com', 'me.com'],
    },
]

function normalizeEmail (email) {
    if (!email) return
    const trimmed = email.trim()
    if (trimmed.length === 0) return
    const lowered = trimmed.toLowerCase()
    const parts = lowered.split('@')
    if (parts.length !== 2) return
    let [userPart, domainPart] = parts
    if (domainPart.length === 0) return
    domainPart = replaceDomain(domainPart)
    userPart = processUserPart(userPart, domainPart)
    if (userPart.length === 0) return
    return `${userPart}@${domainPart}`
}

function replaceDomain (domain) {
    for (const domainGroup of MAIL_DOMAINS) {
        if (domainGroup.addresses.includes(domain)) return domainGroup.mainAddress
    }
    return domain
}

function processUserPart (userPart, domainPart) {
    let result = userPart.split('+')[0]
    // For google abc.abc@ = abcabc@, but abc..abc != abcabc != abc.abc
    if (domainPart === 'gmail.com') result = result.replace(/\.+/g, dotReplacer)
    return result
}

function dotReplacer (match) {
    return match.length > 1 ? match : ''
}

/**
 * The function masks the normalized email
 * @param {string} normalizedEmail
 * @return {string}
 */
function maskNormalizedEmail (normalizedEmail) {
    const [user, domain] = normalizedEmail.split('@')
    if (!domain) return normalizedEmail

    let visible

    if (user.length < 2) {
        visible = user
    } else {
        visible = user.slice(0, 2)
    }

    return `${visible}***@${domain}`
}


module.exports = {
    normalizeEmail,
    maskNormalizedEmail,
}
