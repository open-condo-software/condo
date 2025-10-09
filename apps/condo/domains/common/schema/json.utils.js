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
 * Generates validateInput hook, in which resolved data is validated via ajv or zod, depending on argument,
 * then all errors are aggregated and thrown as single GQLError
 * @param validate - validator acquired from ajv.compile or zod validator
 * @param errorType - type of error thrown, usually is domain specific const
 * @return {(function({resolvedData: *, fieldPath: *, context: *}): void)|*}
 */
function getGQLErrorValidator (validate, errorType) {
    return function validateInput ({ resolvedData, fieldPath, context }) {
        const value = resolvedData[fieldPath]
        let isValid
        let errors = []

        if (typeof validate === 'function' && validate.errors !== undefined) {
            // AJV validator (has .errors property and is a function)
            isValid = validate(value)
            if (!isValid) {
                errors = validate.errors.map(error => ({
                    message: error.message,
                    path: error.instancePath,
                }))
            }
        } else if (typeof validate?.safeParse === 'function') {
            // Zod validator (has safeParse method)
            const result = validate.safeParse(value)
            isValid = result.success
            if (!isValid) {
                errors = result.error.issues.map(issue => ({
                    message: issue.message,
                    path: issue.path.join('.'),
                }))
            }
        } else if (typeof validate?.parse === 'function') {
            // Zod validator (has parse method - try/catch approach)
            try {
                validate.parse(value)
                isValid = true
            } catch (error) {
                isValid = false
                errors = error.issues?.map(issue => ({
                    message: issue.message,
                    path: issue.path?.join('.') || '',
                })) || [{ message: error.message, path: '' }]
            }
        } else {
            throw new Error('Unsupported validator type. Expected AJV compiled function or Zod validator.')
        }

        if (!isValid) {
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