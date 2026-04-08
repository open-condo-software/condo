const path = require('path')

const DEFAULT_COLOR_SCHEMA = { 'main':'#707695', 'secondary':'#F2F4F6' }
const DEFAULT_LOGO_PATH = path.resolve(__dirname, '..', 'assets', 'b2c.png')

const B2C_APP_CORDOVA_TYPE = 'cordova'
const B2C_APP_WEB_TYPE = 'web'
const B2C_APP_TYPES = [B2C_APP_CORDOVA_TYPE, B2C_APP_WEB_TYPE]

module.exports = {
    DEFAULT_COLOR_SCHEMA,
    DEFAULT_LOGO_PATH,

    B2C_APP_TYPES,
    B2C_APP_CORDOVA_TYPE,
    B2C_APP_WEB_TYPE,
}