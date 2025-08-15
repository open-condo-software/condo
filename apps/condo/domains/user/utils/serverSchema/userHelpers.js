const z = require('zod')

const conf = require('@open-condo/config')


function uniqueArray (schema) {
    return z
        .array(schema)
        .refine((items) => new Set(items).size === items.length, {
            message: 'All items must be unique, no duplicate values allowed',
        })
}

const AllowedFields = z.enum(['phone', 'email'])

const IdentificationUserFieldsSchema = z.object({
    staff: uniqueArray(AllowedFields).min(1).max(2).optional(),
    resident: uniqueArray(AllowedFields).min(1).max(2).optional(),
})

/**
 * Returns required user identifiers: phone, email, or both.
 * Each user type can have its own set.
 * For service users, only email is required, cannot be changed.
 * For all others user types, only phone is returned by default.
 *
 * @return {{staff: string[], resident: string[], service: string[]}}
 */
function getIdentificationUserRequiredFields () {
    const defaultFields = ['phone']

    let userIdentificationRequiredFieldsFromEnv
    try {
        userIdentificationRequiredFieldsFromEnv = conf.IDENTIFICATION_USER_REQUIRED_FIELDS ? JSON.parse(conf.IDENTIFICATION_USER_REQUIRED_FIELDS) : null
    } catch (error) {
        throw new Error('Failed to parse USER_REQUIRED_FIELDS!')
    }

    if (!userIdentificationRequiredFieldsFromEnv) {
        return {
            staff: defaultFields,
            resident: defaultFields,
            service: ['email'], // NOTE: Service user registers only by email
        }
    }

    IdentificationUserFieldsSchema.parse(userIdentificationRequiredFieldsFromEnv)

    return {
        staff: userIdentificationRequiredFieldsFromEnv.staff || defaultFields,
        resident: userIdentificationRequiredFieldsFromEnv.resident || defaultFields,
        service: ['email'], // NOTE: Service user registers only by email
    }
}


module.exports = {
    getIdentificationUserRequiredFields,
}
