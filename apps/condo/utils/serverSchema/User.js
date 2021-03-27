const { User: UserGQL } = require('@condo/domains/user/gql')

const { execGqlWithoutAccess } = require('./utils')

async function findUser (context, query) {
    if (!context) throw new Error('no context')
    if (!query) throw new Error('no query')
    return await execGqlWithoutAccess(context, {
        query: UserGQL.GET_ALL_OBJS_QUERY,
        variables: {
            where: query,
        },
        errorMessage: '[error] Unable to query users',
        dataPath: 'objs',
    })
}

module.exports = {
    findUser,
}