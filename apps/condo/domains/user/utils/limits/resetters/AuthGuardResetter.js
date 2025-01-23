const { IPv4_TYPE, PHONE_TYPE, EMAIL_TYPE } = require('@condo/domains/user/constants/identifiers')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')

class AuthGuardResetter extends RedisGuardResetter {
    constructor () {
        super(AUTH_COUNTER_LIMIT_TYPE, [IPv4_TYPE, PHONE_TYPE, EMAIL_TYPE])
    }
}

module.exports = {
    AuthGuardResetter,
}
