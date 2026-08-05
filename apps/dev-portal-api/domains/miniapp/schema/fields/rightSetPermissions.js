const { B2B_PERMISSION_FIELDS } = require('@condo/domains/miniapp/schema/fields/b2bAccessRightSet')


// NOTE: omit fields with extra access
const PERMISSION_FIELDS = Object.fromEntries(Object.entries(B2B_PERMISSION_FIELDS).filter(([, value]) => !value.access))

module.exports = {
    PERMISSION_FIELDS,
}