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
 *
 * @return {{staff: string[], resident: string[]}}
 */
function getIdentificationUserRequiredFields () {
    const defaultFields = ['phone']

    let userIdentificationRequiredFieldsFromEnv
    try {
        userIdentificationRequiredFieldsFromEnv = conf.IDENTIFICATION_USER_REQUIRED_FIELDS ? JSON.parse(conf.IDENTIFICATION_USER_REQUIRED_FIELDS) : null
    } catch (error) {
        throw new Error('Failed to parse USER REQUIRED_FIELDS!')
    }

    if (!userIdentificationRequiredFieldsFromEnv) {
        return {
            staff: defaultFields,
            resident: defaultFields,
        }
    }

    IdentificationUserFieldsSchema.parse(userIdentificationRequiredFieldsFromEnv)

    return {
        staff: userIdentificationRequiredFieldsFromEnv.staff || defaultFields,
        resident: userIdentificationRequiredFieldsFromEnv.resident || defaultFields,
    }
}


module.exports = {
    getIdentificationUserRequiredFields,
}
