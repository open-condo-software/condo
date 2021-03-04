const { execGqlWithoutAccess } = require('./utils')
const { User } = require('../../gql/User')

async function findUser (context, query) {
    if (!context) throw new Error('no context')
    if (!query) throw new Error('no query')
    return await execGqlWithoutAccess(context, {
        query: User.GET_ALL_OBJS_QUERY,
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