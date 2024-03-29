const path = require('path')

const DEV_ENVIRONMENT = 'development'
const PROD_ENVIRONMENT = 'production'

const AVAILABLE_ENVIRONMENTS = [
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
]

const B2C_APP_DEFAULT_LOGO_PATH = path.join(__dirname, '..', 'assets', 'b2cDefaultLogo.png')

const PUBLISH_REQUEST_PENDING_STATUS = 'pending'
const PUBLISH_REQUEST_APPROVED_STATUS = 'approved'
const PUBLISH_REQUEST_STATUS_OPTIONS = [
    PUBLISH_REQUEST_PENDING_STATUS,
    PUBLISH_REQUEST_APPROVED_STATUS,
]

module.exports = {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
    AVAILABLE_ENVIRONMENTS,
    B2C_APP_DEFAULT_LOGO_PATH,
    PUBLISH_REQUEST_PENDING_STATUS,
    PUBLISH_REQUEST_APPROVED_STATUS,
    PUBLISH_REQUEST_STATUS_OPTIONS,
}