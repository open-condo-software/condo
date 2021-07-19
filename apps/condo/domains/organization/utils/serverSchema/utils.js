async function execGqlWithoutAccess(
    context,
    { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj' },
) {
    if (!context) throw new Error('wrong context argument')
    if (!query) throw new Error('wrong query argument')
    if (!variables) throw new Error('wrong variables argument')
    const { errors, data } = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query,
        variables,
    })

    if (errors) {
        if (errors.some((e) => e.originalError && e.originalError.data)) {
            console.warn(errors.map((err) => err.originalError && err.originalError.data))
        }
        console.error(errors)
        const error = new Error(errorMessage)
        error.errors = errors
        throw error
    }

    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }

    return data[dataPath]
}

module.exports = {
    execGqlWithoutAccess,
}
