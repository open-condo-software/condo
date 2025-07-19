const { PHONE_TYPE, IPv4_TYPE } = require('@condo/domains/user/constants/identifiers')
const { SMS_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuardResetter } = require('./RedisGuardResetter')

class SmsGuardResetter extends RedisGuardResetter {
    constructor () {
        super(SMS_COUNTER_LIMIT_TYPE, [PHONE_TYPE, IPv4_TYPE])
    }
}

module.exports = {
    SmsGuardResetter,
}
