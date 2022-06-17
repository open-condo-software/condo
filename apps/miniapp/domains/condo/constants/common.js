// Value of `User.type`, that indicates, that this user is a resident (from mobile client).
const RESIDENT_USER_TYPE = 'resident'
const STAFF_USER_TYPE = 'staff'
const SERVICE_USER_TYPE = 'service'
const USER_TYPES = [STAFF_USER_TYPE, RESIDENT_USER_TYPE, SERVICE_USER_TYPE]

/**
 * Key for redis
 * @type {string}
 */
const CONDO_ACCESS_TOKEN_KEY = 'condoAccessToken'
const CONDO_ORGANIZATION_KEY = 'condoOrganizationId'

const CONDO_API_PATH = '/admin/api'

module.exports = {
    STAFF_USER_TYPE,
    RESIDENT_USER_TYPE,
    SERVICE_USER_TYPE,
    USER_TYPES,
    CONDO_ACCESS_TOKEN_KEY,
    CONDO_API_PATH,
    CONDO_ORGANIZATION_KEY,
}
