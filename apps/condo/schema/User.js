const faker = require('faker') 

const access = require('@core/keystone/access')
const { ForgotPasswordService } = require('@core/keystone/schemas/User')
const { User: BaseUser } = require('@core/keystone/schemas/User')
const { RegisterNewUserService } = require('@core/keystone/schemas/User')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { admin } = require('@condo/domains/common/utils/firebase.back.utils')



module.exports = {
    RegisterNewUserService,
}
