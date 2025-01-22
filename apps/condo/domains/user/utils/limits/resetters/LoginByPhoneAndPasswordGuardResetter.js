const { IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { LOGIN_BY_PHONE_AND_PASSWORD_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')

class LoginByPhoneAndPasswordGuardResetter extends RedisGuardResetter {
    constructor () {
        super(LOGIN_BY_PHONE_AND_PASSWORD_LIMIT_TYPE, [IPv4_TYPE])
    }
}

module.exports = {
    LoginByPhoneAndPasswordGuardResetter,
}
