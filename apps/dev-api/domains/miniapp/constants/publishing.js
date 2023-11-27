const path = require('path')

const DEV_ENVIRONMENT = 'development'
const PROD_ENVIRONMENT = 'production'

const AVAILABLE_ENVIRONMENTS = [
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
]

const B2C_APP_DEFAULT_LOGO_PATH = path.join(__dirname, '..', 'assets', 'b2cDefaultLogo.png')

module.exports = {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
    AVAILABLE_ENVIRONMENTS,
    B2C_APP_DEFAULT_LOGO_PATH,
}