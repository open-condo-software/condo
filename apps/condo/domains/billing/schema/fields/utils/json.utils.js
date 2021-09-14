const render = (fields) => (
    Object.keys(fields).reduce((acc, key) => (
        acc + `${key}: ${fields[key]}\n`
    ), '')
)

const getValidator = (compiledSchema) => {
    return function validateInput ({ resolvedData, fieldPath, addFieldValidationError }) {
        if (!compiledSchema(resolvedData[fieldPath])) {
            compiledSchema.errors.forEach(error => {
                addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
            })
        }
    }
}

module.exports = {
    render,
    getValidator,
}