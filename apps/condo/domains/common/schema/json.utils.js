const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')


const render = (fields) => (
    Object.keys(fields).reduce((acc, key) => (
        acc + `${key}: ${fields[key]}\n`
    ), '')
)

const renderEnumOptions = (options) => options.join(' ')

/**
 * @deprecated Use getGQLErrorValidator instead
 * @param validate - validator acquired from ajv.compile
 * @return {(function({resolvedData: *, fieldPath: *, addFieldValidationError: *}): void)|*}
 */
function getValidator  (validate) {
    return function validateInput ({ resolvedData, fieldPath, addFieldValidationError }) {
        if (!validate(resolvedData[fieldPath])) {
            validate.errors.forEach(error => {
                addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
            })
        }
    }
}

/**
 * Generates validateInput hook, in which resolved data is validated via ajv,
 * then all errors are aggregated and thrown as single GQLError
 * @param validate - validator acquired from ajv.compile
 * @param errorType - type of error thrown, usually is domain specific const
 * @return {(function({resolvedData: *, fieldPath: *, context: *}): void)|*}
 */
function getGQLErrorValidator (validate, errorType) {
    return function validateInput ({ resolvedData, fieldPath, context }) {
        if (!validate(resolvedData[fieldPath])) {
            const errors = validate.errors.map(error => ({ message: error.message, path: error.instancePath }))
            const message = `"${fieldPath}" field validation error. JSON was not in the correct format`
            throw new GQLError({
                code: BAD_USER_INPUT,
                type: errorType,
                message,
                variable: ['data', fieldPath],
                errors,
            }, context)
        }
    }
}

module.exports = {
    render,
    getValidator,
    getGQLErrorValidator,
    renderEnumOptions,
}