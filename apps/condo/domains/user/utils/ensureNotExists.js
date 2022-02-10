const { User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { STAFF } = require('@condo/domains/user/constants/common')

async function ensureNotExists (context, field, value) {
    const existed = await UserServerUtils.getAll(context, { [field]: value, type: STAFF })
    if (existed.length !== 0) {
        throw new Error(`[unique:${field}:multipleFound] user with this ${field} is already exists`)
    }
}

module.exports = {
    ensureNotExists,
}